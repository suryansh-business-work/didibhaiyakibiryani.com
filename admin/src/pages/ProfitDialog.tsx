import { useQuery } from "@apollo/client";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { PROFIT_ITEMS } from "../graphql/queries";
import { AsyncList, Modal, inr } from "../components/ui";
import type { DateRange } from "./DashboardFilter";

interface ProfitItem {
  name: string;
  price: number;
  makingCost: number;
  qty: number;
}

interface ProfitRow extends ProfitItem {
  unitProfit: number;
  margin: number;
  total: number;
}

/** Derive the whole breakdown from Profit/Unit (= Price − Making cost), matching the Menu Finance card. */
function toRow(it: ProfitItem): ProfitRow {
  const unitProfit = it.price - it.makingCost;
  const margin = it.price > 0 ? Math.round((unitProfit / it.price) * 100) : 0;
  return { ...it, unitProfit, margin, total: unitProfit * it.qty };
}

const ink = (n: number) => (n >= 0 ? "success.main" : "error");

/** Per-dish profit breakdown (Menu Finance): Profit/Unit × Qty = Total. */
export default function ProfitDialog({ range, onClose }: Readonly<{ range: DateRange; onClose: () => void }>) {
  const { data, loading } = useQuery<{ profitItems: ProfitItem[] }>(PROFIT_ITEMS, { variables: range });
  const rows = (data?.profitItems ?? []).map(toRow);
  const total = rows.reduce((s, r) => s + r.total, 0);
  return (
    <Modal title="Profit by item (Menu Finance)" onClose={onClose} maxWidth="md">
      <AsyncList loading={loading && !data} empty={rows.length === 0} emptyLabel="No sales in this range.">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Profit = (Price − Making cost) × Qty — i.e. Profit/Unit × Qty.
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Profit/Unit</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Total profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name} hover>
                  <TableCell><Typography fontWeight={700}>{r.name}</Typography></TableCell>
                  <TableCell align="right">{inr(r.price)}</TableCell>
                  <TableCell align="right">{inr(r.makingCost)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color={ink(r.unitProfit)}>{inr(r.unitProfit)}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{r.margin}% margin</Typography>
                  </TableCell>
                  <TableCell align="right">{r.qty}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }} color={ink(r.total)}>{inr(r.total)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Typography sx={{ mt: 1.5 }} fontWeight={700} color={ink(total)}>Total profit: {inr(total)}</Typography>
      </AsyncList>
    </Modal>
  );
}
