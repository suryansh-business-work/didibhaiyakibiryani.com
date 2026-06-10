import type { Request, Response } from "express";
import { Order, Payment } from "../models/index.js";
import { verifyWebhookSignature } from "../utils/razorpay.js";
import { logger } from "../utils/logger.js";

interface WebhookPaymentEntity {
  id: string;
  order_id: string;
  method?: string;
}
interface WebhookRefundEntity {
  id: string;
  payment_id: string;
  amount: number; // paise
}
interface WebhookBody {
  event: string;
  payload?: {
    payment?: { entity: WebhookPaymentEntity };
    refund?: { entity: WebhookRefundEntity };
  };
}

async function markCaptured(entity: WebhookPaymentEntity): Promise<void> {
  const payment = await Payment.findOne({ providerOrderId: entity.order_id }).exec();
  if (!payment || payment.status === "CAPTURED") return; // idempotent
  payment.providerPaymentId = entity.id;
  payment.status = "CAPTURED";
  payment.method = entity.method;
  payment.events.push({ type: "WEBHOOK_CAPTURED", at: new Date(), data: entity.id });
  await payment.save();
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: "PAID" }).exec();
  logger.info({ rzpPayment: entity.id }, "Webhook: payment captured");
}

async function markFailed(entity: WebhookPaymentEntity): Promise<void> {
  const payment = await Payment.findOne({ providerOrderId: entity.order_id }).exec();
  if (!payment || payment.status === "CAPTURED") return; // never downgrade a capture
  payment.status = "FAILED";
  payment.events.push({ type: "WEBHOOK_FAILED", at: new Date(), data: entity.id });
  await payment.save();
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: "FAILED" }).exec();
  logger.warn({ rzpPayment: entity.id }, "Webhook: payment failed");
}

async function recordRefund(entity: WebhookRefundEntity): Promise<void> {
  const payment = await Payment.findOne({ providerPaymentId: entity.payment_id }).exec();
  if (!payment) return;
  if (payment.refunds.some((r) => r.providerRefundId === entity.id)) return; // idempotent
  payment.refunds.push({
    providerRefundId: entity.id,
    amount: entity.amount / 100,
    at: new Date(),
  });
  const refunded = payment.refunds.reduce((s, r) => s + r.amount, 0);
  payment.status = refunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  payment.events.push({ type: "WEBHOOK_REFUND", at: new Date(), data: entity.id });
  await payment.save();
  if (payment.status === "REFUNDED") {
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "REFUNDED" }).exec();
  }
  logger.info({ rzpRefund: entity.id }, "Webhook: refund recorded");
}

/**
 * Razorpay webhook endpoint. Must be mounted with `express.raw()` so the
 * signature is computed over the exact bytes Razorpay sent.
 */
export async function razorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header("x-razorpay-signature") ?? "";
  const raw = req.body as Buffer;

  if (!verifyWebhookSignature(raw, signature)) {
    logger.warn("Webhook rejected: bad signature");
    res.status(400).json({ ok: false });
    return;
  }

  try {
    const body = JSON.parse(raw.toString("utf8")) as WebhookBody;
    const payment = body.payload?.payment?.entity;
    const refund = body.payload?.refund?.entity;

    if (body.event === "payment.captured" && payment) {
      await markCaptured(payment);
    } else if (body.event === "payment.failed" && payment) {
      await markFailed(payment);
    } else if (body.event.startsWith("refund.") && refund) {
      await recordRefund(refund);
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Webhook error");
    res.status(500).json({ ok: false });
  }
}
