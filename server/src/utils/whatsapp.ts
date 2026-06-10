import { logger } from "./logger.js";

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Send a WhatsApp text message via the Meta Cloud API.
 * Note: outside the 24h customer-service window Meta requires pre-approved
 * template messages; campaign sends assume an approved template/opt-in list.
 */
export async function sendWhatsApp(toPhone: string, text: string): Promise<boolean> {
  if (!whatsappConfigured()) {
    logger.warn({ to: toPhone }, "WhatsApp skipped: not configured");
    return false;
  }
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone.replace(/\D/g, ""),
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    logger.error({ to: toPhone, status: res.status, detail }, "WhatsApp send failed");
    return false;
  }
  return true;
}
