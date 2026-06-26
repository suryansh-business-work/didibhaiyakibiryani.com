import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Rating,
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
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { StatusBadge, inr, fmtDate } from "../../components/ui";
import type { MessageKind } from "../../constants/messageTemplates";
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
  onGenerateMessage: (order: Order, kind: MessageKind) => void;
  onViewTimeline: (order: Order) => void;
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

/** Toggleable columns; "Rating" ships hidden by default. */
const TOGGLE_COLS: ReadonlyArray<{ key: string; label: string; def: boolean }> = [
  { key: "customer", label: "Customer", def: true },
  { key: "status", label: "Status", def: true },
  { key: "placedAt", label: "Placed", def: true },
  { key: "items", label: "Items", def: true },
  { key: "rider", label: "Rider", def: true },
  { key: "map", label: "Map", def: true },
  { key: "total", label: "Total", def: true },
  { key: "foodRating", label: "Food rating", def: false },
  { key: "deliveryRating", label: "Delivery rating", def: false },
];

function RatingCell({ value }: Readonly<{ value: number | null | undefined }>) {
  if (value == null) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }
  return <Rating value={value} precision={0.5} readOnly size="small" />;
}

/** Repeat-customer badge under the customer name; undefined ⇒ treated as a first order. */
function CustomerOrderChip({ count }: Readonly<{ count: number | undefined }>) {
  const n = count ?? 1;
  if (n > 1) {
    return <Chip size="small" variant="outlined" color="success" label={`Repeat ×${n}`} sx={{ mt: 0.25, height: 18 }} />;
  }
  return <Chip size="small" label="New" sx={{ mt: 0.25, height: 18 }} />;
}

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
  onGenerateMessage,
  onViewTimeline,
  onDelete,
  onShowMap,
  deletingId,
}: Readonly<OrdersTableProps>) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuOrder, setMenuOrder] = useState<Order | null>(null);
  const [colsAnchor, setColsAnchor] = useState<HTMLElement | null>(null);
  const [cols, setCols] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLE_COLS.map((c) => [c.key, c.def]))
  );

  function openMenu(e: React.MouseEvent<HTMLElement>, o: Order) {
    setMenuAnchor(e.currentTarget);
    setMenuOrder(o);
  }
  function closeMenu() {
    setMenuAnchor(null);
    setMenuOrder(null);
  }
  function toggleCol(key: string) {
    setCols((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function runMenu(action: (o: Order) => void) {
    if (menuOrder) action(menuOrder);
    closeMenu();
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1, pt: 0.5 }}>
        <Button size="small" startIcon={<ViewColumnIcon />} onClick={(e) => setColsAnchor(e.currentTarget)}>
          Columns
        </Button>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox checked={pageAllChecked} onChange={onToggleAll} inputProps={{ "aria-label": "Select all on page" }} />
              </TableCell>
              {COLUMNS.map((c) =>
                c.key === "orderNumber" || cols[c.key] ? (
                  <TableCell key={c.key} sortDirection={sortKey === c.key ? sortDir : false}>
                    <TableSortLabel active={sortKey === c.key} direction={sortKey === c.key ? sortDir : "asc"} onClick={() => onSort(c.key)}>
                      {c.label}
                    </TableSortLabel>
                  </TableCell>
                ) : null
              )}
              {cols.items ? <TableCell>Items</TableCell> : null}
              {cols.rider ? <TableCell>Rider</TableCell> : null}
              {cols.map ? <TableCell>Map</TableCell> : null}
              {cols.foodRating ? <TableCell align="right">Food rating</TableCell> : null}
              {cols.deliveryRating ? <TableCell align="right">Delivery rating</TableCell> : null}
              {cols.total ? (
                <TableCell align="right" sortDirection={sortKey === "total" ? sortDir : false}>
                  <TableSortLabel active={sortKey === "total"} direction={sortKey === "total" ? sortDir : "asc"} onClick={() => onSort("total")}>
                    Total
                  </TableSortLabel>
                </TableCell>
              ) : null}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.has(o.id)} onChange={() => onToggleRow(o.id)} inputProps={{ "aria-label": `Select order ${o.orderNumber}` }} />
                </TableCell>
                <TableCell>
                  <Button variant="text" size="small" onClick={() => onOpen(o)} sx={{ p: 0, minWidth: 0, fontWeight: 700 }}>
                    {o.orderNumber}
                  </Button>
                  {o.source === "POS" ? <Chip size="small" label="POS" sx={{ ml: 0.75, height: 18 }} /> : null}
                </TableCell>
                {cols.customer ? (
                  <TableCell>
                    {o.user?.name ?? o.customerName ?? "—"}
                    <Typography variant="caption" display="block" color="text.secondary">{o.user?.phone ?? o.customerPhone}</Typography>
                    <CustomerOrderChip count={o.customerOrderCount} />
                  </TableCell>
                ) : null}
                {cols.status ? <TableCell><StatusBadge status={o.status} /></TableCell> : null}
                {cols.placedAt ? <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(o.placedAt)}</Typography></TableCell> : null}
                {cols.items ? <TableCell><Typography variant="body2" color="text.secondary">{o.items.reduce((n, it) => n + it.qty, 0)} item(s)</Typography></TableCell> : null}
                {cols.rider ? <TableCell><Typography variant="body2" color="text.secondary">{o.deliveryPartner?.name ?? "—"}</Typography></TableCell> : null}
                {cols.map ? (
                  <TableCell>
                    {o.address ? (
                      <IconButton size="small" aria-label={`Map for ${o.orderNumber}`} onClick={() => onShowMap(o)}>
                        <PlaceIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                ) : null}
                {cols.foodRating ? <TableCell align="right"><RatingCell value={o.rating?.food} /></TableCell> : null}
                {cols.deliveryRating ? <TableCell align="right"><RatingCell value={o.rating?.delivery} /></TableCell> : null}
                {cols.total ? (
                  <TableCell align="right">
                    <Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(o.total)}</Typography>
                  </TableCell>
                ) : null}
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
      </Box>

      <Menu anchorEl={colsAnchor} open={Boolean(colsAnchor)} onClose={() => setColsAnchor(null)}>
        {TOGGLE_COLS.map((c) => (
          <MenuItem key={c.key} dense onClick={() => toggleCol(c.key)}>
            <Checkbox size="small" checked={Boolean(cols[c.key])} sx={{ p: 0.5, mr: 1 }} />
            {c.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => runMenu(onViewTimeline)}>View status timeline</MenuItem>
        <MenuItem onClick={() => runMenu(onChangeStatus)}>Change delivery status</MenuItem>
        <MenuItem onClick={() => runMenu((o) => onGenerateMessage(o, "tracking"))}>Generate tracking message</MenuItem>
        <MenuItem onClick={() => runMenu((o) => onGenerateMessage(o, "survey"))}>Generate survey message</MenuItem>
        <MenuItem onClick={() => runMenu((o) => onGenerateMessage(o, "receipt"))}>Generate receipt message</MenuItem>
      </Menu>
    </Box>
  );
}
