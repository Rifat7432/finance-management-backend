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
exports.handleSubscriptionCreated = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const package_model_1 = require("../../../app/modules/package/package.model");
const user_model_1 = require("../../../app/modules/user/user.model");
const subscription_model_1 = require("../../../app/modules/subscription/subscription.model");
const notificationsHelper_1 = require("../../notificationsHelper");
const formatUnixToIsoUtc = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('Z', '+00:00');
};
const handleSubscriptionCreated = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const adminUser = yield user_model_1.User.findOne({ role: 'SUPER_ADMIN' });
        if (!adminUser)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Admin not found!');
        const customer = yield stripe_1.default.customers.retrieve(data.customer);
        const priceId = (_b = (_a = data.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.id;
        const invoice = yield stripe_1.default.invoices.retrieve(data.latest_invoice);
        const trxId = ((_c = invoice === null || invoice === void 0 ? void 0 : invoice.payment_intent) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const amountPaid = invoice.total / 100;
        const remaining = ((_d = data.items.data[0]) === null || _d === void 0 ? void 0 : _d.quantity) || 0;
        const currentPeriodStart = formatUnixToIsoUtc(data.current_period_start);
        const currentPeriodEnd = formatUnixToIsoUtc(data.current_period_end);
        const subscriptionId = data.id;
        if (!(customer === null || customer === void 0 ? void 0 : customer.email))
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No email found for the customer');
        const existingUser = yield user_model_1.User.findOne({ email: customer.email });
        if (!existingUser)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `User not found for email: ${customer.email}`);
        const pricingPlan = yield package_model_1.Package.findOne({ priceId });
        if (!pricingPlan)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Pricing plan not found for Price ID: ${priceId}`);
        const alreadySubscribed = yield subscription_model_1.Subscription.findOne({
            userId: existingUser._id,
            status: 'active',
        });
        if (alreadySubscribed) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'User already has an active subscription');
        }
        const newSubscription = new subscription_model_1.Subscription({
            userId: existingUser._id,
            customerId: customer.id,
            package: pricingPlan._id,
            status: 'active',
            price: amountPaid,
            trxId,
            remaining,
            currentPeriodStart,
            currentPeriodEnd,
            subscriptionId,
        });
        yield newSubscription.save();
        yield user_model_1.User.findByIdAndUpdate(existingUser._id, {
            isSubscribed: true,
            hasAccess: true,
            isFreeTrial: false,
            trialExpireAt: null,
            packageName: pricingPlan.title,
        }, { new: true });
        yield (0, notificationsHelper_1.sendNotifications)({
            title: `${existingUser.name}`,
            receiver: adminUser._id,
            message: `A new subscription has been purchased by ${existingUser.name}`,
            type: 'ORDER',
        });
    }
    catch (error) {
        console.error('Error in handleSubscriptionCreated:', error);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error in handleSubscriptionCreated: ${error instanceof Error ? error.message : error}`);
    }
});
exports.handleSubscriptionCreated = handleSubscriptionCreated;
