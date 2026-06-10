import { emailShell, cardSection, ctaButton, type EmailBrand } from "./layout.js";
import type { EmailContent } from "./auth.js";
import { getOrCreateSettings } from "../models/index.js";
import { DEFAULT_BRAND } from "./layout.js";

/**
 * Generic marketing/campaign email. `bodyText` supports plain paragraphs
 * separated by blank lines; an optional CTA button is appended.
 */
export function marketingEmail(
  brand: EmailBrand,
  subject: string,
  bodyText: string,
  cta?: { label: string; url: string }
): EmailContent {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<mj-text color="#cdbfb0">${p.replaceAll("\n", "<br/>")}</mj-text>`)
    .join("");
  const button = cta ? ctaButton(brand, cta.label, cta.url) : "";
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="19px" font-weight="800">${subject}</mj-text>
    ${paragraphs}
    ${button}
  `);
  return { subject, mjml: emailShell(brand, body) };
}

/** Load the admin-managed brand for emails (falls back to defaults). */
export async function loadEmailBrand(): Promise<EmailBrand> {
  try {
    const s = await getOrCreateSettings();
    return {
      brandName: s.brandName || DEFAULT_BRAND.brandName,
      tagline: s.tagline || DEFAULT_BRAND.tagline,
      logoUrl: s.logoUrl,
      primaryColor: s.primaryColor || DEFAULT_BRAND.primaryColor,
      companyName: s.companyName || DEFAULT_BRAND.companyName,
      companyAddress: s.companyAddress,
      supportEmail: s.supportEmail,
      supportPhone: s.supportPhone,
    };
  } catch {
    return { ...DEFAULT_BRAND };
  }
}
