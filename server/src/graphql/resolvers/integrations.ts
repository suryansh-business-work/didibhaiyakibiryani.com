import { Settings, SETTINGS_KEY, getOrCreateSettings } from "../../models/Settings.js";
import type { ISettings } from "../../models/Settings.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { resolveMailConfig } from "../../utils/mailer.js";
import { resolveImageKitConfig } from "../../utils/imagekit.js";
import { logger } from "../../utils/logger.js";

interface IntegrationInput {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  mailFrom?: string;
  mailFromName?: string;
  imagekitUrlEndpoint?: string;
  imagekitPublicKey?: string;
  imagekitPrivateKey?: string;
}

/** Non-secret fields — always overwritten with the (trimmed) provided value. */
const PLAIN_FIELDS: (keyof IntegrationInput)[] = [
  "smtpHost", "smtpPort", "smtpUser", "mailFrom", "mailFromName",
  "imagekitUrlEndpoint", "imagekitPublicKey",
];
/** Secret fields — only overwritten when a non-empty value is supplied. */
const SECRET_FIELDS: (keyof IntegrationInput)[] = ["smtpPass", "imagekitPrivateKey"];

async function toIntegrationView(s: ISettings) {
  const [mail, imagekit] = await Promise.all([resolveMailConfig(), resolveImageKitConfig()]);
  return {
    smtpHost: s.smtpHost,
    smtpPort: s.smtpPort,
    smtpUser: s.smtpUser,
    mailFrom: s.mailFrom,
    mailFromName: s.mailFromName,
    smtpPassSet: Boolean(s.smtpPass),
    smtpConfigured: mail !== null,
    imagekitUrlEndpoint: s.imagekitUrlEndpoint,
    imagekitPublicKey: s.imagekitPublicKey,
    imagekitPrivateKeySet: Boolean(s.imagekitPrivateKey),
    imagekitConfigured: imagekit !== null,
  };
}

export const integrationResolvers = {
  Query: {
    integrationSettings: async (_: unknown, __: unknown, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return toIntegrationView(await getOrCreateSettings());
    },
  },

  Mutation: {
    updateIntegrationSettings: async (
      _: unknown,
      { input }: { input: IntegrationInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      await getOrCreateSettings();
      const update: Record<string, string> = {};
      for (const key of PLAIN_FIELDS) {
        const v = input[key];
        if (typeof v === "string") update[key] = v.trim();
      }
      for (const key of SECRET_FIELDS) {
        const v = input[key];
        if (typeof v === "string" && v.trim()) update[key] = v.trim();
      }
      logger.info({ fields: Object.keys(update) }, "Integration settings updated");
      const saved = await Settings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: update },
        { new: true }
      ).exec();
      return toIntegrationView(saved ?? (await getOrCreateSettings()));
    },
  },
};
