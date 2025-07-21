import { Schema, model, Types } from 'mongoose';

export interface ISavingGoal {
  _id?: Types.ObjectId;
  name: string;
  totalAmount: number;
  monthlyTarget: number;
  date: string;
  compliteDate: string;
  userId: Types.ObjectId;
}

const savingGoalSchema = new Schema<ISavingGoal>({
  name: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  monthlyTarget: { type: Number, required: true },
  date: { type: String, required: true },
  compliteDate: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const SavingGoal = model<ISavingGoal>('SavingGoal', savingGoalSchema);
