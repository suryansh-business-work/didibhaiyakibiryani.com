import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import crypto from "node:crypto";

vi.mock("../../src/models/index.js", async (orig) => ({
  ...(await orig<typeof import("../../src/models/index.js")>()),
  getOrCreateSettings: vi.fn().mockRejectedValue(new Error("db down")),
}));

import {
  createProviderOrder,
  refundProviderPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../../src/utils/razorpay";
import { loadEmailBrand } from "../../src/emails/marketing";
import { resolveMailConfig } from "../../src/utils/mailer";

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("razorpay provider", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "key";
    process.env.RAZORPAY_KEY_SECRET = "secret";
  });

  it("creates an order, refunds (full + partial) and surfaces API errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "order_1", amount: 10000, currency: "INR", status: "created" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "rfnd_1", amount: 5000, status: "processed" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "rfnd_2", amount: 10000, status: "processed" }) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: { description: "Bad request" } }) });
    vi.stubGlobal("fetch", fetchMock);

    expect((await createProviderOrder(100, "rcpt")).id).toBe("order_1");
    expect((await refundProviderPayment("pay_1", 50)).id).toBe("rfnd_1");
    expect((await refundProviderPayment("pay_1")).id).toBe("rfnd_2");
    await expect(createProviderOrder(100, "x")).rejects.toThrow(/bad request/i);
  });

  it("throws when not configured", async () => {
    process.env.RAZORPAY_KEY_ID = "";
    process.env.RAZORPAY_KEY_SECRET = "";
    await expect(createProviderOrder(100, "r")).rejects.toThrow(/not configured/i);
  });

  it("verifies payment + webhook signatures", () => {
    const sig = crypto.createHmac("sha256", "secret").update("o1|p1").digest("hex");
    expect(verifyPaymentSignature({ razorpayOrderId: "o1", razorpayPaymentId: "p1", razorpaySignature: sig, secret: "secret" })).toBe(true);
    expect(verifyPaymentSignature({ razorpayOrderId: "o1", razorpayPaymentId: "p1", razorpaySignature: "bad", secret: "secret" })).toBe(false);
    expect(verifyPaymentSignature({ razorpayOrderId: "o1", razorpayPaymentId: "p1", razorpaySignature: "" })).toBe(false);
    const wsig = crypto.createHmac("sha256", "whsec").update("body").digest("hex");
    expect(verifyWebhookSignature("body", wsig, "whsec")).toBe(true);
    expect(verifyWebhookSignature("body", "", "whsec")).toBe(false);
  });
});

describe("email/mailer config fallbacks", () => {
  it("loadEmailBrand falls back to defaults when settings can't be read", async () => {
    const brand = await loadEmailBrand();
    expect(brand.brandName).toBeTruthy();
  });

  it("resolveMailConfig returns null with no SMTP env and no DB", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(await resolveMailConfig()).toBeNull();
  });
});
