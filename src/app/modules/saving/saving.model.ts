import { Schema, model, Types } from 'mongoose';

export interface ISaving {
  _id?: Types.ObjectId;
  amount: number;
  returnRate: number;
  inflationRate: number;
  tanationRate: number;
  frequency: string;
  userId: Types.ObjectId;
}

const savingSchema = new Schema<ISaving>({
  amount: { type: Number, required: true },
  returnRate: { type: Number, required: true },
  inflationRate: { type: Number, required: true },
  tanationRate: { type: Number, required: true },
  frequency: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Saving = model<ISaving>('Saving', savingSchema);
