import { Schema, model } from 'mongoose';
import { IDebt } from './debt.interface';



const debtSchema = new Schema<IDebt>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    monthlyPayment: { type: String, required: true },
    AdHocPayment: { type: String, required: true },
    capitalRepayment: { type: String, required: true },
    interestRepayment: { type: String, required: true },
    payDueDate: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Debt = model<IDebt>('Debt', debtSchema);