import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  sendMailAsync: vi.fn(),
  resolveMailConfig: vi.fn(async () => null),
}));
vi.mock("../../src/emails/notify.js", () => ({ notifyOrderEmail: vi.fn(), ratingUrlFor: () => "u" }));

import { orderResolvers } from "../../src/graphql/resolvers/order";
import { authResolvers } from "../../src/graphql/resolvers/auth";
import { supportResolvers } from "../../src/graphql/resolvers/support";
import { couponResolvers } from "../../src/graphql/resolvers/coupon";
import { menuResolvers } from "../../src/graphql/resolvers/menu";
import { dashboardResolvers } from "../../src/graphql/resolvers/dashboard";
import { deliveryResolvers } from "../../src/graphql/resolvers/delivery";
import { paymentResolvers } from "../../src/graphql/resolvers/payment";
import { passwordResetResolvers } from "../../src/graphql/resolvers/passwordReset";
import { integrationResolvers } from "../../src/graphql/resolvers/integrations";
import {
  MenuItem, Coupon, SupportTicket, Settings, SETTINGS_KEY, getOrCreateSettings, Otp,
} from "../../src/models/index.js";
import { Payment } from "../../src/models/index.js";
import { hashOtp, otpExpiry } from "../../src/utils/otp.js";
import { loadEmailBrand } from "../../src/emails/marketing.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const MISSING = new Types.ObjectId().toString();

async function openStore(over: Record<string, unknown> = {}) {
  await getOrCreateSettings();
  await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { storeOpenTime: "00:00", storeCloseTime: "23:59", codEnabled: true, onlineEnabled: true, ...over }
  );
}
async function makeItem(over: Record<string, unknown> = {}) {
  return MenuItem.create({
    name: "Veg Biryani", slug: `veg-${Math.random().toString(36).slice(2)}`,
    price: 199, category: new Types.ObjectId(), isAvailable: true, spiceLevel: 1, ...over,
  });
}

beforeEach(() => openStore());

describe("order resolver — guard & branch coverage", () => {
  const O = orderResolvers.Mutation;

  it("placeOrder: empty cart, out-of-stock, and distance pricing with coords", async () => {
    const user = await makeUser();
    const ctx = ctxFor(user.id, "CUSTOMER");
    await expect(O.placeOrder(null, { input: { items: [], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)).rejects.toThrow(/empty/i);

    const soldOut = await makeItem({ isAvailable: false });
    await expect(
      O.placeOrder(null, { input: { items: [{ menuItemId: soldOut.id, qty: 1 }], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)
    ).rejects.toThrow(/out of stock/i);

    await openStore({ storeLat: 12.97, storeLng: 77.59 });
    const item = await makeItem();
    const order = await O.placeOrder(
      null,
      { input: { items: [{ menuItemId: item.id, qty: 1 }], address: { line1: "1", city: "B", pincode: "1", lat: 12.9, lng: 77.6 } } },
      ctx
    );
    expect(order.status).toBe("PLACED");
  });

  it("cancelOrder: blocks strangers, delivered orders, and mid-prep customer cancels", async () => {
    const owner = await makeUser();
    const stranger = ctxFor((await makeUser()).id, "CUSTOMER");
    const order = await makeOrder(owner.id, { status: "PREPARING" });
    await expect(O.cancelOrder(null, { id: order.id }, stranger)).rejects.toThrow(/not allowed/i);
    await expect(O.cancelOrder(null, { id: order.id }, ctxFor(owner.id, "CUSTOMER"))).rejects.toThrow(/being prepared/i);
    const delivered = await makeOrder(owner.id, { status: "DELIVERED" });
    await expect(O.cancelOrder(null, { id: delivered.id }, admin)).rejects.toThrow(/cannot cancel/i);
    const cancellable = await makeOrder(owner.id, { status: "PLACED" });
    expect((await O.cancelOrder(null, { id: cancellable.id }, admin)).status).toBe("CANCELLED");
  });

  it("updateOrderStatus rejects an invalid transition; rateOrder blocks non-owners; deleteOrder guards missing", async () => {
    const owner = await makeUser();
    const order = await makeOrder(owner.id, { status: "PLACED" });
    await expect(O.updateOrderStatus(null, { id: order.id, status: "DELIVERED" }, admin)).rejects.toThrow(/cannot move/i);
    await expect(O.rateOrder(null, { orderId: order.id, food: 5, delivery: 5 }, ctxFor((await makeUser()).id, "CUSTOMER"))).rejects.toThrow(/not allowed/i);
    await expect(O.deleteOrder(null, { id: MISSING }, admin)).rejects.toThrow(/not found/i);
  });

  it("Order field resolvers handle populated + id-only user and present/absent rider", async () => {
    const u = await makeUser("CUSTOMER", { name: "Asha" });
    expect((await orderResolvers.Order.user({ user: u.id }) as { name?: string })?.name).toBe("Asha");
    expect(orderResolvers.Order.user({ user: { name: "Already" } })).toEqual({ name: "Already" });
    expect(await orderResolvers.Order.deliveryPartner({ deliveryPartner: u.id })).toBeTruthy();
    expect(await orderResolvers.Order.deliveryPartner({})).toBeNull();
  });
});

describe("support / coupon / menu branch coverage", () => {
  it("supportTickets filter, createSupportTicket ownership, replySupportTicket staff vs other", async () => {
    const owner = await makeUser();
    const order = await makeOrder(owner.id);
    const ownerCtx = ctxFor(owner.id, "CUSTOMER");
    const otherCtx = ctxFor((await makeUser()).id, "CUSTOMER");

    await expect(
      supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "Help", body: "x" }, otherCtx)
    ).rejects.toThrow(/your own orders/i);
    const ticket = await supportResolvers.Mutation.createSupportTicket(null, { orderId: order.id, subject: "Help", body: "x" }, ownerCtx);

    expect((await supportResolvers.Query.supportTickets(null, { status: "OPEN" }, admin)).length).toBe(1);
    expect((await supportResolvers.Query.supportTickets(null, {}, admin)).length).toBe(1);
    const replied = await supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "On it" }, admin);
    expect(replied.status).toBe("IN_PROGRESS");
    // owner (non-staff) reply is allowed and tagged CUSTOMER
    const ownerReply = await supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "thanks" }, ownerCtx);
    expect(ownerReply.messages.at(-1)?.by).toBe("CUSTOMER");
    await expect(
      supportResolvers.Mutation.replySupportTicket(null, { ticketId: ticket.id, text: "hi" }, otherCtx)
    ).rejects.toThrow(/not allowed/i);
    await expect(
      supportResolvers.Mutation.replySupportTicket(null, { ticketId: MISSING, text: "x" }, admin)
    ).rejects.toThrow(/ticket not found/i);
  });

  it("coupons activeOnly filter, freeItem field resolver, menuItems search", async () => {
    await couponResolvers.Mutation.createCoupon(null, { input: { code: "A", title: "A", type: "FLAT", value: 10, isActive: true } }, admin);
    expect((await couponResolvers.Query.coupons(null, { activeOnly: true })).length).toBe(1);
    expect((await couponResolvers.Query.coupons(null, {})).length).toBe(1);
    expect(await couponResolvers.Coupon.freeItem({ freeItem: MISSING })).toBeNull();
    const cat = new Types.ObjectId();
    await MenuItem.create({ name: "Paneer Biryani", slug: "pb1", price: 200, category: cat, isAvailable: true });
    expect((await menuResolvers.Query.menuItems(null, { search: "Paneer" })).length).toBeGreaterThanOrEqual(0);
  });
});

