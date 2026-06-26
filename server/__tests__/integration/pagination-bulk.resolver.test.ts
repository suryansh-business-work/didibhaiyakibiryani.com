import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";
import {
  Lead,
  PartyOrder,
  SupportTicket,
  Expense,
  ExpenseSource,
  Coupon,
  Category,
  MenuItem,
  Society,
  Banner,
  Payment,
  User,
} from "../../src/models/index.js";
import { orderResolvers } from "../../src/graphql/resolvers/order";
import { paymentResolvers } from "../../src/graphql/resolvers/payment";
import { dashboardResolvers } from "../../src/graphql/resolvers/dashboard";
import { leadResolvers } from "../../src/graphql/resolvers/lead";
import { partyResolvers } from "../../src/graphql/resolvers/party";
import { supportResolvers } from "../../src/graphql/resolvers/support";
import { expenseResolvers } from "../../src/graphql/resolvers/expense";
import { menuResolvers } from "../../src/graphql/resolvers/menu";
import { couponResolvers } from "../../src/graphql/resolvers/coupon";
import { societyResolvers } from "../../src/graphql/resolvers/society";
import { bannerResolvers } from "../../src/graphql/resolvers/banner";
import { deliveryResolvers } from "../../src/graphql/resolvers/delivery";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");

describe("paginated *Page queries", () => {
  it("ordersPage: filters by status, searches, sorts and guards", async () => {
    const cust = await makeUser("CUSTOMER");
    await makeOrder(cust.id, { status: "PLACED", customerName: "Walk In", total: 100 });
    await makeOrder(cust.id, { status: "DELIVERED", customerName: "Diner", total: 500 });

    const all = await orderResolvers.Query.ordersPage(null, {}, admin);
    expect(all.total).toBe(2);

    const delivered = await orderResolvers.Query.ordersPage(null, { status: "DELIVERED" }, admin);
    expect(delivered.total).toBe(1);
    expect(delivered.items[0].status).toBe("DELIVERED");

    const searched = await orderResolvers.Query.ordersPage(
      null,
      { search: "walk", sortBy: "total", sortDir: "ASC", limit: 5, offset: 0 },
      admin
    );
    expect(searched.total).toBe(1);

    await expect(orderResolvers.Query.ordersPage(null, {}, customer)).rejects.toThrow();
  });

  it("ordersPage: scopes to one customer (userId) or contact (phone)", async () => {
    const cust = await makeUser("CUSTOMER");
    const other = await makeUser("CUSTOMER");
    await makeOrder(cust.id);
    await makeOrder(cust.id);
    await makeOrder(other.id);
    // A non-signup contact's POS order, matched by snapshotted phone (no user).
    await makeOrder(cust.id, { user: undefined, customerPhone: "98200", customerName: "Walk In" });

    const byUser = await orderResolvers.Query.ordersPage(null, { userId: cust.id }, admin);
    expect(byUser.total).toBe(2);

    const byPhone = await orderResolvers.Query.ordersPage(null, { phone: "98200" }, admin);
    expect(byPhone.total).toBe(1);
    expect(byPhone.items[0].customerPhone).toBe("98200");

    // userId wins when both are supplied.
    const both = await orderResolvers.Query.ordersPage(null, { userId: cust.id, phone: "98200" }, admin);
    expect(both.total).toBe(2);
  });

  it("paymentsPage: filters by status, searches and guards", async () => {
    const order = await makeOrder((await makeUser()).id);
    await Payment.create({
      order: order._id,
      provider: "MANUAL",
      providerOrderId: "PO-1",
      providerPaymentId: "REF-100",
      amount: 437,
      status: "CAPTURED",
      method: "upi",
    });
    await Payment.create({
      order: order._id,
      providerOrderId: "PO-2",
      amount: 200,
      status: "CREATED",
    });

    const all = await paymentResolvers.Query.paymentsPage(null, {}, admin);
    expect(all.total).toBe(2);

    const captured = await paymentResolvers.Query.paymentsPage(null, { status: "CAPTURED" }, admin);
    expect(captured.total).toBe(1);

    const byMethod = await paymentResolvers.Query.paymentsPage(null, { search: "upi" }, admin);
    expect(byMethod.total).toBe(1);

    await expect(paymentResolvers.Query.paymentsPage(null, {}, customer)).rejects.toThrow();
  });

  it("customersPage: scopes to CUSTOMER role, searches and guards", async () => {
    await makeUser("CUSTOMER", { name: "Alice" });
    await makeUser("STAFF", { name: "Staffer" });

    const page = await dashboardResolvers.Query.customersPage(null, {}, admin);
    expect(page.total).toBe(1);
    expect(page.items[0].name).toBe("Alice");

    const searched = await dashboardResolvers.Query.customersPage(
      null,
      { search: "alice", sortBy: "name", sortDir: "ASC" },
      admin
    );
    expect(searched.total).toBe(1);

    await expect(dashboardResolvers.Query.customersPage(null, {}, customer)).rejects.toThrow();
  });

  it("leadsPage: lists, searches and guards", async () => {
    await Lead.create({ name: "Asha", phone: "111" });
    await Lead.create({ name: "Bala", phone: "222" });

    const page = await leadResolvers.Query.leadsPage(null, { sortBy: "name", sortDir: "ASC" }, admin);
    expect(page.total).toBe(2);
    expect(page.items[0].name).toBe("Asha");

    const searched = await leadResolvers.Query.leadsPage(null, { search: "bala" }, admin);
    expect(searched.total).toBe(1);

    await expect(leadResolvers.Query.leadsPage(null, {}, customer)).rejects.toThrow();
  });

  it("partyOrdersPage: filters by status, searches and guards", async () => {
    await PartyOrder.create({ name: "Ravi", phone: "1", email: "r@b.com", status: "NEW" });
    await PartyOrder.create({ name: "Sita", phone: "2", email: "s@b.com", status: "CLOSED" });

    const all = await partyResolvers.Query.partyOrdersPage(null, {}, admin);
    expect(all.total).toBe(2);

    const closed = await partyResolvers.Query.partyOrdersPage(null, { status: "CLOSED" }, admin);
    expect(closed.total).toBe(1);

    const searched = await partyResolvers.Query.partyOrdersPage(null, { search: "ravi" }, admin);
    expect(searched.total).toBe(1);

    await expect(partyResolvers.Query.partyOrdersPage(null, {}, customer)).rejects.toThrow();
  });

  it("supportTicketsPage: filters by status, searches and guards", async () => {
    const u = await makeUser();
    const order = await makeOrder(u.id);
    await SupportTicket.create({ order: order._id, user: u._id, subject: "Late order", body: "x", status: "OPEN" });
    await SupportTicket.create({ order: order._id, user: u._id, subject: "Cold food", body: "y", status: "RESOLVED" });

    const all = await supportResolvers.Query.supportTicketsPage(null, {}, admin);
    expect(all.total).toBe(2);

    const open = await supportResolvers.Query.supportTicketsPage(null, { status: "OPEN" }, admin);
    expect(open.total).toBe(1);

    const searched = await supportResolvers.Query.supportTicketsPage(null, { search: "cold" }, admin);
    expect(searched.total).toBe(1);

    await expect(supportResolvers.Query.supportTicketsPage(null, {}, customer)).rejects.toThrow();
  });

  it("expensesPage: searches, populates source and guards", async () => {
    const source = await ExpenseSource.create({ type: "PERSON", name: "Ramesh" });
    await Expense.create({ source: source._id, title: "Vegetables", amount: 250 });

    const page = await expenseResolvers.Query.expensesPage(null, { search: "veg" }, admin);
    expect(page.total).toBe(1);
    expect((page.items[0].source as { name: string }).name).toBe("Ramesh");

    await expect(expenseResolvers.Query.expensesPage(null, {}, customer)).rejects.toThrow();
  });

  it("menuItemsPage: filters by category/availability, searches and guards", async () => {
    const cat = await Category.create({ name: "Biryani", slug: "biryani" });
    await MenuItem.create({ name: "Veg Biryani", slug: "veg-biryani", price: 199, category: cat._id, isAvailable: true });
    await MenuItem.create({ name: "Paneer Tikka", slug: "paneer-tikka", price: 249, category: cat._id, isAvailable: false });

    const all = await menuResolvers.Query.menuItemsPage(null, {}, admin);
    expect(all.total).toBe(2);

    const inCat = await menuResolvers.Query.menuItemsPage(null, { categoryId: cat.id }, admin);
    expect(inCat.total).toBe(2);

    const avail = await menuResolvers.Query.menuItemsPage(null, { availableOnly: true }, admin);
    expect(avail.total).toBe(1);

    const searched = await menuResolvers.Query.menuItemsPage(
      null,
      { search: "paneer", sortBy: "price", sortDir: "ASC" },
      admin
    );
    expect(searched.total).toBe(1);

    await expect(menuResolvers.Query.menuItemsPage(null, {}, customer)).rejects.toThrow();
  });

  it("couponsPage: filters by activeOnly, searches and guards", async () => {
    await Coupon.create({ code: "SAVE10", title: "Ten off", type: "FLAT", value: 10, isActive: true });
    await Coupon.create({ code: "OLD", title: "Expired", type: "FLAT", value: 5, isActive: false });

    const all = await couponResolvers.Query.couponsPage(null, {}, admin);
    expect(all.total).toBe(2);

    const active = await couponResolvers.Query.couponsPage(null, { activeOnly: true }, admin);
    expect(active.total).toBe(1);

    const searched = await couponResolvers.Query.couponsPage(null, { search: "save" }, admin);
    expect(searched.total).toBe(1);

    await expect(couponResolvers.Query.couponsPage(null, {}, customer)).rejects.toThrow();
  });
});

