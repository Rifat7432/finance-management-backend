import { z } from 'zod';

const slotSchema = z.object({
  time: z.string({ required_error: 'Time is required' }),
  isBooked: z.boolean().default(false),
});

const createTimeSlotZodSchema = z.object({
  body: z.object({
    date: z.string({ required_error: 'Date is required' }),
    availableSlots: z.array(slotSchema),
  }),
});

const updateTimeSlotZodSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    availableSlots: z.array(slotSchema).optional(),
  }),
});

const bookTimeSlotZodSchema = z.object({
  body: z.object({
    date: z.string({ required_error: 'Date is required' }),
    time: z.string({ required_error: 'Time is required' }),
  }),
});

export const TimeSlotValidation = {
  createTimeSlotZodSchema,
  updateTimeSlotZodSchema,
  bookTimeSlotZodSchema,
};
