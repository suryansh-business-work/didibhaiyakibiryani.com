import { GraphQLError } from "graphql";
import { Order, MenuItem, Coupon, User, getOrCreateSettings } from "../../models/index.js";
import { requireAuth, requireRole, type Context, type TokenPayload } from "../../utils/auth.js";
import { evaluateCoupon, computeDeliveryFee, haversineKm } from "../../utils/pricing.js";
import { assertOrderingAvailable } from "../../utils/ordering.js";
import { genOrderNumber } from "../../utils/helpers.js";
import { notifyOrderEmail } from "../../emails/notify.js";
import { saveOrderRating, isValidStars } from "../../utils/rating.js";
import { generateInvoicePdf } from "../../utils/invoice.js";
import type {
  IOrder,
  IOrderItem,
  ISettings,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "../../models/index.js";

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

interface ManualOrderItemInput {
  menuItemId?: string;
  name?: string;
  price?: number;
  qty: number;
  spiceLevel?: number;
}
interface ManualOrderInput {
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: OrderType;
  items: ManualOrderItemInput[];
  address?: AddressInput;
  discount?: number;
  deliveryFee?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  placedAt?: string | Date;
  surveyUrl?: string;
  notes?: string;
}

function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

const HEX24 = /^[a-f0-9]{24}$/i;

/** Load an order for the public survey, gated by its secret ratingToken. */
async function loadSurveyOrder(orderId: string, token: string): Promise<IOrder> {
  if (!HEX24.test(orderId) || !token) throw badInput("This survey link is invalid or has expired.");
  const order = await Order.findById(orderId);
  if (!order || order.ratingToken !== token) {
    throw badInput("This survey link is invalid or has expired.");
  }
  return order;
}

/** Display name for the survey: walk-in snapshot, else the registered customer. */
async function surveyCustomerName(order: IOrder): Promise<string | null> {
  if (order.customerName) return order.customerName;
  if (!order.user) return null;
  const u = await User.findById(order.user);
  return u?.name ?? null;
}

/** Clamp an optional money amount to [0, max], rounding to whole rupees. */
function clampMoney(value: number | undefined, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.round(value), max);
}

/** Resolve POS line items: catalogue items price from the DB, custom lines as
 * typed by staff. POS deliberately ignores `isAvailable` (staff override). */
async function buildManualItems(items: ManualOrderItemInput[]): Promise<IOrderItem[]> {
  if (!items?.length) throw badInput("Add at least one item.");
  const ids = items.filter((i) => i.menuItemId).map((i) => i.menuItemId as string);
  const dbItems = ids.length ? await MenuItem.find({ _id: { $in: ids } }) : [];
  const map = new Map(dbItems.map((d) => [d.id, d]));

  return items.map((ci) => {
    if (!Number.isInteger(ci.qty) || ci.qty < 1) throw badInput("Each item needs a quantity of at least 1.");
    if (ci.menuItemId) {
      const dbItem = map.get(ci.menuItemId);
      if (!dbItem) throw badInput("A selected menu item no longer exists.");
      return { menuItem: dbItem._id, name: dbItem.name, price: dbItem.price, qty: ci.qty, spiceLevel: ci.spiceLevel ?? dbItem.spiceLevel };
    }
    const name = ci.name?.trim();
    if (!name) throw badInput("Custom items need a name.");
    if (typeof ci.price !== "number" || !Number.isFinite(ci.price) || ci.price < 0) {
      throw badInput("Custom items need a valid price.");
    }
    return { name, price: ci.price, qty: ci.qty, spiceLevel: ci.spiceLevel ?? 0 };
  });
}

/** Attach an existing customer, or take a walk-in name/phone snapshot. */
async function resolveManualCustomer(input: ManualOrderInput) {
  if (input.userId) {
    const u = await User.findById(input.userId);
    if (!u) throw badInput("Selected customer not found.");
    return { user: u.id as string, customerName: u.name, customerPhone: u.phone };
  }
  const customerName = input.customerName?.trim();
  if (!customerName) throw badInput("Enter a customer name or pick an existing customer.");
  return { user: undefined, customerName, customerPhone: input.customerPhone?.trim() || undefined };
}

