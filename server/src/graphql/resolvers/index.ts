import { DateTime } from "./scalars.js";
import { authResolvers } from "./auth.js";
import { menuResolvers } from "./menu.js";
import { couponResolvers } from "./coupon.js";
import { orderResolvers } from "./order.js";
import { dashboardResolvers } from "./dashboard.js";
import { settingsResolvers } from "./settings.js";
import { integrationResolvers } from "./integrations.js";
import { paymentResolvers } from "./payment.js";
import { passwordResetResolvers } from "./passwordReset.js";
import { campaignResolvers } from "./campaign.js";
import { deliveryResolvers } from "./delivery.js";
import { uploadResolvers } from "./upload.js";
import { supportResolvers } from "./support.js";
import { adminAccessResolvers } from "./adminAccess.js";

export const resolvers = {
  DateTime,

  Query: {
    ...authResolvers.Query,
    ...menuResolvers.Query,
    ...couponResolvers.Query,
    ...orderResolvers.Query,
    ...dashboardResolvers.Query,
    ...settingsResolvers.Query,
    ...integrationResolvers.Query,
    ...paymentResolvers.Query,
    ...campaignResolvers.Query,
    ...deliveryResolvers.Query,
    ...supportResolvers.Query,
    ...adminAccessResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...menuResolvers.Mutation,
    ...couponResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...integrationResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...passwordResetResolvers.Mutation,
    ...campaignResolvers.Mutation,
    ...deliveryResolvers.Mutation,
    ...uploadResolvers.Mutation,
    ...supportResolvers.Mutation,
    ...adminAccessResolvers.Mutation,
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
  Settings: settingsResolvers.Settings,
  SupportTicket: supportResolvers.SupportTicket,
};