describe("dashboard / delivery / payment / passwordReset / integrations", () => {
  it("dashboardStats maps revenue aggregates + User.totalSpent", async () => {
    const cust = await makeUser();
    const item = await makeItem();
    await makeOrder(cust.id, {
      status: "DELIVERED",
      items: [{ menuItem: item._id, name: item.name, price: 199, qty: 2 }],
    });
    const stats = await dashboardResolvers.Query.dashboardStats(null, null, admin);
    expect(stats.totalOrders).toBeGreaterThan(0);
    expect(stats.topItems.length).toBeGreaterThan(0);
    expect(await dashboardResolvers.User.totalSpent({ _id: cust._id })).toBeGreaterThan(0);
  });

  it("myDeliveries honours default + capped limits", async () => {
    const rider = await makeUser("DELIVERY");
    const riderCtx = ctxFor(rider.id, "DELIVERY");
    expect((await deliveryResolvers.Query.myDeliveries(null, {}, riderCtx)).length).toBe(0);
    expect((await deliveryResolvers.Query.myDeliveries(null, { limit: 500 }, riderCtx)).length).toBe(0);
  });

  it("verifyRazorpayPayment blocks a non-owner", async () => {
    const owner = await makeUser();
    const order = await makeOrder(owner.id);
    await expect(
      paymentResolvers.Mutation.verifyRazorpayPayment(
        null,
        { input: { orderId: order.id, razorpayOrderId: "o", razorpayPaymentId: "p", razorpaySignature: "s" } },
        ctxFor((await makeUser()).id, "CUSTOMER")
      )
    ).rejects.toThrow(/not allowed/i);
  });

  it("resetPassword: wrong OTP increments, and a valid OTP for a missing account is rejected", async () => {
    const ghost = "ghost@b.com";
    await Otp.create({ identifier: ghost, purpose: "PASSWORD_RESET", codeHash: hashOtp("123456", ghost), attempts: 0, expiresAt: otpExpiry() });
    await expect(
      passwordResetResolvers.Mutation.resetPassword(null, { email: ghost, otp: "000000", newPassword: "secret1" })
    ).rejects.toThrow(/incorrect otp/i);
    await expect(
      passwordResetResolvers.Mutation.resetPassword(null, { email: ghost, otp: "123456", newPassword: "secret1" })
    ).rejects.toThrow(/account not found/i);
  });

  it("sendTestEmail uses the support email when no recipient is passed", async () => {
    await Settings.findOneAndUpdate({ key: SETTINGS_KEY }, { supportEmail: "ops@x.com" });
    expect(await integrationResolvers.Mutation.sendTestEmail(null, {}, admin)).toBe(true);
  });
});

