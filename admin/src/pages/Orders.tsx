import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ORDERS } from "../graphql/queries";
import { UPDATE_ORDER_STATUS } from "../graphql/mutations";
import Layout from "../components/Layout";
import { AsyncList, Modal, StatusBadge, inr, fmtDate } from "../components/ui";
import { useAlert } from "../components/dialog";

interface OrderItem { name: string; price: number; qty: number; spiceLevel?: number; }
interface Order {
  id: string; orderNumber: string; total: number; subtotal: number; discount: number;
  deliveryFee: number; status: string; paymentMethod: string; paymentStatus: string;
  couponCode?: string; placedAt: string; notes?: string;
  user?: { name: string; phone?: string; email: string } | null;
  address: { line1: string; line2?: string; city: string; pincode: string; phone?: string };
  items: OrderItem[];
  statusHistory: { status: string; at: string; note?: string }[];
}

const FILTERS = ["ALL", "PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const NEXT: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};
const LABEL: Record<string, string> = {
  CONFIRMED: "Confirm", PREPARING: "Start preparing",
  OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Mark delivered", CANCELLED: "Cancel",
};

export default function Orders() {
  const [filter, setFilter] = useState("ALL");
  const [active, setActive] = useState<Order | null>(null);
  const { data, loading, refetch } = useQuery<{ orders: Order[] }>(ORDERS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const [updateStatus, { loading: saving }] = useMutation(UPDATE_ORDER_STATUS);
  const notify = useAlert();

  async function move(o: Order, status: string) {
    try {
      await updateStatus({ variables: { id: o.id, status } });
      await refetch();
      setActive((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: unknown) {
      await notify({
        title: "Could not update status",
        message: e instanceof Error ? e.message : "Could not update status.",
      });
    }
  }

  const orders = data?.orders ?? [];

  return (
    <Layout title="Orders">
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={orders.length === 0} emptyLabel="No orders here yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Items</th><th>Status</th>
                  <th>Payment</th><th>Placed</th><th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setActive(o)}>
                    <td className="t-strong">{o.orderNumber}</td>
                    <td>
                      {o.user?.name ?? "—"}
                      <div className="muted" style={{ fontSize: "0.78rem" }}>{o.user?.phone}</div>
                    </td>
                    <td className="muted">{o.items.reduce((n, it) => n + it.qty, 0)} item(s)</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="muted">{o.paymentMethod}</td>
                    <td className="muted">{fmtDate(o.placedAt)}</td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {active && (
        <Modal title={`Order ${active.orderNumber}`} onClose={() => setActive(null)}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <StatusBadge status={active.status} />
            <span className="muted">{fmtDate(active.placedAt)}</span>
          </div>

          <Section label="Customer">
            <div>{active.user?.name}</div>
            <div className="muted">{active.user?.phone} · {active.user?.email}</div>
          </Section>

          <Section label="Deliver to">
            <div>{active.address.line1}{active.address.line2 ? `, ${active.address.line2}` : ""}</div>
            <div className="muted">{active.address.city} — {active.address.pincode}</div>
          </Section>

          <Section label="Items">
            <table>
              <tbody>
                {active.items.map((it) => (
                  <tr key={`${it.name}-${it.spiceLevel ?? 0}`}>
                    <td className="t-strong">{it.qty}×</td>
                    <td>{it.name}</td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <Row k="Subtotal" v={inr(active.subtotal)} />
            {active.discount > 0 && <Row k={`Discount ${active.couponCode ? `(${active.couponCode})` : ""}`} v={`– ${inr(active.discount)}`} />}
            <Row k="Delivery" v={active.deliveryFee === 0 ? "Free" : inr(active.deliveryFee)} />
            <Row k="Total" v={inr(active.total)} strong />
          </div>

          {active.notes && (
            <Section label="Notes"><div className="muted">{active.notes}</div></Section>
          )}

          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--dim)" }}>Update status</label>
            <div className="chips" style={{ marginTop: 10 }}>
              {NEXT[active.status]?.length ? (
                NEXT[active.status].map((ns) => (
                  <button
                    key={ns}
                    className={`btn btn-sm ${ns === "CANCELLED" ? "btn-danger" : "btn-gold"}`}
                    disabled={saving}
                    onClick={() => move(active, ns)}
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
      )}
    </Layout>
  );
}

function Section({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", fontWeight: 800, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  return (
    <div className="row-between" style={{ padding: "3px 0", fontWeight: strong ? 800 : 400, color: strong ? "var(--text)" : "var(--dim)" }}>
      <span>{k}</span><span className="t-mono">{v}</span>
    </div>
  );
}
