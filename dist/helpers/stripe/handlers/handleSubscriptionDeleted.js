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
exports.handleSubscriptionDeleted = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const subscription_model_1 = require("../../../app/modules/subscription/subscription.model");
const user_model_1 = require("../../../app/modules/user/user.model");
// const User:any = "";
// const Subscription:any = "";
const handleSubscriptionDeleted = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield stripe_1.default.subscriptions.retrieve(data.id);
    const userSubscription = yield subscription_model_1.Subscription.findOne({
        customerId: subscription.customer,
        status: 'active',
    });
    if (!userSubscription)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Subscription not found.');
    yield subscription_model_1.Subscription.findByIdAndUpdate(userSubscription._id, {
        status: 'cancel',
        remaining: 0,
        currentPeriodStart: null,
        currentPeriodEnd: null,
    });
    const user = yield user_model_1.User.findById(userSubscription.userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    yield user_model_1.User.findByIdAndUpdate(user._id, {
        hasAccess: false,
        isSubscribed: false,
        packageName: null,
    });
});
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
