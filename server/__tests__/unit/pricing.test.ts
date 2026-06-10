import { describe, it, expect } from "vitest";
import {
  computeDeliveryFee,
  haversineKm,
  evaluateCoupon,
  DEFAULT_DELIVERY_PRICING,
} from "../../src/utils/pricing";
import type { ICoupon } from "../../src/models";

function coupon(overrides: Partial<ICoupon> = {}): ICoupon {
  return {
    code: "TEST",
    type: "FLAT",
    value: 50,
    minOrder: 0,
    isActive: true,
    usedCount: 0,
    appOnly: false,
    firstOrderOnly: false,
    ...overrides,
  } as ICoupon;
}

describe("computeDeliveryFee", () => {
  const pricing = { minDeliveryCost: 30, perKmCharge: 10, freeDeliveryAbove: 399 };

  it("charges the minimum cost when distance is unknown", () => {
    expect(computeDeliveryFee(100, 0, pricing)).toBe(30);
    expect(computeDeliveryFee(100, Number.NaN, pricing)).toBe(30);
  });

  it("adds the per-km charge on top of the minimum", () => {
    expect(computeDeliveryFee(100, 5, pricing)).toBe(30 + 50);
    expect(computeDeliveryFee(100, 2.5, pricing)).toBe(Math.round(30 + 25));
  });

  it("is free at or above the free-delivery threshold", () => {
    expect(computeDeliveryFee(399, 5, pricing)).toBe(0);
    expect(computeDeliveryFee(1000, 12, pricing)).toBe(0);
  });

  it("never applies free delivery when the threshold is disabled (0)", () => {
    const noFree = { ...pricing, freeDeliveryAbove: 0 };
    expect(computeDeliveryFee(5000, 0, noFree)).toBe(30);
  });

  it("falls back to sane defaults", () => {
    expect(computeDeliveryFee(100, 0)).toBe(DEFAULT_DELIVERY_PRICING.minDeliveryCost);
    expect(computeDeliveryFee(DEFAULT_DELIVERY_PRICING.freeDeliveryAbove, 0)).toBe(0);
  });
});

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm(12.97, 77.59, 12.97, 77.59)).toBe(0);
  });

  it("computes a known distance (Bengaluru → Mysuru ≈ 128–146 km)", () => {
    const km = haversineKm(12.9716, 77.5946, 12.2958, 76.6394);
    expect(km).toBeGreaterThan(120);
    expect(km).toBeLessThan(150);
  });
});

describe("evaluateCoupon", () => {
  it("rejects a missing coupon", () => {
    const r = evaluateCoupon(null, 500);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
  });

  it("uses the supplied base delivery fee", () => {
    const r = evaluateCoupon(coupon(), 200, { baseDeliveryFee: 77 });
    expect(r.deliveryFee).toBe(77);
  });

  it("applies a FLAT discount, capped at the subtotal", () => {
    expect(evaluateCoupon(coupon({ type: "FLAT", value: 50 }), 300).discount).toBe(50);
    expect(evaluateCoupon(coupon({ type: "FLAT", value: 500 }), 300).discount).toBe(300);
  });

  it("applies a PERCENT discount and respects maxDiscount", () => {
    expect(evaluateCoupon(coupon({ type: "PERCENT", value: 20 }), 1000).discount).toBe(200);
    expect(
      evaluateCoupon(coupon({ type: "PERCENT", value: 50, maxDiscount: 100 }), 1000).discount
    ).toBe(100);
  });

  it("zeroes the delivery fee for FREE_DELIVERY", () => {
    const r = evaluateCoupon(coupon({ type: "FREE_DELIVERY" }), 200, { baseDeliveryFee: 39 });
    expect(r.valid).toBe(true);
    expect(r.deliveryFee).toBe(0);
    expect(r.discount).toBe(0);
  });

  it("enforces minimum order value", () => {
    expect(evaluateCoupon(coupon({ minOrder: 500 }), 300).valid).toBe(false);
    expect(evaluateCoupon(coupon({ minOrder: 500 }), 500).valid).toBe(true);
  });

  it("rejects inactive, exhausted and expired coupons", () => {
    expect(evaluateCoupon(coupon({ isActive: false }), 500).valid).toBe(false);
    expect(evaluateCoupon(coupon({ usageLimit: 5, usedCount: 5 }), 500).valid).toBe(false);
    expect(
      evaluateCoupon(coupon({ validTo: new Date(Date.now() - 1000) }), 500).valid
    ).toBe(false);
  });

  it("honours firstOrderOnly and appOnly flags", () => {
    expect(
      evaluateCoupon(coupon({ firstOrderOnly: true }), 500, { isFirstOrder: false }).valid
    ).toBe(false);
    expect(
      evaluateCoupon(coupon({ appOnly: true }), 500, { fromApp: false }).valid
    ).toBe(false);
    expect(
      evaluateCoupon(coupon({ firstOrderOnly: true, appOnly: true }), 500, {
        isFirstOrder: true,
        fromApp: true,
      }).valid
    ).toBe(true);
  });
});
