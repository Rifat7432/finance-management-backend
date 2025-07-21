import { z } from 'zod';

const createBudgetZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    amount: z.number({ required_error: 'Amount is required' }).min(0),
    type: z.string({ required_error: 'Type is required' }),
    category: z.string({ required_error: 'Category is required' }),
    userId: z.string({ required_error: 'User ID is required' }),
  }),
});

const updateBudgetZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    amount: z.number().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export const BudgetValidation = {
  createBudgetZodSchema,
  updateBudgetZodSchema,
};
