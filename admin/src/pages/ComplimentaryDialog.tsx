import { useQuery } from "@apollo/client";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { COMPLIMENTARY_ITEMS } from "../graphql/queries";
import { AsyncList, Modal, inr, fmtDate } from "../components/ui";
import type { DateRange } from "./DashboardFilter";

interface CompItem {
  orderNumber: string;
  name: string;
  qty: number;
  value: number;
  placedAt: string;
}

/** Drill-down list of complimentary (free) items given in the selected range. */
export default function ComplimentaryDialog({ range, onClose }: Readonly<{ range: DateRange; onClose: () => void }>) {
  const { data, loading } = useQuery<{ complimentaryItems: CompItem[] }>(COMPLIMENTARY_ITEMS, { variables: range });
  const items = data?.complimentaryItems ?? [];
  const total = items.reduce((s, it) => s + it.value, 0);
  return (
    <Modal title="Complimentary items given" onClose={onClose}>
      <AsyncList loading={loading && !data} empty={items.length === 0} emptyLabel="No complimentary items in this range.">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell>
                <TableCell align="right">Value</TableCell><TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.orderNumber} hover>
                  <TableCell><Typography fontWeight={700}>{it.orderNumber}</Typography></TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell align="right">{it.qty}</TableCell>
                  <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(it.value)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(it.placedAt)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Typography sx={{ mt: 1.5 }} fontWeight={700}>Total value given: {inr(total)}</Typography>
      </AsyncList>
    </Modal>
  );
}
