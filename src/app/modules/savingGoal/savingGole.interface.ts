import { Types } from 'mongoose';

export interface ISavingGoal {
     name: string;
     totalAmount: number;
     monthlyTarget: number;
     completionRation:number;
     isCompleted: boolean;
     date: string;
     completeDate: string;
     userId: Types.ObjectId;
     isDeleted: boolean;
}
