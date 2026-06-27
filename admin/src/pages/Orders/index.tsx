import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { ORDERS_PAGE, RIDERS } from "../../graphql/queries";
import { ASSIGN_RIDER, UPDATE_ORDER_STATUS, DELETE_ORDER, DELETE_ORDERS } from "../../graphql/mutations";
import { Alert, Button } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList } from "../../components/ui";
import { IPlus } from "../../components/icons";
import ExportButtons from "../../components/ExportButtons";
import { useServerTable } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import OrderDetail from "./OrderDetail";
import OrderMap from "./OrderMap";
import OrdersTable, { type SortKey } from "./OrdersTable";
import ManualOrderModal from "./ManualOrderModal";
import LockedOrderEdit from "./LockedOrderEdit";
import GenerateMessageDialog from "./GenerateMessageDialog";
import OrderTimelineDialog from "./OrderTimelineDialog";
import OrdersStatsCards from "./OrdersStatsCards";
import type { MessageKind } from "../../constants/messageTemplates";
import { FILTERS, type Order, type Rider } from "./types";

export default function Orders() {
  const [filter, setFilter] = useState("ALL");
  // Optional customer/contact scope, deep-linked from the People lists:
  // ?userId= for signed-up customers, ?phone= for manual contacts (+ ?name= label).
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get("userId");
  const customerPhone = searchParams.get("phone");
  const customerName = searchParams.get("name");
  const scopedToCustomer = Boolean(customerId || customerPhone);
  // Server-side search / sort / pagination (page resets internally on input change).
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "placedAt", initialSortDir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Order | null>(null);
  const [mapOrder, setMapOrder] = useState<Order | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [posOpen, setPosOpen] = useState(false);
  const [editPos, setEditPos] = useState<Order | null>(null);
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [messageTarget, setMessageTarget] = useState<{ order: Order; kind: MessageKind } | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  // Delivered orders are locked from full editing — route them (and the
  // "Change delivery status" action) to the status-only dialog.
  function openEdit(o: Order) {
    if (o.status === "DELIVERED") setStatusOrder(o);
    else setEditPos(o);
  }

  const { data, loading, refetch } = useQuery<{ ordersPage: { items: Order[]; total: number } }>(ORDERS_PAGE, {
    variables: { ...variables, status: filter === "ALL" ? null : filter, userId: customerId, phone: customerPhone },
  });
  const { data: riderData } = useQuery<{ riders: Rider[] }>(RIDERS);
  const [updateStatus, { loading: savingStatus }] = useMutation(UPDATE_ORDER_STATUS);
  const [assignRider, { loading: assigning }] = useMutation(ASSIGN_RIDER);
  const [deleteOrder] = useMutation(DELETE_ORDER);
  const [deleteOrders, { loading: bulkDeleting }] = useMutation(DELETE_ORDERS);
  const confirm = useConfirm();
  const notify = useAlert();
  const saving = savingStatus || assigning;

  const pageItems = data?.ordersPage.items ?? [];
  const total = data?.ordersPage.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / tableProps.pageSize));
  const current = Math.min(tableProps.page, totalPages);
  const pageAllChecked = pageItems.length > 0 && pageItems.every((o) => selected.has(o.id));

  function onFilter(f: string) {
    setFilter(f);
    setSelected(new Set());
    setPage(1);
  }
  function clearCustomerFilter() {
    setSearchParams({});
    setPage(1);
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
      <OrdersStatsCards />
      {scopedToCustomer && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={clearCustomerFilter}>Show all orders</Button>}
        >
          Showing orders for {customerName || customerPhone || "the selected customer"}
        </Alert>
      )}
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
          value={tableProps.search}
          onChange={(e) => tableProps.onSearchChange(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <ExportButtons report="orders" params={{ status: filter === "ALL" ? undefined : filter, search: tableProps.search, userId: customerId ?? undefined, phone: customerPhone ?? undefined }} />
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={() => setPosOpen(true)}>New order (POS)</Button>
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
        <AsyncList loading={loading && !data} empty={total === 0} emptyLabel="No orders here yet.">
          <OrdersTable
            orders={pageItems}
            selected={selected}
            pageAllChecked={pageAllChecked}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
            sortKey={tableProps.sortKey as SortKey}
            sortDir={tableProps.sortDir}
            onSort={(k) => tableProps.onSort(k)}
            onOpen={setActive}
            onEditPos={openEdit}
            onChangeStatus={setStatusOrder}
            onGenerateMessage={(o, kind) => setMessageTarget({ order: o, kind })}
            onViewTimeline={setTimelineOrder}
            onDelete={removeOne}
            onShowMap={setMapOrder}
            deletingId={deletingId}
          />
          <div className="pager">
            <span className="muted">
              {total} order(s) · page {current} of {totalPages}
            </span>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>‹ Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>Next ›</button>
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
      {statusOrder && (
        <LockedOrderEdit
          order={statusOrder}
          onClose={() => setStatusOrder(null)}
          onSaved={() => {
            refetch().catch(() => undefined);
          }}
        />
      )}
      {messageTarget && (
        <GenerateMessageDialog
          order={messageTarget.order}
          kind={messageTarget.kind}
          onClose={() => setMessageTarget(null)}
        />
      )}
      {timelineOrder && <OrderTimelineDialog order={timelineOrder} onClose={() => setTimelineOrder(null)} />}
      {(posOpen || editPos) && (
        <ManualOrderModal
          key={editPos?.id ?? "new"}
          editOrder={editPos ?? undefined}
          riders={riderData?.riders ?? []}
          onClose={() => {
            setPosOpen(false);
            setEditPos(null);
          }}
          onCreated={() => {
            refetch().catch(() => undefined);
          }}
        />
      )}
    </Layout>
  );
}

function msg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}
