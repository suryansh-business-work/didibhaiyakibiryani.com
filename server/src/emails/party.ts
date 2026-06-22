import { emailShell, cardSection, ctaButton, type EmailBrand } from "./layout.js";
import type { EmailContent } from "./auth.js";

export interface PartyOrderDetails {
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: number;
  location?: string;
  message?: string;
}

function row(label: string, value: string): string {
  return `<mj-text color="#cdbfb0" font-size="14px" padding="2px 0"><strong style="color:#f5ece0">${label}:</strong> ${value}</mj-text>`;
}

function detailRows(p: PartyOrderDetails): string {
  const rows = [row("Name", p.name), row("Phone", p.phone), row("Email", p.email)];
  if (p.eventDate) rows.push(row("Event date", p.eventDate));
  if (p.guests) rows.push(row("Guests", String(p.guests)));
  if (p.location) rows.push(row("Location", p.location));
  if (p.message) rows.push(row("Message", p.message));
  return rows.join("");
}

/** Internal notification sent to the admin/support inbox for a new enquiry. */
export function partyOrderAdminEmail(brand: EmailBrand, p: PartyOrderDetails): EmailContent {
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="800">New party order enquiry 🎉</mj-text>
    <mj-text color="#cdbfb0">A customer wants to plan a party order — follow up soon:</mj-text>
    ${detailRows(p)}
  `);
  return { subject: `New party order enquiry — ${p.name}`, mjml: emailShell(brand, body) };
}

/** Confirmation sent to the customer who submitted the enquiry. */
export function partyOrderCustomerEmail(
  brand: EmailBrand,
  p: PartyOrderDetails,
  menuUrl: string
): EmailContent {
  const body = cardSection(`
    <mj-text color="#f5ece0" font-size="18px" font-weight="800">We got your party request, ${p.name}! 🎉</mj-text>
    <mj-text color="#cdbfb0">Thanks for thinking of ${brand.brandName} for your celebration. Our catering team will reach out shortly on ${p.phone}.</mj-text>
    <mj-text color="#8d8073" font-size="13px">Here's what you told us:</mj-text>
    ${detailRows(p)}
    ${ctaButton(brand, "Explore our menu", menuUrl)}
  `);
  return { subject: `Your party order request — ${brand.brandName}`, mjml: emailShell(brand, body) };
}
