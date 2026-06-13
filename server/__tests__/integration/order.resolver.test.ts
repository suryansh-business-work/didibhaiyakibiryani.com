import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({
  sendMail: vi.fn(async () => true),
  sendMailAsync: vi.fn(),
}));
// Fire-and-forget order emails are covered in notify.resolver.test.ts; stub here
// so a previous test's background send can't race the next test's DB reset.
vi.mock("../../src/emails/notify.js", () => ({ notifyOrderEmail: vi.fn() }));

import { orderResolvers } from "../../src/graphql/resolvers/order";
import { MenuItem, Coupon, Settings, SETTINGS_KEY, getOrCreateSettings } from "../../src/models/index.js";

useTestDb();
const M = orderResolvers.Mutation;
const Q = orderResolvers.Query;

async function openStore() {
  await getOrCreateSettings();
  await Settings.findOneAndUpdate({ key: SETTINGS_KEY }, { storeOpenTime: "00:00", storeCloseTime: "23:59", codEnabled: true, onlineEnabled: true });
}
async function makeItem(over: Record<string, unknown> = {}) {
  return MenuItem.create({ name: "Veg Biryani", slug: `veg-${Math.random().toString(36).slice(2)}`, price: 199, category: new Types.ObjectId(), isAvailable: true, spiceLevel: 1, ...over });
}

beforeEach(openStore);

