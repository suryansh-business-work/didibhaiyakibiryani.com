import type { IOrder } from "../models/index.js";

/** Resolve a public base URL. An explicit env override always wins; otherwise
 * pick the localhost dev URL or the production domain based on NODE_ENV. This
 * keeps survey / track / receipt (and email) links pointing at localhost while
 * developing and at the real domain in production — with no extra config. */
export function resolvePublicUrl(override: string | undefined, devUrl: string, prodUrl: string): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  return process.env.NODE_ENV === "production" ? prodUrl : devUrl;
}

/** Public app base URLs. Each customer page is keyed by the short order number. */
export const SURVEY_PUBLIC_URL = resolvePublicUrl(
  process.env.SURVEY_PUBLIC_URL,
  "http://localhost:3006",
  "https://survey.didibhaiyakibiryani.com"
);
export const TRACK_PUBLIC_URL = resolvePublicUrl(
  process.env.TRACK_PUBLIC_URL,
  "http://localhost:3007",
  "https://track.didibhaiyakibiryani.com"
);
/** The GraphQL/API server's own public origin — it also serves the receipt PDF. */
export const SERVER_PUBLIC_URL = resolvePublicUrl(
  process.env.SERVER_PUBLIC_URL,
  "http://localhost:3001",
  "https://server.didibhaiyakibiryani.com"
);
/** The customer ordering app — linked from transactional emails. */
export const ORDER_PUBLIC_URL = resolvePublicUrl(
  process.env.PUBLIC_ORDER_URL,
  "http://localhost:3003",
  "https://native.didibhaiyakibiryani.com"
);
/** The admin console — linked from admin credential emails. */
export const ADMIN_PUBLIC_URL = resolvePublicUrl(
  process.env.PUBLIC_ADMIN_URL,
  "http://localhost:3002",
  "https://admin.didibhaiyakibiryani.com"
);

/** Public, no-login rating-survey link (e.g. survey.didibhaiyakibiryani.com/DDB-8XRBR2). */
export function ratingUrlFor(order: Pick<IOrder, "orderNumber">): string {
  return `${SURVEY_PUBLIC_URL}/${order.orderNumber}`;
}

/** Public, no-login live order-tracking link (e.g. track.didibhaiyakibiryani.com/DDB-8XRBR2). */
export function trackingUrlFor(order: Pick<IOrder, "orderNumber">): string {
  return `${TRACK_PUBLIC_URL}/${order.orderNumber}`;
}

/** Public, no-login receipt PDF link, gated by the order's secret ratingToken
 * (e.g. server.didibhaiyakibiryani.com/receipt/<id>/<token>). */
export function receiptUrlFor(order: Pick<IOrder, "ratingToken"> & { _id: unknown }): string {
  return `${SERVER_PUBLIC_URL}/receipt/${String(order._id)}/${order.ratingToken}`;
}
