import { Document, Types } from 'mongoose';

export interface IPartnerRequest extends Document {
  fromUser: Types.ObjectId;
  toUser?: Types.ObjectId;
  email: string;
  relation?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}
