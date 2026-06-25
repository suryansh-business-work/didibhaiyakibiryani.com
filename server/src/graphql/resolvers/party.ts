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
  eventTime?: string;
  guests?: number;
  location?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  message?: string;
}

function bad(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

/** Trim + validate the required identity fields shared by create and update. */
function validateParty(input: PartyOrderInput): { name: string; phone: string; email: string } {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.toLowerCase().trim();
  if (!name || !phone || !email) throw bad("Name, phone and email are required.");
  if (!EMAIL_RE.test(email)) throw bad("Please enter a valid email address.");
  return { name, phone, email };
}

/** Map the optional input fields to document fields. `blank` is `null` on update
 * (clears an emptied field) and `undefined` on create (falls back to defaults). */
function partyDocFields(input: PartyOrderInput, blank: null | undefined) {
  return {
    eventDate: input.eventDate?.trim() || blank,
    eventTime: input.eventTime?.trim() || blank,
    guests: input.guests ?? blank,
    location: input.location?.trim() || blank,
    line1: input.line1?.trim() || blank,
    city: input.city?.trim() || blank,
    state: input.state?.trim() || blank,
    pincode: input.pincode?.trim() || blank,
    message: input.message?.trim() || blank,
  };
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
        searchFields: ["name", "phone", "email", "location", "line1", "city"],
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

      const { name, phone, email } = validateParty(input);
      const party = await PartyOrder.create({ name, phone, email, ...partyDocFields(input, undefined) });

      const details: PartyOrderDetails = {
        name,
        phone,
        email,
        eventDate: party.eventDate,
        eventTime: party.eventTime,
        guests: party.guests,
        location: party.location,
        line1: party.line1,
        city: party.city,
        state: party.state,
        pincode: party.pincode,
        message: party.message,
      };
      await notifyPartyEmails(details);
      logger.info({ partyId: party.id }, "Party order enquiry received");
      return true;
    },

    createPartyOrder: async (_: unknown, { input }: { input: PartyOrderInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const { name, phone, email } = validateParty(input);
      // Staff-entered party orders skip captcha and the customer/admin email blast.
      return PartyOrder.create({ name, phone, email, ...partyDocFields(input, undefined) });
    },

    updatePartyOrder: async (_: unknown, { id, input }: { id: string; input: PartyOrderInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const { name, phone, email } = validateParty(input);
      // `null` for empty optionals so an admin can clear a field on edit.
      const party = await PartyOrder.findByIdAndUpdate(
        id,
        { name, phone, email, ...partyDocFields(input, null) },
        { new: true }
      ).exec();
      if (!party) throw bad("Party order not found.");
      return party;
    },

    deletePartyOrder: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const removed = await PartyOrder.findByIdAndDelete(id).exec();
      if (!removed) throw bad("Party order not found.");
      return true;
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
