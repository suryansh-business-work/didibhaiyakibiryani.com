import { Modal, inr, fmtDate } from "../../components/ui";
import { STATUS_BADGE, refundableAmount, canRefund, type PaymentRow } from "./types";

interface PaymentDetailProps {
  payment: PaymentRow;
  refunding: boolean;
  onRefund: (payment: PaymentRow) => void;
  onClose: () => void;
}

export default function PaymentDetail({
  payment,
  refunding,
  onRefund,
  onClose,
}: Readonly<PaymentDetailProps>) {
  return (
    <Modal
      title={`Payment · ${payment.order?.orderNumber ?? payment.providerOrderId}`}
      onClose={onClose}
      footer={
        canRefund(payment) ? (
          <button className="btn btn-danger" disabled={refunding} onClick={() => onRefund(payment)}>
            {refunding ? "Refunding…" : `Refund ${inr(refundableAmount(payment))}`}
          </button>
        ) : undefined
      }
    >
      <div className="row-between" style={{ marginBottom: 14 }}>
        <span className={`badge ${STATUS_BADGE[payment.status] ?? "badge--muted"}`}>
          <span className="dot" />
          {payment.status.replaceAll("_", " ")}
        </span>
        <span className="t-mono t-strong">{inr(payment.amount)}</span>
      </div>

      <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
        <div>Provider order: <span className="t-mono">{payment.providerOrderId}</span></div>
        {payment.providerPaymentId && (
          <div>Provider payment: <span className="t-mono">{payment.providerPaymentId}</span></div>
        )}
        {payment.method && <div>Method: {payment.method}</div>}
        <div>Created: {fmtDate(payment.createdAt)}</div>
      </div>

      {payment.refunds.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="panel-title">Refunds</div>
          <table>
            <tbody>
              {payment.refunds.map((r) => (
                <tr key={r.providerRefundId}>
                  <td className="t-mono" style={{ fontSize: "0.8rem" }}>{r.providerRefundId}</td>
                  <td className="muted">{r.reason ?? "—"}</td>
                  <td className="muted">{fmtDate(r.at)}</td>
                  <td className="t-mono" style={{ textAlign: "right" }}>{inr(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel-title">Activity log</div>
      <table>
        <tbody>
          {payment.events.map((e) => (
            <tr key={`${e.type}-${e.at}`}>
              <td className="t-strong" style={{ fontSize: "0.82rem" }}>{e.type}</td>
              <td className="muted" style={{ fontSize: "0.82rem" }}>{e.data ?? ""}</td>
              <td className="muted" style={{ textAlign: "right", fontSize: "0.82rem" }}>
                {fmtDate(e.at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
