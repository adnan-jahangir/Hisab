import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  businessId: mongoose.Types.ObjectId | string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
