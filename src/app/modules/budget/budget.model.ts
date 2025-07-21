import { Schema, model, Types } from 'mongoose';

export interface IBudget {
  _id?: Types.ObjectId;
  name: string;
  amount: number;
  type: string;
  category: string;
  userId: Types.ObjectId;
}

const budgetSchema = new Schema<IBudget>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Budget = model<IBudget>('Budget', budgetSchema);
