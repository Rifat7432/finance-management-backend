import { z } from 'zod';

const createPartnerRequestZodSchema = z.object({
     body: z.object({
          fromUser: z.string({ required_error: 'From user is required' }),
          toUser: z.string().optional(),
          email: z.string({ required_error: 'Email is required' }).email(),
          relation: z.string().optional(),
          status: z.enum(['pending', 'accepted', 'rejected']).optional(),
     }),
});

export const PartnerRequestValidation = {
     createPartnerRequestZodSchema,
};
