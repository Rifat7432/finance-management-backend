import { Document, Types } from 'mongoose';
// Interface
export interface IExpense extends Document {
     name: string;
     amount: number;
     endDate: string; // Or Date, if you want real date type
     frequency: 'once' | 'weekly' | 'monthly';
     userId: Types.ObjectId;
}
