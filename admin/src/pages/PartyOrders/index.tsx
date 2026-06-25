import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PARTY_ORDERS_PAGE } from "../../graphql/queries";
import { UPDATE_PARTY_ORDER_STATUS, DELETE_PARTY_ORDERS } from "../../graphql/mutations";
import { Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { fmtDate } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { DataTable, useServerTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import PartyOrderModal from "./PartyOrderModal";

interface Party {
  id: string; name: string; phone: string; email: string;
  eventDate?: string; guests?: number; location?: string; message?: string;
  status: "NEW" | "CONTACTED" | "CLOSED"; createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;
const FILTERS = ["ALL", ...STATUSES] as const;

export default function PartyOrders() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "createdAt", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ partyOrdersPage: { items: Party[]; total: number } }>(PARTY_ORDERS_PAGE, {
    variables: { ...variables, status: filter === "ALL" ? null : filter },
  });
  const [updateStatus] = useMutation(UPDATE_PARTY_ORDER_STATUS);
  const [deleteMany] = useMutation(DELETE_PARTY_ORDERS);
  const notify = useAlert();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);

  const orders = data?.partyOrdersPage.items ?? [];
  const total = data?.partyOrdersPage.total ?? 0;

  function selectFilter(f: (typeof FILTERS)[number]) {
    setFilter(f);
    setPage(1);
  }

  async function changeStatus(id: string, status: string) {
    try {
      await updateStatus({ variables: { id, status } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not update", message: e instanceof Error ? e.message : "Could not update the status." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete party orders", message: `Delete ${ids.length} selected enquiry(ies)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await deleteMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  const columns = useMemo<Column<Party>[]>(() => [
    { key: "createdAt", label: "When", sortable: true, render: (o) => <Typography variant="body2" color="text.secondary">{fmtDate(o.createdAt)}</Typography> },
    { key: "name", label: "Name", sortable: true, render: (o) => <Typography fontWeight={700}>{o.name}</Typography> },
    { key: "contact", label: "Contact", render: (o) => (
      <>
        <Typography variant="body2" color="text.secondary">{o.phone}</Typography>
        <Typography variant="caption" color="text.secondary">{o.email}</Typography>
      </>
    ) },
    { key: "event", label: "Event", render: (o) => (
      <>
        <Typography variant="body2" color="text.secondary">{o.eventDate || "—"}</Typography>
        {o.location ? <Typography variant="caption" color="text.secondary">{o.location}</Typography> : null}
      </>
    ) },
    { key: "guests", label: "Guests", render: (o) => <Typography variant="body2" color="text.secondary">{o.guests ?? "—"}</Typography> },
    { key: "message", label: "Details", render: (o) => <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{o.message || "—"}</Typography> },
    { key: "status", label: "Status", render: (o) => (
      <TextField select size="small" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} sx={{ minWidth: 130 }}>
        {STATUSES.map((s) => (<MenuItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</MenuItem>))}
      </TextField>
    ) },
  ], []);

  const chips = (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {FILTERS.map((f) => (
        <Chip
          key={f}
          label={f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          color={filter === f ? "primary" : "default"}
          variant={filter === f ? "filled" : "outlined"}
          onClick={() => selectFilter(f)}
        />
      ))}
    </Stack>
  );

  return (
    <Layout title="Party Orders">
      <DataTable
        columns={columns}
        rows={orders}
        total={total}
        rowKey={(o) => o.id}
        loading={loading && !data}
        emptyLabel="No party enquiries yet."
        noun="enquiry"
        searchPlaceholder="Search name, phone, email…"
        onBulkDelete={bulkDelete}
        toolbarStart={chips}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={() => setAdding(true)}>Add party order</Button>}
        {...tableProps}
      />

      {adding && <PartyOrderModal onClose={() => setAdding(false)} onCreated={() => refetch()} />}
    </Layout>
  );
}
