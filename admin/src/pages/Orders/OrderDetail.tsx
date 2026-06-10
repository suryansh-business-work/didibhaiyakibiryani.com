import type { ReactNode } from "react";
import { Modal, StatusBadge, inr, fmtDate } from "../../components/ui";
import { LABEL, NEXT, type Order, type Rider } from "./types";

interface OrderDetailProps {
  order: Order;
  riders: Rider[];
  saving: boolean;
  onClose: () => void;
  onMove: (order: Order, status: string) => void;
  onAssignRider: (order: Order, riderId: string) => void;
  onShowMap: (order: Order) => void;
}

export default function OrderDetail({
  order,
  riders,
  saving,
  onClose,
  onMove,
  onAssignRider,
  onShowMap,
}: Readonly<OrderDetailProps>) {
  const active = order;
  const canAssign = !["DELIVERED", "CANCELLED"].includes(active.status);

  return (
    <Modal title={`Order ${active.orderNumber}`} onClose={onClose}>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <StatusBadge status={active.status} />
        <span className="muted">{fmtDate(active.placedAt)}</span>
      </div>

      <Section label="Customer">
        <div>{active.user?.name}</div>
        <div className="muted">
          {active.user?.phone} · {active.user?.email}
        </div>
      </Section>

      <Section label="Deliver to">
        <div>
          {active.address.line1}
          {active.address.line2 ? `, ${active.address.line2}` : ""}
        </div>
        <div className="muted">
          {active.address.city} — {active.address.pincode}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onShowMap(active)}>
          📍 View on Google Map
        </button>
      </Section>

      <Section label="Items">
        <table>
          <tbody>
            {active.items.map((it) => (
              <tr key={`${it.name}-${it.spiceLevel ?? 0}`}>
                <td className="t-strong">{it.qty}×</td>
                <td>{it.name}</td>
                <td className="t-mono" style={{ textAlign: "right" }}>
                  {inr(it.price * it.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <Row k="Subtotal" v={inr(active.subtotal)} />
        {active.discount > 0 && (
          <Row k={`Discount ${active.couponCode ? `(${active.couponCode})` : ""}`} v={`– ${inr(active.discount)}`} />
        )}
        <Row k="Delivery" v={active.deliveryFee === 0 ? "Free" : inr(active.deliveryFee)} />
        <Row k="Total" v={inr(active.total)} strong />
      </div>

      {active.rating && (
        <Section label="Customer rating">
          <div>
            Food {"★".repeat(active.rating.food)} · Delivery {"★".repeat(active.rating.delivery)}
          </div>
          {active.rating.comment && <div className="muted">“{active.rating.comment}”</div>}
        </Section>
      )}

      {active.notes && (
        <Section label="Notes">
          <div className="muted">{active.notes}</div>
        </Section>
      )}

      <Section label="Delivery partner">
        {canAssign ? (
          <select
            value={active.deliveryPartner?.id ?? ""}
            disabled={saving || riders.length === 0}
            onChange={(e) => e.target.value && onAssignRider(active, e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">{riders.length ? "Assign a rider…" : "No riders yet — add one in Riders"}</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.phone ? ` · ${r.phone}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="muted">{active.deliveryPartner?.name ?? "—"}</div>
        )}
      </Section>

      <div style={{ marginTop: 6 }}>
        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--dim)" }}>Update status</label>
        <div className="chips" style={{ marginTop: 10 }}>
          {NEXT[active.status]?.length ? (
            NEXT[active.status].map((ns) => (
              <button
                key={ns}
                className={`btn btn-sm ${ns === "CANCELLED" ? "btn-danger" : "btn-gold"}`}
                disabled={saving}
                onClick={() => onMove(active, ns)}
              >
                {LABEL[ns]}
              </button>
            ))
          ) : (
            <span className="muted">This order is {active.status.toLowerCase()} — no further action.</span>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Section({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "var(--muted)",
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  return (
    <div
      className="row-between"
      style={{ padding: "3px 0", fontWeight: strong ? 800 : 400, color: strong ? "var(--text)" : "var(--dim)" }}
    >
      <span>{k}</span>
      <span className="t-mono">{v}</span>
    </div>
  );
}
