import { z } from 'zod';

export const SubscriptionValidation = {
  createSubscriptionZodSchema: z.object({
    body: z.object({
      userId: z.string().nonempty('User ID is required'),
      subscriptionId: z.string().nonempty('Subscription ID is required'),
      productId: z.string().nonempty('Product ID is required'),
      purchaseToken: z.string().nonempty('Purchase token is required'),
    }),
  }),

  verifySubscriptionZodSchema: z.object({
    params: z.object({
      userId: z.string().nonempty('User ID is required'),
    }),
  }),

  webhookZodSchema: z.object({
    body: z.object({
      data: z.object({
        subscription_id: z.string(),
        status: z.enum(['active', 'inactive', 'expired', 'canceled']),
      }),
    }),
  }),
};
