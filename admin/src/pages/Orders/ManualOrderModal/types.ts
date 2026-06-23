import type { ManualOrderForm } from "../../../form";

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
  pincode: "",
  phone: "",
  discount: 0,
  deliveryFee: 0,
  paymentMethod: "COD",
  paymentStatus: "PAID",
  status: "DELIVERED",
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
  { value: "DELIVERED", label: "Delivered" },
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "CANCELLED", label: "Cancelled" },
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
