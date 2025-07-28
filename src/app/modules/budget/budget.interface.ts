import { Types } from "mongoose";

export interface IBudget {
  _id?: Types.ObjectId;
  name: string;
  amount: number;
  type: string;
  category: string;
  userId: Types.ObjectId;
}