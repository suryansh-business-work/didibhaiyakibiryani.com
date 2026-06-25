import { describe, it, expect } from "vitest";
import { useTestDb, ctxFor } from "../helpers/db";
import { expenseResolvers } from "../../src/graphql/resolvers/expense";
import { Expense, ExpenseSource } from "../../src/models/index.js";

useTestDb();
const admin = ctxFor("admin1", "ADMIN");
const customer = ctxFor("cust1", "CUSTOMER");

const MISSING_ID = "651111111111111111111111";

describe("expense source resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(
      expenseResolvers.Mutation.createExpenseSource(
        null,
        { input: { type: "PERSON", name: "X" } },
        customer
      )
    ).rejects.toThrow();
  });

  it("CRUD + activeOnly filter + not-found guard", async () => {
    const person = await expenseResolvers.Mutation.createExpenseSource(
      null,
      { input: { type: "PERSON", name: "Ramesh", phone: "9990001111" } },
      admin
    );
    await expenseResolvers.Mutation.createExpenseSource(
      null,
      {
        input: {
          type: "ACCOUNT",
          name: "Cash Account",
          bankName: "HDFC",
          accountNumber: "1234567890",
          ifsc: "HDFC0001",
          isActive: false,
        },
      },
      admin
    );

    const all = await expenseResolvers.Query.expenseSources(null, {});
    const onlyActive = await expenseResolvers.Query.expenseSources(null, { activeOnly: true });
    expect(all.length).toBe(2);
    expect(onlyActive.length).toBe(1);

    const updated = await expenseResolvers.Mutation.updateExpenseSource(
      null,
      { id: person.id, input: { type: "PERSON", name: "Ramesh Kumar" } },
      admin
    );
    expect(updated?.name).toBe("Ramesh Kumar");
    await expect(
      expenseResolvers.Mutation.updateExpenseSource(
        null,
        { id: MISSING_ID, input: { type: "PERSON", name: "Z" } },
        admin
      )
    ).rejects.toThrow(/not found/i);

    await expenseResolvers.Mutation.deleteExpenseSource(null, { id: person.id }, admin);
    expect(await ExpenseSource.countDocuments()).toBe(1);
  });
});

describe("expense resolver", () => {
  it("rejects non-admin mutations", async () => {
    await expect(
      expenseResolvers.Mutation.createExpense(
        null,
        { input: { sourceId: MISSING_ID, title: "X", amount: 10 } },
        customer
      )
    ).rejects.toThrow();
  });

  it("CRUD with populated source + not-found guard", async () => {
    const source = await expenseResolvers.Mutation.createExpenseSource(
      null,
      { input: { type: "PERSON", name: "Ramesh" } },
      admin
    );

    const backDate = "2026-03-10T00:00:00.000Z";
    const expense = await expenseResolvers.Mutation.createExpense(
      null,
      { input: { sourceId: source.id, title: "Vegetables", amount: 250, note: "weekly", date: backDate } },
      admin
    );
    expect(expense.amount).toBe(250);
    expect((expense.source as { name: string }).name).toBe("Ramesh");
    // The supplied back-date is stored on `date` (not the auto createdAt).
    expect(expense.date?.toISOString()).toBe(backDate);

    const list = await expenseResolvers.Query.expenses();
    expect(list.length).toBe(1);
    expect((list[0].source as { name: string }).name).toBe("Ramesh");

    const updated = await expenseResolvers.Mutation.updateExpense(
      null,
      { id: expense.id, input: { sourceId: source.id, title: "Veggies", amount: 300 } },
      admin
    );
    expect(updated?.title).toBe("Veggies");
    expect(updated?.amount).toBe(300);
    await expect(
      expenseResolvers.Mutation.updateExpense(
        null,
        { id: MISSING_ID, input: { sourceId: source.id, title: "Z", amount: 1 } },
        admin
      )
    ).rejects.toThrow(/not found/i);

    await expenseResolvers.Mutation.deleteExpense(null, { id: expense.id }, admin);
    expect(await Expense.countDocuments()).toBe(0);
  });
});
