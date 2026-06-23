import { GraphQLError } from "graphql";
import { Expense, ExpenseSource, type ExpenseSourceType } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";

interface ExpenseSourceInput {
  type: ExpenseSourceType;
  name: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  note?: string;
  isActive?: boolean;
}

interface ExpenseInput {
  sourceId: string;
  title: string;
  amount: number;
  note?: string;
}

function expenseFields(input: ExpenseInput) {
  return { source: input.sourceId, title: input.title, amount: input.amount, note: input.note };
}

export const expenseResolvers = {
  Query: {
    expenseSources: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      const filter = activeOnly ? { isActive: true } : {};
      return ExpenseSource.find(filter).sort({ createdAt: -1 }).exec();
    },

    expenses: async () => Expense.find().sort({ createdAt: -1 }).populate("source").exec(),
  },

  Mutation: {
    createExpenseSource: async (_: unknown, { input }: { input: ExpenseSourceInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return ExpenseSource.create(input);
    },

    updateExpenseSource: async (
      _: unknown,
      { id, input }: { id: string; input: ExpenseSourceInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const source = await ExpenseSource.findByIdAndUpdate(id, input, { new: true });
      if (!source) throw new GraphQLError("Expense source not found.");
      return source;
    },

    deleteExpenseSource: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await ExpenseSource.findByIdAndDelete(id);
      return true;
    },

    createExpense: async (_: unknown, { input }: { input: ExpenseInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const expense = await Expense.create(expenseFields(input));
      return expense.populate("source");
    },

    updateExpense: async (_: unknown, { id, input }: { id: string; input: ExpenseInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const expense = await Expense.findByIdAndUpdate(id, expenseFields(input), { new: true }).populate("source");
      if (!expense) throw new GraphQLError("Expense not found.");
      return expense;
    },

    deleteExpense: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await Expense.findByIdAndDelete(id);
      return true;
    },
  },
};
