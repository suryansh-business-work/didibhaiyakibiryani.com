import { Schema, model, Document, Types } from "mongoose";

export type Badge = "NONE" | "BESTSELLER" | "NEW";

export interface IMenuItem extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  image?: string;
  category: Types.ObjectId;
  isVeg: boolean;
  /** Whether customers may pick a spice level for this item (off for e.g. desserts). */
  spiceSelectable: boolean;
  spiceLevel: number; // 0-3 (default level)
  serves: string;
  badge: Badge;
  tags: string[];
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    image: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    isVeg: { type: Boolean, default: true },
    spiceSelectable: { type: Boolean, default: true },
    spiceLevel: { type: Number, default: 0, min: 0, max: 3 },
    serves: { type: String, default: "Serves 1" },
    badge: { type: String, enum: ["NONE", "BESTSELLER", "NEW"], default: "NONE" },
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 4.7 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ name: "text", description: "text" });

export const MenuItem = model<IMenuItem>("MenuItem", menuItemSchema);
