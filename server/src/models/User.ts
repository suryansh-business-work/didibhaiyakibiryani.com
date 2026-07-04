import { Schema, model, Document, Types } from "mongoose";

export type Role = "CUSTOMER" | "ADMIN" | "STAFF" | "DELIVERY";

export interface IAddress {
  _id?: Types.ObjectId;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  /** Optional "YYYY-MM-DD" dates for birthday / anniversary marketing. */
  dob?: string;
  anniversary?: string;
  passwordHash: string;
  role: Role;
  addresses: IAddress[];
  isActive: boolean;
  /** Loyalty points balance (earned on eligible delivered orders, spent on rewards). */
  loyaltyPoints: number;
  /** Rider live position (DELIVERY role) — last reported GPS for order tracking. */
  lastLat?: number;
  lastLng?: number;
  lastLocationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    pincode: { type: String },
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    dob: { type: String },
    anniversary: { type: String },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN", "STAFF", "DELIVERY"],
      default: "CUSTOMER",
      index: true,
    },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    lastLat: Number,
    lastLng: Number,
    lastLocationAt: Date,
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
