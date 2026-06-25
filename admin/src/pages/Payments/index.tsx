import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PAYMENTS_PAGE } from "../../graphql/queries";
import { REFUND_PAYMENT } from "../../graphql/mutations";
import { Button, Chip, type ChipProps, Stack, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { inr, fmtDate } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { DataTable, useServerTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import PaymentDetail from "./PaymentDetail";
import ManualPaymentModal from "./ManualPaymentModal";
import { STATUS_FILTERS, refundableAmount, type PaymentRow } from "./types";

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  CAPTURED: "success",
  CREATED: "info",
  FAILED: "error",
  REFUNDED: "warning",
  PARTIALLY_REFUNDED: "warning",
};

export default function Payments() {
  const [filter, setFilter] = useState<string>("ALL");
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "createdAt", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ paymentsPage: { items: PaymentRow[]; total: number } }>(PAYMENTS_PAGE, {
    variables: { ...variables, status: filter === "ALL" ? null : filter },
  });
  const [refund, { loading: refunding }] = useMutation(REFUND_PAYMENT);
  const confirm = useConfirm();
  const notify = useAlert();
  const [active, setActive] = useState<PaymentRow | null>(null);
  const [recording, setRecording] = useState(false);

  const payments = data?.paymentsPage.items ?? [];
  const total = data?.paymentsPage.total ?? 0;

  function selectFilter(f: string) {
    setFilter(f);
    setPage(1);
  }

  async function doRefund(p: PaymentRow) {
    const amount = refundableAmount(p);
    const ok = await confirm({ title: "Refund payment", message: `Refund ${inr(amount)} for order ${p.order?.orderNumber ?? p.providerOrderId}? This cannot be undone.`, confirmLabel: "Refund", danger: true });
    if (!ok) return;
    try {
      await refund({ variables: { paymentId: p.id, reason: "Admin refund" } });
      await refetch();
      setActive(null);
      await notify({ title: "Refunded", message: `${inr(amount)} refund initiated.` });
    } catch (e: unknown) {
      await notify({ title: "Refund failed", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  const columns = useMemo<Column<PaymentRow>[]>(() => [
    { key: "order", label: "Order", render: (p) => (
      <>
        <Typography fontWeight={700}>{p.order?.orderNumber ?? "—"}</Typography>
        <Typography variant="caption" color="text.secondary">{p.providerOrderId}</Typography>
      </>
    ) },
    { key: "status", label: "Status", sortable: true, render: (p) => <Chip size="small" variant="outlined" color={STATUS_COLOR[p.status] ?? "default"} label={p.status.replaceAll("_", " ")} /> },
    { key: "method", label: "Method", render: (p) => <Typography variant="body2" color="text.secondary">{p.method ?? "—"}</Typography> },
    { key: "refunded", label: "Refunded", render: (p) => <Typography variant="body2" color="text.secondary">{p.refunds.length > 0 ? inr(p.amount - refundableAmount(p)) : "—"}</Typography> },
    { key: "createdAt", label: "Created", sortable: true, render: (p) => <Typography variant="body2" color="text.secondary">{fmtDate(p.createdAt)}</Typography> },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (p) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(p.amount)}</Typography> },
  ], []);

  const chips = (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {STATUS_FILTERS.map((f) => (
        <Chip
          key={f}
          label={f === "ALL" ? "All" : f.replaceAll("_", " ").toLowerCase()}
          color={filter === f ? "primary" : "default"}
          variant={filter === f ? "filled" : "outlined"}
          onClick={() => selectFilter(f)}
        />
      ))}
    </Stack>
  );

  return (
    <Layout title="Payments">
      <DataTable
        columns={columns}
        rows={payments}
        total={total}
        rowKey={(p) => p.id}
        loading={loading && !data}
        emptyLabel="No payments yet."
        noun="payment"
        searchPlaceholder="Search order #, payment id…"
        toolbarStart={chips}
        renderActions={(p) => <Button size="small" onClick={() => setActive(p)}>Open</Button>}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={() => setRecording(true)}>Record payment</Button>}
        {...tableProps}
      />

      {active && (
        <PaymentDetail payment={active} refunding={refunding} onRefund={doRefund} onClose={() => setActive(null)} />
      )}
      {recording && (
        <ManualPaymentModal onClose={() => setRecording(false)} onCreated={() => { refetch().catch(() => undefined); }} />
      )}
    </Layout>
  );
}
