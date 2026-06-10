import { Schema, model, Document, Types } from "mongoose";

export type CouponType = "PERCENT" | "FLAT" | "FREE_DELIVERY" | "FREE_ITEM";

export interface ICoupon extends Document {
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number; // percent or flat amount
  maxDiscount?: number; // cap for PERCENT
  minOrder: number;
  freeItem?: Types.ObjectId;
  appOnly: boolean;
  firstOrderOnly: boolean;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["PERCENT", "FLAT", "FREE_DELIVERY", "FREE_ITEM"],
      required: true,
    },
    value: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    minOrder: { type: Number, default: 0 },
    freeItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    appOnly: { type: Boolean, default: false },
    firstOrderOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>("Coupon", couponSchema);
