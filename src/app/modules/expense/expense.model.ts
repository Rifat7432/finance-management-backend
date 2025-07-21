import { Schema, model } from 'mongoose';
import { IExpense } from './expense.interface';



// Schema
const expenseSchema = new Schema<IExpense>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          endDate: { type: String, required: true }, // consider Date type
          frequency: { type: String, enum: ['once', 'weekly', 'monthly'], default: 'once' }, // optional: enum like 'daily', 'monthly'
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     },
     { timestamps: true },
);

// Model
export const Expense = model<IExpense>('Expense', expenseSchema);
