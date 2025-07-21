import { model, Schema } from 'mongoose';
import { IIncome } from './income.interface';

const incomeSchema = new Schema<IIncome>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          receiveDate: { type: String, required: true }, // consider Date if storing real date
          frequency: { type: String, default: 'once' }, // e.g., 'once', 'weekly', 'monthly'
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
     },
     { timestamps: true },
);

// Export model
export const Income = model<IIncome>('Income', incomeSchema);
