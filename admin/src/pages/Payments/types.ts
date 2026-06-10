export interface PaymentRefund {
  providerRefundId: string;
  amount: number;
  reason?: string;
  at: string;
}

export interface PaymentEvent {
  type: string;
  at: string;
  data?: string;
}

export interface PaymentRow {
  id: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  createdAt: string;
  order?: { id: string; orderNumber: string; paymentStatus: string } | null;
  refunds: PaymentRefund[];
  events: PaymentEvent[];
}

export const STATUS_FILTERS = [
  "ALL",
  "CREATED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

export const STATUS_BADGE: Record<string, string> = {
  CREATED: "badge--amber",
  CAPTURED: "badge--green",
  FAILED: "badge--red",
  REFUNDED: "badge--blue",
  PARTIALLY_REFUNDED: "badge--gold",
};

export function refundedTotal(p: PaymentRow): number {
  return p.refunds.reduce((s, r) => s + r.amount, 0);
}

export function refundableAmount(p: PaymentRow): number {
  return p.amount - refundedTotal(p);
}

export function canRefund(p: PaymentRow): boolean {
  return (
    Boolean(p.providerPaymentId) &&
    (p.status === "CAPTURED" || p.status === "PARTIALLY_REFUNDED") &&
    refundableAmount(p) > 0
  );
}
