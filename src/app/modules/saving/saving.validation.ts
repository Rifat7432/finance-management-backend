import { z } from 'zod';

const createSavingZodSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }).min(0),
    returnRate: z.number({ required_error: 'Return rate is required' }),
    inflationRate: z.number({ required_error: 'Inflation rate is required' }),
    tanationRate: z.number({ required_error: 'Tanation rate is required' }),
    frequency: z.string({ required_error: 'Frequency is required' }),
    userId: z.string({ required_error: 'User ID is required' }),
  }),
});

const updateSavingZodSchema = z.object({
  body: z.object({
    amount: z.number().optional(),
    returnRate: z.number().optional(),
    inflationRate: z.number().optional(),
    tanationRate: z.number().optional(),
    frequency: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export const SavingValidation = {
  createSavingZodSchema,
  updateSavingZodSchema,
};
