import { GraphQLError } from "graphql";
import { User, Campaign, type ICampaign } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { sendMail, mailConfigured } from "../../utils/mailer.js";
import { sendWhatsApp, whatsappConfigured } from "../../utils/whatsapp.js";
import { marketingEmail, loadEmailBrand } from "../../emails/marketing.js";
import { logger } from "../../utils/logger.js";

interface CampaignInput {
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

async function requireChannelConfigured(channel: CampaignInput["channel"]): Promise<void> {
  if (channel === "EMAIL" && !(await mailConfigured())) {
    throw new GraphQLError("SMTP is not configured.", {
      extensions: { code: "MAIL_NOT_CONFIGURED" },
    });
  }
  if (channel === "WHATSAPP" && !whatsappConfigured()) {
    throw new GraphQLError("WhatsApp is not configured (WHATSAPP_TOKEN missing).", {
      extensions: { code: "WHATSAPP_NOT_CONFIGURED" },
    });
  }
}

async function deliverCampaign(campaign: ICampaign): Promise<void> {
  const customers = await User.find({ role: "CUSTOMER", isActive: true })
    .select("name email phone")
    .exec();
  const cta =
    campaign.ctaLabel && campaign.ctaUrl
      ? { label: campaign.ctaLabel, url: campaign.ctaUrl }
      : undefined;
  const brand = await loadEmailBrand();

  campaign.audienceCount = customers.length;
  campaign.status = "SENDING";
  await campaign.save();

  let sent = 0;
  let failed = 0;
  for (const c of customers) {
    try {
      let ok = false;
      if (campaign.channel === "EMAIL" && c.email) {
        ok = await sendMail({
          to: c.email,
          ...marketingEmail(brand, campaign.subject, campaign.body, cta),
        });
      } else if (campaign.channel === "WHATSAPP" && c.phone) {
        ok = await sendWhatsApp(c.phone, `${campaign.subject}\n\n${campaign.body}`);
      }
      if (ok) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  campaign.sentCount = sent;
  campaign.failedCount = failed;
  campaign.status = failed > 0 && sent === 0 ? "FAILED" : "SENT";
  campaign.sentAt = new Date();
  await campaign.save();
  logger.info({ campaign: campaign.name, sent, failed }, "Campaign delivered");
}

export const campaignResolvers = {
  Query: {
    campaigns: async (_: unknown, __: unknown, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return Campaign.find().sort({ createdAt: -1 }).limit(100).exec();
    },
  },

  Mutation: {
    sendCampaign: async (_: unknown, { input }: { input: CampaignInput }, ctx: Context) => {
      const admin = requireRole(ctx, "ADMIN");
      if (!input.name.trim() || !input.subject.trim() || !input.body.trim()) {
        throw new GraphQLError("Name, subject and body are required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      await requireChannelConfigured(input.channel);

      const campaign = await Campaign.create({
        ...input,
        status: "DRAFT",
        createdBy: admin.id,
      });

      // Deliver in the background; status/counts update as it progresses.
      deliverCampaign(campaign).catch((err: unknown) => {
        logger.error(
          { campaign: campaign.name, err: err instanceof Error ? err.message : String(err) },
          "Campaign delivery crashed"
        );
        campaign.status = "FAILED";
        campaign.save().catch(() => undefined);
      });

      return campaign;
    },
  },
};
