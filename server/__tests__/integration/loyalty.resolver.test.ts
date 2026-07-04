import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { useTestDb, ctxFor } from "../helpers/db";
import { makeUser, makeOrder } from "../helpers/fixtures";

vi.mock("../../src/utils/mailer.js", () => ({ sendMail: vi.fn(async () => true), sendMailAsync: vi.fn() }));
vi.mock("../../src/emails/notify.js", () => ({ notifyOrderEmail: vi.fn(), notifyOrderTrackingWhatsApp: vi.fn() }));

import { loyaltyResolvers } from "../../src/graphql/resolvers/loyalty";
import { couponResolvers } from "../../src/graphql/resolvers/coupon";
import { settingsResolvers } from "../../src/graphql/resolvers/settings";
import { orderResolvers } from "../../src/graphql/resolvers/order";
import { User, Order, Coupon, MenuItem, Settings, SETTINGS_KEY, getOrCreateSettings } from "../../src/models/index.js";

useTestDb();
const adminCtx = ctxFor("admin1", "ADMIN");

async function makeRewardItem() {
  return MenuItem.create({ name: "Free Pizza", slug: `free-${Math.random().toString(36).slice(2)}`, price: 299, category: new Types.ObjectId(), isAvailable: true, spiceLevel: 0 });
}

async function setLoyalty(over: Record<string, unknown> = {}) {
  await getOrCreateSettings();
  return Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { loyaltyEnabled: true, pointsPerOrder: 100, pointsMinOrder: 350, pointsPerReward: 600, ...over },
    { new: true }
  ).exec();
}

describe("loyalty — earning on delivery", () => {
  it("credits points for an eligible delivered order, idempotently", async () => {
    await setLoyalty();
    const user = await makeUser();
    const order = await makeOrder(user.id, { total: 437, status: "OUT_FOR_DELIVERY" });
    await orderResolvers.Mutation.updateOrderStatus(null, { id: order.id, status: "DELIVERED" }, adminCtx);
    let fresh = await User.findById(user.id).exec();
    expect(fresh?.loyaltyPoints).toBe(100);
    const o1 = await Order.findById(order.id).exec();
    expect(o1?.pointsEarned).toBe(100);
    // Re-delivering must not double-credit.
    await orderResolvers.Mutation.updateOrderStatus(null, { id: order.id, status: "DELIVERED" }, adminCtx);
    fresh = await User.findById(user.id).exec();
    expect(fresh?.loyaltyPoints).toBe(100);
  });

  it("does not credit when loyalty is disabled, order is below minimum, or there is no user", async () => {
    await setLoyalty({ loyaltyEnabled: false });
    const user = await makeUser();
    const big = await makeOrder(user.id, { total: 900, status: "OUT_FOR_DELIVERY" });
    await orderResolvers.Mutation.updateOrderStatus(null, { id: big.id, status: "DELIVERED" }, adminCtx);
    expect((await User.findById(user.id).exec())?.loyaltyPoints).toBe(0);

    await setLoyalty();
    const small = await makeOrder(user.id, { total: 100, status: "OUT_FOR_DELIVERY" });
    await orderResolvers.Mutation.updateOrderStatus(null, { id: small.id, status: "DELIVERED" }, adminCtx);
    expect((await User.findById(user.id).exec())?.loyaltyPoints).toBe(0);

    const pos = await Order.create({ orderNumber: "POS-1", items: [{ name: "X", price: 400, qty: 1 }], subtotal: 400, total: 400, status: "OUT_FOR_DELIVERY", paymentMethod: "COD", paymentStatus: "PENDING" });
    const delivered = await orderResolvers.Mutation.updateOrderStatus(null, { id: pos.id, status: "DELIVERED" }, adminCtx);
    expect(delivered.pointsEarned).toBe(0);
  });
});

describe("loyalty — myRewards", () => {
  it("reports the snapshot for a customer with points", async () => {
    await setLoyalty({ rewardName: "Free Regular Pizza" });
    const user = await makeUser("CUSTOMER", { loyaltyPoints: 1200 });
    const r = await loyaltyResolvers.Query.myRewards(null, null, ctxFor(user.id, "CUSTOMER"));
    expect(r.enabled).toBe(true);
    expect(r.points).toBe(1200);
    expect(r.rewardsAvailable).toBe(2);
    expect(r.rewardName).toBe("Free Regular Pizza");
  });

  it("falls back to zero points when the account is missing", async () => {
    const r = await loyaltyResolvers.Query.myRewards(null, null, ctxFor(new Types.ObjectId().toString(), "CUSTOMER"));
    expect(r.points).toBe(0);
    expect(r.rewardsAvailable).toBe(0);
  });

  it("resolves the reward item only when configured", async () => {
    const item = await makeRewardItem();
    const resolved = await loyaltyResolvers.Rewards.rewardItem({ rewardItem: item._id });
    expect(resolved?.name).toBe("Free Pizza");
    expect(await loyaltyResolvers.Rewards.rewardItem({})).toBeNull();
  });
});