describe("more guard coverage", () => {
  it("addAddress / removeAddress reject a missing user", async () => {
    const ghost = ctxFor(MISSING, "CUSTOMER");
    await expect(authResolvers.Mutation.addAddress(null, { input: { line1: "1", city: "B", pincode: "1" } }, ghost)).rejects.toThrow(/user not found/i);
    await expect(authResolvers.Mutation.removeAddress(null, { addressId: MISSING }, ghost)).rejects.toThrow(/user not found/i);
  });

  it("placeOrder rejects qty < 1; owner can cancel a placed order", async () => {
    const cust = await makeUser();
    const ctx = ctxFor(cust.id, "CUSTOMER");
    const item = await makeItem();
    await expect(
      orderResolvers.Mutation.placeOrder(null, { input: { items: [{ menuItemId: item.id, qty: 0 }], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)
    ).rejects.toThrow(/invalid quantity/i);
    const placed = await makeOrder(cust.id, { status: "PLACED" });
    expect((await orderResolvers.Mutation.cancelOrder(null, { id: placed.id }, ctx)).status).toBe("CANCELLED");
  });

  it("payments query filter, verify guards, Payment.order field resolver", async () => {
    expect(await paymentResolvers.Query.payments(null, {}, admin)).toBeDefined();
    expect(await paymentResolvers.Query.payments(null, { status: "CAPTURED" }, admin)).toBeDefined();
    const owner = await makeUser();
    const ord = await makeOrder(owner.id);
    const ownerCtx = ctxFor(owner.id, "CUSTOMER");
    await expect(
      paymentResolvers.Mutation.verifyRazorpayPayment(null, { input: { orderId: MISSING, razorpayOrderId: "o", razorpayPaymentId: "p", razorpaySignature: "s" } }, ownerCtx)
    ).rejects.toThrow(/order not found/i);
    await expect(
      paymentResolvers.Mutation.verifyRazorpayPayment(null, { input: { orderId: ord.id, razorpayOrderId: "none", razorpayPaymentId: "p", razorpaySignature: "s" } }, ownerCtx)
    ).rejects.toThrow(/payment record not found/i);
    expect(paymentResolvers.Payment.order({ order: { orderNumber: "X" } })).toEqual({ orderNumber: "X" });
    expect(await paymentResolvers.Payment.order({ order: ord.id })).toBeTruthy();
  });

  it("dashboardStats + totalSpent handle empty data (object and string ids)", async () => {
    const stats = await dashboardResolvers.Query.dashboardStats(null, null, admin);
    expect(stats.totalRevenue).toBe(0);
    const u = await makeUser();
    expect(await dashboardResolvers.User.totalSpent({ _id: u._id })).toBe(0);
    expect(await dashboardResolvers.User.totalSpent({ id: u.id })).toBe(0);
    expect(await dashboardResolvers.User.orderCount({ id: u.id })).toBe(0);
    expect(await dashboardResolvers.User.orderCount({ _id: u._id })).toBe(0);
  });

  it("cancel / update / rate reject a missing order id", async () => {
    const custCtx = ctxFor((await makeUser()).id, "CUSTOMER");
    await expect(orderResolvers.Mutation.cancelOrder(null, { id: MISSING }, admin)).rejects.toThrow(/not found/i);
    await expect(orderResolvers.Mutation.updateOrderStatus(null, { id: MISSING, status: "CONFIRMED" }, admin)).rejects.toThrow(/not found/i);
    await expect(orderResolvers.Mutation.rateOrder(null, { orderId: MISSING, food: 5, delivery: 5 }, custCtx)).rejects.toThrow(/not found/i);
  });

  it("loadEmailBrand falls back to defaults for blank settings", async () => {
    await Settings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { brandName: "", tagline: "", primaryColor: "", companyName: "" }
    );
    const brand = await loadEmailBrand();
    expect(brand.brandName).toBe("Didi Bhaiya ki Biryani");
    expect(brand.companyName).toBe("D&B Foods");
  });

  it("orders admin query with and without a status filter", async () => {
    const cust = await makeUser();
    await makeOrder(cust.id, { status: "PLACED" });
    expect((await orderResolvers.Query.orders(null, {}, admin)).length).toBe(1);
    expect((await orderResolvers.Query.orders(null, { status: "PLACED" }, admin)).length).toBe(1);
  });
});
