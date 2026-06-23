import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Spinner, Empty, inr } from "../../components/ui";
import type { Item } from "./types";

interface MenuTableProps {
  items: Item[];
  loading: boolean;
  onEdit: (item: Item) => void;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export default function MenuTable({ items, loading, onEdit, onToggle, onDelete }: Readonly<MenuTableProps>) {
  if (loading) {
    return <Spinner />;
  }
  if (items.length === 0) {
    return <Empty>No menu items yet.</Empty>;
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Spice</TableCell>
            <TableCell>Available</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={700}>{it.name}</Typography>
                  {it.badge !== "NONE" ? (
                    <Chip size="small" variant="outlined" color={it.badge === "NEW" ? "success" : "primary"} label={it.badge} />
                  ) : null}
                </Box>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 360 }}>
                  {it.description}
                </Typography>
              </TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{it.category?.name ?? "—"}</Typography></TableCell>
              <TableCell>
                {it.spiceLevel > 0 ? "🌶️".repeat(it.spiceLevel) : <Typography variant="body2" color="text.secondary">mild</Typography>}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  clickable
                  variant="outlined"
                  color={it.isAvailable ? "success" : "error"}
                  label={it.isAvailable ? "In stock" : "Out of stock"}
                  onClick={() => onToggle(it)}
                />
              </TableCell>
              <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(it.price)}</Typography></TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Button size="small" onClick={() => onEdit(it)}>Edit</Button>
                <Button size="small" color="error" onClick={() => onDelete(it)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
