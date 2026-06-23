import { GraphQLError } from "graphql";
import { Lead } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";

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
  },
};
