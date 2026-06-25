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
import { Order, MenuItem, Coupon, Settings, SETTINGS_KEY, getOrCreateSettings } from "../../src/models/index.js";

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

    // Admin/staff can override the flow (e.g. fix an accidental delivery).
    const order2 = await makeOrder(user.id, { status: "PLACED" });
    const jumped = await M.updateOrderStatus(null, { id: order2.id, status: "DELIVERED" }, ctxFor("admin", "ADMIN"));
    expect(jumped.status).toBe("DELIVERED");
    const reverted = await M.updateOrderStatus(null, { id: order2.id, status: "OUT_FOR_DELIVERY" }, ctxFor("admin", "ADMIN"));
    expect(reverted.status).toBe("OUT_FOR_DELIVERY");

    // A rider still can't skip the forward flow (NEXT enforced).
    const rider2 = await makeUser("DELIVERY");
    const order3 = await makeOrder(user.id, { status: "PREPARING", deliveryPartner: rider2._id });
    await expect(M.updateOrderStatus(null, { id: order3.id, status: "DELIVERED" }, ctxFor(rider2.id, "DELIVERY"))).rejects.toThrow(/Cannot move/i);

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

describe("order resolver — createManualOrder (POS)", () => {
  const admin = ctxFor("admin", "ADMIN");

  it("creates a walk-in takeaway order (no account, no address)", async () => {
    const item = await makeItem();
    const order = await M.createManualOrder(
      null,
      {
        input: {
          orderType: "TAKEAWAY",
          customerName: "Ravi Kumar",
          customerPhone: "9812345670",
          items: [{ menuItemId: item.id, qty: 2 }],
          surveyUrl: "  https://forms.gle/abc  ",
          notes: "  extra raita  ",
        },
      },
      admin
    );
    expect(order.source).toBe("POS");
    expect(order.orderType).toBe("TAKEAWAY");
    expect(order.user).toBeUndefined();
    expect(order.address).toBeUndefined();
    expect(order.customerName).toBe("Ravi Kumar");
    expect(order.deliveryFee).toBe(0);
    expect(order.subtotal).toBe(398);
    expect(order.total).toBe(398);
    expect(order.status).toBe("PLACED");
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.surveyUrl).toBe("https://forms.gle/abc");
    expect(order.notes).toBe("extra raita");
  });

  it("bills a complimentary line at zero (price kept), snapshots making cost, caps at one per order", async () => {
    const item = await makeItem({ makingCost: 60 });
    const order = await M.createManualOrder(
      null,
      {
        input: {
          orderType: "TAKEAWAY",
          customerName: "Walk-in",
          items: [
            { menuItemId: item.id, qty: 1 },
            { name: "Gulab Jamun", price: 80, qty: 1, complimentary: true },
          ],
        },
      },
      admin
    );
    // The complimentary line adds ₹0 to the bill but keeps its price for reporting.
    expect(order.subtotal).toBe(199);
    expect(order.total).toBe(199);
    expect(order.items.find((i) => i.complimentary)?.price).toBe(80);
    expect(order.items[0]?.makingCost).toBe(60);

    await expect(
      M.createManualOrder(
        null,
        {
          input: {
            orderType: "TAKEAWAY",
            customerName: "Walk-in",
            items: [
              { name: "A", price: 10, qty: 1, complimentary: true },
              { name: "B", price: 20, qty: 1, complimentary: true },
            ],
          },
        },
        admin
      )
    ).rejects.toThrow(/one complimentary/i);
  });

  it("creates a back-dated delivered order for an existing customer (marks PAID, snapshots name)", async () => {
    const user = await makeUser("CUSTOMER", { name: "Asha", phone: "9000000001" });
    const item = await makeItem();
    const placed = new Date("2026-05-01T10:00:00Z");
    const order = await M.createManualOrder(
      null,
      {
        input: {
          orderType: "DELIVERY",
          userId: user.id,
          items: [{ menuItemId: item.id, qty: 1, spiceLevel: 3 }],
          address: { line1: "5 Park Rd", city: "Bengaluru", pincode: "560002" },
          deliveryFee: 40,
          discount: 25,
          status: "DELIVERED",
          placedAt: placed.toISOString(),
        },
      },
      ctxFor("staff", "STAFF")
    );
    expect(order.user?.toString()).toBe(user.id);
    expect(order.customerName).toBe("Asha");
    expect(order.customerPhone).toBe("9000000001");
    expect(order.paymentStatus).toBe("PAID");
    expect(order.deliveryFee).toBe(40);
    expect(order.discount).toBe(25);
    expect(order.total).toBe(199 - 25 + 40);
    expect(order.placedAt.getTime()).toBe(placed.getTime());
    expect(order.statusHistory[0]?.status).toBe("DELIVERED");
    expect(order.items[0]?.spiceLevel).toBe(3);
  });

  it("supports custom off-menu line items and clamps discount to subtotal", async () => {
    const order = await M.createManualOrder(
      null,
      {
        input: {
          orderType: "TAKEAWAY",
          customerName: "Walk-in",
          items: [
            { name: "Special Platter", price: 450, qty: 1, spiceLevel: 2 },
            { name: "Raita", price: 40, qty: 1 },
          ],
          discount: 999,
          paymentStatus: "PAID",
        },
      },
      admin
    );
    expect(order.items[0]?.name).toBe("Special Platter");
    expect(order.items[0]?.price).toBe(450);
    expect(order.items[0]?.spiceLevel).toBe(2);
    expect(order.items[1]?.spiceLevel).toBe(0);
    expect(order.subtotal).toBe(490);
    expect(order.discount).toBe(490);
    expect(order.total).toBe(0);
    expect(order.paymentStatus).toBe("PAID");
  });

  it("clamps negative / non-finite money to zero", async () => {
    const item = await makeItem();
    const order = await M.createManualOrder(
      null,
      {
        input: {
          orderType: "DELIVERY",
          customerName: "X",
          items: [{ menuItemId: item.id, qty: 1 }],
          address: { line1: "1", city: "B", pincode: "1" },
          deliveryFee: Number.POSITIVE_INFINITY,
          discount: -5,
        },
      },
      admin
    );
    expect(order.deliveryFee).toBe(0);
    expect(order.discount).toBe(0);
  });

  it("rejects invalid inputs", async () => {
    const item = await makeItem();
    const I = (over: Record<string, unknown>) => ({
      input: { orderType: "TAKEAWAY", customerName: "X", items: [{ menuItemId: item.id, qty: 1 }], ...over },
    });
    await expect(M.createManualOrder(null, I({ items: [] }), admin)).rejects.toThrow(/at least one item/i);
    await expect(M.createManualOrder(null, I({ orderType: "DELIVERY" }), admin)).rejects.toThrow(/need an address/i);
    await expect(M.createManualOrder(null, I({ customerName: undefined }), admin)).rejects.toThrow(/customer name/i);
    await expect(M.createManualOrder(null, I({ items: [{ menuItemId: item.id, qty: 0 }] }), admin)).rejects.toThrow(/quantity/i);
    await expect(M.createManualOrder(null, I({ items: [{ menuItemId: item.id, qty: 1.5 }] }), admin)).rejects.toThrow(/quantity/i);
    await expect(
      M.createManualOrder(null, I({ items: [{ menuItemId: new Types.ObjectId().toString(), qty: 1 }] }), admin)
    ).rejects.toThrow(/no longer exists/i);
    await expect(M.createManualOrder(null, I({ items: [{ price: 100, qty: 1 }] }), admin)).rejects.toThrow(/need a name/i);
    await expect(M.createManualOrder(null, I({ items: [{ name: "Y", qty: 1 }] }), admin)).rejects.toThrow(/valid price/i);
    await expect(M.createManualOrder(null, I({ items: [{ name: "Z", price: -5, qty: 1 }] }), admin)).rejects.toThrow(/valid price/i);
    await expect(
      M.createManualOrder(null, I({ userId: new Types.ObjectId().toString(), customerName: undefined }), admin)
    ).rejects.toThrow(/customer not found/i);
    await expect(M.createManualOrder(null, I({ placedAt: "not-a-date" }), admin)).rejects.toThrow(/invalid order date/i);
    await expect(M.createManualOrder(null, I({}), ctxFor("cust", "CUSTOMER"))).rejects.toThrow();
  });

  it("updateManualOrder edits items/total and appends a status change", async () => {
    const item = await makeItem();
    const order = await M.createManualOrder(
      null,
      { input: { orderType: "TAKEAWAY", customerName: "Ravi", items: [{ menuItemId: item.id, qty: 1 }], status: "PLACED" } },
      admin
    );
    const historyLen = order.statusHistory.length;
    const updated = await M.updateManualOrder(
      null,
      {
        id: order.id,
        input: {
          orderType: "TAKEAWAY",
          customerName: "Ravi Kumar",
          items: [{ name: "Special", price: 250, qty: 2 }],
          status: "DELIVERED",
        },
      },
      admin
    );
    expect(updated.customerName).toBe("Ravi Kumar");
    expect(updated.subtotal).toBe(500);
    expect(updated.total).toBe(500);
    expect(updated.status).toBe("DELIVERED");
    expect(updated.statusHistory.length).toBe(historyLen + 1);

    // No status change → history unchanged
    const again = await M.updateManualOrder(
      null,
      { id: order.id, input: { orderType: "TAKEAWAY", customerName: "Ravi Kumar", items: [{ name: "Special", price: 250, qty: 2 }], status: "DELIVERED" } },
      admin
    );
    expect(again.statusHistory.length).toBe(historyLen + 1);

    await expect(
      M.updateManualOrder(null, { id: new Types.ObjectId().toString(), input: { orderType: "TAKEAWAY", customerName: "X", items: [{ menuItemId: item.id, qty: 1 }] } }, admin)
    ).rejects.toThrow(/not found/i);
  });

  it("invoicePdf returns a base64 PDF (admin/staff only)", async () => {
    const user = await makeUser();
    const order = await makeOrder(user.id, { surveyUrl: "https://forms.gle/xyz" });
    const b64 = await Q.invoicePdf(null, { orderId: order.id }, admin);
    expect(Buffer.from(b64, "base64").subarray(0, 5).toString("utf8")).toBe("%PDF-");
    await expect(Q.invoicePdf(null, { orderId: new Types.ObjectId().toString() }, admin)).rejects.toThrow(/not found/i);
    await expect(Q.invoicePdf(null, { orderId: order.id }, ctxFor("cust", "CUSTOMER"))).rejects.toThrow();
  });

  it("Order.user resolver returns null for walk-in orders", async () => {
    expect(await orderResolvers.Order.user({ user: undefined })).toBeNull();
  });
});

