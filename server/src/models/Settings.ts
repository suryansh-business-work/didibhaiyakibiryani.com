import { Schema, model, Document, Types } from "mongoose";

/** Per-app maintenance switches, toggled from the admin panel. */
export interface IMaintenanceFlags {
  website: boolean;
  server: boolean;
  admin: boolean;
  native: boolean;
  delivery: boolean;
}

/**
 * Site-wide branding, company, store and finance settings. Singleton document
 * (key: "default") managed from the admin panel; every client (website, apps,
 * emails, invoices) reads it so configuration stays fully dynamic.
 */
export interface ISettings extends Document {
  key: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  // Branding assets (managed from admin → Branding; served everywhere)
  websiteHeaderLogoUrl: string;
  websiteFooterLogoUrl: string;
  faviconUrl: string;
  consumerAppName: string;
  consumerSplashUrl: string;
  consumerIconUrl: string;
  deliveryAppName: string;
  deliverySplashUrl: string;
  deliveryIconUrl: string;
  primaryColor: string;
  accentColor: string;
  /** Google Font family name applied across web apps & admin ("" = system). */
  fontFamily: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  supportPhone: string;
  supportEmail: string;
  feedbackEmail: string;
  website: string;
  fssaiLicense: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  // Maintenance (per app)
  maintenance: IMaintenanceFlags;
  // Store hours
  storeOpenTime: string; // "HH:mm" 24h
  storeCloseTime: string; // "HH:mm" 24h
  storeTimezone: string; // IANA zone, e.g. "Asia/Kolkata"
  // Finance — delivery cost
  minDeliveryCost: number;
  perKmCharge: number;
  freeDeliveryAbove: number;
  storeLat: number;
  storeLng: number;
  // Finance — invoice / compliance
  gstLegalName: string;
  gstNumber: string;
  /** External feedback-survey link printed on invoices (per-order can override). */
  surveyUrl: string;
  /** Template for the admin "Generate survey message" action (supports {{tokens}}). */
  surveyMessageTemplate: string;
  /** Template for the admin "Generate tracking message" action (supports {{tokens}}). */
  trackingMessageTemplate: string;
  /** Template for the admin "Generate receipt message" action (supports {{tokens}}). */
  receiptMessageTemplate: string;
  // Finance — payment options
  codEnabled: boolean;
  onlineEnabled: boolean;
  // Loyalty / rewards ("Cheesy Rewards"-style)
  loyaltyEnabled: boolean;
  pointsPerOrder: number; // points earned per eligible delivered order
  pointsMinOrder: number; // min order total (₹) to earn points
  pointsPerReward: number; // points needed to redeem one reward
  rewardItem?: Types.ObjectId; // free menu item granted on redeem
  // Support — admin-managed subject lines for the order support box
  supportSubjects: string[];
  // Integrations — secret credentials entered from admin → Integrations.
  // Never exposed on the public `settings` query; admin-only & masked.
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  mailFromName: string;
  imagekitPrivateKey: string;
  imagekitPublicKey: string;
  imagekitUrlEndpoint: string;
  updatedAt: Date;
  createdAt: Date;
}

export const SETTINGS_KEY = "default";

const maintenanceSchema = new Schema<IMaintenanceFlags>(
  {
    website: { type: Boolean, default: false },
    server: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    native: { type: Boolean, default: false },
    delivery: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    brandName: { type: String, default: "Didi Bhaiya ki Biryani" },
    tagline: { type: String, default: "Har bite, yaad rahe!" },
    logoUrl: { type: String, default: "" },
    websiteHeaderLogoUrl: { type: String, default: "" },
    websiteFooterLogoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    consumerAppName: { type: String, default: "Didi Bhaiya ki Biryani" },
    consumerSplashUrl: { type: String, default: "" },
    consumerIconUrl: { type: String, default: "" },
    deliveryAppName: { type: String, default: "DDB Delivery" },
    deliverySplashUrl: { type: String, default: "" },
    deliveryIconUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "#e4b65c" },
    accentColor: { type: String, default: "#5e2218" },
    fontFamily: { type: String, default: "" },
    companyName: { type: String, default: "D&B Foods" },
    companyAddress: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    companyEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    feedbackEmail: { type: String, default: "" },
    website: { type: String, default: "" },
    fssaiLicense: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    maintenance: { type: maintenanceSchema, default: () => ({}) },
    storeOpenTime: { type: String, default: "19:00" },
    storeCloseTime: { type: String, default: "22:00" },
    storeTimezone: { type: String, default: "Asia/Kolkata" },
    minDeliveryCost: { type: Number, default: 39, min: 0 },
    perKmCharge: { type: Number, default: 0, min: 0 },
    freeDeliveryAbove: { type: Number, default: 399, min: 0 },
    storeLat: { type: Number, default: 0 },
    storeLng: { type: Number, default: 0 },
    gstLegalName: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    surveyUrl: { type: String, default: "" },
    surveyMessageTemplate: { type: String, default: "" },
    trackingMessageTemplate: { type: String, default: "" },
    receiptMessageTemplate: { type: String, default: "" },
    codEnabled: { type: Boolean, default: true },
    onlineEnabled: { type: Boolean, default: true },
    loyaltyEnabled: { type: Boolean, default: false },
    pointsPerOrder: { type: Number, default: 100, min: 0 },
    pointsMinOrder: { type: Number, default: 350, min: 0 },
    pointsPerReward: { type: Number, default: 600, min: 1 },
    rewardItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    supportSubjects: {
      type: [String],
      default: () => [
        "Order not delivered",
        "Wrong or missing items",
        "Food quality issue",
        "Payment / refund issue",
        "Delivery partner behaviour",
        "App issue",
      ],
    },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: String, default: "" },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    mailFrom: { type: String, default: "" },
    mailFromName: { type: String, default: "" },
    imagekitPrivateKey: { type: String, default: "" },
    imagekitPublicKey: { type: String, default: "" },
    imagekitUrlEndpoint: { type: String, default: "" },
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
