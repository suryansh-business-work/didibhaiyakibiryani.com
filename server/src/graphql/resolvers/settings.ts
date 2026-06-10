import { Settings, SETTINGS_KEY, getOrCreateSettings } from "../../models/Settings.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { logger } from "../../utils/logger.js";

export interface SettingsInput {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  supportPhone?: string;
  supportEmail?: string;
  fssaiLicense?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
}

/** Strip undefined fields so a partial update never blanks existing values. */
export function cleanSettingsInput(input: SettingsInput): Record<string, string> {
  const update: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") {
      update[k] = v.trim();
    }
  }
  return update;
}

export const settingsResolvers = {
  Query: {
    settings: async () => getOrCreateSettings(),
  },

  Mutation: {
    updateSettings: async (
      _: unknown,
      { input }: { input: SettingsInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      await getOrCreateSettings();
      const update = cleanSettingsInput(input);
      logger.info({ fields: Object.keys(update) }, "Settings updated");
      return Settings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: update },
        { new: true }
      ).exec();
    },
  },
};
