import { Types } from 'mongoose';

export interface IBudget {
     name: string;
     amount: number;
     type: string;
     category: string;
     userId: Types.ObjectId;
}
