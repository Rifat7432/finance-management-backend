import { Types } from "mongoose";

export interface IDebt {
  _id?: Types.ObjectId;
  name: string;
  amount: number;
  monthlyPayment: string;
  AdHocPayment: string;
  capitalRepayment: string;
  interestRepayment: string;
  payDueDate: string;
  userId: Types.ObjectId;
}