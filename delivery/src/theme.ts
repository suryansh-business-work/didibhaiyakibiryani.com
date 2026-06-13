// Brand palette for the Didi Bhaiya ki Biryani delivery app (shared across screens).
export const brand = {
  bg: "#0b0705",
  bgSoft: "#110c08",
  card: "#17110c",
  cardSoft: "#1d150d",
  border: "rgba(232,200,140,0.14)",
  borderStrong: "rgba(232,200,140,0.26)",
  gold: "#e4b65c",
  goldDeep: "#b9852f",
  maroon: "#4a1515",
  maroonSoft: "#6e2418",
  green: "#5fb45f",
  blue: "#6aa3e0",
  red: "#e0584b",
  text: "#f5ece0",
  dim: "#cdbfb0",
  muted: "#8d8073",
  faint: "#6b6157",
};

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function fmtDate(d: string | number): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_META: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmed", color: brand.blue },
  PREPARING: { label: "Preparing", color: brand.blue },
  OUT_FOR_DELIVERY: { label: "Out for delivery", color: brand.gold },
  DELIVERED: { label: "Delivered", color: brand.green },
  CANCELLED: { label: "Cancelled", color: brand.red },
};
