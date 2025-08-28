import { Document } from 'mongoose';

export interface ITimeSlot extends Document {
  date: string;
  availableSlots: {
    time: string;
    isBooked: boolean;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}
