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
exports.updateSubscriptionProduct = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../config/stripe"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const updateSubscriptionProduct = (subscriptionId, newPriceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscription = yield stripe_1.default.subscriptions.retrieve(subscriptionId);
        const updatedSubscription = yield stripe_1.default.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscription.items.data[0].id,
                    price: newPriceId,
                },
            ],
        });
        // This will trigger the `customer.subscription.updated` event in Stripe
        return updatedSubscription;
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error updating subscription: ${error.message}`);
    }
});
exports.updateSubscriptionProduct = updateSubscriptionProduct;
