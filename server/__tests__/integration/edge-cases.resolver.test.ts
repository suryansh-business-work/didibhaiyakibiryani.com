import { describe, it, expect, vi } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => false), // SMTP not configured
  sendMailAsync: vi.fn(),
}));
vi.mock("../../src/utils/imagekit.js", () => ({
  imagekitConfigured: vi.fn(async () => true),
  uploadToImageKit: vi.fn(async () => {
    throw new Error("ImageKit exploded");
  }),
}));
vi.mock("../../src/utils/razorpay.js", () => ({
  createProviderOrder: vi.fn(async (amt: number) => ({ id: "ord_p", amount: Math.round(amt * 100), currency: "INR" })),
  refundProviderPayment: vi.fn(async () => ({ id: "rfnd_p" })),
  verifyPaymentSignature: vi.fn(() => true),
  razorpayKeyId: vi.fn(() => "key"),
}));

import { passwordResetResolvers } from "../../src/graphql/resolvers/passwordReset";
import { uploadResolvers } from "../../src/graphql/resolvers/upload";
import { paymentResolvers } from "../../src/graphql/resolvers/payment";
import { getOrCreateSettings, Payment } from "../../src/models/index.js";

useTestDb();

describe("edge cases", () => {
  it("requestPasswordReset throws when SMTP send fails", async () => {
    await makeUser("CUSTOMER", { email: "noreset@b.com" });
    await expect(passwordResetResolvers.Mutation.requestPasswordReset(null, { email: "noreset@b.com" })).rejects.toThrow(/could not send/i);
  });

  it("uploadImage surfaces an ImageKit failure", async () => {
    await expect(uploadResolvers.Mutation.uploadImage(null, { file: "AAAA", fileName: "x.png" }, ctxFor("a", "ADMIN"))).rejects.toThrow(/exploded/i);
  });

  it("refundPayment supports a partial refund", async () => {
    await getOrCreateSettings();
    const user = await makeUser();
    const ctx = ctxFor(user.id, "CUSTOMER");
    const order = await makeOrder(user.id, { paymentMethod: "ONLINE", total: 437 });
    await paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx);
    await paymentResolvers.Mutation.verifyRazorpayPayment(null, { input: { orderId: order.id, razorpayOrderId: "ord_p", razorpayPaymentId: "pay_p", razorpaySignature: "s" } }, ctx);
    const payment = await Payment.findOne({ order: order._id });

    const refunded = await paymentResolvers.Mutation.refundPayment(null, { paymentId: payment!.id, amount: 100 }, ctxFor("admin", "ADMIN"));
    expect(refunded.status).toBe("PARTIALLY_REFUNDED");
    // over-refund is rejected
    await expect(paymentResolvers.Mutation.refundPayment(null, { paymentId: payment!.id, amount: 9999 }, ctxFor("admin", "ADMIN"))).rejects.toThrow(/refundable/i);
  });
});
