import { inr } from "../../components/ui";
import type { CouponForm } from "../../form";

export type { CouponForm };

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: string;
  value: number;
  maxDiscount?: number;
  minOrder: number;
  appOnly: boolean;
  firstOrderOnly: boolean;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  freeItem?: { id: string; name: string } | null;
}

export interface FreeItemOption {
  id: string;
  name: string;
}

/** Empty-form defaults (reusable configuration, not business data). */
export const BLANK_FORM: CouponForm = {
  code: "",
  title: "",
  description: "",
  type: "FLAT",
  value: 0,
  maxDiscount: 0,
  minOrder: 0,
  freeItemId: "",
  appOnly: false,
  firstOrderOnly: false,
  isActive: true,
  usageLimit: 0,
};

export const TYPE_LABEL: Record<string, string> = {
  PERCENT: "% off",
  FLAT: "Flat ₹ off",
  FREE_DELIVERY: "Free delivery",
  FREE_ITEM: "Free item",
};

export const TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "FLAT", label: "Flat ₹ off" },
  { value: "PERCENT", label: "% off" },
  { value: "FREE_DELIVERY", label: "Free delivery" },
  { value: "FREE_ITEM", label: "Free item" },
];

export function describeCoupon(c: Coupon): string {
  if (c.type === "PERCENT") {
    const cap = c.maxDiscount ? ` up to ${inr(c.maxDiscount)}` : "";
    return `${c.value}% off${cap}`;
  }
  if (c.type === "FLAT") {
    return `${inr(c.value)} off`;
  }
  if (c.type === "FREE_DELIVERY") {
    return "Free delivery";
  }
  if (c.type === "FREE_ITEM") {
    return `Free ${c.freeItem?.name ?? "item"}`;
  }
  return "—";
}

export function couponToForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    title: c.title,
    description: c.description ?? "",
    type: c.type as CouponForm["type"],
    value: c.value,
    maxDiscount: c.maxDiscount ?? 0,
    minOrder: c.minOrder,
    freeItemId: c.freeItem?.id ?? "",
    appOnly: c.appOnly,
    firstOrderOnly: c.firstOrderOnly,
    isActive: c.isActive,
    usageLimit: c.usageLimit ?? 0,
  };
}
