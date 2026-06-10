import type { ICoupon } from "../models/index.js";

export const DELIVERY_FEE = 39;
export const FREE_DELIVERY_THRESHOLD = 399;

export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export interface CouponEval {
  valid: boolean;
  message: string;
  /** discount applied to the subtotal */
  discount: number;
  /** delivery fee after the coupon (handles FREE_DELIVERY) */
  deliveryFee: number;
}

/**
 * Evaluate a coupon against a subtotal. `isFirstOrder` lets first-order-only
 * coupons be checked at order time.
 */
export function evaluateCoupon(
  coupon: ICoupon | null,
  subtotal: number,
  opts: { isFirstOrder?: boolean; fromApp?: boolean } = {}
): CouponEval {
  const baseDelivery = deliveryFeeFor(subtotal);
  if (!coupon) {
    return { valid: false, message: "Invalid coupon code.", discount: 0, deliveryFee: baseDelivery };
  }
  const now = new Date();
  if (!coupon.isActive) {
    return { valid: false, message: "This coupon is no longer active.", discount: 0, deliveryFee: baseDelivery };
  }
  if (coupon.validFrom && now < coupon.validFrom) {
    return { valid: false, message: "This coupon isn't active yet.", discount: 0, deliveryFee: baseDelivery };
  }
  if (coupon.validTo && now > coupon.validTo) {
    return { valid: false, message: "This coupon has expired.", discount: 0, deliveryFee: baseDelivery };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "This coupon has been fully claimed.", discount: 0, deliveryFee: baseDelivery };
  }
  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      message: `Add ₹${coupon.minOrder - subtotal} more to use ${coupon.code}.`,
      discount: 0,
      deliveryFee: baseDelivery,
    };
  }
  if (coupon.firstOrderOnly && opts.isFirstOrder === false) {
    return { valid: false, message: "This offer is for your first order only.", discount: 0, deliveryFee: baseDelivery };
  }
  if (coupon.appOnly && opts.fromApp === false) {
    return { valid: false, message: "This offer is available only in the app.", discount: 0, deliveryFee: baseDelivery };
  }

  let discount = 0;
  let deliveryFee = baseDelivery;

  switch (coupon.type) {
    case "PERCENT": {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      break;
    }
    case "FLAT": {
      discount = Math.min(coupon.value, subtotal);
      break;
    }
    case "FREE_DELIVERY": {
      deliveryFee = 0;
      break;
    }
    case "FREE_ITEM": {
      // free item handled when building the order; no subtotal discount
      break;
    }
  }

  return { valid: true, message: `“${coupon.code}” applied!`, discount, deliveryFee };
}
