import { useQuery } from "@apollo/client";
import { MY_DELIVERIES } from "../graphql";
import Shell from "../components/Shell";
import { Spinner, Empty, inr, fmtDate } from "../components/ui";
import type { DeliveredOrder } from "../types";

function isToday(date: string): boolean {
  return new Date(date).toDateString() === new Date().toDateString();
}

export default function Earnings() {
  const { data, loading } = useQuery<{ myDeliveries: DeliveredOrder[] }>(MY_DELIVERIES, {
    variables: { limit: 100 },
  });

  const deliveries = data?.myDeliveries ?? [];
  const todayCount = deliveries.filter((d) => isToday(d.placedAt)).length;
  const totalFees = deliveries.reduce((s, d) => s + d.deliveryFee, 0);

  return (
    <Shell title="Earnings">
      {loading && !data && <Spinner label="Crunching your numbers…" />}

      {!loading && (
        <div className="stat-grid rider-stats">
          <Stat label="Delivered today" value={String(todayCount)} />
          <Stat label="Total delivered" value={String(deliveries.length)} />
          <Stat label="Delivery fees earned" value={inr(totalFees)} />
        </div>
      )}

      {!loading && deliveries.length === 0 && (
        <Empty>No completed deliveries yet — your history shows up here.</Empty>
      )}

      {deliveries.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Area</th>
                  <th>When</th>
                  <th style={{ textAlign: "right" }}>Order value</th>
                  <th style={{ textAlign: "right" }}>Fee</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="t-strong">{d.orderNumber}</td>
                    <td className="muted">
                      {d.address.city} · {d.address.pincode}
                    </td>
                    <td className="muted">{fmtDate(d.placedAt)}</td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(d.total)}</td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(d.deliveryFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gold)" }}>{value}</div>
    </div>
  );
}
