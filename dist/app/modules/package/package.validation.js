"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageValidation = void 0;
const zod_1 = require("zod");
// Common transformations for price fields
const priceSchema = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val), {
    message: 'Price must be a valid number.',
});
const createPackageZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }),
        description: zod_1.z.string({ required_error: 'Description is required' }),
        price: priceSchema,
        promoPrice: priceSchema.optional(),
        duration: zod_1.z.enum(['1 month', '3 months', '6 months', '1 year'], {
            required_error: 'Duration is required',
        }),
        paymentType: zod_1.z.enum(['Monthly', 'Yearly'], {
            required_error: 'Payment type is required',
        }),
        currency: zod_1.z.string().default('usd').optional(),
        productId: zod_1.z.string().optional(),
        priceId: zod_1.z.string().optional(),
        promoPriceId: zod_1.z.string().optional(),
        subscriptionType: zod_1.z.enum(['app', 'web'], {
            required_error: 'Subscription type is required',
        }),
        status: zod_1.z.enum(['active', 'inactive']).default('active').optional(),
        isDeleted: zod_1.z.boolean().default(false).optional(),
    }),
});
const updatePackageZodSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        price: priceSchema.optional(),
        promoPrice: priceSchema.optional(),
        duration: zod_1.z.enum(['1 month', '3 months', '6 months', '1 year']).optional(),
        paymentType: zod_1.z.enum(['Monthly', 'Yearly']).optional(),
        currency: zod_1.z.string().optional(),
        productId: zod_1.z.string().optional(),
        priceId: zod_1.z.string().optional(),
        promoPriceId: zod_1.z.string().optional(),
        subscriptionType: zod_1.z.enum(['app', 'web']).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        isDeleted: zod_1.z.boolean().optional(),
    })
        .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update.',
    }),
});
exports.PackageValidation = {
    createPackageZodSchema,
    updatePackageZodSchema,
};