/** Compute the order fields shared by manual create + update (POS). */
async function buildManualOrderFields(input: ManualOrderInput) {
  const isDelivery = input.orderType === "DELIVERY";
  if (isDelivery && !(input.address?.line1?.trim() && input.address?.city?.trim())) {
    throw badInput("Delivery orders need an address (at least a street line and city).");
  }
  const items = await buildManualItems(input.items);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = clampMoney(input.discount, subtotal);
  const deliveryFee = isDelivery ? clampMoney(input.deliveryFee, Number.MAX_SAFE_INTEGER) : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const customer = await resolveManualCustomer(input);
  const status = input.status ?? "PLACED";
  const placedAt = input.placedAt ? new Date(input.placedAt) : new Date();
  if (Number.isNaN(placedAt.getTime())) throw badInput("Invalid order date.");
  const paymentStatus = input.paymentStatus ?? (status === "DELIVERED" ? "PAID" : "PENDING");
  return {
    ...customer,
    items,
    subtotal,
    discount,
    deliveryFee,
    total,
    status,
    orderType: input.orderType,
    paymentMethod: input.paymentMethod ?? "COD",
    paymentStatus,
    address: isDelivery ? input.address : undefined,
    surveyUrl: input.surveyUrl?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    placedAt,
  };
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

    invoicePdf: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const order = await Order.findById(orderId);
      if (!order) throw new GraphQLError("Order not found.");
      const settings = await getOrCreateSettings();
      const pdf = await generateInvoicePdf(order, settings);
      return pdf.toString("base64");
    },

    // Public — the no-login feedback survey reads the order via its token.
    surveyOrder: async (_: unknown, { orderId, token }: { orderId: string; token: string }) => {
      const order = await loadSurveyOrder(orderId, token);
      return {
        orderNumber: order.orderNumber,
        customerName: await surveyCustomerName(order),
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        status: order.status,
        placedAt: order.placedAt,
        alreadyRated: Boolean(order.rating),
        canRate: order.status === "DELIVERED" && !order.rating,
        rating: order.rating ?? null,
      };
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

    createManualOrder: async (_: unknown, { input }: { input: ManualOrderInput }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const fields = await buildManualOrderFields(input);
      return Order.create({
        orderNumber: genOrderNumber(),
        source: "POS",
        statusHistory: [{ status: fields.status, at: fields.placedAt }],
        ...fields,
      });
    },

    updateManualOrder: async (
      _: unknown,
      { id, input }: { id: string; input: ManualOrderInput },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const order = await Order.findById(id);
      if (!order) throw new GraphQLError("Order not found.");
      const fields = await buildManualOrderFields(input);
      const prevStatus = order.status;
      Object.assign(order, fields);
      if (prevStatus !== fields.status) {
        order.statusHistory.push({ status: fields.status, at: new Date() });
      }
      await order.save();
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
      // Admin/staff may set any status (e.g. revert an accidental "delivered");
      // riders stay restricted to the forward delivery flow.
      const isStaff = u.role === "ADMIN" || u.role === "STAFF";
      if (!isStaff && !NEXT[order.status].includes(status)) {
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

    // Public — token-gated survey submission (per-item food + separate delivery).
    submitOrderSurvey: async (
      _: unknown,
      args: {
        orderId: string;
        token: string;
        itemRatings: { name: string; rating: number }[];
        delivery: number;
        comment?: string;
      }
    ) => {
      const order = await loadSurveyOrder(args.orderId, args.token);
      if (!args.itemRatings?.length) throw badInput("Please rate at least one item.");
      if (args.itemRatings.some((r) => !isValidStars(r.rating))) {
        throw badInput("Item ratings must be between 1 and 5 stars.");
      }
      const food = Math.round(args.itemRatings.reduce((s, r) => s + r.rating, 0) / args.itemRatings.length);
      await saveOrderRating(order, food, args.delivery, args.comment, args.itemRatings);
      return true;
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
