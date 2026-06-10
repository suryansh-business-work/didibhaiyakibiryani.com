import { DateTime } from "./scalars.js";
import { authResolvers } from "./auth.js";
import { menuResolvers } from "./menu.js";
import { couponResolvers } from "./coupon.js";
import { orderResolvers } from "./order.js";
import { dashboardResolvers } from "./dashboard.js";

export const resolvers = {
  DateTime,

  Query: {
    ...authResolvers.Query,
    ...menuResolvers.Query,
    ...couponResolvers.Query,
    ...orderResolvers.Query,
    ...dashboardResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...menuResolvers.Mutation,
    ...couponResolvers.Mutation,
    ...orderResolvers.Mutation,
  },

  // Field resolvers
  Category: menuResolvers.Category,
  MenuItem: menuResolvers.MenuItem,
  Coupon: couponResolvers.Coupon,
  Order: orderResolvers.Order,
  OrderItem: dashboardResolvers.OrderItem,
  TopItem: dashboardResolvers.TopItem,
  User: dashboardResolvers.User,
};
