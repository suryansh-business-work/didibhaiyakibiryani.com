import { describe, it, expect, vi } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";

// Captcha internals are covered by captcha.test.ts — here we only need the
// resolver's accept/reject branches, so stub verifyCaptcha deterministically.
vi.mock("../../src/utils/captcha.js", () => ({
  verifyCaptcha: vi.fn(async (id: string) => id === "good"),
}));
vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  sendMailAsync: vi.fn(),
}));

import { partyResolvers } from "../../src/graphql/resolvers/party";
import { PartyOrder, Settings, SETTINGS_KEY } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("a1", "ADMIN");
const customer = ctxFor("c1", "CUSTOMER");
const Q = partyResolvers.Query;
const M = partyResolvers.Mutation;

const goodCaptcha = { captchaId: "good", captchaAnswer: "5" };
const fullInput = {
  name: "Asha",
  phone: "9876543210",
  email: "Asha@Example.com",
  eventDate: "2026-08-01",
  guests: 40,
  location: "Indiranagar",
  message: "Veg only please",
};

describe("party order resolver", () => {
  it("rejects a wrong/expired captcha and saves nothing", async () => {
    await expect(
      M.submitPartyOrder(null, { input: fullInput, captchaId: "bad", captchaAnswer: "x" })
    ).rejects.toThrow(/captcha/i);
    expect(await PartyOrder.countDocuments()).toBe(0);
  });

  it("rejects blank required fields (after trim)", async () => {
    await expect(
      M.submitPartyOrder(null, { input: { ...fullInput, name: "   " }, ...goodCaptcha })
    ).rejects.toThrow(/required/i);
  });

  it("rejects an invalid email address", async () => {
    await expect(
      M.submitPartyOrder(null, { input: { ...fullInput, email: "nope" }, ...goodCaptcha })
    ).rejects.toThrow(/valid email/i);
  });

  it("creates a full enquiry and emails the admin inbox + customer", async () => {
    await Settings.findOneAndUpdate({ key: SETTINGS_KEY }, { supportEmail: "ops@ddb.com" }, { upsert: true });
    expect(await M.submitPartyOrder(null, { input: fullInput, ...goodCaptcha })).toBe(true);
    const saved = await PartyOrder.findOne({ email: "asha@example.com" }).lean();
    expect(saved?.guests).toBe(40);
    expect(saved?.status).toBe("NEW");
  });

  it("creates a minimal enquiry when no admin inbox is configured", async () => {
    expect(
      await M.submitPartyOrder(null, {
        input: { name: "Bo", phone: "9000000000", email: "bo@x.com" },
        ...goodCaptcha,
      })
    ).toBe(true);
    expect(await PartyOrder.countDocuments()).toBe(1);
  });

  it("lists for staff with an optional status filter and blocks customers", async () => {
    await PartyOrder.create({ name: "X", phone: "1", email: "x@x.com" });
    await expect(Q.partyOrders(null, {}, customer)).rejects.toThrow();
    expect((await Q.partyOrders(null, {}, admin)).length).toBe(1);
    expect((await Q.partyOrders(null, { status: "NEW" }, admin)).length).toBe(1);
    expect((await Q.partyOrders(null, { status: "CLOSED" }, admin)).length).toBe(0);
  });

  it("updates status; blocks customers and unknown ids", async () => {
    const p = await PartyOrder.create({ name: "X", phone: "1", email: "x@x.com" });
    expect((await M.updatePartyOrderStatus(null, { id: p.id, status: "CONTACTED" }, admin)).status).toBe(
      "CONTACTED"
    );
    await expect(
      M.updatePartyOrderStatus(null, { id: p.id, status: "CLOSED" }, customer)
    ).rejects.toThrow();
    await expect(
      M.updatePartyOrderStatus(null, { id: "651111111111111111111111", status: "CLOSED" }, admin)
    ).rejects.toThrow(/not found/i);
  });
});
