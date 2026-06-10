import { describe, it, expect } from "vitest";
import {
  deliveryFeeFor,
  evaluateCoupon,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
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

describe("deliveryFeeFor", () => {
  it("charges the flat fee below the free-delivery threshold", () => {
    expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD - 1)).toBe(DELIVERY_FEE);
    expect(deliveryFeeFor(0)).toBe(DELIVERY_FEE);
  });

  it("is free at or above the threshold", () => {
    expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD)).toBe(0);
    expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD + 100)).toBe(0);
  });
});

describe("evaluateCoupon", () => {
  it("rejects a missing coupon", () => {
    const r = evaluateCoupon(null, 500);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
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
    const r = evaluateCoupon(coupon({ type: "FREE_DELIVERY" }), 200);
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
