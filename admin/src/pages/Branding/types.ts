export interface SettingsData {
  brandName: string;
  tagline: string;
  logoUrl: string;
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
  updatedAt?: string;
}

export type SettingsForm = Omit<SettingsData, "updatedAt">;

export const BLANK_FORM: SettingsForm = {
  brandName: "",
  tagline: "",
  logoUrl: "",
  websiteHeaderLogoUrl: "",
  websiteFooterLogoUrl: "",
  faviconUrl: "",
  consumerAppName: "",
  consumerSplashUrl: "",
  consumerIconUrl: "",
  deliveryAppName: "",
  deliverySplashUrl: "",
  deliveryIconUrl: "",
  primaryColor: "#e4b65c",
  accentColor: "#5e2218",
  companyName: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  supportPhone: "",
  supportEmail: "",
  feedbackEmail: "",
  website: "",
  fssaiLicense: "",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
};

/**
 * Build the branding form from a settings document, copying ONLY the branding
 * fields. The `settings` query returns the whole document (store hours,
 * maintenance, the computed `storeOpenNow`, plus Apollo's `__typename`); spreading
 * all of that into the mutation input fails server-side validation, so we pick
 * by key instead.
 */
export function settingsToForm(s: SettingsData): SettingsForm {
  const src = s as Partial<Record<keyof SettingsForm, string>>;
  const form = { ...BLANK_FORM };
  for (const key of Object.keys(BLANK_FORM) as (keyof SettingsForm)[]) {
    const value = src[key];
    if (typeof value === "string") form[key] = value;
  }
  return form;
}

interface FieldDef {
  key: keyof SettingsForm;
  label: string;
  type?: "color" | "url" | "email" | "tel";
  placeholder?: string;
}

export interface SectionDef {
  title: string;
  fields: FieldDef[];
}

/** Uploadable brand assets — each renders an ImageUpload that stores a CDN URL. */
export interface AssetDef {
  key: keyof SettingsForm;
  label: string;
  hint: string;
}

export const BRANDING_ASSETS: AssetDef[] = [
  { key: "logoUrl", label: "Primary logo", hint: "Used across website, apps & emails" },
  { key: "websiteHeaderLogoUrl", label: "Website header logo", hint: "Top navigation bar" },
  { key: "websiteFooterLogoUrl", label: "Website footer logo", hint: "Site footer" },
  { key: "faviconUrl", label: "Website favicon", hint: "Browser tab icon (square PNG)" },
  { key: "consumerSplashUrl", label: "Consumer app splash", hint: "Customer app launch screen" },
  { key: "consumerIconUrl", label: "Consumer app icon", hint: "Customer app launcher icon" },
  { key: "deliverySplashUrl", label: "Delivery app splash", hint: "Rider app launch screen" },
  { key: "deliveryIconUrl", label: "Delivery app icon", hint: "Rider app launcher icon" },
];

/** Form layout — one place to add new branding fields. */
export const SECTIONS: SectionDef[] = [
  {
    title: "Brand",
    fields: [
      { key: "brandName", label: "Brand name" },
      { key: "tagline", label: "Tagline" },
      { key: "primaryColor", label: "Primary color", type: "color" },
      { key: "accentColor", label: "Accent color", type: "color" },
    ],
  },
  {
    title: "App names",
    fields: [
      { key: "consumerAppName", label: "Consumer app name" },
      { key: "deliveryAppName", label: "Delivery app name" },
    ],
  },
  {
    title: "Company",
    fields: [
      { key: "companyName", label: "Company name" },
      { key: "companyAddress", label: "Address" },
      { key: "companyPhone", label: "Phone", type: "tel" },
      { key: "companyEmail", label: "Email", type: "email" },
      { key: "website", label: "Website", type: "url" },
    ],
  },
  {
    title: "Support",
    fields: [
      { key: "supportPhone", label: "Support phone", type: "tel" },
      { key: "supportEmail", label: "Support email", type: "email" },
      { key: "feedbackEmail", label: "Feedback email", type: "email" },
    ],
  },
  {
    title: "Social",
    fields: [
      { key: "instagramUrl", label: "Instagram", type: "url" },
      { key: "facebookUrl", label: "Facebook", type: "url" },
      { key: "youtubeUrl", label: "YouTube", type: "url" },
    ],
  },
];
