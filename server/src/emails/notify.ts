import { User, getOrCreateSettings } from "../models/index.js";
import type { IOrder } from "../models/index.js";
import { loadEmailBrand } from "./marketing.js";
import { orderConfirmedEmail, orderDeliveredEmail } from "./order.js";
import { generateInvoicePdf } from "../utils/invoice.js";
import { sendMail } from "../utils/mailer.js";
import { logger } from "../utils/logger.js";

const APP_URL = process.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";
const SERVER_PUBLIC_URL =
  process.env.SERVER_PUBLIC_URL || "https://server.didibhaiyakibiryani.com";

/** Public, no-login rating-survey link for the post-delivery email. */
export function ratingUrlFor(order: Pick<IOrder, "id" | "ratingToken">): string {
  return `${SERVER_PUBLIC_URL}/rate/${order.id}/${order.ratingToken}`;
}

async function buildJob(order: IOrder, kind: "CONFIRMED" | "DELIVERED") {
  const [customer, brand, settings] = await Promise.all([
    User.findById(order.user).exec(),
    loadEmailBrand(),
    getOrCreateSettings(),
  ]);
  if (!customer?.email) return null;

  if (kind === "CONFIRMED") {
    const content = orderConfirmedEmail(
      brand,
      customer.name,
      order,
      `${APP_URL}/order/${order.id}`
    );
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
        filename: `invoice-${order.orderNumber}.pdf`,
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
