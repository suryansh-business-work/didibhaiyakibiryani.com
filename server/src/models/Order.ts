import { randomBytes } from "node:crypto";
import { Schema, model, Document, Types } from "mongoose";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
/** How the order is fulfilled. Counter sales have no delivery leg. */
export type OrderType = "DELIVERY" | "TAKEAWAY";
/** Where the order originated: the customer app/site, or a staff POS entry. */
export type OrderSource = "APP" | "POS";

export interface IOrderItem {
  menuItem?: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  spiceLevel?: number;
}

export interface IOrderAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

export interface IStatusEvent {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrderItemRating {
  name: string;
  rating: number;
}

/** Post-delivery survey: per-item food stars + a separate delivery rating. */
export interface IOrderRating {
  food: number; // overall food (avg of per-item ratings, or in-app single score)
  delivery: number;
  comment?: string;
  items?: IOrderItemRating[];
  ratedAt: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  /** Optional: walk-in POS sales may have no registered customer. */
  user?: Types.ObjectId;
  /** Snapshot of the buyer for POS/walk-in orders without an account. */
  customerName?: string;
  customerPhone?: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  orderType: OrderType;
  source: OrderSource;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Optional: takeaway / counter sales have no delivery address. */
  address?: IOrderAddress;
  deliveryPartner?: Types.ObjectId;
  statusHistory: IStatusEvent[];
  rating?: IOrderRating;
  /** Secret used by the public (no-login) rating survey link. */
  ratingToken: string;
  /** External feedback-survey link printed on this order's invoice. */
  surveyUrl?: string;
  notes?: string;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    spiceLevel: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    label: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    pincode: { type: String },
    phone: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const statusEventSchema = new Schema<IStatusEvent>(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
);

const orderItemRatingSchema = new Schema<IOrderItemRating>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const orderRatingSchema = new Schema<IOrderRating>(
  {
    food: { type: Number, required: true, min: 1, max: 5 },
    delivery: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    items: { type: [orderItemRatingSchema], default: undefined },
    ratedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PLACED",
      index: true,
    },
    orderType: { type: String, enum: ["DELIVERY", "TAKEAWAY"], default: "DELIVERY" },
    source: { type: String, enum: ["APP", "POS"], default: "APP", index: true },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], default: "COD" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    address: { type: orderAddressSchema },
    surveyUrl: { type: String },
    deliveryPartner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    statusHistory: { type: [statusEventSchema], default: [] },
    rating: { type: orderRatingSchema, default: undefined },
    ratingToken: {
      type: String,
      default: () => randomBytes(16).toString("hex"),
    },
    notes: String,
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
