import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SUPPORT_TICKETS_PAGE } from "../../graphql/queries";
import { REPLY_TICKET, UPDATE_TICKET_STATUS, DELETE_SUPPORT_TICKET, DELETE_SUPPORT_TICKETS } from "../../graphql/mutations";
import { Button, Chip, type ChipProps, Stack, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { fmtDate } from "../../components/ui";
import { DataTable, useServerTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import SubjectsManager from "./SubjectsManager";
import TicketDetail from "./TicketDetail";
import { TICKET_FILTERS, type Ticket } from "./types";

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
};

export default function Support() {
  const [filter, setFilter] = useState("ALL");
  const [active, setActive] = useState<Ticket | null>(null);
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "createdAt", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ supportTicketsPage: { items: Ticket[]; total: number } }>(SUPPORT_TICKETS_PAGE, {
    variables: { ...variables, status: filter === "ALL" ? null : filter },
    pollInterval: 30000,
  });
  const [replyMutation, { loading: replying }] = useMutation(REPLY_TICKET);
  const [statusMutation, { loading: updating }] = useMutation(UPDATE_TICKET_STATUS);
  const [deleteTicket] = useMutation(DELETE_SUPPORT_TICKET);
  const [deleteTickets] = useMutation(DELETE_SUPPORT_TICKETS);
  const notify = useAlert();
  const confirm = useConfirm();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tickets = data?.supportTicketsPage.items ?? [];
  const total = data?.supportTicketsPage.total ?? 0;
  const busy = replying || updating;

  function selectFilter(f: string) {
    setFilter(f);
    setPage(1);
  }

  async function remove(ticket: Ticket) {
    const ok = await confirm({ title: "Delete ticket", message: `Delete this support ticket${ticket.order?.orderNumber ? ` for ${ticket.order.orderNumber}` : ""}? This cannot be undone.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    setDeletingId(ticket.id);
    try {
      await deleteTicket({ variables: { ticketId: ticket.id } });
      if (active?.id === ticket.id) setActive(null);
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete tickets", message: `Delete ${ids.length} selected ticket(s)? This cannot be undone.`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await deleteTickets({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  async function reply(ticket: Ticket, text: string) {
    try {
      const { data: res } = await replyMutation({ variables: { ticketId: ticket.id, text } });
      await refetch();
      const updated = res?.replySupportTicket;
      setActive((prev) => (prev ? { ...prev, messages: updated?.messages ?? prev.messages, status: updated?.status ?? prev.status } : prev));
    } catch (e: unknown) {
      await notify({ title: "Could not reply", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  async function setStatus(ticket: Ticket, status: string) {
    try {
      await statusMutation({ variables: { ticketId: ticket.id, status } });
      await refetch();
      setActive((prev) => (prev ? { ...prev, status: status as Ticket["status"] } : prev));
    } catch (e: unknown) {
      await notify({ title: "Could not update status", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  const columns = useMemo<Column<Ticket>[]>(() => [
    { key: "order", label: "Order", render: (t) => <Typography fontWeight={700}>{t.order?.orderNumber ?? "—"}</Typography> },
    { key: "subject", label: "Subject", sortable: true, render: (t) => <span>{t.subject}{t.imageUrl ? " 📷" : ""}</span> },
    { key: "customer", label: "Customer", render: (t) => <Typography variant="body2" color="text.secondary">{t.user?.name ?? "—"}</Typography> },
    { key: "status", label: "Status", sortable: true, render: (t) => <Chip size="small" variant="outlined" color={STATUS_COLOR[t.status] ?? "default"} label={t.status.replace("_", " ").toLowerCase()} /> },
    { key: "updatedAt", label: "Updated", render: (t) => <Typography variant="body2" color="text.secondary">{fmtDate(t.updatedAt)}</Typography> },
  ], []);

  const chips = (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {TICKET_FILTERS.map((f) => (
        <Chip
          key={f}
          label={f === "ALL" ? "All" : f.replace("_", " ").toLowerCase()}
          color={filter === f ? "primary" : "default"}
          variant={filter === f ? "filled" : "outlined"}
          onClick={() => selectFilter(f)}
        />
      ))}
    </Stack>
  );

  return (
    <Layout title="Support">
      <SubjectsManager />
      <DataTable
        columns={columns}
        rows={tickets}
        total={total}
        rowKey={(t) => t.id}
        loading={loading && !data}
        emptyLabel="No support tickets here."
        noun="ticket"
        searchPlaceholder="Search subject…"
        onBulkDelete={bulkDelete}
        toolbarStart={chips}
        renderActions={(t) => (
          <>
            <Button size="small" onClick={() => setActive(t)}>Open</Button>
            <Button size="small" color="error" disabled={deletingId === t.id} onClick={() => remove(t)}>
              {deletingId === t.id ? "…" : "Delete"}
            </Button>
          </>
        )}
        {...tableProps}
      />

      {active && (
        <TicketDetail ticket={active} busy={busy} onClose={() => setActive(null)} onReply={reply} onStatus={setStatus} />
      )}
    </Layout>
  );
}
