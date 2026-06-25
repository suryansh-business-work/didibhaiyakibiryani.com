import { GraphQLError } from "graphql";
import { SupportTicket, Order, User } from "../../models/index.js";
import { requireAuth, requireRole, type Context } from "../../utils/auth.js";
import { logger } from "../../utils/logger.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";
import type { TicketStatus } from "../../models/index.js";

function bad(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

interface CreateTicketArgs {
  orderId: string;
  subject: string;
  body: string;
  imageUrl?: string;
}

export const supportResolvers = {
  Query: {
    myTickets: async (_: unknown, __: unknown, ctx: Context) => {
      const u = requireAuth(ctx);
      return SupportTicket.find({ user: u.id }).sort({ updatedAt: -1 }).exec();
    },

    orderTickets: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const filter: Record<string, unknown> = { order: orderId };
      if (!["ADMIN", "STAFF"].includes(u.role)) {
        filter.user = u.id;
      }
      return SupportTicket.find(filter).sort({ updatedAt: -1 }).exec();
    },

    supportTickets: async (_: unknown, { status }: { status?: TicketStatus }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const filter = status ? { status } : {};
      return SupportTicket.find(filter).sort({ updatedAt: -1 }).limit(300).exec();
    },

    supportTicketsPage: async (
      _: unknown,
      { status, ...page }: PageArgs & { status?: TicketStatus },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      return paginate(SupportTicket, {
        filter: status ? { status } : {},
        searchFields: ["subject", "body"],
        sortAllow: ["createdAt", "status"],
        ...page,
      });
    },
  },

  Mutation: {
    createSupportTicket: async (_: unknown, args: CreateTicketArgs, ctx: Context) => {
      const u = requireAuth(ctx);
      if (!args.subject.trim()) throw bad("Please choose or enter a subject.");
      if (!args.body.trim()) throw bad("Please describe the issue.");
      const order = await Order.findById(args.orderId).exec();
      if (!order) throw bad("Order not found.");
      if (String(order.user) !== u.id) {
        throw new GraphQLError("You can raise support only for your own orders.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const ticket = await SupportTicket.create({
        order: order._id,
        user: u.id,
        subject: args.subject.trim(),
        body: args.body.trim(),
        imageUrl: args.imageUrl || undefined,
      });
      logger.info({ ticketId: ticket.id, order: order.orderNumber }, "Support ticket created");
      return ticket;
    },

    replySupportTicket: async (
      _: unknown,
      { ticketId, text }: { ticketId: string; text: string },
      ctx: Context
    ) => {
      const u = requireAuth(ctx);
      if (!text.trim()) throw bad("Reply text is required.");
      const ticket = await SupportTicket.findById(ticketId).exec();
      if (!ticket) throw bad("Ticket not found.");
      const isStaff = ["ADMIN", "STAFF"].includes(u.role);
      if (!isStaff && String(ticket.user) !== u.id) {
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      }
      ticket.messages.push({ by: isStaff ? "ADMIN" : "CUSTOMER", text: text.trim(), at: new Date() });
      if (isStaff && ticket.status === "OPEN") {
        ticket.status = "IN_PROGRESS";
      }
      await ticket.save();
      return ticket;
    },

    updateSupportTicketStatus: async (
      _: unknown,
      { ticketId, status }: { ticketId: string; status: TicketStatus },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true }
      ).exec();
      if (!ticket) throw bad("Ticket not found.");
      return ticket;
    },

    deleteSupportTicket: async (_: unknown, { ticketId }: { ticketId: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const deleted = await SupportTicket.findByIdAndDelete(ticketId).exec();
      if (!deleted) throw bad("Ticket not found.");
      return true;
    },

    deleteSupportTickets: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await SupportTicket.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },

  SupportTicket: {
    order: (parent: { order?: unknown }) =>
      parent.order ? Order.findById(parent.order as string).exec() : null,
    user: (parent: { user?: unknown }) =>
      parent.user ? User.findById(parent.user as string).exec() : null,
  },
};
