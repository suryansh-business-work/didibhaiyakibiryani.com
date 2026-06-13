import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { menuResolvers } from "../../src/graphql/resolvers/menu";
import { couponResolvers } from "../../src/graphql/resolvers/coupon";
import { Category, MenuItem, Coupon, Order } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");

async function makeCategory(name = "Biryani") {
  return menuResolvers.Mutation.createCategory(null, { input: { name } }, admin);
}

describe("menu resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(menuResolvers.Mutation.createCategory(null, { input: { name: "X" } }, customer)).rejects.toThrow();
  });

  it("category CRUD + itemCount + guards", async () => {
    const cat = await makeCategory();
    expect(cat.slug).toBe("biryani");

    const updated = await menuResolvers.Mutation.updateCategory(null, { id: cat.id, input: { name: "Veg Biryani" } }, admin);
    expect(updated.slug).toBe("veg-biryani");
    await expect(menuResolvers.Mutation.updateCategory(null, { id: "651111111111111111111111", input: { name: "Z" } }, admin)).rejects.toThrow(/not found/i);

    const all = await menuResolvers.Query.categories(null, {});
    const active = await menuResolvers.Query.categories(null, { activeOnly: true });
    expect(all.length).toBe(1);
    expect(active.length).toBe(1);
    expect(await menuResolvers.Category.itemCount({ id: cat.id })).toBe(0);

    await menuResolvers.Mutation.deleteCategory(null, { id: cat.id }, admin);
    expect(await Category.countDocuments()).toBe(0);
  });

  it("blocks deleting a category that still has items", async () => {
    const cat = await makeCategory();
    await menuResolvers.Mutation.createMenuItem(null, { input: { name: "Veg Biryani", price: 199, categoryId: cat.id } }, admin);
    await expect(menuResolvers.Mutation.deleteCategory(null, { id: cat.id }, admin)).rejects.toThrow(/still use/i);
  });

  it("menu item CRUD, queries, toggle + field resolver", async () => {
    const cat = await makeCategory();
    const item = await menuResolvers.Mutation.createMenuItem(null, { input: { name: "Paneer Biryani", price: 249, categoryId: cat.id } }, admin);
    expect(item.slug).toBe("paneer-biryani");

    const byId = await menuResolvers.Query.menuItem(null, { id: item.id });
    expect(byId?.name).toBe("Paneer Biryani");
    const bySlug = await menuResolvers.Query.menuItem(null, { slug: "paneer-biryani" });
    expect(bySlug?.id).toBe(item.id);
    expect(await menuResolvers.Query.menuItem(null, {})).toBeNull();

    const list = await menuResolvers.Query.menuItems(null, { categoryId: cat.id, availableOnly: true });
    expect(list.length).toBe(1);

    const updated = await menuResolvers.Mutation.updateMenuItem(null, { id: item.id, input: { name: "Paneer Dum", price: 259, categoryId: cat.id } }, admin);
    expect(updated.slug).toBe("paneer-dum");
    await expect(menuResolvers.Mutation.updateMenuItem(null, { id: "651111111111111111111111", input: { name: "Z", price: 1, categoryId: cat.id } }, admin)).rejects.toThrow(/not found/i);

    const toggled = await menuResolvers.Mutation.toggleItemAvailability(null, { id: item.id }, admin);
    expect(toggled.isAvailable).toBe(false);
    await expect(menuResolvers.Mutation.toggleItemAvailability(null, { id: "651111111111111111111111" }, admin)).rejects.toThrow(/not found/i);

    const resolvedCat = await menuResolvers.MenuItem.category({ category: cat.id });
    expect((resolvedCat as { name?: string })?.name).toBe("Biryani");
    expect(menuResolvers.MenuItem.category({ category: { name: "Already" } })).toEqual({ name: "Already" });
    expect(await menuResolvers.MenuItem.category({ category: null })).toBeNull();

    await menuResolvers.Mutation.deleteMenuItem(null, { id: item.id }, admin);
    expect(await MenuItem.countDocuments()).toBe(0);
  });
});

describe("coupon resolver", () => {
  it("create (+dup), update (+not found), delete, list, freeItem", async () => {
    const c = await couponResolvers.Mutation.createCoupon(null, { input: { code: "save20", title: "20% off", type: "PERCENT", value: 20 } }, admin);
    expect(c.code).toBe("SAVE20");
    await expect(couponResolvers.Mutation.createCoupon(null, { input: { code: "save20", title: "dup", type: "PERCENT", value: 20 } }, admin)).rejects.toThrow(/already exists/i);

    const upd = await couponResolvers.Mutation.updateCoupon(null, { id: c.id, input: { code: "SAVE20", title: "Updated", type: "PERCENT", value: 25 } }, admin);
    expect(upd.title).toBe("Updated");
    await expect(couponResolvers.Mutation.updateCoupon(null, { id: "651111111111111111111111", input: { code: "Z", title: "z", type: "FLAT", value: 1 } }, admin)).rejects.toThrow(/not found/i);

    const list = await couponResolvers.Query.coupons(null, { activeOnly: true });
    expect(list.length).toBe(1);

    expect(await couponResolvers.Coupon.freeItem({ freeItem: undefined })).toBeNull();

    await couponResolvers.Mutation.deleteCoupon(null, { id: c.id }, admin);
    expect(await Coupon.countDocuments()).toBe(0);
  });

  it("validateCoupon evaluates against settings (guest + signed-in)", async () => {
    await couponResolvers.Mutation.createCoupon(null, { input: { code: "FLAT50", title: "Flat 50", type: "FLAT", value: 50, minOrder: 100 } }, admin);
    const guest = await couponResolvers.Query.validateCoupon(null, { code: "FLAT50", subtotal: 300 }, { user: null });
    expect(guest.valid).toBe(true);
    expect(guest.coupon?.code).toBe("FLAT50");

    const signed = await couponResolvers.Query.validateCoupon(null, { code: "NOPE", subtotal: 300 }, ctxFor("651111111111111111111111", "CUSTOMER"));
    expect(signed.valid).toBe(false);
    expect(signed.coupon).toBeNull();
    expect(await Order.countDocuments()).toBe(0);
  });
});
