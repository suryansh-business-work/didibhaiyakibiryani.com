import type { ReactNode } from "react";

export function Spinner({ label }: Readonly<{ label?: string }>) {
  return (
    <div className="loading">
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }} />
        {label && <div className="muted">{label}</div>}
      </div>
    </div>
  );
}

export function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="empty">{children}</div>;
}

const STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  CONFIRMED: { cls: "badge--blue", label: "Confirmed" },
  PREPARING: { cls: "badge--blue", label: "Preparing" },
  OUT_FOR_DELIVERY: { cls: "badge--gold", label: "Out for delivery" },
  DELIVERED: { cls: "badge--green", label: "Delivered" },
  CANCELLED: { cls: "badge--red", label: "Cancelled" },
};

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const st = STATUS_STYLE[status] ?? { cls: "badge--muted", label: status };
  return (
    <span className={`badge ${st.cls}`}>
      <span className="dot" />
      {st.label}
    </span>
  );
}

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
