import { z } from 'zod';

const createAppointmentZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    email: z.string({ required_error: 'Email is required' }).email(),
    attendent: z.string({ required_error: 'Attendent is required' }),
    isChild: z.boolean({ required_error: 'isChild is required' }),
    approxIncome: z.number({ required_error: 'Approx income is required' }),
    investment: z.number({ required_error: 'Investment is required' }),
    dicuss: z.string().optional(),
    reachingFor: z.string({ required_error: 'Reaching for is required' }),
    ask: z.string({ required_error: 'Ask is required' }),
    date: z.string({ required_error: 'Date is required' }),
    timeSlote: z.string({ required_error: 'Time slot is required' }),
    userId: z.string({ required_error: 'User ID is required' }),
  }),
});

const updateAppointmentZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    attendent: z.string().optional(),
    isChild: z.boolean().optional(),
    approxIncome: z.number().optional(),
    investment: z.number().optional(),
    dicuss: z.string().optional(),
    reachingFor: z.string().optional(),
    ask: z.string().optional(),
    date: z.string().optional(),
    timeSlote: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export const AppointmentValidation = {
  createAppointmentZodSchema,
  updateAppointmentZodSchema,
};
