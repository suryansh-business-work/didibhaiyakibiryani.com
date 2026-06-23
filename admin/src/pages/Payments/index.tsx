import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PAYMENTS } from "../../graphql/queries";
import { REFUND_PAYMENT } from "../../graphql/mutations";
import { Box, Chip, type ChipProps, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, inr, fmtDate } from "../../components/ui";
import { useAlert, useConfirm } from "../../components/dialog";
import PaymentDetail from "./PaymentDetail";
import {
  STATUS_FILTERS,
  refundableAmount,
  type PaymentRow,
} from "./types";

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  CAPTURED: "success",
  CREATED: "info",
  FAILED: "error",
  REFUNDED: "warning",
  PARTIALLY_REFUNDED: "warning",
};

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
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "ALL" ? "All" : f.replaceAll("_", " ").toLowerCase()}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            onClick={() => setFilter(f)}
          />
        ))}
      </Stack>

      <div className="card">
        <AsyncList loading={loading && !data} empty={payments.length === 0} emptyLabel="No payments yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell><TableCell>Status</TableCell><TableCell>Method</TableCell>
                  <TableCell>Refunded</TableCell><TableCell>Created</TableCell><TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => setActive(p)}>
                    <TableCell>
                      <Typography fontWeight={700}>{p.order?.orderNumber ?? "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.providerOrderId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={STATUS_COLOR[p.status] ?? "default"} label={p.status.replaceAll("_", " ")} />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.method ?? "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.refunds.length > 0 ? inr(p.amount - refundableAmount(p)) : "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(p.createdAt)}</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(p.amount)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
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
