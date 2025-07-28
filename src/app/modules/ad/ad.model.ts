import { Schema, model } from 'mongoose';
import { IAd } from './ad.interface';



const adSchema = new Schema<IAd>({
  name: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
}, { timestamps: true });

export const Ad = model<IAd>('Ad', adSchema);
