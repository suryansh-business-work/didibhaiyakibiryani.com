import { Schema, model, Document } from "mongoose";

export type PartyOrderStatus = "NEW" | "CONTACTED" | "CLOSED";

/**
 * A "Plan a Party Order" enquiry submitted from the website / app (captcha-gated,
 * no login). Staff follow up from admin → Party Orders; both the admin inbox and
 * the customer receive an email on submission.
 */
export interface IPartyOrder extends Document {
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: number;
  location?: string;
  message?: string;
  status: PartyOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const partyOrderSchema = new Schema<IPartyOrder>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    eventDate: { type: String, trim: true, maxlength: 60 },
    guests: { type: Number, min: 1, max: 100000 },
    location: { type: String, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CLOSED"],
      default: "NEW",
      index: true,
    },
  },
  { timestamps: true }
);

export const PartyOrder = model<IPartyOrder>("PartyOrder", partyOrderSchema);
