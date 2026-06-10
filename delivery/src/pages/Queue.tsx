import { useMutation, useQuery } from "@apollo/client";
import { DELIVERY_QUEUE, UPDATE_ORDER_STATUS } from "../graphql";
import Shell from "../components/Shell";
import { Spinner, Empty, StatusBadge, inr, fmtDate } from "../components/ui";
import { useState } from "react";
import type { QueueOrder } from "../types";

function mapsUrl(o: QueueOrder): string {
  const a = o.address;
  const q = a.lat && a.lng ? `${a.lat},${a.lng}` : `${a.line1}, ${a.city} ${a.pincode}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** The rider's actionable transition for an order, if any. */
function nextAction(status: string): { to: string; label: string } | null {
  if (status === "PREPARING") return { to: "OUT_FOR_DELIVERY", label: "Picked up — start delivery" };
  if (status === "OUT_FOR_DELIVERY") return { to: "DELIVERED", label: "Mark delivered ✓" };
  return null;
}

export default function Queue() {
  const { data, loading, refetch } = useQuery<{ deliveryQueue: QueueOrder[] }>(DELIVERY_QUEUE, {
    pollInterval: 20000,
  });
  const [updateStatus, { loading: saving }] = useMutation(UPDATE_ORDER_STATUS);
  const [error, setError] = useState("");

  const orders = data?.deliveryQueue ?? [];

  async function move(o: QueueOrder, status: string) {
    setError("");
    try {
      await updateStatus({ variables: { id: o.id, status } });
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update the order.");
    }
  }

  return (
    <Shell title="My queue">
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {loading && !data && <Spinner label="Loading your orders…" />}
      {!loading && orders.length === 0 && (
        <Empty>No assigned orders right now — new assignments appear here automatically.</Empty>
      )}

      {orders.map((o) => {
        const action = nextAction(o.status);
        return (
          <div className="card rider-order" key={o.id}>
            <div className="row-between">
              <span className="t-strong">{o.orderNumber}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="muted" style={{ fontSize: "0.8rem" }}>{fmtDate(o.placedAt)}</div>

            <div className="rider-block">
              <b>{o.user?.name ?? "Customer"}</b>
              <div className="muted">
                {o.address.line1}
                {o.address.line2 ? `, ${o.address.line2}` : ""} · {o.address.city} —{" "}
                {o.address.pincode}
              </div>
            </div>

            <div className="rider-block muted">
              {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
            </div>

            <div className="row-between rider-pay">
              <span className={`badge ${o.paymentMethod === "COD" ? "badge--amber" : "badge--green"}`}>
                <span className="dot" />
                {o.paymentMethod === "COD" ? `Collect ${inr(o.total)} (cash)` : "Paid online"}
              </span>
              <span className="t-strong">{inr(o.total)}</span>
            </div>

            {o.notes && <div className="rider-block muted">📝 {o.notes}</div>}

            <div className="rider-actions">
              <a className="btn btn-ghost btn-sm" href={mapsUrl(o)} target="_blank" rel="noreferrer">
                🗺 Navigate
              </a>
              {(o.address.phone || o.user?.phone) && (
                <a className="btn btn-ghost btn-sm" href={`tel:${o.address.phone ?? o.user?.phone}`}>
                  📞 Call
                </a>
              )}
              {action && (
                <button
                  className="btn btn-gold btn-sm"
                  disabled={saving}
                  onClick={() => move(o, action.to)}
                >
                  {action.label}
                </button>
              )}
              {!action && <span className="muted">Waiting for the kitchen…</span>}
            </div>
          </div>
        );
      })}
    </Shell>
  );
}
