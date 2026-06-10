import type { ICoupon } from "../models/index.js";

export interface DeliveryPricing {
  minDeliveryCost: number;
  perKmCharge: number;
  freeDeliveryAbove: number;
}

/** Defaults used when admin has not configured Finance settings yet. */
export const DEFAULT_DELIVERY_PRICING: DeliveryPricing = {
  minDeliveryCost: 39,
  perKmCharge: 0,
  freeDeliveryAbove: 399,
};

/** Great-circle distance in km between two coordinates (haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Delivery fee = min delivery cost + per-km charge × distance, free above the
 * configured subtotal. Distance is 0 when either side has no coordinates yet.
 */
export function computeDeliveryFee(
  subtotal: number,
  distanceKm: number,
  pricing: DeliveryPricing = DEFAULT_DELIVERY_PRICING
): number {
  if (pricing.freeDeliveryAbove > 0 && subtotal >= pricing.freeDeliveryAbove) return 0;
  const km = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  return Math.round(pricing.minDeliveryCost + pricing.perKmCharge * km);
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
 * coupons be checked at order time. `baseDeliveryFee` is the fee computed from
 * the admin-configured delivery pricing for this order.
 */
export function evaluateCoupon(
  coupon: ICoupon | null,
  subtotal: number,
  opts: { isFirstOrder?: boolean; fromApp?: boolean; baseDeliveryFee?: number } = {}
): CouponEval {
  const baseDelivery =
    opts.baseDeliveryFee ?? computeDeliveryFee(subtotal, 0, DEFAULT_DELIVERY_PRICING);
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
