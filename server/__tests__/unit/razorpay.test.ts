import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  razorpayConfigured,
} from "../../src/utils/razorpay";

const SECRET = "test_secret_key";

function sign(payload: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("verifyPaymentSignature", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  it("accepts a correctly signed order|payment pair", () => {
    const signature = sign(`${orderId}|${paymentId}`);
    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        secret: SECRET,
      })
    ).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    const signature = sign(`${orderId}|${paymentId}`, "attacker_secret");
    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        secret: SECRET,
      })
    ).toBe(false);
  });

  it("rejects a signature for a different payment", () => {
    const signature = sign(`${orderId}|pay_OTHER`);
    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        secret: SECRET,
      })
    ).toBe(false);
  });

  it("rejects empty signatures and empty secrets", () => {
    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "",
        secret: SECRET,
      })
    ).toBe(false);
    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sign(`${orderId}|${paymentId}`),
        secret: "",
      })
    ).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts the correct HMAC over the raw body", () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
    expect(verifyWebhookSignature(Buffer.from(body), sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = body.replace("captured", "failed");
    expect(verifyWebhookSignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it("rejects when the secret is missing", () => {
    expect(verifyWebhookSignature(body, sign(body), "")).toBe(false);
  });
});

describe("razorpayConfigured", () => {
  it("is false when env keys are absent", () => {
    expect(razorpayConfigured()).toBe(false);
  });
});