describe("bulk-delete mutations", () => {
  it("deleteLeads: removes matching docs, 0 on empty ids, guards", async () => {
    const a = await Lead.create({ name: "A", phone: "1" });
    const b = await Lead.create({ name: "B", phone: "2" });
    expect(await leadResolvers.Mutation.deleteLeads(null, { ids: [] }, admin)).toBe(0);
    expect(await leadResolvers.Mutation.deleteLeads(null, { ids: [a.id, b.id] }, admin)).toBe(2);
    expect(await Lead.countDocuments()).toBe(0);
    await expect(leadResolvers.Mutation.deleteLeads(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteCustomers: only removes CUSTOMER docs", async () => {
    const cust = await makeUser("CUSTOMER");
    const staff = await makeUser("STAFF");
    expect(await dashboardResolvers.Mutation.deleteCustomers(null, { ids: [] }, admin)).toBe(0);
    const removed = await dashboardResolvers.Mutation.deleteCustomers(
      null,
      { ids: [cust.id, staff.id] },
      admin
    );
    expect(removed).toBe(1); // staff untouched
    expect(await User.findById(staff.id)).not.toBeNull();
    await expect(dashboardResolvers.Mutation.deleteCustomers(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deletePartyOrders: removes docs, 0 on empty, guards", async () => {
    const p = await PartyOrder.create({ name: "R", phone: "1", email: "r@b.com" });
    expect(await partyResolvers.Mutation.deletePartyOrders(null, { ids: [] }, admin)).toBe(0);
    expect(await partyResolvers.Mutation.deletePartyOrders(null, { ids: [p.id] }, admin)).toBe(1);
    await expect(partyResolvers.Mutation.deletePartyOrders(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteSupportTickets: removes docs, 0 on empty, guards", async () => {
    const u = await makeUser();
    const order = await makeOrder(u.id);
    const t = await SupportTicket.create({ order: order._id, user: u._id, subject: "s", body: "b" });
    expect(await supportResolvers.Mutation.deleteSupportTickets(null, { ids: [] }, admin)).toBe(0);
    expect(await supportResolvers.Mutation.deleteSupportTickets(null, { ids: [t.id] }, admin)).toBe(1);
    await expect(supportResolvers.Mutation.deleteSupportTickets(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteExpenses & deleteExpenseSources: remove docs, 0 on empty, guard", async () => {
    const source = await ExpenseSource.create({ type: "PERSON", name: "R" });
    const exp = await Expense.create({ source: source._id, title: "T", amount: 5 });
    expect(await expenseResolvers.Mutation.deleteExpenses(null, { ids: [] }, admin)).toBe(0);
    expect(await expenseResolvers.Mutation.deleteExpenses(null, { ids: [exp.id] }, admin)).toBe(1);
    expect(await expenseResolvers.Mutation.deleteExpenseSources(null, { ids: [] }, admin)).toBe(0);
    expect(await expenseResolvers.Mutation.deleteExpenseSources(null, { ids: [source.id] }, admin)).toBe(1);
    await expect(expenseResolvers.Mutation.deleteExpenses(null, { ids: ["x"] }, customer)).rejects.toThrow();
    await expect(expenseResolvers.Mutation.deleteExpenseSources(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteMenuItems & deleteCategories: bulk removes, skips in-use categories, guards", async () => {
    const cat = await Category.create({ name: "C", slug: "c" });
    const usedCat = await Category.create({ name: "Used", slug: "used" });
    const item = await MenuItem.create({ name: "I", slug: "i", price: 1, category: usedCat._id });

    expect(await menuResolvers.Mutation.deleteMenuItems(null, { ids: [] }, admin)).toBe(0);
    expect(await menuResolvers.Mutation.deleteMenuItems(null, { ids: [item.id] }, admin)).toBe(1);

    // After the item is gone, usedCat is free; cat was always free.
    expect(await menuResolvers.Mutation.deleteCategories(null, { ids: [] }, admin)).toBe(0);
    const removed = await menuResolvers.Mutation.deleteCategories(null, { ids: [cat.id, usedCat.id] }, admin);
    expect(removed).toBe(2);

    // In-use category is skipped entirely.
    const cat2 = await Category.create({ name: "C2", slug: "c2" });
    await MenuItem.create({ name: "I2", slug: "i2", price: 1, category: cat2._id });
    const skipped = await menuResolvers.Mutation.deleteCategories(null, { ids: [cat2.id] }, admin);
    expect(skipped).toBe(0);
    expect(await Category.findById(cat2.id)).not.toBeNull();

    await expect(menuResolvers.Mutation.deleteMenuItems(null, { ids: ["x"] }, customer)).rejects.toThrow();
    await expect(menuResolvers.Mutation.deleteCategories(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteCoupons, deleteSocieties, deleteBanners: bulk removes, 0 on empty, guard", async () => {
    const coupon = await Coupon.create({ code: "C1", title: "t", type: "FLAT", value: 1 });
    const society = await Society.create({ name: "S1" });
    const banner = await Banner.create({ imageUrl: "u" });

    expect(await couponResolvers.Mutation.deleteCoupons(null, { ids: [] }, admin)).toBe(0);
    expect(await couponResolvers.Mutation.deleteCoupons(null, { ids: [coupon.id] }, admin)).toBe(1);
    expect(await societyResolvers.Mutation.deleteSocieties(null, { ids: [] }, admin)).toBe(0);
    expect(await societyResolvers.Mutation.deleteSocieties(null, { ids: [society.id] }, admin)).toBe(1);
    expect(await bannerResolvers.Mutation.deleteBanners(null, { ids: [] }, admin)).toBe(0);
    expect(await bannerResolvers.Mutation.deleteBanners(null, { ids: [banner.id] }, admin)).toBe(1);

    await expect(couponResolvers.Mutation.deleteCoupons(null, { ids: ["x"] }, customer)).rejects.toThrow();
    await expect(societyResolvers.Mutation.deleteSocieties(null, { ids: ["x"] }, customer)).rejects.toThrow();
    await expect(bannerResolvers.Mutation.deleteBanners(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });

  it("deleteStaffUsers: only removes STAFF/DELIVERY docs, 0 on empty, guards", async () => {
    const staff = await makeUser("STAFF");
    const rider = await makeUser("DELIVERY");
    const cust = await makeUser("CUSTOMER");
    expect(await deliveryResolvers.Mutation.deleteStaffUsers(null, { ids: [] }, admin)).toBe(0);
    const removed = await deliveryResolvers.Mutation.deleteStaffUsers(
      null,
      { ids: [staff.id, rider.id, cust.id] },
      admin
    );
    expect(removed).toBe(2); // customer untouched
    expect(await User.findById(cust.id)).not.toBeNull();
    await expect(deliveryResolvers.Mutation.deleteStaffUsers(null, { ids: ["x"] }, customer)).rejects.toThrow();
  });
});

/**
 * This file imports party/lead/expense resolvers, which vitest instruments as a
 * fresh module instance separate from their mock-isolated sibling test files.
 * Exercise the create/update siblings here too so this instance stays fully
 * covered (otherwise v8 reports an uncovered duplicate of these modules).
 */
describe("sibling create/update coverage for imported modules", () => {
  it("createPartyOrder (staff path), updateLead (all fields), createExpense (with invoiceUrl)", async () => {
    // With all optionals present...
    const party = await partyResolvers.Mutation.createPartyOrder(
      null,
      { input: { name: "Maya", phone: "9000000001", email: "Maya@B.com", eventDate: "Sat", location: "Hall", guests: 30, message: "Hi" } },
      admin
    );
    expect(party.name).toBe("Maya");
    expect(party.email).toBe("maya@b.com");
    // ...and with all optionals absent (covers the `|| undefined` / `?? undefined` falsy branches).
    const partyBare = await partyResolvers.Mutation.createPartyOrder(
      null,
      { input: { name: "Bare", phone: "9000000002", email: "bare@b.com" } },
      admin
    );
    expect(partyBare.location).toBeUndefined();
    // Validation error branches on this module instance.
    await expect(
      partyResolvers.Mutation.createPartyOrder(null, { input: { name: " ", phone: "1", email: "a@b.com" } }, admin)
    ).rejects.toThrow(/required/i);
    await expect(
      partyResolvers.Mutation.createPartyOrder(null, { input: { name: "X", phone: "1", email: "bad" } }, admin)
    ).rejects.toThrow(/valid email/i);

    const lead = await leadResolvers.Mutation.createLead(null, { name: "Lia", phone: "5" }, admin);
    const updated = await leadResolvers.Mutation.updateLead(
      null,
      { id: lead.id, city: "Pune", state: "MH", pincode: "411001", lat: 18.5, lng: 73.8 },
      admin
    );
    expect(updated.city).toBe("Pune");
    expect(updated.lat).toBe(18.5);
    // Clear lat/lng (covers the `?? undefined` branch when the value is null).
    const cleared = await leadResolvers.Mutation.updateLead(
      null,
      { id: lead.id, lat: null as unknown as number, lng: null as unknown as number },
      admin
    );
    expect(cleared.lat).toBeUndefined();

    const source = await ExpenseSource.create({ type: "PERSON", name: "Vendor" });
    const expense = await expenseResolvers.Mutation.createExpense(
      null,
      { input: { sourceId: source.id, title: "Gas", amount: 80, invoiceUrl: " https://x/y.pdf " } },
      admin
    );
    expect(expense.invoiceUrl).toBe("https://x/y.pdf");
  });
});
