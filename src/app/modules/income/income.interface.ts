import {  Document, Types } from 'mongoose';

// Interface for Income document
export interface IIncome extends Document {
  name: string;
  amount: number;
  receiveDate: string;         // changed from 'reaciveDate'
  frequency: string;
  userId: Types.ObjectId;
}

// Mongoose Schema

