import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { expenseResolvers } from "../../src/graphql/resolvers/expense";
import { Expense, ExpenseSource, ExpenseProduct } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");

const MISSING_ID = "651111111111111111111111";
const M = expenseResolvers.Mutation;
const Q = expenseResolvers.Query;

describe("expense source resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(M.createExpenseSource(null, { input: { type: "PERSON", name: "X" } }, customer)).rejects.toThrow();
  });

  it("CRUD + colour + activeOnly filter + not-found guard", async () => {
    const person = await M.createExpenseSource(
      null,
      { input: { type: "PERSON", name: "Ramesh", phone: "9990001111", color: "#ffd966" } },
      admin
    );
    expect(person.color).toBe("#ffd966");
    await M.createExpenseSource(
      null,
      { input: { type: "ACCOUNT", name: "Cash Account", bankName: "HDFC", accountNumber: "1234567890", ifsc: "HDFC0001", isActive: false } },
      admin
    );

    expect((await Q.expenseSources(null, {})).length).toBe(2);
    expect((await Q.expenseSources(null, { activeOnly: true })).length).toBe(1);

    const updated = await M.updateExpenseSource(null, { id: person.id, input: { type: "PERSON", name: "Ramesh Kumar" } }, admin);
    expect(updated?.name).toBe("Ramesh Kumar");
    await expect(M.updateExpenseSource(null, { id: MISSING_ID, input: { type: "PERSON", name: "Z" } }, admin)).rejects.toThrow(/not found/i);

    await M.deleteExpenseSource(null, { id: person.id }, admin);
    expect(await ExpenseSource.countDocuments()).toBe(1);
  });
});

describe("expense resolver (simple table)", () => {
  it("rejects non-admin mutations", async () => {
    await expect(M.createExpense(null, { input: { title: "X", amount: 10 } }, customer)).rejects.toThrow();
  });

  it("records an expense from a source + raw item (all fields), and a bare one", async () => {
    const source = await M.createExpenseSource(null, { input: { type: "PERSON", name: "Ramesh" } }, admin);
    const item = await M.createExpenseProduct(null, { name: "Vegetables", marketPrice: 40, priceUnit: "KG" }, admin);

    const backDate = "2026-03-10T00:00:00.000Z";
    const full = await M.createExpense(
      null,
      { input: { sourceId: source.id, productId: item.id, title: "Vegetables", amount: 250, unit: "KG", invoiceUrl: " https://x/i.pdf ", note: "weekly", date: backDate } },
      admin
    );
    expect(full.amount).toBe(250);
    expect(full.unit).toBe("KG");
    expect(full.invoiceUrl).toBe("https://x/i.pdf");
    expect((full.source as { name: string }).name).toBe("Ramesh");
    expect((full.product as { name: string }).name).toBe("Vegetables");
    expect(full.date?.toISOString()).toBe(backDate);

    // A bare expense — no source / product / unit / invoice / date.
    const bare = await M.createExpense(null, { input: { title: "Misc", amount: 30 } }, admin);
    expect(bare.source ?? null).toBeNull();
    expect(bare.product ?? null).toBeNull();
    expect(bare.unit).toBeUndefined();
    expect(bare.date).toBeInstanceOf(Date); // defaulted to now

    const list = await Q.expenses();
    expect(list.length).toBe(2);

    const updated = await M.updateExpense(null, { id: full.id, input: { sourceId: source.id, productId: item.id, title: "Veggies", amount: 300, unit: "KG" } }, admin);
    expect(updated?.title).toBe("Veggies");
    expect(updated?.amount).toBe(300);
    await expect(M.updateExpense(null, { id: MISSING_ID, input: { title: "Z", amount: 1 } }, admin)).rejects.toThrow(/not found/i);

    await M.deleteExpense(null, { id: full.id }, admin);
    expect(await Expense.countDocuments()).toBe(1);
  });

  it("bulk-deletes expenses (and ignores an empty list)", async () => {
    const a = await M.createExpense(null, { input: { title: "A", amount: 1 } }, admin);
    const b = await M.createExpense(null, { input: { title: "B", amount: 2 } }, admin);
    expect(await M.deleteExpenses(null, { ids: [] }, admin)).toBe(0);
    expect(await M.deleteExpenses(null, { ids: [a.id, b.id] }, admin)).toBe(2);
    expect(await Expense.countDocuments()).toBe(0);
  });
});

