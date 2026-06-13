import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";
import { deliveryResolvers } from "../../src/graphql/resolvers/delivery";
import { dashboardResolvers } from "../../src/graphql/resolvers/dashboard";
import { Review, MenuItem } from "../../src/models/index.js";

useTestDb();
const adminCtx = ctxFor("admin1", "ADMIN");

describe("delivery resolver", () => {
  it("riders / queue / myDeliveries", async () => {
    const rider = await makeUser("DELIVERY");
    const cust = await makeUser("CUSTOMER");
    await makeOrder(cust.id, { status: "OUT_FOR_DELIVERY", deliveryPartner: rider._id });
    await makeOrder(cust.id, { status: "DELIVERED", deliveryPartner: rider._id });

    expect((await deliveryResolvers.Query.riders(null, null, adminCtx)).length).toBe(1);
    const riderCtx = ctxFor(rider.id, "DELIVERY");
    expect((await deliveryResolvers.Query.deliveryQueue(null, null, riderCtx)).length).toBe(1);
    expect((await deliveryResolvers.Query.myDeliveries(null, { limit: 10 }, riderCtx)).length).toBe(1);
  });

  it("assignDeliveryPartner validation + success", async () => {
    const rider = await makeUser("DELIVERY");
    const cust = await makeUser("CUSTOMER");
    const order = await makeOrder(cust.id);
    await expect(deliveryResolvers.Mutation.assignDeliveryPartner(null, { orderId: new Types.ObjectId().toString(), riderId: rider.id }, adminCtx)).rejects.toThrow(/order not found/i);
    await expect(deliveryResolvers.Mutation.assignDeliveryPartner(null, { orderId: order.id, riderId: cust.id }, adminCtx)).rejects.toThrow(/not a delivery partner/i);
    const assigned = await deliveryResolvers.Mutation.assignDeliveryPartner(null, { orderId: order.id, riderId: rider.id }, adminCtx);
    expect(String(assigned.deliveryPartner)).toBe(rider.id);
    const done = await makeOrder(cust.id, { status: "DELIVERED" });
    await expect(deliveryResolvers.Mutation.assignDeliveryPartner(null, { orderId: done.id, riderId: rider.id }, adminCtx)).rejects.toThrow(/delivered order/i);
  });

  it("createStaffUser validation + success", async () => {
    await expect(deliveryResolvers.Mutation.createStaffUser(null, { name: "X", email: "x@b.com", password: "secret1", role: "CUSTOMER" }, adminCtx)).rejects.toThrow(/STAFF or DELIVERY/i);
    await expect(deliveryResolvers.Mutation.createStaffUser(null, { name: "X", email: "x@b.com", password: "123", role: "DELIVERY" }, adminCtx)).rejects.toThrow(/6 characters/i);
    const u = await deliveryResolvers.Mutation.createStaffUser(null, { name: "Rider", email: "Rider@B.com", phone: "9", password: "secret1", role: "DELIVERY" }, adminCtx);
    expect(u.email).toBe("rider@b.com");
    await expect(deliveryResolvers.Mutation.createStaffUser(null, { name: "Y", email: "rider@b.com", password: "secret1", role: "STAFF" }, adminCtx)).rejects.toThrow(/already exists/i);
  });
});

describe("dashboard resolver", () => {
  it("reviews / customers (+search) / stats / field resolvers", async () => {
    const cust = await makeUser("CUSTOMER", { name: "Asha", phone: "999" });
    await makeOrder(cust.id, { status: "DELIVERED" });
    await makeOrder(cust.id, { status: "PLACED" });
    await Review.create({ authorName: "Asha", text: "Great", rating: 5, isPublished: true });

    expect((await dashboardResolvers.Query.reviews(null, {})).length).toBe(1);
    expect((await dashboardResolvers.Query.customers(null, {}, adminCtx)).length).toBe(1);
    expect((await dashboardResolvers.Query.customers(null, { search: "Asha" }, adminCtx)).length).toBe(1);

    const stats = await dashboardResolvers.Query.dashboardStats(null, null, adminCtx);
    expect(stats.totalOrders).toBe(2);
    expect(stats.totalCustomers).toBe(1);
    expect(stats.topItems.length).toBeGreaterThan(0);
    expect(Array.isArray(stats.revenueByDay)).toBe(true);
    expect(stats.recentOrders.length).toBe(2);

    expect(await dashboardResolvers.User.orderCount({ id: cust.id })).toBe(2);
    expect(await dashboardResolvers.User.totalSpent({ _id: cust._id })).toBeGreaterThan(0);
    expect(await dashboardResolvers.User.totalSpent({ id: cust.id })).toBeGreaterThanOrEqual(0);

    const item = await MenuItem.create({ name: "I", slug: "i-x", price: 10, category: new Types.ObjectId() });
    expect((await dashboardResolvers.TopItem.menuItem({ menuItemId: item.id }))?.id).toBe(item.id);
    expect(await dashboardResolvers.TopItem.menuItem({ menuItemId: undefined })).toBeNull();
    expect((await dashboardResolvers.OrderItem.menuItem({ menuItem: item.id }))?.id).toBe(item.id);
    expect(await dashboardResolvers.OrderItem.menuItem({ menuItem: undefined })).toBeNull();
  });
});
