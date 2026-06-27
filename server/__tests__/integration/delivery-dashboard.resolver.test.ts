import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";
import { deliveryResolvers } from "../../src/graphql/resolvers/delivery";
import { dashboardResolvers } from "../../src/graphql/resolvers/dashboard";
import { Review, MenuItem, User, Lead, Expense, ExpenseProduct, ExpenseSource } from "../../src/models/index.js";

useTestDb();
const adminCtx = ctxFor("admin1", "ADMIN");

describe("delivery resolver", () => {
  it("riders / queue / myDeliveries", async () => {
    const rider = await makeUser("DELIVERY");
    const cust = await makeUser("CUSTOMER");
    // A freshly-assigned PLACED order must already be in the rider's queue.
    await makeOrder(cust.id, { status: "PLACED", deliveryPartner: rider._id });
    await makeOrder(cust.id, { status: "OUT_FOR_DELIVERY", deliveryPartner: rider._id });
    await makeOrder(cust.id, { status: "DELIVERED", deliveryPartner: rider._id });

    expect((await deliveryResolvers.Query.riders(null, null, adminCtx)).length).toBe(1);
    const riderCtx = ctxFor(rider.id, "DELIVERY");
    // PLACED + OUT_FOR_DELIVERY are active; DELIVERED drops to the earnings list.
    expect((await deliveryResolvers.Query.deliveryQueue(null, null, riderCtx)).length).toBe(2);
    expect((await deliveryResolvers.Query.myDeliveries(null, { limit: 10 }, riderCtx)).length).toBe(1);
  });

  it("updateRiderLocation stores the rider's GPS and is role- + input-gated", async () => {
    const rider = await makeUser("DELIVERY");
    const riderCtx = ctxFor(rider.id, "DELIVERY");
    expect(await deliveryResolvers.Mutation.updateRiderLocation(null, { lat: 18.52, lng: 73.85 }, riderCtx)).toBe(true);
    const fresh = await User.findById(rider.id).exec();
    expect(fresh?.lastLat).toBe(18.52);
    expect(fresh?.lastLng).toBe(73.85);
    expect(fresh?.lastLocationAt).toBeInstanceOf(Date);

    // Non-delivery roles cannot push location.
    await expect(
      deliveryResolvers.Mutation.updateRiderLocation(null, { lat: 1, lng: 2 }, ctxFor("c", "CUSTOMER"))
    ).rejects.toThrow();
    // Non-finite coordinates are rejected.
    await expect(
      deliveryResolvers.Mutation.updateRiderLocation(null, { lat: Number.NaN, lng: 2 }, riderCtx)
    ).rejects.toThrow(/invalid coordinates/i);
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
    await makeOrder(cust.id, {
      status: "DELIVERED",
      rating: { food: 5, delivery: 4, ratedAt: new Date(), items: [{ name: "Veg Biryani", rating: 5 }] },
    });
    await makeOrder(cust.id, { status: "PLACED" });
    await Review.create({ authorName: "Asha", text: "Great", rating: 5, isPublished: true });
    // A manual contact is counted separately from signed-up customers.
    await Lead.create({ name: "Walk-in Ravi", phone: "98200" });
    // A raw item bought from a coloured source → feeds the dashboard charts.
    const prod = await ExpenseProduct.create({ name: "Rice", marketPrice: 50 });
    const src = await ExpenseSource.create({ type: "PERSON", name: "Veg Vendor", color: "#ffd966" });
    await Expense.create({ source: src._id, product: prod._id, title: "Rice", amount: 200, date: new Date() });

    expect((await dashboardResolvers.Query.reviews(null, {})).length).toBe(1);
    expect((await dashboardResolvers.Query.customers(null, {}, adminCtx)).length).toBe(1);
    expect((await dashboardResolvers.Query.customers(null, { search: "Asha" }, adminCtx)).length).toBe(1);

    const stats = await dashboardResolvers.Query.dashboardStats(null, {}, adminCtx);
    expect(stats.totalOrders).toBe(2);
    expect(stats.totalCustomers).toBe(1);
    expect(stats.totalLeads).toBe(1);
    expect(stats.expenseCategoryCount).toBe(1);
    expect(stats.expenseBySource).toEqual([{ name: "Veg Vendor", color: "#ffd966", total: 200 }]);
    expect(stats.expenseByItem).toEqual([{ name: "Rice", total: 200 }]);
    expect(stats.ordersByStatus.map((o) => o.status).toSorted()).toEqual(["DELIVERED", "PLACED"]);
    expect(stats.ordersByStatus.every((o) => o.count === 1)).toBe(true);
    expect(stats.avgFoodRating).toBe(5);
    expect(stats.avgDeliveryRating).toBe(4);
    expect(stats.ratingCount).toBe(1);
    expect(stats.dishRatings).toHaveLength(1);
    expect(stats.dishRatings[0].name).toBe("Veg Biryani");
    expect(stats.dishRatings[0].rating).toBe(5);
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

  it("ordersStats returns headline counts (zeros when empty)", async () => {
    const empty = await dashboardResolvers.Query.ordersStats(null, null, adminCtx);
    expect(empty).toEqual({ totalOrders: 0, todayOrders: 0, pendingOrders: 0, totalRevenue: 0, todayRevenue: 0 });

    const cust = await makeUser("CUSTOMER");
    await makeOrder(cust.id, { status: "DELIVERED", total: 500 });
    await makeOrder(cust.id, { status: "PLACED", total: 100 });
    const stats = await dashboardResolvers.Query.ordersStats(null, null, adminCtx);
    expect(stats.totalOrders).toBe(2);
    expect(stats.todayOrders).toBe(2);
    expect(stats.pendingOrders).toBe(1);
    expect(stats.totalRevenue).toBe(500);
    expect(stats.todayRevenue).toBe(500);
  });
});
