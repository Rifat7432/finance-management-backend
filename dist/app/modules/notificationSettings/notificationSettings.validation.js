"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingsValidation = void 0;
const zod_1 = require("zod");
const createNotificationSettingsZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string({ required_error: 'User ID is required' }),
        budgetNotification: zod_1.z.boolean().default(true),
        contentNotification: zod_1.z.boolean().default(true),
        debtNotification: zod_1.z.boolean().default(true),
        dateNightNotification: zod_1.z.boolean().default(true),
    }),
});
const updateNotificationSettingsZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        budgetNotification: zod_1.z.boolean().optional(),
        contentNotification: zod_1.z.boolean().optional(),
        debtNotification: zod_1.z.boolean().optional(),
        dateNightNotification: zod_1.z.boolean().optional(),
    }),
});
exports.NotificationSettingsValidation = {
    createNotificationSettingsZodSchema,
    updateNotificationSettingsZodSchema,
};
