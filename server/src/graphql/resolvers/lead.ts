import { GraphQLError } from "graphql";
import { Lead, Order } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";

// Statuses that represent realised revenue (mirrors the dashboard resolver).
const REVENUE_STATUSES = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

function leadNotFound(): GraphQLError {
  return new GraphQLError("Contact not found.", { extensions: { code: "BAD_USER_INPUT" } });
}

function normEmail(email?: string): string | undefined {
  return email?.trim().toLowerCase() || undefined;
}

function clean(v?: string): string | undefined {
  return v?.trim() || undefined;
}

interface LeadInput {
  name?: string;
  phone?: string;
  email?: string;
  note?: string;
  address?: string;
  society?: string;
  block?: string;
  flat?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export const leadResolvers = {
  Query: {
    leads: async (_: unknown, { search }: { search?: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const filter: Record<string, unknown> = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      return Lead.find(filter).sort({ createdAt: -1 }).limit(200).exec();
    },

    leadsPage: async (_: unknown, page: PageArgs, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return paginate(Lead, {
        searchFields: ["name", "phone", "email"],
        sortAllow: ["name", "createdAt"],
        ...page,
      });
    },
  },

  Mutation: {
    createLead: async (_: unknown, args: LeadInput, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return Lead.create({
        name: args.name?.trim(),
        phone: args.phone?.trim(),
        email: normEmail(args.email),
        note: clean(args.note),
        address: clean(args.address),
        society: clean(args.society),
        block: clean(args.block),
        flat: clean(args.flat),
        city: clean(args.city),
        state: clean(args.state),
        pincode: clean(args.pincode),
        lat: args.lat ?? undefined,
        lng: args.lng ?? undefined,
      });
    },

    updateLead: async (_: unknown, { id, ...rest }: LeadInput & { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const lead = await Lead.findById(id).exec();
      if (!lead) throw leadNotFound();
      if (rest.name !== undefined) lead.name = rest.name.trim();
      if (rest.phone !== undefined) lead.phone = rest.phone.trim();
      if (rest.email !== undefined) lead.email = normEmail(rest.email);
      if (rest.note !== undefined) lead.note = clean(rest.note);
      if (rest.address !== undefined) lead.address = clean(rest.address);
      if (rest.society !== undefined) lead.society = clean(rest.society);
      if (rest.block !== undefined) lead.block = clean(rest.block);
      if (rest.flat !== undefined) lead.flat = clean(rest.flat);
      if (rest.city !== undefined) lead.city = clean(rest.city);
      if (rest.state !== undefined) lead.state = clean(rest.state);
      if (rest.pincode !== undefined) lead.pincode = clean(rest.pincode);
      if (rest.lat !== undefined) lead.lat = rest.lat ?? undefined;
      if (rest.lng !== undefined) lead.lng = rest.lng ?? undefined;
      await lead.save();
      return lead;
    },

    deleteLead: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const lead = await Lead.findById(id).exec();
      if (!lead) throw leadNotFound();
      await Lead.findByIdAndDelete(id).exec();
      return true;
    },

    deleteLeads: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await Lead.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },

  // A contact's orders are POS orders snapshotted against their phone number
  // (non-signup contacts never carry a `user` id).
  Lead: {
    orderCount: (parent: { phone: string }) =>
      Order.countDocuments({ customerPhone: parent.phone }).exec(),
    totalSpent: async (parent: { phone: string }) => {
      const agg = await Order.aggregate([
        { $match: { customerPhone: parent.phone, status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      return agg[0]?.total ?? 0;
    },
  },
};
