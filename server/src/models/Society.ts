import { Schema, model, Document } from "mongoose";

/**
 * A delivery society / apartment complex. Managed from admin → Societies; the
 * native app offers the active ones as the delivery-area dropdown so a customer
 * only enters their flat number & block.
 */
export interface ISociety extends Document {
  name: string;
  area?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    line1: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Society = model<ISociety>("Society", societySchema);
