import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SUPPORT_TICKETS } from "../../graphql/queries";
import { REPLY_TICKET, UPDATE_TICKET_STATUS, DELETE_SUPPORT_TICKET } from "../../graphql/mutations";
import { Box, Button, Chip, type ChipProps, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
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
  const { data, loading, refetch } = useQuery<{ supportTickets: Ticket[] }>(SUPPORT_TICKETS, {
    variables: { status: filter === "ALL" ? null : filter },
    pollInterval: 30000,
  });
  const [replyMutation, { loading: replying }] = useMutation(REPLY_TICKET);
  const [statusMutation, { loading: updating }] = useMutation(UPDATE_TICKET_STATUS);
  const [deleteTicket] = useMutation(DELETE_SUPPORT_TICKET);
  const notify = useAlert();
  const confirm = useConfirm();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tickets = data?.supportTickets ?? [];
  const busy = replying || updating;

  async function remove(ticket: Ticket) {
    const ok = await confirm({
      title: "Delete ticket",
      message: `Delete this support ticket${ticket.order?.orderNumber ? ` for ${ticket.order.orderNumber}` : ""}? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(ticket.id);
    try {
      await deleteTicket({ variables: { ticketId: ticket.id } });
      if (active?.id === ticket.id) setActive(null);
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function reply(ticket: Ticket, text: string) {
    try {
      const { data: res } = await replyMutation({ variables: { ticketId: ticket.id, text } });
      await refetch();
      const updated = res?.replySupportTicket;
      setActive((prev) =>
        prev ? { ...prev, messages: updated?.messages ?? prev.messages, status: updated?.status ?? prev.status } : prev
      );
    } catch (e: unknown) {
      await notify({
        title: "Could not reply",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  async function setStatus(ticket: Ticket, status: string) {
    try {
      await statusMutation({ variables: { ticketId: ticket.id, status } });
      await refetch();
      setActive((prev) => (prev ? { ...prev, status: status as Ticket["status"] } : prev));
    } catch (e: unknown) {
      await notify({
        title: "Could not update status",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  return (
    <Layout title="Support">
      <SubjectsManager />

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        {TICKET_FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "ALL" ? "All" : f.replace("_", " ").toLowerCase()}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            onClick={() => setFilter(f)}
          />
        ))}
      </Stack>

      <div className="card">
        <AsyncList
          loading={loading && !data}
          empty={tickets.length === 0}
          emptyLabel="No support tickets here."
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell><TableCell>Subject</TableCell><TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell><TableCell>Updated</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} hover sx={{ cursor: "pointer" }} onClick={() => setActive(t)}>
                    <TableCell><Typography fontWeight={700}>{t.order?.orderNumber ?? "—"}</Typography></TableCell>
                    <TableCell>{t.subject}{t.imageUrl ? " 📷" : ""}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{t.user?.name ?? "—"}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={STATUS_COLOR[t.status] ?? "default"} label={t.status.replace("_", " ").toLowerCase()} />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(t.updatedAt)}</Typography></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        color="error"
                        disabled={deletingId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(t);
                        }}
                      >
                        {deletingId === t.id ? "…" : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AsyncList>
      </div>

      {active && (
        <TicketDetail
          ticket={active}
          busy={busy}
          onClose={() => setActive(null)}
          onReply={reply}
          onStatus={setStatus}
        />
      )}
    </Layout>
  );
}
