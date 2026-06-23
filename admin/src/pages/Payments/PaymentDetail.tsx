import { Box, Button, Chip, type ChipProps, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { Modal, inr, fmtDate } from "../../components/ui";
import { refundableAmount, canRefund, type PaymentRow } from "./types";

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  CAPTURED: "success",
  CREATED: "info",
  FAILED: "error",
  REFUNDED: "warning",
  PARTIALLY_REFUNDED: "warning",
};

interface PaymentDetailProps {
  payment: PaymentRow;
  refunding: boolean;
  onRefund: (payment: PaymentRow) => void;
  onClose: () => void;
}

export default function PaymentDetail({ payment, refunding, onRefund, onClose }: Readonly<PaymentDetailProps>) {
  return (
    <Modal
      title={`Payment · ${payment.order?.orderNumber ?? payment.providerOrderId}`}
      onClose={onClose}
      footer={
        canRefund(payment) ? (
          <Button variant="contained" color="error" disabled={refunding} onClick={() => onRefund(payment)}>
            {refunding ? "Refunding…" : `Refund ${inr(refundableAmount(payment))}`}
          </Button>
        ) : undefined
      }
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Chip size="small" variant="outlined" color={STATUS_COLOR[payment.status] ?? "default"} label={payment.status.replaceAll("_", " ")} />
        <Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(payment.amount)}</Typography>
      </Box>

      <Box sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
        <div>Provider order: <span style={{ fontVariantNumeric: "tabular-nums" }}>{payment.providerOrderId}</span></div>
        {payment.providerPaymentId ? <div>Provider payment: {payment.providerPaymentId}</div> : null}
        {payment.method ? <div>Method: {payment.method}</div> : null}
        <div>Created: {fmtDate(payment.createdAt)}</div>
      </Box>

      {payment.refunds.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={700} gutterBottom>Refunds</Typography>
          <Table size="small">
            <TableBody>
              {payment.refunds.map((r) => (
                <TableRow key={r.providerRefundId}>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{r.providerRefundId}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{r.reason ?? "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(r.at)}</Typography></TableCell>
                  <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(r.amount)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : null}

      <Typography fontWeight={700} gutterBottom>Activity log</Typography>
      <Table size="small">
        <TableBody>
          {payment.events.map((e) => (
            <TableRow key={`${e.type}-${e.at}`}>
              <TableCell><Typography variant="body2" fontWeight={700}>{e.type}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{e.data ?? ""}</Typography></TableCell>
              <TableCell align="right"><Typography variant="body2" color="text.secondary">{fmtDate(e.at)}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Modal>
  );
}
