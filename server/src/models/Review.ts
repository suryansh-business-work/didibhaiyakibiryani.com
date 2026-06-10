import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  menuItem?: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  text?: string;
  authorName: string;
  authorMeta?: string;
  isPublished: boolean;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String },
    authorName: { type: String, required: true },
    authorMeta: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Review = model<IReview>("Review", reviewSchema);
