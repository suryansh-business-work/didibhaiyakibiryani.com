import { describe, it, expect } from "vitest";
import { useTestDb } from "../helpers/db";
import { paginate } from "../../src/utils/pagination";
import { Lead, Expense, ExpenseSource } from "../../src/models/index.js";

useTestDb();

async function seedLeads(): Promise<void> {
  await Lead.create([
    { name: "Asha", phone: "111", email: "asha@b.com" },
    { name: "Bala", phone: "222", email: "bala@b.com" },
    { name: "Chetan", phone: "333", email: "chetan@b.com" },
  ]);
}

describe("paginate helper", () => {
  it("returns items + total with default limit/offset and createdAt fallback sort", async () => {
    await seedLeads();
    const page = await paginate(Lead, {});
    expect(page.total).toBe(3);
    expect(page.items.length).toBe(3);
  });

  it("applies a case-insensitive regex OR over searchFields", async () => {
    await seedLeads();
    const page = await paginate(Lead, { search: "ASH", searchFields: ["name", "email"] });
    expect(page.total).toBe(1);
    expect(page.items[0].name).toBe("Asha");
  });

  it("ignores a blank search and a search with no searchFields", async () => {
    await seedLeads();
    const blank = await paginate(Lead, { search: "   ", searchFields: ["name"] });
    expect(blank.total).toBe(3);
    const noFields = await paginate(Lead, { search: "asha" });
    expect(noFields.total).toBe(3);
  });

  it("honours a whitelisted sort field + ASC direction", async () => {
    await seedLeads();
    const asc = await paginate(Lead, {
      sortBy: "name",
      sortDir: "ASC",
      sortAllow: ["name"],
    });
    expect(asc.items.map((l) => l.name)).toEqual(["Asha", "Bala", "Chetan"]);
  });

  it("falls back to defaultSort when sortBy is not whitelisted", async () => {
    await seedLeads();
    const page = await paginate(Lead, {
      sortBy: "phone", // not allowed
      sortDir: "DESC",
      sortAllow: ["name"],
      defaultSort: "name",
    });
    expect(page.items.map((l) => l.name)).toEqual(["Chetan", "Bala", "Asha"]);
  });

  it("clamps limit (max 200, min default) and applies offset", async () => {
    await seedLeads();
    const big = await paginate(Lead, { limit: 9999 });
    expect(big.items.length).toBe(3); // only 3 docs, but no crash from huge limit

    const sized = await paginate(Lead, {
      sortBy: "name",
      sortDir: "ASC",
      sortAllow: ["name"],
      limit: 1,
      offset: 1,
    });
    expect(sized.items.length).toBe(1);
    expect(sized.items[0].name).toBe("Bala");
    expect(sized.total).toBe(3);
  });

  it("defaults invalid limit/offset (NaN, negative) safely", async () => {
    await seedLeads();
    const page = await paginate(Lead, { limit: Number.NaN, offset: -5 });
    expect(page.items.length).toBe(3);
    expect(page.total).toBe(3);
  });

  it("populates a referenced path (string and array forms)", async () => {
    const source = await ExpenseSource.create({ type: "PERSON", name: "Ramesh" });
    await Expense.create({ source: source._id, title: "Veg", amount: 100 });

    const byString = await paginate(Expense, { populate: "source" });
    expect((byString.items[0].source as { name: string }).name).toBe("Ramesh");

    const byArray = await paginate(Expense, { populate: ["source"] });
    expect((byArray.items[0].source as { name: string }).name).toBe("Ramesh");
  });
});
