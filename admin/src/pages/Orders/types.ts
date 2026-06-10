export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  spiceLevel?: number;
}

export interface OrderAddress {
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

export interface Rider {
  id: string;
  name: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  placedAt: string;
  notes?: string;
  user?: { name: string; phone?: string; email: string } | null;
  address: OrderAddress;
  items: OrderItem[];
  statusHistory: { status: string; at: string; note?: string }[];
  deliveryPartner?: Rider | null;
  rating?: { food: number; delivery: number; comment?: string } | null;
}

export const FILTERS = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const NEXT: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const LABEL: Record<string, string> = {
  CONFIRMED: "Confirm",
  PREPARING: "Start preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel",
};

/** Google-Maps embed URL for an order's drop point (coords beat the text address). */
export function orderMapEmbedUrl(address: OrderAddress): string {
  const query = address.lat && address.lng
    ? `${address.lat},${address.lng}`
    : [address.line1, address.line2, address.city, address.pincode].filter(Boolean).join(", ");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}
