import { Schema, model, Document } from "mongoose";

/** Whether an expense source is a named person or a bank/financial account. */
export type ExpenseSourceType = "PERSON" | "ACCOUNT";

/**
 * Where money for an expense comes from. Managed from admin → Finance →
 * Expense Sources. A PERSON source carries contact details; an ACCOUNT source
 * carries bank-account details. Expenses reference one of these.
 */
export interface IExpenseSource extends Document {
  type: ExpenseSourceType;
  name: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  note?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSourceSchema = new Schema<IExpenseSource>(
  {
    type: { type: String, enum: ["PERSON", "ACCOUNT"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    note: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ExpenseSource = model<IExpenseSource>("ExpenseSource", expenseSourceSchema);
