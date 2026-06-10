import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PAYMENTS } from "../../graphql/queries";
import { REFUND_PAYMENT } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, inr, fmtDate } from "../../components/ui";
import { useAlert, useConfirm } from "../../components/dialog";
import PaymentDetail from "./PaymentDetail";
import {
  STATUS_FILTERS,
  STATUS_BADGE,
  refundableAmount,
  type PaymentRow,
} from "./types";

export default function Payments() {
  const [filter, setFilter] = useState<string>("ALL");
  const { data, loading, refetch } = useQuery<{ payments: PaymentRow[] }>(PAYMENTS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const [refund, { loading: refunding }] = useMutation(REFUND_PAYMENT);
  const confirm = useConfirm();
  const notify = useAlert();
  const [active, setActive] = useState<PaymentRow | null>(null);

  const payments = data?.payments ?? [];

  async function doRefund(p: PaymentRow) {
    const amount = refundableAmount(p);
    const ok = await confirm({
      title: "Refund payment",
      message: `Refund ${inr(amount)} for order ${p.order?.orderNumber ?? p.providerOrderId}? This cannot be undone.`,
      confirmLabel: "Refund",
      danger: true,
    });
    if (!ok) return;
    try {
      await refund({ variables: { paymentId: p.id, reason: "Admin refund" } });
      await refetch();
      setActive(null);
      await notify({ title: "Refunded", message: `${inr(amount)} refund initiated.` });
    } catch (e: unknown) {
      await notify({
        title: "Refund failed",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  return (
    <Layout title="Payments">
      <div className="toolbar">
        <div className="chips">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "All" : f.replaceAll("_", " ").toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={payments.length === 0} emptyLabel="No payments yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th><th>Status</th><th>Method</th><th>Refunded</th>
                  <th>Created</th><th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setActive(p)}>
                    <td>
                      <div className="t-strong">{p.order?.orderNumber ?? "—"}</div>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>{p.providerOrderId}</div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[p.status] ?? "badge--muted"}`}>
                        <span className="dot" />
                        {p.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="muted">{p.method ?? "—"}</td>
                    <td className="muted">
                      {p.refunds.length > 0 ? inr(p.amount - refundableAmount(p)) : "—"}
                    </td>
                    <td className="muted">{fmtDate(p.createdAt)}</td>
                    <td className="t-mono" style={{ textAlign: "right" }}>{inr(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {active && (
        <PaymentDetail
          payment={active}
          refunding={refunding}
          onRefund={doRefund}
          onClose={() => setActive(null)}
        />
      )}
    </Layout>
  );
}
