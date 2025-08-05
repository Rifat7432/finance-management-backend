import { Types } from "mongoose";

export interface IDebt {
  name: string;
  amount: number;
  monthlyPayment: string;
  AdHocPayment: string;
  capitalRepayment: string;
  interestRepayment: string;
  payDueDate: string;
  userId: Types.ObjectId;
}