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
  onDelete,
  onShowMap,
  deletingId,
}: Readonly<OrdersTableProps>) {
  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: 34 }}>
              <input type="checkbox" checked={pageAllChecked} onChange={onToggleAll} aria-label="Select all on page" />
            </th>
            {COLUMNS.map((c) => (
              <th key={c.key} style={{ cursor: "pointer" }} onClick={() => onSort(c.key)}>
                {c.label}
                {arrow(c.key)}
              </th>
            ))}
            <th>Items</th>
            <th>Rider</th>
            <th>Map</th>
            <th style={{ textAlign: "right", cursor: "pointer" }} onClick={() => onSort("total")}>
              Total{arrow("total")}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(o.id)}
                  onChange={() => onToggleRow(o.id)}
                  aria-label={`Select order ${o.orderNumber}`}
                />
              </td>
              <td>
                <button className="link-btn t-strong" onClick={() => onOpen(o)}>
                  {o.orderNumber}
                </button>
              </td>
              <td>
                {o.user?.name ?? "—"}
                <div className="muted" style={{ fontSize: "0.78rem" }}>{o.user?.phone}</div>
              </td>
              <td><StatusBadge status={o.status} /></td>
              <td className="muted">{fmtDate(o.placedAt)}</td>
              <td className="muted">{o.items.reduce((n, it) => n + it.qty, 0)} item(s)</td>
              <td className="muted">{o.deliveryPartner?.name ?? "—"}</td>
              <td>
                <button className="btn btn-ghost btn-sm" aria-label={`Map for ${o.orderNumber}`} onClick={() => onShowMap(o)}>📍</button>
              </td>
              <td className="t-mono" style={{ textAlign: "right" }}>{inr(o.total)}</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpen(o)}>Edit</button>{" "}
                <button className="btn btn-danger btn-sm" disabled={deletingId === o.id} onClick={() => onDelete(o)}>
                  {deletingId === o.id ? "…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
