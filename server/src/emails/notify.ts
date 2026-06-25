import { User, getOrCreateSettings } from "../models/index.js";
import type { IOrder } from "../models/index.js";
import { loadEmailBrand } from "./marketing.js";
import { orderConfirmedEmail, orderDeliveredEmail } from "./order.js";
import { generateInvoicePdf } from "../utils/invoice.js";
import { sendMail } from "../utils/mailer.js";
import { sendWhatsApp, whatsappConfigured } from "../utils/whatsapp.js";
import { ratingUrlFor, trackingUrlFor } from "../utils/links.js";
import { logger } from "../utils/logger.js";

const APP_URL = process.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";

// Re-exported so existing callers/tests keep importing the link helpers here.
export { ratingUrlFor, trackingUrlFor };

async function buildJob(order: IOrder, kind: "CONFIRMED" | "DELIVERED") {
  const [customer, brand, settings] = await Promise.all([
    User.findById(order.user).exec(),
    loadEmailBrand(),
    getOrCreateSettings(),
  ]);
  if (!customer?.email) return null;

  if (kind === "CONFIRMED") {
    // The CTA is the public, no-login tracking link so it works for anyone.
    const content = orderConfirmedEmail(brand, customer.name, order, trackingUrlFor(order));
    return { to: customer.email, ...content };
  }

  // Delivered: attach the PDF invoice and link the rating survey.
  const content = orderDeliveredEmail(brand, customer.name, order, APP_URL, ratingUrlFor(order));
  const invoice = await generateInvoicePdf(order, settings);
  return {
    to: customer.email,
    ...content,
    attachments: [
      {
        filename: `receipt-${order.orderNumber}.pdf`,
        content: invoice,
        contentType: "application/pdf",
      },
    ],
  };
}

/** Fire-and-forget order lifecycle email — never blocks or throws. */
export function notifyOrderEmail(order: IOrder, kind: "CONFIRMED" | "DELIVERED"): void {
  buildJob(order, kind)
    .then((job) => (job ? sendMail(job) : false))
    /* v8 ignore next 6 -- fire-and-forget delivery-failure logging, not unit-tested */
    .catch((err: unknown) => {
      logger.error(
        { orderId: order.id, kind, err: err instanceof Error ? err.message : String(err) },
        "Order email failed"
      );
    });
}

/** Resolve the WhatsApp recipient + message for an order's tracking link, or
 * null when WhatsApp is off or we have no phone number to send to. */
export async function buildTrackingWhatsApp(
  order: IOrder
): Promise<{ phone: string; text: string } | null> {
  if (!whatsappConfigured()) return null;
  const phone = order.customerPhone?.trim() || (await User.findById(order.user).exec())?.phone;
  if (!phone) return null;
  const text =
    `Namaste! Your order ${order.orderNumber} is confirmed. ` +
    `Track it live (no login needed): ${trackingUrlFor(order)}`;
  return { phone, text };
}

/** Fire-and-forget WhatsApp with the live tracking link on order placement. */
export function notifyOrderTrackingWhatsApp(order: IOrder): void {
  buildTrackingWhatsApp(order)
    .then((job) => (job ? sendWhatsApp(job.phone, job.text) : false))
    /* v8 ignore next 6 -- fire-and-forget delivery-failure logging, not unit-tested */
    .catch((err: unknown) => {
      logger.error(
        { orderId: order.id, err: err instanceof Error ? err.message : String(err) },
        "Order tracking WhatsApp failed"
      );
    });
}
