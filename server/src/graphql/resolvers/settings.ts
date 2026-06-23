import { Settings, SETTINGS_KEY, getOrCreateSettings } from "../../models/Settings.js";
import type { ISettings } from "../../models/Settings.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { isStoreOpen } from "../../utils/storeHours.js";
import { logger } from "../../utils/logger.js";

export interface SettingsInput {
  [key: string]: unknown;
  maintenance?: Partial<Record<string, boolean>>;
}

const STRING_FIELDS = new Set([
  "brandName", "tagline", "logoUrl", "primaryColor", "accentColor",
  "websiteHeaderLogoUrl", "websiteFooterLogoUrl", "faviconUrl",
  "consumerAppName", "consumerSplashUrl", "consumerIconUrl",
  "deliveryAppName", "deliverySplashUrl", "deliveryIconUrl",
  "companyName", "companyAddress", "companyPhone", "companyEmail",
  "supportPhone", "supportEmail", "feedbackEmail", "website", "fssaiLicense",
  "instagramUrl", "facebookUrl", "youtubeUrl",
  "storeOpenTime", "storeCloseTime", "storeTimezone",
  "gstLegalName", "gstNumber", "surveyUrl",
]);
const NUMBER_FIELDS = new Set([
  "minDeliveryCost", "perKmCharge", "freeDeliveryAbove", "storeLat", "storeLng",
]);
const BOOLEAN_FIELDS = new Set(["codEnabled", "onlineEnabled"]);
const MAINTENANCE_APPS = new Set(["website", "server", "admin", "native", "delivery"]);

/**
 * Build a typed `$set` update from a partial input so an omitted field never
 * blanks an existing value. Maintenance flags become dotted paths so each
 * app's switch updates independently.
 */
export function cleanSettingsInput(input: SettingsInput): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (STRING_FIELDS.has(k) && typeof v === "string") {
      update[k] = v.trim();
    } else if (NUMBER_FIELDS.has(k) && typeof v === "number" && Number.isFinite(v)) {
      update[k] = k === "storeLat" || k === "storeLng" ? v : Math.max(0, v);
    } else if (BOOLEAN_FIELDS.has(k) && typeof v === "boolean") {
      update[k] = v;
    }
  }
  if (input.maintenance && typeof input.maintenance === "object") {
    for (const [app, flag] of Object.entries(input.maintenance)) {
      if (MAINTENANCE_APPS.has(app) && typeof flag === "boolean") {
        update[`maintenance.${app}`] = flag;
      }
    }
  }
  if (Array.isArray(input.supportSubjects)) {
    update.supportSubjects = input.supportSubjects
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  return update;
}

export const settingsResolvers = {
  Query: {
    settings: async () => getOrCreateSettings(),
  },

  Settings: {
    storeOpenNow: (parent: ISettings) =>
      isStoreOpen(parent.storeOpenTime, parent.storeCloseTime, parent.storeTimezone),
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
