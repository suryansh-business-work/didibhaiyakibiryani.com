import { GraphQLError } from "graphql";
import { Order, Payment, getOrCreateSettings } from "../../models/index.js";
import { requireAuth, requireRole, type Context } from "../../utils/auth.js";
import {
  createProviderOrder,
  refundProviderPayment,
  verifyPaymentSignature,
  razorpayKeyId,
} from "../../utils/razorpay.js";
import { logger } from "../../utils/logger.js";

interface VerifyInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const paymentResolvers = {
  Query: {
    payments: async (_: unknown, { status }: { status?: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const filter = status ? { status } : {};
      return Payment.find(filter).sort({ createdAt: -1 }).limit(300).exec();
    },
  },

  Mutation: {
    createRazorpayOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const order = await Order.findById(orderId).exec();
      if (!order) throw new GraphQLError("Order not found.");
      if (String(order.user) !== u.id) {
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      }
      if (order.paymentMethod !== "ONLINE" || order.paymentStatus === "PAID") {
        throw new GraphQLError("This order is not awaiting an online payment.");
      }
      const settings = await getOrCreateSettings();
      if (!settings.onlineEnabled || settings.maintenance?.server) {
        throw new GraphQLError("Online payment is currently unavailable.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await Payment.findOne({ order: order._id, status: "CREATED" }).exec();
      if (existing) {
        return {
          keyId: razorpayKeyId(),
          razorpayOrderId: existing.providerOrderId,
          amount: Math.round(existing.amount * 100),
          currency: existing.currency,
        };
      }

      const rzpOrder = await createProviderOrder(order.total, order.orderNumber);
      await Payment.create({
        order: order._id,
        user: order.user,
        providerOrderId: rzpOrder.id,
        amount: order.total,
        currency: rzpOrder.currency,
        status: "CREATED",
        events: [{ type: "ORDER_CREATED", at: new Date(), data: rzpOrder.id }],
      });
      logger.info({ order: order.orderNumber, rzpOrder: rzpOrder.id }, "Razorpay order created");

      return {
        keyId: razorpayKeyId(),
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      };
    },

    verifyRazorpayPayment: async (_: unknown, { input }: { input: VerifyInput }, ctx: Context) => {
      const u = requireAuth(ctx);
      const order = await Order.findById(input.orderId).exec();
      if (!order) throw new GraphQLError("Order not found.");
      if (String(order.user) !== u.id) {
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      }

      const ok = verifyPaymentSignature(input);
      const payment = await Payment.findOne({ providerOrderId: input.razorpayOrderId }).exec();
      if (!payment) throw new GraphQLError("Payment record not found.");

      if (!ok) {
        payment.status = "FAILED";
        payment.events.push({ type: "SIGNATURE_INVALID", at: new Date() });
        await payment.save();
        order.paymentStatus = "FAILED";
        await order.save();
        logger.warn({ order: order.orderNumber }, "Razorpay signature verification failed");
        throw new GraphQLError("Payment verification failed.", {
          extensions: { code: "PAYMENT_VERIFICATION_FAILED" },
        });
      }

      payment.providerPaymentId = input.razorpayPaymentId;
      payment.status = "CAPTURED";
      payment.events.push({ type: "VERIFIED", at: new Date(), data: input.razorpayPaymentId });
      await payment.save();

      order.paymentStatus = "PAID";
      await order.save();
      logger.info({ order: order.orderNumber }, "Payment captured");
      return order;
    },

    refundPayment: async (
      _: unknown,
      { paymentId, amount, reason }: { paymentId: string; amount?: number; reason?: string },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const payment = await Payment.findById(paymentId).exec();
      if (!payment) throw new GraphQLError("Payment not found.");
      if (!payment.providerPaymentId || payment.status === "REFUNDED") {
        throw new GraphQLError("This payment cannot be refunded.");
      }

      const refunded = payment.refunds.reduce((s, r) => s + r.amount, 0);
      const refundable = payment.amount - refunded;
      const toRefund = amount ?? refundable;
      if (toRefund <= 0 || toRefund > refundable) {
        throw new GraphQLError(`Refundable amount is ₹${refundable}.`);
      }

      const rzpRefund = await refundProviderPayment(payment.providerPaymentId, toRefund);
      payment.refunds.push({
        providerRefundId: rzpRefund.id,
        amount: toRefund,
        reason,
        at: new Date(),
      });
      const totalRefunded = refunded + toRefund;
      payment.status = totalRefunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
      payment.events.push({ type: "REFUND", at: new Date(), data: rzpRefund.id });
      await payment.save();

      if (payment.status === "REFUNDED") {
        await Order.findByIdAndUpdate(payment.order, { paymentStatus: "REFUNDED" }).exec();
      }
      logger.info({ payment: String(payment._id), amount: toRefund }, "Refund issued");
      return payment;
    },
  },

  Payment: {
    order: (parent: { order: unknown }) => {
      const o = parent.order as { orderNumber?: string } | string | null;
      if (o && typeof o === "object" && "orderNumber" in o && o.orderNumber) return o;
      return o ? Order.findById(o as string).exec() : null;
    },
  },
};
