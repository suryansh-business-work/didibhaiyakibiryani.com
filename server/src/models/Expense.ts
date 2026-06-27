import { Schema, model, Document, Types } from "mongoose";

/**
 * A recorded expense. Managed from admin → Finance → Manage Expenses. An
 * expense may be a one-off (with an ExpenseSource) or a single day-cell in the
 * calendar grid (linked to an ExpenseProduct, no source). Both carry an amount.
 */
export interface IExpense extends Document {
  source?: Types.ObjectId;
  /** The raw item this expense is for (selected in the Expense Manager). */
  product?: Types.ObjectId;
  title: string;
  amount: number;
  /** Unit the amount is measured in (snapshot of the raw item's unit). */
  unit?: string;
  note?: string;
  invoiceUrl?: string;
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    // Optional: grid (product × day) amounts are not tied to a payment source.
    source: { type: Schema.Types.ObjectId, ref: "ExpenseSource", index: true },
    product: { type: Schema.Types.ObjectId, ref: "ExpenseProduct", index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true },
    note: { type: String, trim: true },
    invoiceUrl: { type: String, trim: true },
    // The date the money was spent on (may be back-dated). `createdAt` stays the
    // record-creation timestamp; this drives period reporting on the dashboard.
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Expense = model<IExpense>("Expense", expenseSchema);
