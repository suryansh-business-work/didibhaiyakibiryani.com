import { Schema, model, Document } from "mongoose";

/**
 * Home-screen slider entry. Managed from admin → Slider and rendered as a
 * paged carousel at the top of the native app home screen.
 */
export interface IBanner extends Document {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Banner = model<IBanner>("Banner", bannerSchema);
