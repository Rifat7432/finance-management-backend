"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionProduct = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../config/stripe"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createSubscriptionProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Create Product in Stripe
    const product = yield stripe_1.default.products.create({
        name: payload.title,
        description: payload.description,
    });
    if (!product) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create product in Stripe');
    }
    // Interval mapping (flexible)
    let interval = 'month';
    let intervalCount = 1;
    switch (payload.duration) {
        case '1 month':
            interval = 'month';
            intervalCount = 1;
            break;
        case '3 months':
            interval = 'month';
            intervalCount = 3;
            break;
        case '6 months':
            interval = 'month';
            intervalCount = 6;
            break;
        case '1 year':
            interval = 'year';
            intervalCount = 1;
            break;
        default:
            interval = 'month';
            intervalCount = 1;
    }
    // Create Regular Price
    if (!payload.price) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Regular price is required');
    }
    const regularPrice = yield stripe_1.default.prices.create({
        product: product.id,
        unit_amount: Number(payload.price) * 100,
        currency: payload.currency || 'usd',
        recurring: { interval, interval_count: intervalCount },
    });
    if (!regularPrice) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create regular price in Stripe');
    }
    let promoPriceId;
    // Create Promo Price if admin provided
    if (payload.promoPrice) {
        const promoPrice = yield stripe_1.default.prices.create({
            product: product.id,
            unit_amount: Number(payload.promoPrice) * 100,
            currency: payload.currency || 'usd',
            recurring: { interval, interval_count: intervalCount },
        });
        if (!promoPrice) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create promo price in Stripe');
        }
        promoPriceId = promoPrice.id;
    }
    return {
        productId: product.id,
        regularPriceId: regularPrice.id,
        promoPriceId,
    };
});
exports.createSubscriptionProduct = createSubscriptionProduct;
