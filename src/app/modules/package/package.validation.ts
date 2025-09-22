import { z } from 'zod';

// Common transformations for price fields
const priceSchema = z
  .union([z.string(), z.number()])
  .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
  .refine((val) => !isNaN(val), {
    message: 'Price must be a valid number.',
  });

const createPackageZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    price: priceSchema,
    promoPrice: priceSchema.optional(),
    duration: z.enum(['1 month', '3 months', '6 months', '1 year'], {
      required_error: 'Duration is required',
    }),
    paymentType: z.enum(['Monthly', 'Yearly'], {
      required_error: 'Payment type is required',
    }),
    currency: z.string().default('usd').optional(),
    productId: z.string().optional(),
    priceId: z.string().optional(),
    promoPriceId: z.string().optional(),
    subscriptionType: z.enum(['app', 'web'], {
      required_error: 'Subscription type is required',
    }),
    status: z.enum(['active', 'inactive']).default('active').optional(),
    isDeleted: z.boolean().default(false).optional(),
  }),
});

const updatePackageZodSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      price: priceSchema.optional(),
      promoPrice: priceSchema.optional(),
      duration: z.enum(['1 month', '3 months', '6 months', '1 year']).optional(),
      paymentType: z.enum(['Monthly', 'Yearly']).optional(),
      currency: z.string().optional(),
      productId: z.string().optional(),
      priceId: z.string().optional(),
      promoPriceId: z.string().optional(),
      subscriptionType: z.enum(['app', 'web']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      isDeleted: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update.',
    }),
});

export const PackageValidation = {
  createPackageZodSchema,
  updatePackageZodSchema,
};
