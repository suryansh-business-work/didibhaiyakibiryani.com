export interface TicketMessage {
  by: "CUSTOMER" | "ADMIN";
  text: string;
  at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  imageUrl?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  order?: { id: string; orderNumber: string } | null;
  user?: { name: string; email: string; phone?: string } | null;
}

export const TICKET_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];

export const TICKET_BADGE: Record<string, string> = {
  OPEN: "badge--amber",
  IN_PROGRESS: "badge--blue",
  RESOLVED: "badge--green",
};
