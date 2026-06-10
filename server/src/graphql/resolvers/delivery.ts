import { GraphQLError } from "graphql";
import { Order, User } from "../../models/index.js";
import { requireRole, hashPassword, type Context } from "../../utils/auth.js";
import { logger } from "../../utils/logger.js";
import type { Role } from "../../models/index.js";

/** Statuses a rider still has work to do on. */
const ACTIVE_STATUSES = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];

interface CreateStaffArgs {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
}

export const deliveryResolvers = {
  Query: {
    /** Delivery partners for the admin assignment dropdown. */
    riders: async (_: unknown, __: unknown, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      return User.find({ role: "DELIVERY", isActive: true }).sort({ name: 1 }).exec();
    },

    /** The signed-in rider's active queue. */
    deliveryQueue: async (_: unknown, __: unknown, ctx: Context) => {
      const u = requireRole(ctx, "DELIVERY");
      return Order.find({ deliveryPartner: u.id, status: { $in: ACTIVE_STATUSES } })
        .sort({ placedAt: 1 })
        .exec();
    },

    /** The signed-in rider's delivered orders (earnings history). */
    myDeliveries: async (_: unknown, { limit }: { limit?: number }, ctx: Context) => {
      const u = requireRole(ctx, "DELIVERY");
      return Order.find({ deliveryPartner: u.id, status: "DELIVERED" })
        .sort({ placedAt: -1 })
        .limit(Math.min(limit ?? 50, 200))
        .exec();
    },
  },

  Mutation: {
    assignDeliveryPartner: async (
      _: unknown,
      { orderId, riderId }: { orderId: string; riderId: string },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const [order, rider] = await Promise.all([
        Order.findById(orderId).exec(),
        User.findById(riderId).exec(),
      ]);
      if (!order) throw new GraphQLError("Order not found.");
      if (!rider || rider.role !== "DELIVERY") {
        throw new GraphQLError("Selected user is not a delivery partner.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (["DELIVERED", "CANCELLED"].includes(order.status)) {
        throw new GraphQLError(`Cannot assign a rider to a ${order.status.toLowerCase()} order.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      order.deliveryPartner = rider._id;
      await order.save();
      logger.info({ orderId, riderId }, "Delivery partner assigned");
      return order;
    },

    /** Admin creates staff / delivery accounts (riders sign in on the delivery portal). */
    createStaffUser: async (_: unknown, args: CreateStaffArgs, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!["STAFF", "DELIVERY"].includes(args.role)) {
        throw new GraphQLError("Role must be STAFF or DELIVERY.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (args.password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const email = args.email.toLowerCase().trim();
      const exists = await User.findOne({ email }).exec();
      if (exists) {
        throw new GraphQLError("An account with this email already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const user = await User.create({
        name: args.name.trim(),
        email,
        phone: args.phone?.trim(),
        passwordHash: await hashPassword(args.password),
        role: args.role,
      });
      logger.info({ userId: user.id, role: args.role }, "Staff user created");
      return user;
    },
  },
};
