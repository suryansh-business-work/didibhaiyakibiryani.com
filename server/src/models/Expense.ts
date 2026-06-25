import { Schema, model, Document, Types } from "mongoose";

/**
 * A recorded expense. Managed from admin → Finance → Manage Expenses. Each
 * expense is paid from one ExpenseSource and carries a numeric amount.
 */
export interface IExpense extends Document {
  source: Types.ObjectId;
  title: string;
  amount: number;
  note?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    source: { type: Schema.Types.ObjectId, ref: "ExpenseSource", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    invoiceUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Expense = model<IExpense>("Expense", expenseSchema);
