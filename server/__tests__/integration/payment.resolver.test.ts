import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/razorpay.js", () => ({
  createProviderOrder: vi.fn(async (amount: number) => ({ id: "rzp_order_1", amount: Math.round(amount * 100), currency: "INR" })),
  refundProviderPayment: vi.fn(async () => ({ id: "rfnd_1" })),
  verifyPaymentSignature: vi.fn(() => true),
  razorpayKeyId: vi.fn(() => "rzp_key"),
}));

import { paymentResolvers } from "../../src/graphql/resolvers/payment";
import { verifyPaymentSignature } from "../../src/utils/razorpay.js";
import { Order, Payment, Settings, SETTINGS_KEY, getOrCreateSettings } from "../../src/models/index.js";

useTestDb();

async function onlineOrder() {
  const user = await makeUser();
  await getOrCreateSettings();
  const order = await makeOrder(user.id, { paymentMethod: "ONLINE" });
  return { user, order, ctx: ctxFor(user.id, "CUSTOMER") };
}

describe("payment resolver", () => {
  it("createRazorpayOrder: guards + create + reuse existing", async () => {
    const { user, order, ctx } = await onlineOrder();
    await expect(paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: new Types.ObjectId().toString() }, ctx)).rejects.toThrow(/not found/i);
    await expect(paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctxFor("999999999999999999999999", "CUSTOMER"))).rejects.toThrow(/not allowed/i);

    const cod = await makeOrder(user.id, { paymentMethod: "COD" });
    await expect(paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: cod.id }, ctx)).rejects.toThrow(/not awaiting/i);

    const created = await paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx);
    expect(created.keyId).toBe("rzp_key");
    expect(created.razorpayOrderId).toBe("rzp_order_1");
    // second call reuses the CREATED payment
    const reused = await paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx);
    expect(reused.razorpayOrderId).toBe("rzp_order_1");
    expect(await Payment.countDocuments({ order: order._id })).toBe(1);
  });

  it("createRazorpayOrder fails when online disabled", async () => {
    const { order, ctx } = await onlineOrder();
    await Settings.findOneAndUpdate({ key: SETTINGS_KEY }, { onlineEnabled: false });
    await expect(paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx)).rejects.toThrow(/unavailable/i);
  });

  it("verifyRazorpayPayment: invalid signature then valid", async () => {
    const { order, ctx } = await onlineOrder();
    await paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx);
    const input = { orderId: order.id, razorpayOrderId: "rzp_order_1", razorpayPaymentId: "pay_1", razorpaySignature: "sig" };

    vi.mocked(verifyPaymentSignature).mockReturnValueOnce(false);
    await expect(paymentResolvers.Mutation.verifyRazorpayPayment(null, { input }, ctx)).rejects.toThrow(/verification failed/i);
    expect((await Order.findById(order.id))?.paymentStatus).toBe("FAILED");

    const ok = await paymentResolvers.Mutation.verifyRazorpayPayment(null, { input }, ctx);
    expect(ok.paymentStatus).toBe("PAID");
  });

  it("refundPayment: full refund + guards + payments query + field resolver", async () => {
    const { order, ctx } = await onlineOrder();
    await paymentResolvers.Mutation.createRazorpayOrder(null, { orderId: order.id }, ctx);
    await paymentResolvers.Mutation.verifyRazorpayPayment(null, { input: { orderId: order.id, razorpayOrderId: "rzp_order_1", razorpayPaymentId: "pay_1", razorpaySignature: "s" } }, ctx);
    const payment = await Payment.findOne({ order: order._id });
    const adminCtx = ctxFor("admin", "ADMIN");

    await expect(paymentResolvers.Mutation.refundPayment(null, { paymentId: new Types.ObjectId().toString() }, adminCtx)).rejects.toThrow(/not found/i);
    const refunded = await paymentResolvers.Mutation.refundPayment(null, { paymentId: payment!.id, reason: "test" }, adminCtx);
    expect(refunded.status).toBe("REFUNDED");
    expect((await Order.findById(order.id))?.paymentStatus).toBe("REFUNDED");
    await expect(paymentResolvers.Mutation.refundPayment(null, { paymentId: payment!.id }, adminCtx)).rejects.toThrow(/cannot be refunded/i);

    expect((await paymentResolvers.Query.payments(null, { status: "REFUNDED" }, adminCtx)).length).toBe(1);
    expect((await paymentResolvers.Payment.order({ order: order.id }))?.id).toBe(order.id);
    expect(paymentResolvers.Payment.order({ order: { orderNumber: "X" } })).toEqual({ orderNumber: "X" });
  });

  it("createManualPayment: guards + captured (marks order paid) + non-captured", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id, { paymentMethod: "COD" });
    const adminCtx = ctxFor("admin", "ADMIN");
    const M = paymentResolvers.Mutation;

    await expect(M.createManualPayment(null, { orderId: order.id, amount: 0 }, adminCtx)).rejects.toThrow(/greater than zero/i);
    await expect(M.createManualPayment(null, { orderId: new Types.ObjectId().toString(), amount: 100 }, adminCtx)).rejects.toThrow(/not found/i);

    // Captured (default status) records details and marks the order paid.
    const captured = await M.createManualPayment(
      null,
      { orderId: order.id, amount: 250, method: "Cash", reference: "RCPT-1", note: "Counter cash" },
      adminCtx
    );
    expect(captured.provider).toBe("MANUAL");
    expect(captured.status).toBe("CAPTURED");
    expect(captured.method).toBe("Cash");
    expect(captured.providerPaymentId).toBe("RCPT-1");
    expect((await Order.findById(order.id))?.paymentStatus).toBe("PAID");

    // Non-captured status, no optional details — order stays unpaid.
    const other = await makeOrder(user.id, { paymentMethod: "COD" });
    const pending = await M.createManualPayment(null, { orderId: other.id, amount: 150, status: "CREATED" }, adminCtx);
    expect(pending.status).toBe("CREATED");
    expect(pending.method).toBeUndefined();
    expect(pending.providerPaymentId).toBeUndefined();
    expect((await Order.findById(other.id))?.paymentStatus).not.toBe("PAID");
  });
});
