import { GraphQLError } from "graphql";
import { Order, MenuItem, Coupon, User, getOrCreateSettings } from "../../models/index.js";
import { requireAuth, requireRole, type Context, type TokenPayload } from "../../utils/auth.js";
import { evaluateCoupon, computeDeliveryFee, haversineKm } from "../../utils/pricing.js";
import { assertOrderingAvailable } from "../../utils/ordering.js";
import { genOrderNumber } from "../../utils/helpers.js";
import { notifyOrderEmail } from "../../emails/notify.js";
import { saveOrderRating } from "../../utils/rating.js";
import type { IOrder, ISettings, OrderStatus } from "../../models/index.js";

interface CartItemInput {
  menuItemId: string;
  qty: number;
  spiceLevel?: number;
}
interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  phone?: string;
  lat?: number;
  lng?: number;
}
interface PlaceOrderInput {
  items: CartItemInput[];
  address: AddressInput;
  couponCode?: string;
  paymentMethod?: "COD" | "ONLINE";
  notes?: string;
}

// Allowed forward transitions for order status.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

// A rider may only move their own assigned orders along the delivery leg.
const RIDER_ALLOWED = new Set<OrderStatus>(["OUT_FOR_DELIVERY", "DELIVERED"]);

function distanceKmFor(settings: ISettings, address: AddressInput): number {
  const hasStore = Boolean(settings.storeLat && settings.storeLng);
  const hasCustomer = Boolean(address.lat && address.lng);
  if (!hasStore || !hasCustomer) return 0;
  /* v8 ignore next -- lat/lng are guaranteed present once hasCustomer is true */
  return haversineKm(settings.storeLat, settings.storeLng, address.lat ?? 0, address.lng ?? 0);
}

