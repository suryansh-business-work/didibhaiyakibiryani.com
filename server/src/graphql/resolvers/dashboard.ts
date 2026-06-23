import { GraphQLError } from "graphql";
import { Order, User, MenuItem, Review } from "../../models/index.js";
import { requireRole, type Context } from "../../utils/auth.js";

function customerNotFound(): GraphQLError {
  return new GraphQLError("Customer not found.", { extensions: { code: "BAD_USER_INPUT" } });
}

const REVENUE_STATUSES = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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

    dashboardStats: async (_: unknown, __: unknown, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const today = startOfToday();

      const [
        totalOrders,
        revenueAgg,
        todayOrders,
        todayRevenueAgg,
        pendingOrders,
        totalCustomers,
        topItemsAgg,
        revenueByDayAgg,
        recentOrders,
        ratingAgg,
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
        Order.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.menuItem",
              name: { $first: "$items.name" },
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
      ]);

      const totalRevenue = revenueAgg[0]?.total ?? 0;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const r = ratingAgg[0];
      const avgRating = r ? Math.round(((r.food + r.delivery) / 2) * 10) / 10 : 0;
      const ratingCount = r?.count ?? 0;

      return {
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue: todayRevenueAgg[0]?.total ?? 0,
        pendingOrders,
        totalCustomers,
        avgOrderValue,
        avgRating,
        ratingCount,
        topItems: topItemsAgg.map((t) => ({
          menuItemId: t._id,
          name: t.name,
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
