import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { ORDERS, RIDERS } from "../../graphql/queries";
import { ASSIGN_RIDER, UPDATE_ORDER_STATUS, DELETE_ORDER, DELETE_ORDERS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList } from "../../components/ui";
import { useAlert, useConfirm } from "../../components/dialog";
import OrderDetail from "./OrderDetail";
import OrderMap from "./OrderMap";
import OrdersTable, { type SortKey } from "./OrdersTable";
import { FILTERS, type Order, type Rider } from "./types";

const PAGE_SIZE = 15;

export default function Orders() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("placedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Order | null>(null);
  const [mapOrder, setMapOrder] = useState<Order | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{ orders: Order[] }>(ORDERS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const { data: riderData } = useQuery<{ riders: Rider[] }>(RIDERS);
  const [updateStatus, { loading: savingStatus }] = useMutation(UPDATE_ORDER_STATUS);
  const [assignRider, { loading: assigning }] = useMutation(ASSIGN_RIDER);
  const [deleteOrder] = useMutation(DELETE_ORDER);
  const [deleteOrders, { loading: bulkDeleting }] = useMutation(DELETE_ORDERS);
  const confirm = useConfirm();
  const notify = useAlert();
  const saving = savingStatus || assigning;
  const orders = data?.orders ?? [];

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? orders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            (o.user?.name ?? "").toLowerCase().includes(q) ||
            (o.user?.phone ?? "").toLowerCase().includes(q)
        )
      : orders;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => cmp(a, b, sortKey) * dir);
  }, [orders, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pageAllChecked = pageItems.length > 0 && pageItems.every((o) => selected.has(o.id));

  function resetTo(p: number) {
    setPage(p);
  }
  function onSearch(v: string) {
    setSearch(v);
    resetTo(1);
  }
  function onFilter(f: string) {
    setFilter(f);
    setSelected(new Set());
    resetTo(1);
  }
  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "placedAt" || key === "total" ? "desc" : "asc");
    }
    resetTo(1);
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const add = !pageAllChecked;
      for (const o of pageItems) {
        if (add) next.add(o.id);
        else next.delete(o.id);
      }
      return next;
    });
  }

  async function move(o: Order, status: string) {
    const ok = await confirm({
      title: "Update order",
      message: `Change order ${o.orderNumber} to “${status.replace(/_/g, " ").toLowerCase()}”?`,
      confirmLabel: "Update",
      danger: status === "CANCELLED",
    });
    if (!ok) return;
    try {
      await updateStatus({ variables: { id: o.id, status } });
      await refetch();
      setActive((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: unknown) {
      await notify({ title: "Could not update status", message: msg(e, "Could not update status.") });
    }
  }

  async function assign(o: Order, riderId: string) {
    try {
      const { data: res } = await assignRider({ variables: { orderId: o.id, riderId } });
      await refetch();
      const partner = res?.assignDeliveryPartner?.deliveryPartner ?? null;
      setActive((prev) => (prev ? { ...prev, deliveryPartner: partner } : prev));
    } catch (e: unknown) {
      await notify({ title: "Could not assign rider", message: msg(e, "Please try again.") });
    }
  }

  async function removeOne(o: Order) {
    const ok = await confirm({
      title: "Delete order",
      message: `Delete order ${o.orderNumber}? This permanently removes it and cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(o.id);
    try {
      await deleteOrder({ variables: { id: o.id } });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(o.id);
        return next;
      });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: msg(e, "Could not delete the order.") });
    } finally {
      setDeletingId(null);
    }
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await confirm({
      title: "Delete orders",
      message: `Delete ${ids.length} selected order(s)? This permanently removes them and cannot be undone.`,
      confirmLabel: "Delete all",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteOrders({ variables: { ids } });
      setSelected(new Set());
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: msg(e, "Could not delete the orders.") });
    }
  }

  return (
    <Layout title="Orders">
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => onFilter(f)}>
              {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase()}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <input
          className="search-input"
          placeholder="Search order #, name, phone…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <button className="btn btn-danger btn-sm" disabled={bulkDeleting} onClick={bulkDelete}>
            {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="card">
        <AsyncList loading={loading && !data} empty={sorted.length === 0} emptyLabel="No orders here yet.">
          <OrdersTable
            orders={pageItems}
            selected={selected}
            pageAllChecked={pageAllChecked}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            onOpen={setActive}
            onDelete={removeOne}
            onShowMap={setMapOrder}
            deletingId={deletingId}
          />
          <div className="pager">
            <span className="muted">
              {sorted.length} order(s) · page {current} of {totalPages}
            </span>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" disabled={current <= 1} onClick={() => resetTo(current - 1)}>‹ Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={current >= totalPages} onClick={() => resetTo(current + 1)}>Next ›</button>
          </div>
        </AsyncList>
      </div>

      {active && (
        <OrderDetail
          order={active}
          riders={riderData?.riders ?? []}
          saving={saving}
          onClose={() => setActive(null)}
          onMove={move}
          onAssignRider={assign}
          onShowMap={setMapOrder}
        />
      )}
      {mapOrder && <OrderMap order={mapOrder} onClose={() => setMapOrder(null)} />}
    </Layout>
  );
}

function cmp(a: Order, b: Order, key: SortKey): number {
  if (key === "total") return a.total - b.total;
  if (key === "placedAt") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
  const av = key === "customer" ? a.user?.name ?? "" : key === "status" ? a.status : a.orderNumber;
  const bv = key === "customer" ? b.user?.name ?? "" : key === "status" ? b.status : b.orderNumber;
  return av.localeCompare(bv);
}

function msg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}
