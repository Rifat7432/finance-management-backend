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
exports.SubscriptionService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const subscription_model_1 = require("./subscription.model");
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = __importDefault(require("../../../config"));
// 🔍 Verify subscription with RevenueCat API (optional)
const verifyWithRevenueCat = (appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, node_fetch_1.default)(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
        headers: {
            'Authorization': `Bearer ${config_1.default.revenuecat_secret_key}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'RevenueCat verification failed');
    return res.json();
});
// 🟢 Create subscription (initial data from app)
const createSubscriptionToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const revenueCatData = yield verifyWithRevenueCat(payload.subscriptionId);
    const isUserSubscribed = yield subscription_model_1.Subscription.findOne({ userId });
    if (isUserSubscribed) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User already has a subscription');
    }
    const subscription = yield subscription_model_1.Subscription.create(Object.assign(Object.assign({}, payload), { userId, status: payload.status || 'active', lastVerified: new Date() }));
    if (!subscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subscription');
    }
    return subscription;
});
// 🔵 Handle RevenueCat webhook
const handleWebhookEventToDB = (webhookData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { event, app_user_id, product_id, purchase_token, event_type, expiration_at_ms, period_type } = webhookData;
        const updateData = {
            status: event_type === 'CANCELLATION' ? 'canceled' : 'active',
            productId: product_id,
            purchaseToken: purchase_token,
            expiryDate: expiration_at_ms ? new Date(expiration_at_ms) : undefined,
            lastVerified: new Date(),
        };
        yield subscription_model_1.Subscription.findOneAndUpdate({ subscriptionId: app_user_id }, { $set: updateData }, { new: true, upsert: true });
        console.log(`✅ RevenueCat webhook processed: ${event_type} for ${app_user_id}`);
    }
    catch (error) {
        console.error('❌ RevenueCat webhook failed:', error);
    }
});
// 🟠 Manual verification (optional)
const verifySubscriptionToDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findOne({ userId });
    if (!subscription)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Subscription not found');
    const adaptyData = yield verifyWithRevenueCat(subscription.subscriptionId);
    const updated = yield subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, {
        status: adaptyData.subscriber.entitlements.active ? 'active' : 'canceled',
        expiryDate: new Date(adaptyData.subscriber.expiration_date),
        lastVerified: new Date(),
    }, { new: true });
    if (!updated)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
    return updated;
});
exports.SubscriptionService = {
    createSubscriptionToDB,
    handleWebhookEventToDB,
    verifySubscriptionToDB,
};
