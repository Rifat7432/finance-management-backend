import { StatusCodes } from 'http-status-codes';
import { ITimeSlot } from './timeSlot.interface';
import AppError from '../../../errors/AppError';
import { TimeSlot } from './timeSlot.model';

const createTimeSlotToDB = async (payload: { date: string; availableSlots: string[] }) => {
     // Validate request body with Zod schema
     const { date, availableSlots } = payload;
     const isTimeSlotExist = await TimeSlot.findOne({ date });
     if (isTimeSlotExist) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot for this date already exists');
     }
     // Prepare the available slots data
     const slotData = availableSlots.map((time: string) => ({
          time,
          isBooked: false, // Initially, slots are not booked
     }));

     // Create a new time slot document
     const newTimeSlot = await TimeSlot.create({
          date,
          availableSlots: slotData,
     });

     return newTimeSlot;
};

const getTimeSlotsFromDB = async (date?: string): Promise<ITimeSlot[]> => {
  // If date is provided, search by date, otherwise return all time slots
  const query = date ? { date } : {};  // If date is provided, search by date, otherwise empty query

  const slots = await TimeSlot.find(query);  // Apply the query

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

const updateTimeSlotToDB = async (id: string, payload: { date: string; availableSlots: string[] }): Promise<ITimeSlot | null> => {
     const { date, availableSlots } = payload;

     // Step 1: Check if the date already exists for another time slot
     if (date) {
          const existingSlot = await TimeSlot.findOne({ date });
          if (existingSlot && (existingSlot._id as any).toString() !== id) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot for this date already exists');
          }
     }

     // Step 2: Fetch the existing time slot document by ID
     const existingTimeSlot = await TimeSlot.findById(id);
     if (!existingTimeSlot) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
     }

     // Step 3: Prepare the updated available slots data while preserving the booking status
     if (availableSlots) {
          const bookedSlots = existingTimeSlot.availableSlots.filter((slot) => slot.isBooked);
          const newNotBookedSlots = availableSlots.map((time) => {
               const isAlreadyBooked = bookedSlots.find((slot) => slot.time === time);
               if (!isAlreadyBooked) {
                    return {
                         time,
                         isBooked: false,
                    };
               }
          });

          // Step 4: Update the time slot with the new available slots (preserving the booking status)
          const updatedSlot = await TimeSlot.findByIdAndUpdate(id, { date, availableSlots: [...bookedSlots, newNotBookedSlots] }, { new: true });

          if (!updatedSlot) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update time slot');
          }

          return updatedSlot;
     }

     // If no availableSlots are provided in the payload, update the other fields (e.g., date only)
     const updatedSlot = await TimeSlot.findByIdAndUpdate(id, payload, { new: true });

     if (!updatedSlot) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update time slot');
     }

     return updatedSlot;
};

const deleteTimeSlotFromDB = async (id: string): Promise<boolean> => {
     const deleted = await TimeSlot.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
     }
     return true;
};

export const TimeSlotService = {
     createTimeSlotToDB,
     getTimeSlotsFromDB,
     getSingleTimeSlotFromDB,
     updateTimeSlotToDB,
     deleteTimeSlotFromDB,
};
