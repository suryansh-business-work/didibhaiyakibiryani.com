import { describe, it, expect } from "vitest";
import {
  etaMinutes,
  riderLocationFor,
  liveState,
  type TrackOrderLike,
} from "../../src/utils/orderTracking";

function order(overrides: Partial<TrackOrderLike> = {}): TrackOrderLike {
  return {
    status: "OUT_FOR_DELIVERY",
    statusHistory: [{ status: "PLACED", at: "2026-06-25T10:00:00.000Z" }],
    address: { lat: 18.52, lng: 73.85 },
    ...overrides,
  };
}

describe("etaMinutes", () => {
  it("is null for finished or cancelled orders", () => {
    expect(etaMinutes("DELIVERED", null, null)).toBeNull();
    expect(etaMinutes("CANCELLED", null, null)).toBeNull();
  });

  it("is distance-based when out for delivery with a rider + destination", () => {
    const eta = etaMinutes("OUT_FOR_DELIVERY", { lat: 18.5, lng: 73.85 }, { lat: 18.52, lng: 73.85 });
    expect(eta).toBeGreaterThanOrEqual(2);
    expect(typeof eta).toBe("number");
  });

  it("falls back to a per-stage estimate without coords", () => {
    expect(etaMinutes("PLACED", null, null)).toBe(40);
    expect(etaMinutes("CONFIRMED", null, null)).toBe(35);
    expect(etaMinutes("PREPARING", null, null)).toBe(30);
    expect(etaMinutes("OUT_FOR_DELIVERY", null, null)).toBe(15);
  });

  it("is null for an unknown status", () => {
    expect(etaMinutes("WEIRD", null, null)).toBeNull();
  });
});

describe("riderLocationFor", () => {
  it("is null unless out for delivery", () => {
    expect(riderLocationFor("PREPARING", { lastLat: 1, lastLng: 2, lastLocationAt: new Date() })).toBeNull();
  });

  it("is null without a rider or coordinates", () => {
    expect(riderLocationFor("OUT_FOR_DELIVERY", null)).toBeNull();
    expect(riderLocationFor("OUT_FOR_DELIVERY", { lastLocationAt: new Date() })).toBeNull();
    expect(riderLocationFor("OUT_FOR_DELIVERY", { lastLat: 1, lastLng: 2 })).toBeNull();
  });

  it("is null when the fix is stale (>10 min)", () => {
    const old = new Date(Date.now() - 11 * 60 * 1000);
    expect(riderLocationFor("OUT_FOR_DELIVERY", { lastLat: 1, lastLng: 2, lastLocationAt: old })).toBeNull();
  });

  it("returns a fresh fix when out for delivery", () => {
    const now = new Date();
    expect(riderLocationFor("OUT_FOR_DELIVERY", { lastLat: 18.5, lastLng: 73.85, lastLocationAt: now })).toEqual({
      lat: 18.5,
      lng: 73.85,
      at: now,
    });
  });
});

describe("liveState", () => {
  it("exposes destination + rider + ETA while out for delivery", () => {
    const s = liveState(order(), { lastLat: 18.5, lastLng: 73.85, lastLocationAt: new Date() });
    expect(s.destination).toEqual({ lat: 18.52, lng: 73.85 });
    expect(s.rider).not.toBeNull();
    expect(s.etaMinutes).toBeGreaterThanOrEqual(2);
  });

  it("hides the rider before pickup and copes with no destination coords", () => {
    const s = liveState(order({ status: "PREPARING", address: null }), {
      lastLat: 1,
      lastLng: 2,
      lastLocationAt: new Date(),
    });
    expect(s.rider).toBeNull();
    expect(s.destination).toBeNull();
    expect(s.etaMinutes).toBe(30);
  });

  it("treats an address without coords as no destination", () => {
    const s = liveState(order({ status: "CONFIRMED", address: { lat: undefined, lng: undefined } }), null);
    expect(s.destination).toBeNull();
  });
});
