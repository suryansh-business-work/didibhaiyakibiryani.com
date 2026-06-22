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

/**
 * Renders a spinner while loading, an empty-state when there is no data,
 * or its children otherwise — keeps list pages free of nested ternaries.
 */
export function AsyncList({
  loading,
  empty,
  emptyLabel,
  children,
}: Readonly<{
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  children: ReactNode;
}>) {
  if (loading) {
    return <Spinner />;
  }
  if (empty) {
    return <Empty>{emptyLabel}</Empty>;
  }
  return <>{children}</>;
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: Readonly<{
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  // Intentionally no backdrop click-to-close: dialogs dismiss only via the ×
  // button (or an explicit footer action) to avoid accidental data loss.
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  PLACED: { cls: "badge--amber", label: "Placed" },
  CONFIRMED: { cls: "badge--blue", label: "Confirmed" },
  PREPARING: { cls: "badge--blue", label: "Preparing" },
  OUT_FOR_DELIVERY: { cls: "badge--gold", label: "Out for delivery" },
  DELIVERED: { cls: "badge--green", label: "Delivered" },
  CANCELLED: { cls: "badge--red", label: "Cancelled" },
};

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const s = STATUS_STYLE[status] ?? { cls: "badge--muted", label: status };
  return (
    <span className={`badge ${s.cls}`}>
      <span className="dot" />
      {s.label}
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
