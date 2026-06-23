import { Box, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { OnOffChip, inr } from "../../components/ui";
import { TYPE_LABEL, describeCoupon, type Coupon } from "./types";

interface CouponsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export default function CouponsTable({ coupons, onEdit, onDelete }: Readonly<CouponsTableProps>) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Offer</TableCell>
            <TableCell>Min order</TableCell>
            <TableCell>Flags</TableCell>
            <TableCell>Used</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>
                <Typography fontWeight={700} sx={{ letterSpacing: 1 }}>{c.code}</Typography>
                <Typography variant="caption" color="text.secondary">{c.title}</Typography>
              </TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" color="primary" label={TYPE_LABEL[c.type]} />
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{describeCoupon(c)}</Typography>
              </TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{c.minOrder ? inr(c.minOrder) : "—"}</Typography></TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  {c.firstOrderOnly ? <Chip size="small" variant="outlined" color="info" label="1st order" /> : null}
                  {c.appOnly ? <Chip size="small" variant="outlined" label="App only" /> : null}
                </Stack>
              </TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Typography></TableCell>
              <TableCell><OnOffChip on={c.isActive} /></TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Button size="small" onClick={() => onEdit(c)}>Edit</Button>
                <Button size="small" color="error" onClick={() => onDelete(c)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
