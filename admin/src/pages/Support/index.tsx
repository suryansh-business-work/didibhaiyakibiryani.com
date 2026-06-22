import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SUPPORT_TICKETS } from "../../graphql/queries";
import { REPLY_TICKET, UPDATE_TICKET_STATUS, DELETE_SUPPORT_TICKET } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
import { useAlert, useConfirm } from "../../components/dialog";
import SubjectsManager from "./SubjectsManager";
import TicketDetail from "./TicketDetail";
import { TICKET_BADGE, TICKET_FILTERS, type Ticket } from "./types";

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

      <div className="toolbar">
        <div className="chips">
          {TICKET_FILTERS.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "All" : f.replace("_", " ").toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <AsyncList
          loading={loading && !data}
          empty={tickets.length === 0}
          emptyLabel="No support tickets here."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setActive(t)}>
                    <td className="t-strong">{t.order?.orderNumber ?? "—"}</td>
                    <td>
                      {t.subject}
                      {t.imageUrl && " 📷"}
                    </td>
                    <td className="muted">{t.user?.name ?? "—"}</td>
                    <td>
                      <span className={`badge ${TICKET_BADGE[t.status]}`}>
                        <span className="dot" />
                        {t.status.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="muted">{fmtDate(t.updatedAt)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(t);
                        }}
                      >
                        {deletingId === t.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
