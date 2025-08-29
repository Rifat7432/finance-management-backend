import { z } from 'zod';

const createTimeSlotZodSchema = z.object({
  body: z.object({
    date: z.string({ required_error: 'Date is required' }),
   availableSlots: z.array(z.string()),
  }),
});

const updateTimeSlotZodSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    availableSlots: z.array(z.string()).optional(),
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
