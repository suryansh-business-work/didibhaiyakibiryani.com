import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "node:crypto";
import {
  razorpayKeyId,
  razorpayConfigured,
  createProviderOrder,
  refundProviderPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../../src/utils/razorpay";

const KEYS = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe("razorpay config + signatures", () => {
  it("keyId / configured reflect env", () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(razorpayKeyId()).toBe("");
    expect(razorpayConfigured()).toBe(false);
    process.env.RAZORPAY_KEY_ID = "key";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    expect(razorpayConfigured()).toBe(true);
  });

  it("verifyPaymentSignature validates the HMAC", () => {
    const secret = "secret";
    const sig = crypto.createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_1", razorpaySignature: sig, secret })).toBe(true);
    expect(verifyPaymentSignature({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_1", razorpaySignature: "deadbeef", secret })).toBe(false);
    expect(verifyPaymentSignature({ razorpayOrderId: "o", razorpayPaymentId: "p", razorpaySignature: "", secret })).toBe(false);
    expect(verifyPaymentSignature({ razorpayOrderId: "o", razorpayPaymentId: "p", razorpaySignature: sig, secret: "" })).toBe(false);
  });

  it("verifyWebhookSignature validates the raw-body HMAC", () => {
    const secret = "whsec";
    const body = '{"event":"payment.captured"}';
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body, "bad", secret)).toBe(false);
    expect(verifyWebhookSignature(body, "", secret)).toBe(false);
    expect(verifyWebhookSignature(body, sig, "")).toBe(false);
  });
});

describe("razorpay API calls", () => {
  it("createProviderOrder throws when unconfigured, posts when configured", async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    await expect(createProviderOrder(100, "r1")).rejects.toThrow(/not configured/i);

    process.env.RAZORPAY_KEY_ID = "key";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "order_x", amount: 10000, currency: "INR", status: "created" }), { status: 200 })
    );
    const order = await createProviderOrder(100, "r1");
    expect(order.id).toBe("order_x");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body)).amount).toBe(10000);
  });

  it("refundProviderPayment posts (full + partial) and surfaces API errors", async () => {
    process.env.RAZORPAY_KEY_ID = "key";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response(JSON.stringify({ id: "rfnd_x", amount: 5000, status: "processed" }), { status: 200 })
    );
    expect((await refundProviderPayment("pay_1")).id).toBe("rfnd_x");
    expect((await refundProviderPayment("pay_1", 50)).id).toBe("rfnd_x");

    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ error: { description: "boom" } }), { status: 400 }));
    await expect(refundProviderPayment("pay_1")).rejects.toThrow(/boom/i);
  });
});
