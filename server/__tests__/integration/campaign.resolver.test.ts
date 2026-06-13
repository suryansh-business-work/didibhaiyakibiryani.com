import { describe, it, expect, vi } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  mailConfigured: vi.fn(async () => true),
}));
vi.mock("../../src/utils/whatsapp.js", () => ({
  sendWhatsApp: vi.fn(async () => true),
  whatsappConfigured: vi.fn(() => true),
}));

import { campaignResolvers } from "../../src/graphql/resolvers/campaign";
import { mailConfigured, sendMail } from "../../src/utils/mailer.js";
import { whatsappConfigured } from "../../src/utils/whatsapp.js";
import { Campaign } from "../../src/models/index.js";

useTestDb();
const adminCtx = ctxFor("651111111111111111111111", "ADMIN");

async function waitForStatus(id: string) {
  await vi.waitFor(async () => {
    const c = await Campaign.findById(id);
    if (!c || ["DRAFT", "SENDING"].includes(c.status)) throw new Error("pending");
    return c;
  }, { timeout: 3000, interval: 30 });
}

describe("campaign resolver", () => {
  it("campaigns query requires admin", async () => {
    await expect(campaignResolvers.Query.campaigns(null, null, ctxFor("u", "CUSTOMER"))).rejects.toThrow();
    expect(await campaignResolvers.Query.campaigns(null, null, adminCtx)).toEqual([]);
  });

  it("sendCampaign validates input and channel config", async () => {
    await expect(campaignResolvers.Mutation.sendCampaign(null, { input: { name: "", channel: "EMAIL", subject: "s", body: "b" } }, adminCtx)).rejects.toThrow(/required/i);

    vi.mocked(mailConfigured).mockResolvedValueOnce(false);
    await expect(campaignResolvers.Mutation.sendCampaign(null, { input: { name: "N", channel: "EMAIL", subject: "s", body: "b" } }, adminCtx)).rejects.toThrow(/SMTP/i);

    vi.mocked(whatsappConfigured).mockReturnValueOnce(false);
    await expect(campaignResolvers.Mutation.sendCampaign(null, { input: { name: "N", channel: "WHATSAPP", subject: "s", body: "b" } }, adminCtx)).rejects.toThrow(/WhatsApp/i);
  });

  it("delivers an EMAIL campaign (with CTA) to active customers", async () => {
    await makeUser("CUSTOMER", { email: "c1@b.com" });
    await makeUser("CUSTOMER", { email: "c2@b.com" });
    const c = await campaignResolvers.Mutation.sendCampaign(null, { input: { name: "Promo", channel: "EMAIL", subject: "20% off", body: "Today only", ctaLabel: "Order", ctaUrl: "https://x" } }, adminCtx);
    await waitForStatus(c.id);
    const done = await Campaign.findById(c.id);
    expect(done?.status).toBe("SENT");
    expect(done?.audienceCount).toBe(2);
    expect(sendMail).toHaveBeenCalled();
  });

  it("delivers a WHATSAPP campaign to customers with a phone", async () => {
    await makeUser("CUSTOMER", { phone: "9000000000" });
    vi.mocked(whatsappConfigured).mockReturnValue(true);
    const c = await campaignResolvers.Mutation.sendCampaign(null, { input: { name: "WA", channel: "WHATSAPP", subject: "Hi", body: "There" } }, adminCtx);
    await waitForStatus(c.id);
    expect((await Campaign.findById(c.id))?.status).toBe("SENT");
  });

  it("marks FAILED when no recipient is reachable (WhatsApp, no phone)", async () => {
    await makeUser("CUSTOMER", {}); // no phone
    vi.mocked(whatsappConfigured).mockReturnValue(true);
    const c = await campaignResolvers.Mutation.sendCampaign(null, { input: { name: "WA2", channel: "WHATSAPP", subject: "Hi", body: "There" } }, adminCtx);
    await waitForStatus(c.id);
    const done = await Campaign.findById(c.id);
    expect(done?.status).toBe("FAILED");
    expect(done?.failedCount).toBe(1);
  });
});
