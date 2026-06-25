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
  profit: number;
}

/** Per-dish profit breakdown (Menu Finance) for the dashboard Profit drill-down. */
export default function ProfitDialog({ range, onClose }: Readonly<{ range: DateRange; onClose: () => void }>) {
  const { data, loading } = useQuery<{ profitItems: ProfitItem[] }>(PROFIT_ITEMS, { variables: range });
  const items = data?.profitItems ?? [];
  const total = items.reduce((s, it) => s + it.profit, 0);
  return (
    <Modal title="Profit by item (Menu Finance)" onClose={onClose}>
      <AsyncList loading={loading && !data} empty={items.length === 0} emptyLabel="No sales in this range.">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.name} hover>
                  <TableCell><Typography fontWeight={700}>{it.name}</Typography></TableCell>
                  <TableCell align="right">{inr(it.price)}</TableCell>
                  <TableCell align="right">{inr(it.makingCost)}</TableCell>
                  <TableCell align="right">{it.qty}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color={it.profit >= 0 ? "success.main" : "error"}>{inr(it.profit)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Typography sx={{ mt: 1.5 }} fontWeight={700}>Total profit: {inr(total)}</Typography>
      </AsyncList>
    </Modal>
  );
}
