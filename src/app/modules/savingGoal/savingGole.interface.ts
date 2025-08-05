import { Types } from 'mongoose';

export interface ISavingGoal {
     name: string;
     totalAmount: number;
     monthlyTarget: number;
     date: string;
     completeDate: string;
     userId: Types.ObjectId;
}
