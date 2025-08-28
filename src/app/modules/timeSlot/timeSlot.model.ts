import { Schema, model } from 'mongoose';
import { ITimeSlot } from './timeSlot.interface';

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: String, required: true },  // Date for the available slot
    availableSlots: [
      {
        time: { type: String, required: true },  // Time of the slot (e.g., "10:00 AM")
        isBooked: { type: Boolean, default: false },  // Whether the slot is booked or not
      },
    ],
  },
  { timestamps: true }
);

export const TimeSlot = model('TimeSlot', timeSlotSchema);
