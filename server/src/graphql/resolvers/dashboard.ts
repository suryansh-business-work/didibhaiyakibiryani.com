import { GraphQLError } from "graphql";
import { Order, User, MenuItem, Review, Expense } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";

function customerNotFound(): GraphQLError {
  return new GraphQLError("Customer not found.", { extensions: { code: "BAD_USER_INPUT" } });
}

const REVENUE_STATUSES = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Builds a `$gte`/`$lte` range filter for the given date field. Returns an
 * empty object (no filter ⇒ all-time) when neither bound is provided so the
 * period stats fall back to lifetime figures.
 */
function dateRangeFilter(from: Date | undefined, to: Date | undefined, field: string): Record<string, unknown> {
  const range: Record<string, Date> = {};
  if (from) {
    range.$gte = from;
  }
  if (to) {
    range.$lte = to;
  }
  return Object.keys(range).length > 0 ? { [field]: range } : {};
}

export const dashboardResolvers = {
  Query: {
    reviews: async (_: unknown, { limit }: { limit?: number }) => {
      return Review.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(limit ?? 12)
        .exec();
    },

    customers: async (_: unknown, { search }: { search?: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const filter: Record<string, unknown> = { role: "CUSTOMER" };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }
      return User.find(filter).sort({ createdAt: -1 }).limit(200).exec();
    },

    customersPage: async (_: unknown, page: PageArgs, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return paginate(User, {
        filter: { role: "CUSTOMER" },
        searchFields: ["name", "email", "phone"],
        sortAllow: ["name", "createdAt"],
        ...page,
      });
    },

    dashboardStats: async (
      _: unknown,
      { from, to }: { from?: Date; to?: Date } = {},
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const today = startOfToday();
      const ordersRange = dateRangeFilter(from, to, "placedAt");
      // Expenses report on their effective date: the back-dated `date` when set,
      // else the legacy `createdAt`. Match the range on that computed field.
      const expensesRange = dateRangeFilter(from, to, "effDate");

      const [
        totalOrders,
        revenueAgg,
        todayOrders,
        todayRevenueAgg,
        pendingOrders,
        totalCustomers,
        repeatAgg,
        topItemsAgg,
        revenueByDayAgg,
        recentOrders,
        ratingAgg,
        dishRatingsAgg,
        periodOrders,
        periodRevenueAgg,
        periodExpensesAgg,
        periodMarginAgg,
      ] = await Promise.all([
        Order.countDocuments({ status: { $ne: "CANCELLED" } }),
        Order.aggregate([
          { $match: { status: { $in: REVENUE_STATUSES } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.countDocuments({ placedAt: { $gte: today } }),
        Order.aggregate([
          { $match: { placedAt: { $gte: today }, status: { $in: REVENUE_STATUSES } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.countDocuments({ status: { $in: ["PLACED", "CONFIRMED", "PREPARING"] } }),
        User.countDocuments({ role: "CUSTOMER" }),
        // Repeat customers (all-time): group every non-cancelled order by its
        // unified identity (signed-up user id, else walk-in phone) and count the
        // identities that appear more than once.
        Order.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          { $group: { _id: { $ifNull: ["$user", "$customerPhone"] }, c: { $sum: 1 } } },
          { $match: { _id: { $ne: null }, c: { $gt: 1 } } },
          { $count: "n" },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          { $unwind: "$items" },
          {
            // Group by dish name so the same dish isn't split across different
            // (or missing) menuItem ids.
            $group: {
              _id: "$items.name",
              menuItemId: { $first: "$items.menuItem" },
              qty: { $sum: "$items.qty" },
              revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            },
          },
          { $sort: { qty: -1 } },
          { $limit: 5 },
        ]),
        Order.aggregate([
          {
            $match: {
              status: { $in: REVENUE_STATUSES },
              placedAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$placedAt" } },
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.find().sort({ placedAt: -1 }).limit(8),
        Order.aggregate([
          { $match: { "rating.food": { $exists: true } } },
          {
            $group: {
              _id: null,
              food: { $avg: "$rating.food" },
              delivery: { $avg: "$rating.delivery" },
              count: { $sum: 1 },
            },
          },
        ]),
        // Per-dish overall rating, averaged across every rated order's items.
        Order.aggregate([
          { $match: { "rating.items.0": { $exists: true } } },
          { $unwind: "$rating.items" },
          {
            $group: {
              _id: "$rating.items.name",
              rating: { $avg: "$rating.items.rating" },
              count: { $sum: 1 },
            },
          },
          { $sort: { rating: -1, count: -1 } },
        ]),
        Order.countDocuments({ status: { $ne: "CANCELLED" }, ...ordersRange }),
        Order.aggregate([
          { $match: { status: { $in: REVENUE_STATUSES }, ...ordersRange } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Expense.aggregate([
          { $addFields: { effDate: { $ifNull: ["$date", "$createdAt"] } } },
          { $match: { ...expensesRange } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Cost-of-goods (from each item's snapshot makingCost) and the retail
        // value given away as complimentary, over revenue orders in the range.
        Order.aggregate([
          { $match: { status: { $in: REVENUE_STATUSES }, ...ordersRange } },
          { $unwind: "$items" },
          {
            $group: {
              _id: null,
              cogs: { $sum: { $multiply: [{ $ifNull: ["$items.makingCost", 0] }, "$items.qty"] } },
              complimentary: {
                $sum: {
                  $cond: [{ $eq: ["$items.complimentary", true] }, { $multiply: ["$items.price", "$items.qty"] }, 0],
                },
              },
            },
          },
        ]),
      ]);

      const periodRevenue = periodRevenueAgg[0]?.total ?? 0;
      const periodExpenses = periodExpensesAgg[0]?.total ?? 0;
      // Profit is the menu-finance gross margin: revenue minus cost-of-goods.
      // Operating expenses are reported separately, NOT subtracted here.
      const periodCogs = periodMarginAgg[0]?.cogs ?? 0;
      const periodComplimentary = periodMarginAgg[0]?.complimentary ?? 0;
      const periodProfit = periodRevenue - periodCogs;

      const totalRevenue = revenueAgg[0]?.total ?? 0;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const r = ratingAgg[0];
      const avgFoodRating = r ? Math.round(r.food * 10) / 10 : 0;
      const avgDeliveryRating = r ? Math.round(r.delivery * 10) / 10 : 0;
      const ratingCount = r?.count ?? 0;

      return {
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue: todayRevenueAgg[0]?.total ?? 0,
        pendingOrders,
        totalCustomers,
        repeatCustomers: repeatAgg[0]?.n ?? 0,
        avgOrderValue,
        avgFoodRating,
        avgDeliveryRating,
        ratingCount,
        periodOrders,
        periodRevenue,
        periodExpenses,
        periodProfit,
        periodComplimentary,
        dishRatings: dishRatingsAgg.map((d) => ({
          name: d._id,
          rating: Math.round(d.rating * 10) / 10,
          count: d.count,
        })),
        topItems: topItemsAgg.map((t) => ({
          menuItemId: t.menuItemId,
          name: t._id,
          qty: t.qty,
          revenue: t.revenue,
        })),
        revenueByDay: revenueByDayAgg.map((r) => ({
          date: r._id,
          revenue: r.revenue,
          orders: r.orders,
        })),
        recentOrders,
      };
    },
  },

  Mutation: {
    updateCustomer: async (
      _: unknown,
      { id, name, phone }: { id: string; name?: string; phone?: string },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN");
      const user = await User.findById(id).exec();
      if (!user || user.role !== "CUSTOMER") throw customerNotFound();
      if (name !== undefined) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      await user.save();
      return user;
    },

    deleteCustomer: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const user = await User.findById(id).exec();
      if (!user || user.role !== "CUSTOMER") throw customerNotFound();
      await User.findByIdAndDelete(id).exec();
      return true;
    },

    deleteCustomers: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      // Scoped to CUSTOMER so staff/admin accounts can't be removed via this path.
      const res = await User.deleteMany({ _id: { $in: ids }, role: "CUSTOMER" }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },

  // Field resolvers that need DB lookups
  User: {
    orderCount: (parent: { id?: string; _id?: unknown }) =>
      Order.countDocuments({ user: parent.id ?? parent._id }).exec(),
    /* v8 ignore next 4 -- object/string id paths both exercised; defensive ternary */
    totalSpent: async (parent: { id?: string; _id?: unknown }) => {
      const agg = await Order.aggregate([
        {
          $match: {
            user: typeof parent._id === "object" ? parent._id : parent.id,
            status: { $in: REVENUE_STATUSES },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      return agg[0]?.total ?? 0;
    },
  },

  TopItem: {
    menuItem: (parent: { menuItemId?: unknown }) =>
      parent.menuItemId ? MenuItem.findById(parent.menuItemId as string).exec() : null,
  },

  OrderItem: {
    menuItem: (parent: { menuItem?: unknown }) =>
      parent.menuItem ? MenuItem.findById(parent.menuItem as string).exec() : null,
  },
};
