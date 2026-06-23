import type { ReactNode } from "react";
import { useLazyQuery } from "@apollo/client";
import { Chip, Rating, Stack, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { INVOICE_PDF } from "../../graphql/queries";
import { Modal, StatusBadge, inr, fmtDate } from "../../components/ui";
import { LABEL, NEXT, type Order, type Rider } from "./types";

/** Decode a base64 PDF payload and trigger a browser download. */
function downloadBase64Pdf(b64: string, filename: string): void {
  const bytes = Uint8Array.from(atob(b64), (c) => c.codePointAt(0) ?? 0);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [fetchInvoice, { loading: invoiceLoading, error: invoiceError }] = useLazyQuery<{ invoicePdf: string }>(
    INVOICE_PDF,
    { fetchPolicy: "network-only" }
  );

  async function onDownloadInvoice() {
    const { data } = await fetchInvoice({ variables: { orderId: active.id } });
    if (data?.invoicePdf) downloadBase64Pdf(data.invoicePdf, `invoice-${active.orderNumber}.pdf`);
  }

  const customerName = active.user?.name ?? active.customerName ?? "Walk-in customer";
  const customerMeta = [active.user?.phone ?? active.customerPhone, active.user?.email].filter(Boolean).join(" · ");

  return (
    <Modal title={`Order ${active.orderNumber}`} onClose={onClose}>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={active.status} />
          {active.source === "POS" ? <Chip size="small" label="POS" /> : null}
          {active.orderType === "TAKEAWAY" ? <Chip size="small" label="Takeaway" /> : null}
        </div>
        <span className="muted">{fmtDate(active.placedAt)}</span>
      </div>

      <Section label="Customer">
        <div>{customerName}</div>
        {customerMeta ? <div className="muted">{customerMeta}</div> : null}
      </Section>

      {active.address ? (
        <Section label="Deliver to">
          <div>
            {active.address.line1}
            {active.address.line2 ? `, ${active.address.line2}` : ""}
          </div>
          <div className="muted">
            {active.address.city}
            {active.address.pincode ? ` — ${active.address.pincode}` : ""}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onShowMap(active)}>
            📍 View on Google Map
          </button>
        </Section>
      ) : (
        <Section label="Fulfilment">
          <div className="muted">Takeaway / counter sale — no delivery address.</div>
        </Section>
      )}

      <Section label="Items">
        <Table size="small">
          <TableBody>
            {active.items.map((it) => (
              <TableRow key={`${it.name}-${it.spiceLevel ?? 0}`}>
                <TableCell sx={{ width: 36 }}><Typography fontWeight={700}>{it.qty}×</Typography></TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(it.price * it.qty)}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <Row k="Subtotal" v={inr(active.subtotal)} />
        {active.discount > 0 && (
          <Row k={`Discount ${active.couponCode ? `(${active.couponCode})` : ""}`} v={`– ${inr(active.discount)}`} />
        )}
        <Row k="Delivery" v={active.deliveryFee === 0 ? "Free" : inr(active.deliveryFee)} />
        <Row k="Total" v={inr(active.total)} strong />
      </div>

      <div style={{ marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={onDownloadInvoice} disabled={invoiceLoading}>
          {invoiceLoading ? "Preparing…" : "⬇ Download invoice (PDF)"}
        </button>
        {invoiceError ? <div className="field-error">Could not generate the invoice. Try again.</div> : null}
      </div>

      {active.rating && (
        <Section label="Customer rating">
          <Stack spacing={0.75}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography fontWeight={800}>Overall</Typography>
              <Rating value={Math.round((active.rating.food + active.rating.delivery) / 2)} readOnly size="small" />
            </Stack>
            {active.rating.items?.length
              ? active.rating.items.map((r) => (
                  <Stack key={r.name} direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{r.name}</Typography>
                    <Rating value={r.rating} readOnly size="small" />
                  </Stack>
                ))
              : (
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Food</Typography>
                    <Rating value={active.rating.food} readOnly size="small" />
                  </Stack>
                )}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Delivery</Typography>
              <Rating value={active.rating.delivery} readOnly size="small" />
            </Stack>
            {active.rating.comment ? <Typography variant="body2" color="text.secondary">“{active.rating.comment}”</Typography> : null}
          </Stack>
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
