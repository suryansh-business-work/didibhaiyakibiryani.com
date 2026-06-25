import { haversineKm } from "./pricing.js";

/** Minimal order shape the tracking view needs (works with a Mongoose doc). */
export interface TrackOrderLike {
  status: string;
  statusHistory: ReadonlyArray<{ status: string; at: Date | string }>;
  address?: { lat?: number; lng?: number } | null;
}

export interface RiderUser {
  lastLat?: number;
  lastLng?: number;
  lastLocationAt?: Date | string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RiderFix extends LatLng {
  at: Date | string;
}

export interface LiveState {
  destination: LatLng | null;
  rider: RiderFix | null;
  etaMinutes: number | null;
}

/** Rough minutes to delivery — distance-based once a rider is en route, else a
 * coarse per-stage estimate. Null for finished/cancelled orders. */
export function etaMinutes(
  status: string,
  rider: LatLng | null,
  destination: LatLng | null
): number | null {
  if (status === "DELIVERED" || status === "CANCELLED") return null;
  if (status === "OUT_FOR_DELIVERY" && rider && destination) {
    const km = haversineKm(rider.lat, rider.lng, destination.lat, destination.lng);
    return Math.max(2, Math.round((km / 18) * 60));
  }
  const STAGE: Record<string, number> = { PLACED: 40, CONFIRMED: 35, PREPARING: 30, OUT_FOR_DELIVERY: 15 };
  return STAGE[status] ?? null;
}

/** Rider position to expose publicly — only while out for delivery and fresh
 * (≤10 min old), so we never leak a rider's location before/after the trip. */
export function riderLocationFor(status: string, rider: RiderUser | null): RiderFix | null {
  if (status !== "OUT_FOR_DELIVERY" || !rider) return null;
  const { lastLat, lastLng, lastLocationAt } = rider;
  if (typeof lastLat !== "number" || typeof lastLng !== "number" || !lastLocationAt) return null;
  const ageMs = Date.now() - new Date(lastLocationAt).getTime();
  if (ageMs > 10 * 60 * 1000) return null;
  return { lat: lastLat, lng: lastLng, at: lastLocationAt };
}

function destinationOf(order: TrackOrderLike): LatLng | null {
  const a = order.address;
  if (a && typeof a.lat === "number" && typeof a.lng === "number") return { lat: a.lat, lng: a.lng };
  return null;
}

/** Destination, (privacy-gated) rider fix and ETA for the public tracking page. */
export function liveState(order: TrackOrderLike, rider: RiderUser | null): LiveState {
  const destination = destinationOf(order);
  const riderFix = riderLocationFor(order.status, rider);
  return {
    destination,
    rider: riderFix,
    etaMinutes: etaMinutes(order.status, riderFix, destination),
  };
}
