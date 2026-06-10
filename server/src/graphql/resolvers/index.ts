import { DateTime } from "./scalars.js";
import { authResolvers } from "./auth.js";
import { menuResolvers } from "./menu.js";
import { couponResolvers } from "./coupon.js";
import { orderResolvers } from "./order.js";
import { dashboardResolvers } from "./dashboard.js";
import { settingsResolvers } from "./settings.js";
import { paymentResolvers } from "./payment.js";
import { passwordResetResolvers } from "./passwordReset.js";
import { campaignResolvers } from "./campaign.js";

export const resolvers = {
  DateTime,

  Query: {
    ...authResolvers.Query,
    ...menuResolvers.Query,
    ...couponResolvers.Query,
    ...orderResolvers.Query,
    ...dashboardResolvers.Query,
    ...settingsResolvers.Query,
    ...paymentResolvers.Query,
    ...campaignResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...menuResolvers.Mutation,
    ...couponResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...passwordResetResolvers.Mutation,
    ...campaignResolvers.Mutation,
  },

  // Field resolvers
  Category: menuResolvers.Category,
  MenuItem: menuResolvers.MenuItem,
  Coupon: couponResolvers.Coupon,
  Order: orderResolvers.Order,
  OrderItem: dashboardResolvers.OrderItem,
  TopItem: dashboardResolvers.TopItem,
  User: dashboardResolvers.User,
  Payment: paymentResolvers.Payment,
};
