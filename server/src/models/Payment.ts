import { Schema, model, Document, Types } from "mongoose";

export type PaymentRecordStatus =
  | "CREATED" // razorpay order created, awaiting payment
  | "CAPTURED" // money received
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface IPaymentEvent {
  type: string;
  at: Date;
  data?: string;
}

export interface IPaymentRefund {
  providerRefundId: string;
  amount: number;
  reason?: string;
  at: Date;
}

export interface IPayment extends Document {
  order: Types.ObjectId;
  user?: Types.ObjectId;
  provider: "RAZORPAY" | "MANUAL";
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number; // rupees
  currency: string;
  status: PaymentRecordStatus;
  method?: string; // upi / card / netbanking … (from provider)
  refunds: IPaymentRefund[];
  events: IPaymentEvent[]; // audit log (webhooks, verifications, refunds)
  createdAt: Date;
  updatedAt: Date;
}

const paymentEventSchema = new Schema<IPaymentEvent>(
  {
    type: { type: String, required: true },
    at: { type: Date, default: Date.now },
    data: String,
  },
  { _id: false }
);

const paymentRefundSchema = new Schema<IPaymentRefund>(
  {
    providerRefundId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    provider: { type: String, enum: ["RAZORPAY", "MANUAL"], default: "RAZORPAY" },
    providerOrderId: { type: String, required: true, unique: true, index: true },
    providerPaymentId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["CREATED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "CREATED",
      index: true,
    },
    method: String,
    refunds: { type: [paymentRefundSchema], default: [] },
    events: { type: [paymentEventSchema], default: [] },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
