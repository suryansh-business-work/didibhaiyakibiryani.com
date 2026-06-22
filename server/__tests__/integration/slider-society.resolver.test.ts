import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { bannerResolvers } from "../../src/graphql/resolvers/banner";
import { societyResolvers } from "../../src/graphql/resolvers/society";
import { Banner, Society } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");

const MISSING_ID = "651111111111111111111111";

describe("banner (slider) resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(
      bannerResolvers.Mutation.createBanner(null, { input: { imageUrl: "x" } }, customer)
    ).rejects.toThrow();
  });

  it("CRUD + activeOnly filter + not-found guard", async () => {
    const active = await bannerResolvers.Mutation.createBanner(
      null,
      { input: { imageUrl: "https://img/1.jpg", title: "Hero", sortOrder: 1 } },
      admin
    );
    await bannerResolvers.Mutation.createBanner(
      null,
      { input: { imageUrl: "https://img/2.jpg", title: "Hidden", sortOrder: 2, isActive: false } },
      admin
    );

    const all = await bannerResolvers.Query.banners(null, {});
    const onlyActive = await bannerResolvers.Query.banners(null, { activeOnly: true });
    expect(all.length).toBe(2);
    expect(onlyActive.length).toBe(1);

    const updated = await bannerResolvers.Mutation.updateBanner(
      null,
      { id: active.id, input: { imageUrl: "https://img/1.jpg", title: "Hero 2" } },
      admin
    );
    expect(updated.title).toBe("Hero 2");
    await expect(
      bannerResolvers.Mutation.updateBanner(null, { id: MISSING_ID, input: { imageUrl: "x" } }, admin)
    ).rejects.toThrow(/not found/i);

    await bannerResolvers.Mutation.deleteBanner(null, { id: active.id }, admin);
    expect(await Banner.countDocuments()).toBe(1);
  });
});

describe("society resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(
      societyResolvers.Mutation.createSociety(null, { input: { name: "X" } }, customer)
    ).rejects.toThrow();
  });

  it("CRUD + activeOnly filter + not-found guard", async () => {
    const s = await societyResolvers.Mutation.createSociety(
      null,
      { input: { name: "Prestige Lakeside", area: "Whitefield", pincode: "560066", sortOrder: 1 } },
      admin
    );
    await societyResolvers.Mutation.createSociety(
      null,
      { input: { name: "Old Block", sortOrder: 2, isActive: false } },
      admin
    );

    const all = await societyResolvers.Query.societies(null, {});
    const onlyActive = await societyResolvers.Query.societies(null, { activeOnly: true });
    expect(all.length).toBe(2);
    expect(onlyActive.length).toBe(1);

    const updated = await societyResolvers.Mutation.updateSociety(
      null,
      { id: s.id, input: { name: "Prestige Lakeside Habitat" } },
      admin
    );
    expect(updated.name).toBe("Prestige Lakeside Habitat");
    await expect(
      societyResolvers.Mutation.updateSociety(null, { id: MISSING_ID, input: { name: "Z" } }, admin)
    ).rejects.toThrow(/not found/i);

    await societyResolvers.Mutation.deleteSociety(null, { id: s.id }, admin);
    expect(await Society.countDocuments()).toBe(1);
  });
});