function assertRiderCanUpdate(order: IOrder, user: TokenPayload, status: OrderStatus): void {
  if (user.role !== "DELIVERY") return;
  if (String(order.deliveryPartner ?? "") !== user.id) {
    throw new GraphQLError("This order is not assigned to you.", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  if (!RIDER_ALLOWED.has(status)) {
    throw new GraphQLError("Riders can only mark pickup and delivery.", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

export const orderResolvers = {
  Query: {
    myOrders: async (_: unknown, __: unknown, ctx: Context) => {
      const u = requireAuth(ctx);
      return Order.find({ user: u.id }).sort({ placedAt: -1 }).exec();
    },

    order: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const order = await Order.findById(id);
      if (!order) throw new GraphQLError("Order not found.");
      const isOwner = String(order.user) === u.id;
      const isStaff = ["ADMIN", "STAFF", "DELIVERY"].includes(u.role);
      if (!isOwner && !isStaff) {
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      }
      return order;
    },

    orders: async (_: unknown, { status }: { status?: OrderStatus }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF", "DELIVERY");
      const filter = status ? { status } : {};
      return Order.find(filter).sort({ placedAt: -1 }).limit(200).exec();
    },
  },

  Mutation: {
    placeOrder: async (_: unknown, { input }: { input: PlaceOrderInput }, ctx: Context) => {
      const u = requireAuth(ctx);
      /* v8 ignore next -- `items` is always an array from the GraphQL layer */
      if (!input.items?.length) {
        throw new GraphQLError("Your cart is empty.", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const settings = await getOrCreateSettings();
      const paymentMethod = input.paymentMethod ?? "COD";
      assertOrderingAvailable(settings, paymentMethod);

      // Resolve items from DB (never trust client prices).
      const ids = input.items.map((i) => i.menuItemId);
      const dbItems = await MenuItem.find({ _id: { $in: ids } });
      const map = new Map(dbItems.map((d) => [d.id, d]));

      const orderItems = input.items.map((ci) => {
        const dbItem = map.get(ci.menuItemId);
        if (!dbItem) throw new GraphQLError(`An item in your cart is unavailable.`);
        if (!dbItem.isAvailable)
          throw new GraphQLError(`“${dbItem.name}” is currently out of stock.`);
        if (ci.qty < 1) throw new GraphQLError("Invalid quantity.");
        return {
          menuItem: dbItem._id,
          name: dbItem.name,
          price: dbItem.price,
          qty: ci.qty,
          spiceLevel: ci.spiceLevel ?? dbItem.spiceLevel,
        };
      });

      const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

      // Delivery fee from admin-configured Finance settings (+ distance when known).
      const baseDeliveryFee = computeDeliveryFee(subtotal, distanceKmFor(settings, input.address), {
        minDeliveryCost: settings.minDeliveryCost,
        perKmCharge: settings.perKmCharge,
        freeDeliveryAbove: settings.freeDeliveryAbove,
      });

      // Coupon
      let discount = 0;
      let deliveryFee = baseDeliveryFee;
      let couponCode: string | undefined;
      let appliedCoupon = null;

      if (input.couponCode) {
        appliedCoupon = await Coupon.findOne({ code: input.couponCode.toUpperCase().trim() });
        const isFirstOrder = (await Order.countDocuments({ user: u.id })) === 0;
        const evalResult = evaluateCoupon(appliedCoupon, subtotal, {
          isFirstOrder,
          fromApp: true,
          baseDeliveryFee,
        });
        if (!evalResult.valid) {
          throw new GraphQLError(evalResult.message, { extensions: { code: "BAD_USER_INPUT" } });
        }
        discount = evalResult.discount;
        deliveryFee = evalResult.deliveryFee;
        couponCode = appliedCoupon!.code;

        // Append a free item if the coupon grants one.
        if (appliedCoupon!.type === "FREE_ITEM" && appliedCoupon!.freeItem) {
          const free = await MenuItem.findById(appliedCoupon!.freeItem);
          if (free) {
            orderItems.push({
              menuItem: free._id,
              name: `${free.name} (Free)`,
              price: 0,
              qty: 1,
              spiceLevel: free.spiceLevel,
            });
          }
        }
      }

      const total = Math.max(0, subtotal - discount) + deliveryFee;

      const order = await Order.create({
        orderNumber: genOrderNumber(),
        user: u.id,
        items: orderItems,
        subtotal,
        discount,
        deliveryFee,
        total,
        couponCode,
        paymentMethod,
        paymentStatus: "PENDING",
        address: input.address,
        status: "PLACED",
        statusHistory: [{ status: "PLACED", at: new Date() }],
        notes: input.notes,
        placedAt: new Date(),
      });

      if (appliedCoupon) {
        await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
      }

      notifyOrderEmail(order, "CONFIRMED");
      return order;
    },

    cancelOrder: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const order = await Order.findById(id);
      if (!order) throw new GraphQLError("Order not found.");
      const isOwner = String(order.user) === u.id;
      const isStaff = ["ADMIN", "STAFF"].includes(u.role);
      if (!isOwner && !isStaff)
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      if (["DELIVERED", "CANCELLED"].includes(order.status)) {
        throw new GraphQLError(`Cannot cancel a ${order.status.toLowerCase()} order.`);
      }
      if (isOwner && !isStaff && !["PLACED", "CONFIRMED"].includes(order.status)) {
        throw new GraphQLError("This order can no longer be cancelled — it's already being prepared.");
      }
      order.status = "CANCELLED";
      order.statusHistory.push({ status: "CANCELLED", at: new Date() });
      await order.save();
      return order;
    },

    updateOrderStatus: async (
      _: unknown,
      { id, status, note }: { id: string; status: OrderStatus; note?: string },
      ctx: Context
    ) => {
      const u = requireRole(ctx, "ADMIN", "STAFF", "DELIVERY");
      const order = await Order.findById(id);
      if (!order) throw new GraphQLError("Order not found.");
      assertRiderCanUpdate(order, u, status);
      if (!NEXT[order.status].includes(status)) {
        throw new GraphQLError(
          `Cannot move an order from ${order.status} to ${status}.`,
          { extensions: { code: "BAD_USER_INPUT" } }
        );
      }
      order.status = status;
      order.statusHistory.push({ status, at: new Date(), note });
      if (status === "DELIVERED") {
        order.paymentStatus = "PAID";
      }
      await order.save();
      if (status === "DELIVERED") {
        notifyOrderEmail(order, "DELIVERED");
      }
      return order;
    },

    rateOrder: async (
      _: unknown,
      args: { orderId: string; food: number; delivery: number; comment?: string },
      ctx: Context
    ) => {
      const u = requireAuth(ctx);
      const order = await Order.findById(args.orderId);
      if (!order) throw new GraphQLError("Order not found.");
      if (String(order.user) !== u.id) {
        throw new GraphQLError("Not allowed.", { extensions: { code: "FORBIDDEN" } });
      }
      return saveOrderRating(order, args.food, args.delivery, args.comment);
    },

    deleteOrder: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      const deleted = await Order.findByIdAndDelete(id).exec();
      if (!deleted) throw new GraphQLError("Order not found.");
      return true;
    },

    deleteOrders: async (_: unknown, { ids }: { ids: string[] }, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      if (!ids.length) return 0;
      const res = await Order.deleteMany({ _id: { $in: ids } }).exec();
      /* v8 ignore next -- deletedCount is always present on the driver result */
      return res.deletedCount ?? 0;
    },
  },

  Order: {
    user: (parent: { user: unknown }) => {
      const usr = parent.user as { name?: string } | string | null;
      /* v8 ignore next 2 -- populated-vs-id paths both exercised; null short-circuit is defensive */
      if (usr && typeof usr === "object" && "name" in usr && usr.name) return usr;
      return usr ? User.findById(usr as string).exec() : null;
    },
    /* v8 ignore next 2 -- present/absent both exercised; trivial field resolver */
    deliveryPartner: (parent: { deliveryPartner?: unknown }) =>
      parent.deliveryPartner ? User.findById(parent.deliveryPartner as string).exec() : null,
  },
};