describe("order resolver — survey (public, token-gated)", () => {
  it("surveyOrder returns order details for a valid token", async () => {
    const user = await makeUser("CUSTOMER", { name: "Asha" });
    const order = await makeOrder(user.id, { status: "DELIVERED" });
    const s = await Q.surveyOrder(null, { orderId: order.id, token: order.ratingToken });
    expect(s.orderNumber).toBe(order.orderNumber);
    expect(s.customerName).toBe("Asha");
    expect(s.canRate).toBe(true);
    expect(s.alreadyRated).toBe(false);
    expect(s.items.length).toBeGreaterThan(0);
  });

  it("uses the walk-in snapshot name and reflects a submitted rating", async () => {
    const item = await makeItem();
    const order = await M.createManualOrder(
      null,
      { input: { orderType: "TAKEAWAY", customerName: "Ravi", items: [{ menuItemId: item.id, qty: 1 }], status: "DELIVERED" } },
      ctxFor("admin", "ADMIN")
    );
    expect(
      await M.submitOrderSurvey(null, {
        orderId: order.id,
        token: order.ratingToken,
        itemRatings: [{ name: "Veg Biryani", rating: 5 }],
        delivery: 4,
        comment: "Great",
      })
    ).toBe(true);
    const s = await Q.surveyOrder(null, { orderId: order.id, token: order.ratingToken });
    expect(s.customerName).toBe("Ravi");
    expect(s.alreadyRated).toBe(true);
    expect(s.canRate).toBe(false);
    expect(s.rating?.food).toBe(5);
    expect(s.rating?.items?.[0]?.rating).toBe(5);
  });

  it("returns no name for orders with no / deleted customer", async () => {
    const noUser = await Order.create({
      orderNumber: `DDB-NU${Math.random().toString(36).slice(2, 7)}`,
      items: [{ name: "X", price: 10, qty: 1 }],
      subtotal: 10,
      total: 10,
      address: { line1: "1", city: "B", pincode: "1" },
    });
    expect((await Q.surveyOrder(null, { orderId: noUser.id, token: noUser.ratingToken })).customerName).toBeNull();
    const ghost = await makeOrder(new Types.ObjectId().toString());
    expect((await Q.surveyOrder(null, { orderId: ghost.id, token: ghost.ratingToken })).customerName).toBeNull();
  });

  it("rejects a bad id, wrong token and empty token", async () => {
    const order = await makeOrder((await makeUser()).id);
    await expect(Q.surveyOrder(null, { orderId: "not-an-id", token: "x" })).rejects.toThrow(/invalid/i);
    await expect(Q.surveyOrder(null, { orderId: order.id, token: "wrong" })).rejects.toThrow(/invalid/i);
    await expect(Q.surveyOrder(null, { orderId: order.id, token: "" })).rejects.toThrow(/invalid/i);
    await expect(Q.surveyOrder(null, { orderId: new Types.ObjectId().toString(), token: "x" })).rejects.toThrow(/invalid/i);
  });

  it("submitOrderSurvey saves per-item ratings once and guards bad input", async () => {
    const user = await makeUser();
    const delivered = await makeOrder(user.id, { status: "DELIVERED" });
    const items = [{ name: "Veg Biryani", rating: 4 }];
    expect(await M.submitOrderSurvey(null, { orderId: delivered.id, token: delivered.ratingToken, itemRatings: items, delivery: 5 })).toBe(true);
    await expect(
      M.submitOrderSurvey(null, { orderId: delivered.id, token: delivered.ratingToken, itemRatings: items, delivery: 5 })
    ).rejects.toThrow(/already been rated/i);

    const placed = await makeOrder(user.id, { status: "PLACED" });
    await expect(M.submitOrderSurvey(null, { orderId: placed.id, token: placed.ratingToken, itemRatings: items, delivery: 5 })).rejects.toThrow(/delivered/i);
    await expect(M.submitOrderSurvey(null, { orderId: placed.id, token: "wrong", itemRatings: items, delivery: 5 })).rejects.toThrow(/invalid/i);

    const fresh = await makeOrder(user.id, { status: "DELIVERED" });
    await expect(M.submitOrderSurvey(null, { orderId: fresh.id, token: fresh.ratingToken, itemRatings: [], delivery: 5 })).rejects.toThrow(/at least one item/i);
    await expect(
      M.submitOrderSurvey(null, { orderId: fresh.id, token: fresh.ratingToken, itemRatings: [{ name: "X", rating: 9 }], delivery: 5 })
    ).rejects.toThrow(/between 1 and 5/i);
  });
});