describe("raw items (expense products)", () => {
  it("rejects non-admin access", async () => {
    await expect(Q.expenseProducts(null, {}, customer)).rejects.toThrow();
    await expect(M.createExpenseProduct(null, { name: "Rice" }, customer)).rejects.toThrow();
  });

  it("creates raw items (default + market price/unit), guarding blank + duplicate names", async () => {
    const rice = await M.createExpenseProduct(null, { name: "  Rice  " }, admin);
    expect(rice.name).toBe("Rice");
    expect(rice.marketPrice).toBe(0);
    expect(rice.priceUnit).toBeUndefined();

    const chicken = await M.createExpenseProduct(null, { name: "Chicken", marketPrice: 240, priceUnit: "KG" }, admin);
    expect(chicken.priceUnit).toBe("KG");

    await expect(M.createExpenseProduct(null, { name: "   " }, admin)).rejects.toThrow(/required/i);
    await expect(M.createExpenseProduct(null, { name: "Rice" }, admin)).rejects.toThrow(/already exists/i);

    expect((await Q.expenseProducts(null, {}, admin)).map((p) => p.name)).toEqual(["Rice", "Chicken"]); // createdAt asc
  });

  it("updates a raw item (set, clear unit, omitted) and guards not-found / blank / duplicate name", async () => {
    const p = await M.createExpenseProduct(null, { name: "Gas", marketPrice: 1100, priceUnit: "Cylinder" }, admin);
    await M.createExpenseProduct(null, { name: "Oil" }, admin);

    const both = await M.updateExpenseProduct(null, { id: p.id, name: "  Gas Cylinder ", marketPrice: 1150, priceUnit: "Piece" }, admin);
    expect(both?.name).toBe("Gas Cylinder");
    expect(both?.marketPrice).toBe(1150);
    expect(both?.priceUnit).toBe("Piece");

    const clearedUnit = await M.updateExpenseProduct(null, { id: p.id, priceUnit: "" }, admin);
    expect(clearedUnit?.priceUnit).toBeUndefined();

    const noop = await M.updateExpenseProduct(null, { id: p.id }, admin);
    expect(noop?.name).toBe("Gas Cylinder");
    expect(noop?.marketPrice).toBe(1150);

    await expect(M.updateExpenseProduct(null, { id: MISSING_ID, name: "x" }, admin)).rejects.toThrow(/not found/i);
    await expect(M.updateExpenseProduct(null, { id: p.id, name: "   " }, admin)).rejects.toThrow(/required/i);
    await expect(M.updateExpenseProduct(null, { id: p.id, name: "Oil" }, admin)).rejects.toThrow(/already exists/i);
  });

  it("deleting a raw item also removes the expenses recorded against it", async () => {
    const p = await M.createExpenseProduct(null, { name: "Packaging" }, admin);
    await M.createExpense(null, { input: { productId: p.id, title: "Packaging", amount: 50 } }, admin);
    await M.createExpense(null, { input: { productId: p.id, title: "Packaging", amount: 60 } }, admin);
    expect(await Expense.countDocuments({ product: p.id })).toBe(2);

    expect(await M.deleteExpenseProduct(null, { id: p.id }, admin)).toBe(true);
    expect(await ExpenseProduct.countDocuments()).toBe(0);
    expect(await Expense.countDocuments({ product: p.id })).toBe(0);
  });
});
