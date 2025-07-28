import { z } from 'zod';

const createAdZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
  }),
});

const updateAdZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const AdValidation = {
  createAdZodSchema,
  updateAdZodSchema,
};
