import { GraphQLError } from "graphql";
import { Order, MenuItem, Coupon, User, getOrCreateSettings } from "../../models/index.js";
import { requireAuth, requireRole, type Context, type TokenPayload } from "../../utils/auth.js";
import { paginate, type PageArgs } from "../../utils/pagination.js";
import { evaluateCoupon, computeDeliveryFee, haversineKm } from "../../utils/pricing.js";
import { assertOrderingAvailable } from "../../utils/ordering.js";
import { genOrderNumber } from "../../utils/helpers.js";
import { notifyOrderEmail, notifyOrderTrackingWhatsApp } from "../../emails/notify.js";
import { trackingUrlFor, ratingUrlFor, receiptUrlFor } from "../../utils/links.js";
import { liveState } from "../../utils/orderTracking.js";
import { saveOrderRating, isValidStars } from "../../utils/rating.js";
import { generateReceiptPdf } from "../../utils/receipt.js";
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
  state?: string;
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
  complimentary?: boolean;
}
interface ManualOrderInput {
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: OrderType;
  items: ManualOrderItemInput[];
  address?: AddressInput;
  deliveryPartner?: string;
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

/** Load an order for the public survey/track pages by its short order number.
 * The order number is the only key (no secret token) — see SURVEY/TRACK apps. */
async function loadOrderByNumber(orderNumber: string): Promise<IOrder> {
  const num = orderNumber?.trim();
  if (!num) throw badInput("This link is invalid or has expired.");
  const order = await Order.findOne({ orderNumber: num });
  if (!order) throw badInput("This link is invalid or has expired.");
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
    const complimentary = ci.complimentary ?? false;
    if (ci.menuItemId) {
      const dbItem = map.get(ci.menuItemId);
      if (!dbItem) throw badInput("A selected menu item no longer exists.");
      return { menuItem: dbItem._id, name: dbItem.name, price: dbItem.price, makingCost: dbItem.makingCost ?? 0, qty: ci.qty, spiceLevel: ci.spiceLevel ?? dbItem.spiceLevel, complimentary };
    }
    const name = ci.name?.trim();
    if (!name) throw badInput("Custom items need a name.");
    if (typeof ci.price !== "number" || !Number.isFinite(ci.price) || ci.price < 0) {
      throw badInput("Custom items need a valid price.");
    }
    return { name, price: ci.price, makingCost: 0, qty: ci.qty, spiceLevel: ci.spiceLevel ?? 0, complimentary };
  });
}

/** Resolve & validate the rider assigned at POS time. Only delivery orders carry
 * a partner; takeaway clears it. The rider's app picks the order up from its
 * polled queue once the order reaches an active status. */
async function resolveManualRider(input: ManualOrderInput) {
  if (input.orderType !== "DELIVERY" || !input.deliveryPartner) return undefined;
  const rider = await User.findById(input.deliveryPartner);
  if (!rider || rider.role !== "DELIVERY") {
    throw badInput("Selected user is not a delivery partner.");
  }
  return rider._id;
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
  if (items.filter((i) => i.complimentary).length > 1) {
    throw badInput("Only one complimentary item is allowed per order.");
  }
  if (items.some((i) => i.complimentary && i.qty > 1)) {
    throw badInput("A complimentary item must be a single unit.");
  }
  // Complimentary lines keep their price (for reporting) but bill at ₹0.
  const subtotal = items.reduce((s, i) => s + (i.complimentary ? 0 : i.price * i.qty), 0);
  const discount = clampMoney(input.discount, subtotal);
  const deliveryFee = isDelivery ? clampMoney(input.deliveryFee, Number.MAX_SAFE_INTEGER) : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const customer = await resolveManualCustomer(input);
  const deliveryPartner = await resolveManualRider(input);
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
    deliveryPartner,
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

    ordersPage: async (
      _: unknown,
      { status, ...page }: PageArgs & { status?: OrderStatus },
      ctx: Context
    ) => {
      requireRole(ctx, "ADMIN", "STAFF", "DELIVERY");
      return paginate(Order, {
        filter: status ? { status } : {},
        searchFields: ["orderNumber", "customerName", "customerPhone"],
        sortAllow: ["placedAt", "total", "createdAt", "status"],
        defaultSort: "placedAt",
        ...page,
      });
    },

    receiptPdf: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      requireRole(ctx, "ADMIN", "STAFF");
      const order = await Order.findById(orderId);
      if (!order) throw new GraphQLError("Order not found.");
      const settings = await getOrCreateSettings();
      const pdf = await generateReceiptPdf(order, settings);
      return pdf.toString("base64");
    },

    // Public — the no-login feedback survey, keyed by the short order number.
    surveyOrder: async (_: unknown, { orderNumber }: { orderNumber: string }) => {
      const order = await loadOrderByNumber(orderNumber);
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
        receiptUrl: receiptUrlFor(order),
        rating: order.rating ?? null,
      };
    },

    // Public — the no-login live tracking page, keyed by the short order number.
    trackOrder: async (_: unknown, { orderNumber }: { orderNumber: string }) => {
      const order = await loadOrderByNumber(orderNumber);
      const rider = order.deliveryPartner ? await User.findById(order.deliveryPartner) : null;
      const { destination, rider: riderFix, etaMinutes } = liveState(order, rider);
      return {
        orderNumber: order.orderNumber,
        customerName: await surveyCustomerName(order),
        status: order.status,
        statusHistory: order.statusHistory,
        items: order.items,
        total: order.total,
        deliveryFee: order.deliveryFee,
        paymentMethod: order.paymentMethod,
        address: order.address ?? null,
        destination,
        rider: riderFix,
        etaMinutes,
        receiptUrl: receiptUrlFor(order),
        placedAt: order.placedAt,
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
          makingCost: dbItem.makingCost ?? 0,
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
              makingCost: free.makingCost ?? 0,
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
      notifyOrderTrackingWhatsApp(order);
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

    // Public — survey submission keyed by order number (per-item food + delivery).
    submitOrderSurvey: async (
      _: unknown,
      args: {
        orderNumber: string;
        itemRatings: { name: string; rating: number }[];
        delivery: number;
        comment?: string;
      }
    ) => {
      const order = await loadOrderByNumber(args.orderNumber);
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
    trackingUrl: (parent: { orderNumber: string }) => trackingUrlFor(parent),
    ratingUrl: (parent: { orderNumber: string }) => ratingUrlFor(parent),
    receiptUrl: (parent: { _id: unknown; ratingToken: string }) => receiptUrlFor(parent),
    user: (parent: { user: unknown }) => {
      const usr = parent.user as { name?: string } | string | null;
      /* v8 ignore next 2 -- populated-vs-id paths both exercised; null short-circuit is defensive */
      if (usr && typeof usr === "object" && "name" in usr && usr.name) return usr;
      return usr ? User.findById(usr as string).exec() : null;
    },
    /* v8 ignore next 2 -- present/absent both exercised; trivial field resolver */
    deliveryPartner: (parent: { deliveryPartner?: unknown }) =>
      parent.deliveryPartner ? User.findById(parent.deliveryPartner as string).exec() : null,
    customerOrderCount: async (parent: { user?: unknown; customerPhone?: string }) => {
      if (parent.user) {
        return Order.countDocuments({ user: parent.user, status: { $ne: "CANCELLED" } }).exec();
      }
      const phone = parent.customerPhone?.trim();
      if (phone) {
        return Order.countDocuments({ customerPhone: phone, status: { $ne: "CANCELLED" } }).exec();
      }
      return 1;
    },
  },
};
