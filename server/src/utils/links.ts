import type { IOrder } from "../models/index.js";

/** Public app base URLs. Each customer page is keyed by the short order number. */
export const SURVEY_PUBLIC_URL =
  process.env.SURVEY_PUBLIC_URL || "https://survey.didibhaiyakibiryani.com";
export const TRACK_PUBLIC_URL =
  process.env.TRACK_PUBLIC_URL || "https://track.didibhaiyakibiryani.com";

/** Public, no-login rating-survey link (e.g. survey.didibhaiyakibiryani.com/DDB-8XRBR2). */
export function ratingUrlFor(order: Pick<IOrder, "orderNumber">): string {
  return `${SURVEY_PUBLIC_URL}/${order.orderNumber}`;
}

/** Public, no-login live order-tracking link (e.g. track.didibhaiyakibiryani.com/DDB-8XRBR2). */
export function trackingUrlFor(order: Pick<IOrder, "orderNumber">): string {
  return `${TRACK_PUBLIC_URL}/${order.orderNumber}`;
}
