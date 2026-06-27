import { Schema, model, Document } from "mongoose";

/**
 * A raw item / material (managed under admin → Raw Items). Carries a reference
 * market price and unit; expenses select a raw item when recording spend.
 */
export interface IExpenseProduct extends Document {
  name: string;
  /** Reference/market rate for this item — informational only. */
  marketPrice: number;
  /** Optional unit the market price is quoted per (e.g. "KG", "Piece"). */
  priceUnit?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseProductSchema = new Schema<IExpenseProduct>(
  {
    name: { type: String, required: true, trim: true },
    marketPrice: { type: Number, default: 0, min: 0 },
    priceUnit: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ExpenseProduct = model<IExpenseProduct>("ExpenseProduct", expenseProductSchema);
