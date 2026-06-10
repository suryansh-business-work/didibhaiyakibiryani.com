import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ORDERS, RIDERS } from "../../graphql/queries";
import { ASSIGN_RIDER, UPDATE_ORDER_STATUS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, StatusBadge, inr, fmtDate } from "../../components/ui";
import { useAlert } from "../../components/dialog";
import OrderDetail from "./OrderDetail";
import OrderMap from "./OrderMap";
import { FILTERS, type Order, type Rider } from "./types";

export default function Orders() {
  const [filter, setFilter] = useState("ALL");
  const [active, setActive] = useState<Order | null>(null);
  const [mapOrder, setMapOrder] = useState<Order | null>(null);
  const { data, loading, refetch } = useQuery<{ orders: Order[] }>(ORDERS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const { data: riderData } = useQuery<{ riders: Rider[] }>(RIDERS);
  const [updateStatus, { loading: savingStatus }] = useMutation(UPDATE_ORDER_STATUS);
  const [assignRider, { loading: assigning }] = useMutation(ASSIGN_RIDER);
  const notify = useAlert();

  const saving = savingStatus || assigning;

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

  async function assign(o: Order, riderId: string) {
    try {
      const { data: res } = await assignRider({ variables: { orderId: o.id, riderId } });
      await refetch();
      const partner = res?.assignDeliveryPartner?.deliveryPartner ?? null;
      setActive((prev) => (prev ? { ...prev, deliveryPartner: partner } : prev));
    } catch (e: unknown) {
      await notify({
        title: "Could not assign rider",
        message: e instanceof Error ? e.message : "Please try again.",
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
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Rider</th>
                  <th>Payment</th>
                  <th>Placed</th>
                  <th>Map</th>
                  <th style={{ textAlign: "right" }}>Total</th>
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
                    <td className="muted">{o.deliveryPartner?.name ?? "—"}</td>
                    <td className="muted">{o.paymentMethod}</td>
                    <td className="muted">{fmtDate(o.placedAt)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        aria-label={`Show order ${o.orderNumber} on map`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMapOrder(o);
                        }}
                      >
                        📍
                      </button>
                    </td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {active && (
        <OrderDetail
          order={active}
          riders={riderData?.riders ?? []}
          saving={saving}
          onClose={() => setActive(null)}
          onMove={move}
          onAssignRider={assign}
          onShowMap={setMapOrder}
        />
      )}
      {mapOrder && <OrderMap order={mapOrder} onClose={() => setMapOrder(null)} />}
    </Layout>
  );
}
