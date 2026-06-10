import { GraphQLError } from "graphql";
import { Order, MenuItem, Coupon, User } from "../../models/index.js";
import { requireAuth, requireRole, type Context } from "../../utils/auth.js";
import { evaluateCoupon, deliveryFeeFor } from "../../utils/pricing.js";
import { genOrderNumber } from "../../utils/helpers.js";
import { sendMailAsync } from "../../utils/mailer.js";
import { orderConfirmedEmail, orderDeliveredEmail } from "../../emails/order.js";
import { loadEmailBrand } from "../../emails/marketing.js";
import type { IOrder, OrderStatus } from "../../models/index.js";

const APP_URL = process.env.PUBLIC_ORDER_URL || "https://native.didibhaiyakibiryani.com";

function notifyOrderEmail(order: IOrder, kind: "CONFIRMED" | "DELIVERED"): void {
  Promise.all([User.findById(order.user).exec(), loadEmailBrand()])
    .then(([customer, brand]) => {
      if (!customer?.email) return;
      const url = `${APP_URL}/order/${order.id}`;
      const content =
        kind === "CONFIRMED"
          ? orderConfirmedEmail(brand, customer.name, order, url)
          : orderDeliveredEmail(brand, customer.name, order, APP_URL);
      sendMailAsync({ to: customer.email, ...content });
    })
    .catch(() => undefined);
}

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
      if (!input.items?.length) {
        throw new GraphQLError("Your cart is empty.", { extensions: { code: "BAD_USER_INPUT" } });
      }

      // Resolve items from DB (never trust client prices).
      const ids = input.items.map((i) => i.menuItemId);
      const dbItems = await MenuItem.find({ _id: { $in: ids } });
      const map = new Map(dbItems.map((d) => [d.id, d]));

      const orderItems = input.items.map((ci) => {
        const dbItem = map.get(ci.menuItemId);
        if (!dbItem) throw new GraphQLError(`An item in your cart is unavailable.`);
        if (!dbItem.isAvailable)
          throw new GraphQLError(`“${dbItem.name}” is currently unavailable.`);
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

      // Coupon
      let discount = 0;
      let deliveryFee = deliveryFeeFor(subtotal);
      let couponCode: string | undefined;
      let appliedCoupon = null;

      if (input.couponCode) {
        appliedCoupon = await Coupon.findOne({ code: input.couponCode.toUpperCase().trim() });
        const isFirstOrder = (await Order.countDocuments({ user: u.id })) === 0;
        const evalResult = evaluateCoupon(appliedCoupon, subtotal, {
          isFirstOrder,
          fromApp: true,
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
        paymentMethod: input.paymentMethod ?? "COD",
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
      requireRole(ctx, "ADMIN", "STAFF", "DELIVERY");
      const order = await Order.findById(id);
      if (!order) throw new GraphQLError("Order not found.");
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
  },

  Order: {
    user: (parent: { user: unknown }) => {
      const usr = parent.user as { name?: string } | string | null;
      if (usr && typeof usr === "object" && "name" in usr && usr.name) return usr;
      return usr ? User.findById(usr as string).exec() : null;
    },
  },
};
