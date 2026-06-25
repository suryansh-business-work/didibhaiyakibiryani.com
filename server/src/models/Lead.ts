import { Schema, model, Document } from "mongoose";

/**
 * A non-signup contact (lead): someone the restaurant has details for who has
 * not created an account. Managed from admin → Contacts and selectable in POS.
 * When a matching email signs up, the lead is auto-removed (see auth.register).
 */
export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  note?: string;
  address?: string;
  society?: string;
  block?: string;
  flat?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    note: { type: String, trim: true },
    address: { type: String, trim: true },
    society: { type: String, trim: true },
    block: { type: String, trim: true },
    flat: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

export const Lead = model<ILead>("Lead", leadSchema);
