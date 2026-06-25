import { GraphQLError } from "graphql";
import { PartyOrder, getOrCreateSettings } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { verifyCaptcha } from "../../utils/captcha.js";
import { loadEmailBrand } from "../../emails/marketing.js";
import {
  partyOrderAdminEmail,
  partyOrderCustomerEmail,
  type PartyOrderDetails,
} from "../../emails/party.js";
import { sendMailAsync } from "../../utils/mailer.js";
import { logger } from "../../utils/logger.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";
import type { PartyOrderStatus } from "../../models/index.js";

const MENU_URL = process.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PartyOrderInput {
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: number;
  location?: string;
  message?: string;
}

function bad(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

/** Email the admin/support inbox and the customer (build is synchronous; send is fire-and-forget). */
async function notifyPartyEmails(details: PartyOrderDetails): Promise<void> {
  // Sequential, not Promise.all: loadEmailBrand also reads the settings singleton,
  // so creating it twice in parallel on a fresh DB races the unique key.
  const settings = await getOrCreateSettings();
  const brand = await loadEmailBrand();
  const adminTo = (settings.supportEmail || settings.companyEmail || "").trim();
  if (adminTo) {
    sendMailAsync({ to: adminTo, ...partyOrderAdminEmail(brand, details) });
  }
  sendMailAsync({ to: details.email, ...partyOrderCustomerEmail(brand, details, MENU_URL) });
}

export const partyResolvers = {
  Query: {
    partyOrders: async (_: unknown, { status }: { status?: PartyOrderStatus }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const filter = status ? { status } : {};
      return PartyOrder.find(filter).sort({ createdAt: -1 }).limit(300).exec();
    },

    partyOrdersPage: async (
      _: unknown,
      { status, ...page }: PageArgs & { status?: PartyOrderStatus },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      return paginate(PartyOrder, {
        filter: status ? { status } : {},
        searchFields: ["name", "phone", "email", "location"],
        sortAllow: ["name", "createdAt", "status"],
        ...page,
      });
    },
  },

  Mutation: {
    submitPartyOrder: async (
      _: unknown,
      { input, captchaId, captchaAnswer }: { input: PartyOrderInput; captchaId: string; captchaAnswer: string }
    ) => {
      const ok = await verifyCaptcha(captchaId, captchaAnswer);
      if (!ok) throw bad("Captcha answer is wrong or expired — try again.");

      const name = input.name.trim();
      const phone = input.phone.trim();
      const email = input.email.toLowerCase().trim();
      if (!name || !phone || !email) throw bad("Name, phone and email are required.");
      if (!EMAIL_RE.test(email)) throw bad("Please enter a valid email address.");

      const party = await PartyOrder.create({
        name,
        phone,
        email,
        eventDate: input.eventDate?.trim() || undefined,
        guests: input.guests ?? undefined,
        location: input.location?.trim() || undefined,
        message: input.message?.trim() || undefined,
      });

      const details: PartyOrderDetails = {
        name,
        phone,
        email,
        eventDate: party.eventDate,
        guests: party.guests,
        location: party.location,
        message: party.message,
      };
      await notifyPartyEmails(details);
      logger.info({ partyId: party.id }, "Party order enquiry received");
      return true;
    },

    createPartyOrder: async (_: unknown, { input }: { input: PartyOrderInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const name = input.name.trim();
      const phone = input.phone.trim();
      const email = input.email.toLowerCase().trim();
      if (!name || !phone || !email) throw bad("Name, phone and email are required.");
      if (!EMAIL_RE.test(email)) throw bad("Please enter a valid email address.");
      // Staff-entered party orders skip captcha and the customer/admin email blast.
      return PartyOrder.create({
        name,
        phone,
        email,
        eventDate: input.eventDate?.trim() || undefined,
        guests: input.guests ?? undefined,
        location: input.location?.trim() || undefined,
        message: input.message?.trim() || undefined,
      });
    },

    updatePartyOrderStatus: async (
      _: unknown,
      { id, status }: { id: string; status: PartyOrderStatus },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const party = await PartyOrder.findByIdAndUpdate(id, { status }, { new: true }).exec();
      if (!party) throw bad("Party order not found.");
      return party;
    },

    deletePartyOrders: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      if (!ids.length) return 0;
      const res = await PartyOrder.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },
};
