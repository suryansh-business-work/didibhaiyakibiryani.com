export interface CampaignRow {
  id: string;
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  status: "DRAFT" | "SENDING" | "SENT" | "FAILED";
  audienceCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: string;
  createdAt: string;
}

export interface CampaignForm {
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}

export const BLANK_FORM: CampaignForm = {
  name: "",
  channel: "EMAIL",
  subject: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
};

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge--muted",
  SENDING: "badge--amber",
  SENT: "badge--green",
  FAILED: "badge--red",
};
