import { StatusCodes } from 'http-status-codes';
import { ITimeSlot } from './timeSlot.interface';
import AppError from '../../../errors/AppError';
import { TimeSlot } from './timeSlot.model';
import { Appointment } from '../appointment/appointment.model'; // Import Appointment model

const createTimeSlotToDB = async (payload: Partial<ITimeSlot>): Promise<ITimeSlot> => {
  const newSlot = await TimeSlot.create(payload);
  if (!newSlot) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create time slot');
  }
  return newSlot;
};

const getTimeSlotsFromDB = async (): Promise<ITimeSlot[]> => {
  const slots = await TimeSlot.find();
  if (!slots.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No time slots found');
  }
  return slots;
};

const getSingleTimeSlotFromDB = async (id: string): Promise<ITimeSlot | null> => {
  const slot = await TimeSlot.findById(id);
  if (!slot) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
  }
  return slot;
};

const updateTimeSlotToDB = async (id: string, payload: Partial<ITimeSlot>): Promise<ITimeSlot | null> => {
  const updated = await TimeSlot.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update time slot');
  }
  return updated;
};

const deleteTimeSlotFromDB = async (id: string): Promise<boolean> => {
  const deleted = await TimeSlot.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
  }
  return true;
};

// Booking API: Book a slot for a date and time
const bookTimeSlot = async (date: string, time: string, userId: string): Promise<ITimeSlot | null> => {
    // Find the time slot document for the given date
    const slotDoc = await TimeSlot.findOne({ date });
    if (!slotDoc) {
        throw new AppError(StatusCodes.NOT_FOUND, 'No time slots found for this date');
    }

    // Find the specific slot by time
    const slot = slotDoc.availableSlots.find(s => s.time === time);
    if (!slot) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
    }

    // Check if the slot is already booked
    if (slot.isBooked) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
    }

    // Mark the slot as booked
    slot.isBooked = true;
    await slotDoc.save();

    // Create an appointment and associate it with the booked slot
    await Appointment.create({
        user: userId,
        date,
        time,
        timeSlot: slotDoc._id,
    });

    return slotDoc;
};

export const TimeSlotService = {
  createTimeSlotToDB,
  getTimeSlotsFromDB,
  getSingleTimeSlotFromDB,
  updateTimeSlotToDB,
  deleteTimeSlotFromDB,
  bookTimeSlot,
};
