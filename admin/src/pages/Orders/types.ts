export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  spiceLevel?: number;
  complimentary?: boolean;
}

export interface OrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
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
  orderType?: "DELIVERY" | "TAKEAWAY";
  source?: "APP" | "POS";
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  placedAt: string;
  notes?: string;
  surveyUrl?: string;
  ratingToken?: string;
  customerName?: string;
  customerPhone?: string;
  customerOrderCount?: number;
  user?: { id: string; name: string; phone?: string; email: string } | null;
  address?: OrderAddress | null;
  items: OrderItem[];
  statusHistory: { status: string; at: string; note?: string }[];
  deliveryPartner?: Rider | null;
  rating?: { food: number; delivery: number; comment?: string; items?: { name: string; rating: number }[] } | null;
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

/** The order lifecycle in sequence (1–6) for status pickers. */
export const STATUS_SEQUENCE: ReadonlyArray<{ value: string; label: string }> = [
  { value: "PLACED", label: "1 · Placed" },
  { value: "CONFIRMED", label: "2 · Confirmed" },
  { value: "PREPARING", label: "3 · Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "4 · Out for delivery" },
  { value: "DELIVERED", label: "5 · Delivered" },
  { value: "CANCELLED", label: "6 · Cancelled" },
];

export interface LatLng {
  lat: number;
  lng: number;
}

/** Single-line text form of an order's drop address. */
export function addressText(a: OrderAddress): string {
  return [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(", ");
}

/** Keyless OpenStreetMap embed centred on a point, with a marker. */
export function osmEmbedUrl({ lat, lng }: LatLng): string {
  const d = 0.008;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/** Deep link to open the drop point in Google Maps (coords beat text). */
export function googleMapsLink(a: OrderAddress): string {
  const q = a.lat && a.lng ? `${a.lat},${a.lng}` : addressText(a);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * Resolve an address to coordinates. Stored coords win; otherwise geocode the
 * text address via OpenStreetMap's keyless Nominatim service.
 */
export async function geocodeAddress(a: OrderAddress): Promise<LatLng | null> {
  if (a.lat && a.lng) return { lat: a.lat, lng: a.lng };
  try {
    const q = encodeURIComponent(addressText(a));
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = Array.isArray(data) ? data[0] : undefined;
    if (hit?.lat && hit?.lon) return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    /* geocoding is best-effort; the UI falls back to the address text */
  }
  return null;
}
