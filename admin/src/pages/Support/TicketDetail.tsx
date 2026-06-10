import { useState } from "react";
import { Modal, fmtDate } from "../../components/ui";
import { TICKET_BADGE, type Ticket } from "./types";

interface TicketDetailProps {
  ticket: Ticket;
  busy: boolean;
  onClose: () => void;
  onReply: (ticket: Ticket, text: string) => Promise<void>;
  onStatus: (ticket: Ticket, status: string) => Promise<void>;
}

const STATUS_ACTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "IN_PROGRESS", label: "Mark in progress" },
  { value: "RESOLVED", label: "Mark resolved" },
  { value: "OPEN", label: "Reopen" },
];

export default function TicketDetail({
  ticket,
  busy,
  onClose,
  onReply,
  onStatus,
}: Readonly<TicketDetailProps>) {
  const [reply, setReply] = useState("");

  async function sendReply() {
    if (!reply.trim()) return;
    await onReply(ticket, reply.trim());
    setReply("");
  }

  return (
    <Modal title={`Ticket · ${ticket.order?.orderNumber ?? "—"}`} onClose={onClose}>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className={`badge ${TICKET_BADGE[ticket.status]}`}>
          <span className="dot" />
          {ticket.status.replace("_", " ").toLowerCase()}
        </span>
        <span className="muted">{fmtDate(ticket.createdAt)}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="t-strong">{ticket.subject}</div>
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          {ticket.user?.name} · {ticket.user?.email}
          {ticket.user?.phone ? ` · ${ticket.user.phone}` : ""}
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <p style={{ whiteSpace: "pre-wrap" }}>{ticket.body}</p>
        {ticket.imageUrl && (
          <a href={ticket.imageUrl} target="_blank" rel="noreferrer">
            <img
              src={ticket.imageUrl}
              alt="Attachment from the customer"
              style={{ maxWidth: "100%", borderRadius: 10, marginTop: 10 }}
            />
          </a>
        )}
      </div>

      {ticket.messages.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {ticket.messages.map((m) => (
            <div
              key={`${m.at}-${m.by}`}
              className="card"
              style={{
                padding: 10,
                borderColor: m.by === "ADMIN" ? "var(--gold-deep)" : "var(--border)",
              }}
            >
              <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 4 }}>
                {m.by === "ADMIN" ? "You (admin)" : "Customer"} · {fmtDate(m.at)}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="field">
        <label>Reply to the customer</label>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} />
      </div>
      <div className="chips">
        <button className="btn btn-gold btn-sm" disabled={busy || !reply.trim()} onClick={sendReply}>
          Send reply
        </button>
        {STATUS_ACTIONS.filter((a) => a.value !== ticket.status).map((a) => (
          <button
            key={a.value}
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => onStatus(ticket, a.value)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
