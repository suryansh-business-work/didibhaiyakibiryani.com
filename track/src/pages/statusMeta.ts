import type { OrderStatus } from "../graphql";

type ChipColor = "primary" | "secondary" | "success" | "error" | "info" | "warning";

interface StatusMeta {
  label: string;
  chipColor: ChipColor;
}

// Gold maps to the MUI "primary" colour in the dark-gold theme.
const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PLACED: { label: "Order placed", chipColor: "primary" },
  CONFIRMED: { label: "Confirmed", chipColor: "info" },
  PREPARING: { label: "Preparing", chipColor: "info" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", chipColor: "primary" },
  DELIVERED: { label: "Delivered", chipColor: "success" },
  CANCELLED: { label: "Cancelled", chipColor: "error" },
};

export function statusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status];
}

// The five forward steps shown in the timeline, in order.
export const TIMELINE_STEPS: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function stepLabel(status: OrderStatus): string {
  return STATUS_META[status].label;
}

// Index of a status within the forward flow (-1 if not part of it).
export function stepIndex(status: OrderStatus): number {
  return TIMELINE_STEPS.indexOf(status);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN");
}
