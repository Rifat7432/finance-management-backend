import { Schema, model, Types } from 'mongoose';

export interface IAppointment {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  attendent: string;
  isChild: boolean;
  approxIncome: number;
  investment: number;
  dicuss?: string;
  reachingFor: string;
  ask: string;
  date: string;
  timeSlote: string;
  userId: Types.ObjectId;
}

const appointmentSchema = new Schema<IAppointment>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  attendent: { type: String, required: true },
  isChild: { type: Boolean, required: true },
  approxIncome: { type: Number, required: true },
  investment: { type: Number, required: true },
  dicuss: { type: String },
  reachingFor: { type: String, required: true },
  ask: { type: String, required: true },
  date: { type: String, required: true },
  timeSlote: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
