import { Types } from "mongoose";

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