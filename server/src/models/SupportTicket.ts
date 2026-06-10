import { Schema, model, Document, Types } from "mongoose";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface ISupportMessage {
  by: "CUSTOMER" | "ADMIN";
  text: string;
  at: Date;
}

/** Order-scoped customer support request (like a food-app help ticket). */
export interface ISupportTicket extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  subject: string;
  body: string;
  imageUrl?: string;
  status: TicketStatus;
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<ISupportMessage>(
  {
    by: { type: String, enum: ["CUSTOMER", "ADMIN"], required: true },
    text: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
      index: true,
    },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);
