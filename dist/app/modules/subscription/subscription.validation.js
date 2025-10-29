"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionValidation = void 0;
const zod_1 = require("zod");
exports.SubscriptionValidation = {
    createSubscriptionZodSchema: zod_1.z.object({
        body: zod_1.z.object({
            userId: zod_1.z.string().nonempty('User ID is required'),
            subscriptionId: zod_1.z.string().nonempty('Subscription ID is required'),
            productId: zod_1.z.string().nonempty('Product ID is required'),
            purchaseToken: zod_1.z.string().nonempty('Purchase token is required'),
        }),
    }),
    verifySubscriptionZodSchema: zod_1.z.object({
        params: zod_1.z.object({
            userId: zod_1.z.string().nonempty('User ID is required'),
        }),
    }),
    webhookZodSchema: zod_1.z.object({
        body: zod_1.z.object({
            data: zod_1.z.object({
                subscription_id: zod_1.z.string(),
                status: zod_1.z.enum(['active', 'inactive', 'expired', 'canceled']),
            }),
        }),
    }),
};
