import { Schema, model } from 'mongoose';
import { ISavingGoal } from './savingGole.interface';

const savingGoalSchema = new Schema<ISavingGoal>(
     {
          name: { type: String, required: true },
          totalAmount: { type: Number, required: true },
          monthlyTarget: { type: Number, required: true },
          completionRation: { type: Number, default: 0 },
          savedMoney: { type: Number, default: 0 },
          date: { type: String, required: true },
          completeDate: { type: String, required: true },
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          isCompleted: { type: Boolean, default: false },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const SavingGoal = model<ISavingGoal>('SavingGoal', savingGoalSchema);
