import { Schema, model, Document } from "mongoose";

/**
 * Site-wide branding & company settings. Singleton document (key: "default")
 * managed from the admin panel; every client (website, apps, emails) reads it
 * so branding stays fully dynamic.
 */
export interface ISettings extends Document {
  key: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  supportPhone: string;
  supportEmail: string;
  fssaiLicense: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  updatedAt: Date;
  createdAt: Date;
}

export const SETTINGS_KEY = "default";

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    brandName: { type: String, default: "Didi Bhaiya ki Biryani" },
    tagline: { type: String, default: "Har bite, yaad rahe!" },
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "#e4b65c" },
    accentColor: { type: String, default: "#5e2218" },
    companyName: { type: String, default: "D&B Foods" },
    companyAddress: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    companyEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    fssaiLicense: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>("Settings", settingsSchema);

/** Fetch the singleton settings document, creating it with defaults if absent. */
export async function getOrCreateSettings(): Promise<ISettings> {
  const existing = await Settings.findOne({ key: SETTINGS_KEY }).exec();
  if (existing) return existing;
  return Settings.create({ key: SETTINGS_KEY });
}