describe("order resolver — placeOrder", () => {
  it("places an order, computes totals, sends confirmation", async () => {
    const user = await makeUser();
    const item = await makeItem();
    const ctx = ctxFor(user.id, "CUSTOMER");
    const order = await M.placeOrder(null, { input: { items: [{ menuItemId: item.id, qty: 2 }], address: { line1: "1 St", city: "BLR", pincode: "560001" } } }, ctx);
    expect(order.subtotal).toBe(398);
    expect(order.total).toBeGreaterThanOrEqual(398);
    expect(order.status).toBe("PLACED");
  });

  it("rejects empty cart, unavailable items, out-of-stock", async () => {
    const user = await makeUser();
    const ctx = ctxFor(user.id, "CUSTOMER");
    await expect(M.placeOrder(null, { input: { items: [], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)).rejects.toThrow(/cart is empty/i);
    await expect(M.placeOrder(null, { input: { items: [{ menuItemId: new Types.ObjectId().toString(), qty: 1 }], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)).rejects.toThrow(/unavailable/i);
    const oos = await makeItem({ isAvailable: false });
    await expect(M.placeOrder(null, { input: { items: [{ menuItemId: oos.id, qty: 1 }], address: { line1: "1", city: "B", pincode: "1" } } }, ctx)).rejects.toThrow(/out of stock/i);
  });

  it("applies a valid coupon and a free-item coupon", async () => {
    const user = await makeUser();
    const ctx = ctxFor(user.id, "CUSTOMER");
    const item = await makeItem();
    await Coupon.create({ code: "FLAT50", title: "Flat 50", type: "FLAT", value: 50, minOrder: 100, isActive: true });
    const o1 = await M.placeOrder(null, { input: { items: [{ menuItemId: item.id, qty: 2 }], address: { line1: "1", city: "B", pincode: "1" }, couponCode: "flat50" } }, ctx);
    expect(o1.discount).toBe(50);
    expect(o1.couponCode).toBe("FLAT50");

    const freebie = await makeItem({ name: "Gulab Jamun" });
    await Coupon.create({ code: "FREESWEET", title: "Free sweet", type: "FREE_ITEM", freeItem: freebie._id, isActive: true });
    const o2 = await M.placeOrder(null, { input: { items: [{ menuItemId: item.id, qty: 1 }], address: { line1: "1", city: "B", pincode: "1" }, couponCode: "FREESWEET" } }, ctx);
    expect(o2.items.some((i) => i.name.includes("(Free)"))).toBe(true);

    await expect(M.placeOrder(null, { input: { items: [{ menuItemId: item.id, qty: 1 }], address: { line1: "1", city: "B", pincode: "1" }, couponCode: "NOPE" } }, ctx)).rejects.toThrow();
  });
});

describe("order resolver — queries / lifecycle", () => {
  it("myOrders / order (owner, staff, forbidden) / orders", async () => {
    const user = await makeUser();
    const other = await makeUser();
    const order = await makeOrder(user.id);
    const ownerCtx = ctxFor(user.id, "CUSTOMER");
    expect((await Q.myOrders(null, null, ownerCtx)).length).toBe(1);
    expect((await Q.order(null, { id: order.id }, ownerCtx)).id).toBe(order.id);
    expect((await Q.order(null, { id: order.id }, ctxFor("admin", "ADMIN"))).id).toBe(order.id);
    await expect(Q.order(null, { id: order.id }, ctxFor(other.id, "CUSTOMER"))).rejects.toThrow(/not allowed/i);
    await expect(Q.order(null, { id: new Types.ObjectId().toString() }, ownerCtx)).rejects.toThrow(/not found/i);
    expect((await Q.orders(null, { status: "PLACED" }, ctxFor("admin", "ADMIN"))).length).toBe(1);
  });

  it("cancelOrder rules", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id, { status: "PREPARING" });
    const ownerCtx = ctxFor(user.id, "CUSTOMER");
    await expect(M.cancelOrder(null, { id: order.id }, ownerCtx)).rejects.toThrow(/being prepared/i);
    const cancelled = await M.cancelOrder(null, { id: order.id }, ctxFor("admin", "ADMIN"));
    expect(cancelled.status).toBe("CANCELLED");
    await expect(M.cancelOrder(null, { id: order.id }, ctxFor("admin", "ADMIN"))).rejects.toThrow(/cannot cancel/i);
  });

  it("updateOrderStatus transitions + rider rules + delivered marks paid", async () => {
    const user = await makeUser();
    const rider = await makeUser("DELIVERY");
    const order = await makeOrder(user.id, { status: "PREPARING", deliveryPartner: rider._id });
    const riderCtx = ctxFor(rider.id, "DELIVERY");
    await expect(M.updateOrderStatus(null, { id: order.id, status: "CONFIRMED" }, riderCtx)).rejects.toThrow(/pickup and delivery/i);
    const out = await M.updateOrderStatus(null, { id: order.id, status: "OUT_FOR_DELIVERY" }, riderCtx);
    expect(out.status).toBe("OUT_FOR_DELIVERY");
    const delivered = await M.updateOrderStatus(null, { id: order.id, status: "DELIVERED" }, riderCtx);
    expect(delivered.paymentStatus).toBe("PAID");

    const order2 = await makeOrder(user.id, { status: "PLACED" });
    await expect(M.updateOrderStatus(null, { id: order2.id, status: "DELIVERED" }, ctxFor("admin", "ADMIN"))).rejects.toThrow(/Cannot move/i);
    const otherRider = await makeUser("DELIVERY");
    await expect(M.updateOrderStatus(null, { id: order2.id, status: "OUT_FOR_DELIVERY" }, ctxFor(otherRider.id, "DELIVERY"))).rejects.toThrow(/not assigned to you/i);
  });

  it("rateOrder (+ field resolvers)", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id, { status: "DELIVERED" });
    const rated = await M.rateOrder(null, { orderId: order.id, food: 5, delivery: 4, comment: "Great" }, ctxFor(user.id, "CUSTOMER"));
    expect(rated.rating?.food).toBe(5);
    await expect(M.rateOrder(null, { orderId: order.id, food: 5, delivery: 4 }, ctxFor("x", "CUSTOMER"))).rejects.toThrow(/not allowed/i);

    expect((await orderResolvers.Order.user({ user: user.id }))?.id).toBe(user.id);
    expect(orderResolvers.Order.user({ user: { name: "Pre" } })).toEqual({ name: "Pre" });
    expect(await orderResolvers.Order.deliveryPartner({ deliveryPartner: undefined })).toBeNull();
  });
});
