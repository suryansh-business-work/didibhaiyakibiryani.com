import { GraphQLError } from "graphql";
import type { ISettings } from "../models/index.js";
import { isStoreOpen } from "./storeHours.js";

/** Settings fields consulted before accepting a customer order. */
export type OrderingSettings = Pick<
  ISettings,
  | "maintenance"
  | "storeOpenTime"
  | "storeCloseTime"
  | "storeTimezone"
  | "codEnabled"
  | "onlineEnabled"
>;

function bad(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

/**
 * Throws a user-readable error when ordering is currently unavailable:
 * server maintenance, store closed, or the chosen payment method disabled.
 */
export function assertOrderingAvailable(
  settings: OrderingSettings,
  paymentMethod: "COD" | "ONLINE",
  now: Date = new Date()
): void {
  if (settings.maintenance?.server) {
    throw bad("We're down for scheduled maintenance — please try again shortly.");
  }
  if (!isStoreOpen(settings.storeOpenTime, settings.storeCloseTime, settings.storeTimezone, now)) {
    throw bad(
      `The store is closed right now. We're open ${settings.storeOpenTime}–${settings.storeCloseTime}.`
    );
  }
  if (paymentMethod === "COD" && !settings.codEnabled) {
    throw bad("Cash on delivery is currently unavailable — please pay online.");
  }
  if (paymentMethod === "ONLINE" && !settings.onlineEnabled) {
    throw bad("Online payment is currently unavailable — please choose cash on delivery.");
  }
}
