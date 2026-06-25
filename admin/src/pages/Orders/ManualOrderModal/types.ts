import type { ManualOrderForm } from "../../../form";
import type { Order } from "../types";

export interface MenuOption {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  category?: { id: string } | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
}

export interface SocietyOption {
  id: string;
  name: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type CouponKind = "PERCENT" | "FLAT" | "FREE_DELIVERY" | "FREE_ITEM";

export interface CouponOption {
  id: string;
  code: string;
  title: string;
  type: CouponKind;
  value: number;
  maxDiscount?: number | null;
  minOrder: number;
  isActive: boolean;
}

export interface DeliverySettings {
  minDeliveryCost: number;
  freeDeliveryAbove: number;
}

export interface LeadOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  society?: string;
  block?: string;
  flat?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

/** Empty-form defaults. Items are added by tapping the catalogue; POS counter
 * sales default to a completed takeaway. */
export const BLANK_MANUAL_ORDER: ManualOrderForm = {
  orderType: "TAKEAWAY",
  customerMode: "WALKIN",
  userId: "",
  customerName: "",
  customerPhone: "",
  items: [],
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  couponCode: "",
  discount: 0,
  deliveryFee: 0,
  paymentMethod: "COD",
  paymentStatus: "PAID",
  status: "PLACED",
  placedAt: "",
  surveyUrl: "",
  notes: "",
};

export const PAYMENT_METHODS = [
  { value: "COD", label: "Cash" },
  { value: "ONLINE", label: "Online" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

export const ORDER_STATUSES = [
  { value: "PLACED", label: "1 · Placed" },
  { value: "CONFIRMED", label: "2 · Confirmed" },
  { value: "PREPARING", label: "3 · Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "4 · Out for delivery" },
  { value: "DELIVERED", label: "5 · Delivered" },
  { value: "CANCELLED", label: "6 · Cancelled" },
] as const;

export const SPICE_OPTIONS = [
  { value: 0, label: "Mild" },
  { value: 1, label: "Medium" },
  { value: 2, label: "Spicy" },
  { value: 3, label: "Fiery" },
] as const;

export interface Totals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

/** Live order totals for the summary panel (server re-derives authoritatively). */
export function computeTotals(v: ManualOrderForm): Totals {
  const subtotal = (v.items ?? []).reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0),
    0
  );
  const discount = Math.min(Number(v.discount) || 0, subtotal);
  const deliveryFee = v.orderType === "DELIVERY" ? Number(v.deliveryFee) || 0 : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { subtotal, discount, deliveryFee, total };
}

/** Item discount a coupon yields against the current subtotal (POS quick-apply).
 * FREE_DELIVERY is handled via the delivery fee; FREE_ITEM is not auto-applied. */
export function couponItemDiscount(coupon: CouponOption | undefined, subtotal: number): number {
  if (!coupon || subtotal <= 0 || subtotal < (coupon.minOrder ?? 0)) return 0;
  if (coupon.type === "PERCENT") {
    const raw = Math.round((subtotal * coupon.value) / 100);
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  if (coupon.type === "FLAT") return Math.min(Math.round(coupon.value), subtotal);
  return 0;
}

/** Delivery fee derived from Finance settings (free over a threshold, else the
 * base min cost). A FREE_DELIVERY coupon zeroes it. */
export function deliveryFeeFor(settings: DeliverySettings, subtotal: number, freeByCoupon: boolean): number {
  if (freeByCoupon) return 0;
  if (settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove) return 0;
  return Math.max(0, Math.round(settings.minDeliveryCost) || 0);
}

/** Merge duplicate lines of the same dish so an order shows one row per dish. */
function mergeItemsByName(items: Order["items"]) {
  const map = new Map<string, { name: string; price: number; qty: number; spiceLevel: number }>();
  for (const it of items) {
    const existing = map.get(it.name);
    if (existing) existing.qty += it.qty;
    else map.set(it.name, { name: it.name, price: it.price, qty: it.qty, spiceLevel: it.spiceLevel ?? 0 });
  }
  return [...map.values()];
}

/** Prefill the POS form from an existing order (for the Edit flow). */
export function orderToManualForm(o: Order): ManualOrderForm {
  const isDelivery = o.orderType === "DELIVERY" || Boolean(o.address);
  return {
    orderType: isDelivery ? "DELIVERY" : "TAKEAWAY",
    customerMode: o.user?.id ? "EXISTING" : "WALKIN",
    userId: o.user?.id ?? "",
    customerName: o.customerName ?? o.user?.name ?? "",
    customerPhone: o.customerPhone ?? o.user?.phone ?? "",
    items: mergeItemsByName(o.items).map((it) => ({ menuItemId: "", ...it })),
    line1: o.address?.line1 ?? "",
    line2: o.address?.line2 ?? "",
    city: o.address?.city ?? "",
    state: o.address?.state ?? "",
    pincode: o.address?.pincode ?? "",
    phone: o.address?.phone ?? "",
    couponCode: o.couponCode ?? "",
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    paymentMethod: o.paymentMethod as ManualOrderForm["paymentMethod"],
    paymentStatus: o.paymentStatus as ManualOrderForm["paymentStatus"],
    status: o.status as ManualOrderForm["status"],
    placedAt: o.placedAt ?? "",
    surveyUrl: o.surveyUrl ?? "",
    notes: o.notes ?? "",
  };
}

/** Map the form to the GraphQL `ManualOrderInput`. */
export function buildManualInput(v: ManualOrderForm) {
  const isDelivery = v.orderType === "DELIVERY";
  const items = v.items.map((it) =>
    it.menuItemId
      ? { menuItemId: it.menuItemId, qty: Number(it.qty), spiceLevel: Number(it.spiceLevel) }
      : { name: it.name?.trim(), price: Number(it.price), qty: Number(it.qty), spiceLevel: Number(it.spiceLevel) }
  );
  const address = isDelivery
    ? {
        line1: v.line1?.trim(),
        line2: v.line2?.trim() || null,
        city: v.city?.trim(),
        state: v.state?.trim() || null,
        pincode: v.pincode?.trim() || "",
        phone: v.phone?.trim() || null,
      }
    : null;
  return {
    orderType: v.orderType,
    userId: v.customerMode === "EXISTING" ? v.userId : null,
    customerName: v.customerMode === "WALKIN" ? v.customerName?.trim() : null,
    customerPhone: v.customerMode === "WALKIN" ? v.customerPhone?.trim() || null : null,
    items,
    address,
    discount: Number(v.discount) || 0,
    deliveryFee: isDelivery ? Number(v.deliveryFee) || 0 : 0,
    paymentMethod: v.paymentMethod,
    paymentStatus: v.paymentStatus,
    status: v.status,
    placedAt: v.placedAt ? new Date(v.placedAt).toISOString() : null,
    surveyUrl: v.surveyUrl?.trim() || null,
    notes: v.notes?.trim() || null,
  };
}