describe("loyalty — redeemReward", () => {
  it("redeems points for a single-use reward coupon", async () => {
    const item = await makeRewardItem();
    await setLoyalty({ rewardItem: item._id });
    const user = await makeUser("CUSTOMER", { loyaltyPoints: 600 });
    const res = await loyaltyResolvers.Mutation.redeemReward(null, null, ctxFor(user.id, "CUSTOMER"));
    expect(res.code.startsWith("RWD-")).toBe(true);
    expect(res.points).toBe(0);
    const coupon = await Coupon.findOne({ code: res.code }).exec();
    expect(coupon?.isReward).toBe(true);
    expect(coupon?.type).toBe("FREE_ITEM");
    expect(String(coupon?.freeItem)).toBe(String(item._id));
    expect((await User.findById(user.id).exec())?.loyaltyPoints).toBe(0);
  });

  it("rejects when disabled, unconfigured, account missing, or short on points", async () => {
    const user = await makeUser("CUSTOMER", { loyaltyPoints: 600 });
    await setLoyalty({ loyaltyEnabled: false });
    await expect(loyaltyResolvers.Mutation.redeemReward(null, null, ctxFor(user.id, "CUSTOMER"))).rejects.toThrow();

    await setLoyalty({ rewardItem: null });
    await expect(loyaltyResolvers.Mutation.redeemReward(null, null, ctxFor(user.id, "CUSTOMER"))).rejects.toThrow();

    const item = await makeRewardItem();
    await setLoyalty({ rewardItem: item._id });
    await expect(loyaltyResolvers.Mutation.redeemReward(null, null, ctxFor(new Types.ObjectId().toString(), "CUSTOMER"))).rejects.toThrow();

    const poor = await makeUser("CUSTOMER", { loyaltyPoints: 100 });
    await expect(loyaltyResolvers.Mutation.redeemReward(null, null, ctxFor(poor.id, "CUSTOMER"))).rejects.toThrow();
  });
});

describe("loyalty — reward coupons stay hidden", () => {
  it("excludes reward coupons from the public list (active and all)", async () => {
    await Coupon.create({ code: "PUBLIC10", title: "Public", type: "FLAT", value: 10, minOrder: 0, isActive: true });
    await Coupon.create({ code: "RWD-AAAA", title: "Loyalty reward", type: "FREE_ITEM", value: 0, minOrder: 0, isActive: true, isReward: true });
    const active = await couponResolvers.Query.coupons(null, { activeOnly: true });
    const all = await couponResolvers.Query.coupons(null, {});
    expect(active.map((c) => c.code)).toEqual(["PUBLIC10"]);
    expect(all.map((c) => c.code)).toEqual(["PUBLIC10"]);
  });
});

describe("loyalty — settings config", () => {
  it("persists loyalty fields and the reward item, and clears it on empty", async () => {
    const item = await makeRewardItem();
    const updated = await settingsResolvers.Mutation.updateSettings(
      null,
      { input: { loyaltyEnabled: true, pointsPerOrder: 50, pointsMinOrder: 200, pointsPerReward: 500, rewardItem: item.id, rewardName: "Free Pizza" } },
      adminCtx
    );
    expect(updated?.rewardName).toBe("Free Pizza");
    expect(updated?.loyaltyEnabled).toBe(true);
    expect(updated?.pointsPerOrder).toBe(50);
    expect(updated?.pointsMinOrder).toBe(200);
    expect(updated?.pointsPerReward).toBe(500);
    expect(String(updated?.rewardItem)).toBe(String(item._id));
    expect((await settingsResolvers.Settings.rewardItem(updated!))?.name).toBe("Free Pizza");

    const cleared = await settingsResolvers.Mutation.updateSettings(null, { input: { rewardItem: "" } }, adminCtx);
    expect(cleared?.rewardItem ?? null).toBeNull();
    expect(await settingsResolvers.Settings.rewardItem(cleared!)).toBeNull();
  });
});
