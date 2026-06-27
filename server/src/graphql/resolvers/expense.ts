import { GraphQLError } from "graphql";
import { Expense, ExpenseSource, ExpenseProduct, type ExpenseSourceType } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";

function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

interface ExpenseSourceInput {
  type: ExpenseSourceType;
  name: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  note?: string;
  color?: string;
  isActive?: boolean;
}

interface ExpenseInput {
  sourceId?: string;
  productId?: string;
  title: string;
  amount: number;
  unit?: string;
  note?: string;
  invoiceUrl?: string;
  date?: string;
}

function expenseFields(input: ExpenseInput) {
  return {
    source: input.sourceId || undefined,
    product: input.productId || undefined,
    title: input.title,
    amount: input.amount,
    unit: input.unit?.trim() || undefined,
    note: input.note,
    invoiceUrl: input.invoiceUrl?.trim() || undefined,
    // undefined → mongoose `default: now` on create; ignored by
    // findByIdAndUpdate on update, so the date only changes when supplied.
    date: input.date ? new Date(input.date) : undefined,
  };
}

const EXPENSE_POPULATE = ["source", "product"];

export const expenseResolvers = {
  Query: {
    expenseSources: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      const filter = activeOnly ? { isActive: true } : {};
      return ExpenseSource.find(filter).sort({ createdAt: -1 }).exec();
    },

    expenses: async () => Expense.find().sort({ createdAt: -1 }).populate(EXPENSE_POPULATE).exec(),

    expensesPage: async (
      _: unknown,
      { sourceId, productId, from, to, ...page }: PageArgs & { sourceId?: string; productId?: string; from?: Date; to?: Date },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const filter: Record<string, unknown> = {};
      if (sourceId) {
        filter.source = sourceId;
      }
      if (productId) {
        filter.product = productId;
      }
      if (from || to) {
        const range: Record<string, Date> = {};
        if (from) {
          range.$gte = from;
        }
        if (to) {
          range.$lte = to;
        }
        filter.date = range;
      }
      return paginate(Expense, {
        filter,
        searchFields: ["title"],
        sortAllow: ["amount", "createdAt", "title", "date"],
        defaultSort: "date",
        populate: EXPENSE_POPULATE,
        ...page,
      });
    },

    // Raw items / materials, oldest first.
    expenseProducts: async (_: unknown, __: unknown, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return ExpenseProduct.find().sort({ createdAt: 1 }).exec();
    },
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

    deleteExpenseSources: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await ExpenseSource.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },

    createExpense: async (_: unknown, { input }: { input: ExpenseInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const expense = await Expense.create(expenseFields(input));
      return expense.populate(EXPENSE_POPULATE);
    },

    updateExpense: async (_: unknown, { id, input }: { id: string; input: ExpenseInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const expense = await Expense.findByIdAndUpdate(id, expenseFields(input), { new: true }).populate(EXPENSE_POPULATE);
      if (!expense) throw new GraphQLError("Expense not found.");
      return expense;
    },

    deleteExpense: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      await Expense.findByIdAndDelete(id);
      return true;
    },

    deleteExpenses: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await Expense.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },

    createExpenseProduct: async (
      _: unknown,
      { name, marketPrice, priceUnit }: { name: string; marketPrice?: number; priceUnit?: string },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const trimmed = name.trim();
      if (!trimmed) throw badInput("Raw item name is required.");
      const exists = await ExpenseProduct.findOne({ name: trimmed });
      if (exists) throw badInput("A raw item with this name already exists.");
      return ExpenseProduct.create({ name: trimmed, marketPrice, priceUnit });
    },

    updateExpenseProduct: async (
      _: unknown,
      { id, name, marketPrice, priceUnit }: { id: string; name?: string; marketPrice?: number; priceUnit?: string },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const product = await ExpenseProduct.findById(id);
      if (!product) throw badInput("Raw item not found.");
      if (name !== undefined) {
        const trimmed = name.trim();
        if (!trimmed) throw badInput("Raw item name is required.");
        const clash = await ExpenseProduct.findOne({ name: trimmed, _id: { $ne: id } });
        if (clash) throw badInput("A raw item with this name already exists.");
        product.name = trimmed;
      }
      if (marketPrice !== undefined) product.marketPrice = marketPrice;
      if (priceUnit !== undefined) product.priceUnit = priceUnit.trim() || undefined;
      await product.save();
      return product;
    },

    deleteExpenseProduct: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      // Removing a raw item also clears the recorded expenses that referenced it.
      await Expense.deleteMany({ product: id });
      await ExpenseProduct.findByIdAndDelete(id);
      return true;
    },
  },
};
