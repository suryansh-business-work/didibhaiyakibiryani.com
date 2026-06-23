import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { StatusBadge, inr, fmtDate } from "../../components/ui";
import type { Order } from "./types";

export type SortKey = "orderNumber" | "customer" | "status" | "placedAt" | "total";

interface OrdersTableProps {
  orders: Order[];
  selected: Set<string>;
  pageAllChecked: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onOpen: (order: Order) => void;
  onEditPos: (order: Order) => void;
  onChangeStatus: (order: Order) => void;
  onDelete: (order: Order) => void;
  onShowMap: (order: Order) => void;
  deletingId: string | null;
}

const COLUMNS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "orderNumber", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "placedAt", label: "Placed" },
];

export default function OrdersTable({
  orders,
  selected,
  pageAllChecked,
  onToggleAll,
  onToggleRow,
  sortKey,
  sortDir,
  onSort,
  onOpen,
  onEditPos,
  onChangeStatus,
  onDelete,
  onShowMap,
  deletingId,
}: Readonly<OrdersTableProps>) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuOrder, setMenuOrder] = useState<Order | null>(null);

  function openMenu(e: React.MouseEvent<HTMLElement>, o: Order) {
    setMenuAnchor(e.currentTarget);
    setMenuOrder(o);
  }
  function closeMenu() {
    setMenuAnchor(null);
    setMenuOrder(null);
  }
  function copySurvey(o: Order) {
    if (!o.ratingToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/survey/${o.id}/${o.ratingToken}`).catch(() => undefined);
  }

  const menuDelivered = menuOrder?.status === "DELIVERED";

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox checked={pageAllChecked} onChange={onToggleAll} inputProps={{ "aria-label": "Select all on page" }} />
            </TableCell>
            {COLUMNS.map((c) => (
              <TableCell key={c.key} sortDirection={sortKey === c.key ? sortDir : false}>
                <TableSortLabel active={sortKey === c.key} direction={sortKey === c.key ? sortDir : "asc"} onClick={() => onSort(c.key)}>
                  {c.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>Items</TableCell>
            <TableCell>Rider</TableCell>
            <TableCell>Map</TableCell>
            <TableCell align="right" sortDirection={sortKey === "total" ? sortDir : false}>
              <TableSortLabel active={sortKey === "total"} direction={sortKey === "total" ? sortDir : "asc"} onClick={() => onSort("total")}>
                Total
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.has(o.id)}
                  onChange={() => onToggleRow(o.id)}
                  inputProps={{ "aria-label": `Select order ${o.orderNumber}` }}
                />
              </TableCell>
              <TableCell>
                <Button variant="text" size="small" onClick={() => onOpen(o)} sx={{ p: 0, minWidth: 0, fontWeight: 700 }}>
                  {o.orderNumber}
                </Button>
                {o.source === "POS" ? <Chip size="small" label="POS" sx={{ ml: 0.75, height: 18 }} /> : null}
              </TableCell>
              <TableCell>
                {o.user?.name ?? o.customerName ?? "—"}
                <Typography variant="caption" display="block" color="text.secondary">
                  {o.user?.phone ?? o.customerPhone}
                </Typography>
              </TableCell>
              <TableCell><StatusBadge status={o.status} /></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(o.placedAt)}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{o.items.reduce((n, it) => n + it.qty, 0)} item(s)</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{o.deliveryPartner?.name ?? "—"}</Typography></TableCell>
              <TableCell>
                {o.address ? (
                  <IconButton size="small" aria-label={`Map for ${o.orderNumber}`} onClick={() => onShowMap(o)}>
                    <PlaceIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(o.total)}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Button size="small" onClick={() => onEditPos(o)}>Edit</Button>
                <Button size="small" color="error" disabled={deletingId === o.id} onClick={() => onDelete(o)}>
                  {deletingId === o.id ? "…" : "Delete"}
                </Button>
                <IconButton size="small" aria-label={`More actions for ${o.orderNumber}`} onClick={(e) => openMenu(e, o)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuOrder) onChangeStatus(menuOrder);
            closeMenu();
          }}
        >
          Change delivery status
        </MenuItem>
        <MenuItem
          disabled={!menuDelivered}
          onClick={() => {
            if (menuOrder) copySurvey(menuOrder);
            closeMenu();
          }}
        >
          Copy survey link
        </MenuItem>
      </Menu>
    </Box>
  );
}
