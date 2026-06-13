import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { settingsResolvers } from "../../src/graphql/resolvers/settings";
import { integrationResolvers } from "../../src/graphql/resolvers/integrations";

useTestDb();
const adminCtx = ctxFor("admin1", "ADMIN");
const custCtx = ctxFor("cust1", "CUSTOMER");

describe("settings resolver", () => {
  it("settings query, storeOpenNow field, updateSettings (admin)", async () => {
    const s = await settingsResolvers.Query.settings();
    expect(s.brandName).toBeTruthy();
    expect(typeof settingsResolvers.Settings.storeOpenNow(s)).toBe("boolean");

    await expect(settingsResolvers.Mutation.updateSettings(null, { input: { brandName: "New Brand" } }, custCtx)).rejects.toThrow();
    const updated = await settingsResolvers.Mutation.updateSettings(null, { input: { brandName: "New Brand", websiteHeaderLogoUrl: "https://x/h.png", minDeliveryCost: 49, codEnabled: false, maintenance: { website: true }, supportSubjects: ["A", "B"] } }, adminCtx);
    expect(updated.brandName).toBe("New Brand");
    expect(updated.websiteHeaderLogoUrl).toBe("https://x/h.png");
    expect(updated.minDeliveryCost).toBe(49);
    expect(updated.maintenance.website).toBe(true);
  });
});

describe("integrations resolver", () => {
  it("masks secrets and updates only provided secret fields", async () => {
    await expect(integrationResolvers.Query.integrationSettings(null, null, custCtx)).rejects.toThrow();
    const initial = await integrationResolvers.Query.integrationSettings(null, null, adminCtx);
    expect(initial.smtpPassSet).toBe(false);
    expect(initial.smtpConfigured).toBe(false);

    const saved = await integrationResolvers.Mutation.updateIntegrationSettings(null, { input: { smtpHost: "smtp.x.com", smtpUser: "u@x.com", smtpPass: "secret", mailFrom: "no-reply@x.com", imagekitPrivateKey: "priv_x", imagekitUrlEndpoint: "https://ik.io/x" } }, adminCtx);
    expect(saved.smtpHost).toBe("smtp.x.com");
    expect(saved.smtpPassSet).toBe(true);
    expect(saved.smtpConfigured).toBe(true);
    expect(saved.imagekitPrivateKeySet).toBe(true);
    expect(saved.imagekitConfigured).toBe(true);
    expect((saved as Record<string, unknown>).smtpPass).toBeUndefined();

    // empty secret leaves the saved one intact
    const again = await integrationResolvers.Mutation.updateIntegrationSettings(null, { input: { smtpHost: "smtp2.x.com", smtpPass: "" } }, adminCtx);
    expect(again.smtpHost).toBe("smtp2.x.com");
    expect(again.smtpPassSet).toBe(true);
  });
});
