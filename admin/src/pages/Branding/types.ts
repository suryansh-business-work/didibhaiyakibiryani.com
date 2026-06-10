export interface SettingsData {
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
  updatedAt?: string;
}

export type SettingsForm = Omit<SettingsData, "updatedAt">;

export const BLANK_FORM: SettingsForm = {
  brandName: "",
  tagline: "",
  logoUrl: "",
  primaryColor: "#e4b65c",
  accentColor: "#5e2218",
  companyName: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  supportPhone: "",
  supportEmail: "",
  fssaiLicense: "",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
};

export function settingsToForm(s: SettingsData): SettingsForm {
  const { updatedAt: _updatedAt, ...form } = s;
  return { ...BLANK_FORM, ...form };
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

/** Form layout — one place to add new branding fields. */
export const SECTIONS: SectionDef[] = [
  {
    title: "Brand",
    fields: [
      { key: "brandName", label: "Brand name" },
      { key: "tagline", label: "Tagline" },
      { key: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://…/logo.png" },
      { key: "primaryColor", label: "Primary color", type: "color" },
      { key: "accentColor", label: "Accent color", type: "color" },
    ],
  },
  {
    title: "Company",
    fields: [
      { key: "companyName", label: "Company name" },
      { key: "companyAddress", label: "Address" },
      { key: "companyPhone", label: "Phone", type: "tel" },
      { key: "companyEmail", label: "Email", type: "email" },
      { key: "fssaiLicense", label: "FSSAI license no." },
    ],
  },
  {
    title: "Support",
    fields: [
      { key: "supportPhone", label: "Support phone", type: "tel" },
      { key: "supportEmail", label: "Support email", type: "email" },
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
