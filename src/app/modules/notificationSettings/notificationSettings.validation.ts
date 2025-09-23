import { z } from 'zod';

const createNotificationSettingsZodSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }),
    budgetNotification: z.boolean().default(true),
    contentNotification: z.boolean().default(true),
    debtNotification: z.boolean().default(true),
    dateNightNotification: z.boolean().default(true),
  }),
});

const updateNotificationSettingsZodSchema = z.object({
  body: z.object({
    budgetNotification: z.boolean().optional(),
    contentNotification: z.boolean().optional(),
    debtNotification: z.boolean().optional(),
    dateNightNotification: z.boolean().optional(),
  }),
});

export const NotificationSettingsValidation = {
  createNotificationSettingsZodSchema,
  updateNotificationSettingsZodSchema,
};
