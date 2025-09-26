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
exports.handleSubscriptionUpdated = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = require("../../../app/modules/user/user.model");
const package_model_1 = require("../../../app/modules/package/package.model");
const subscription_model_1 = require("../../../app/modules/subscription/subscription.model");
const formatUnixToDate = (timestamp) => new Date(timestamp * 1000);
const handleSubscriptionUpdated = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const subscription = yield stripe_1.default.subscriptions.retrieve(data.id);
        const customer = (yield stripe_1.default.customers.retrieve(subscription.customer));
        const priceId = (_b = (_a = subscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.id;
        const invoice = (yield stripe_1.default.invoices.retrieve(subscription.latest_invoice));
        const trxId = ((_c = invoice === null || invoice === void 0 ? void 0 : invoice.payment_intent) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const amountPaid = invoice.total / 100;
        const remaining = ((_d = subscription.items.data[0]) === null || _d === void 0 ? void 0 : _d.quantity) || 0;
        const currentPeriodStart = formatUnixToDate(subscription.current_period_start);
        const currentPeriodEnd = formatUnixToDate(subscription.current_period_end);
        const subscriptionId = subscription.id;
        if (!(customer === null || customer === void 0 ? void 0 : customer.email))
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No email found for customer.');
        const existingUser = yield user_model_1.User.findOne({ email: customer.email });
        if (!existingUser)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `User not found for email: ${customer.email}`);
        const pricingPlan = yield package_model_1.Package.findOne({ priceId });
        if (!pricingPlan)
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Package with priceId ${priceId} not found`);
        const currentSub = yield subscription_model_1.Subscription.findOne({
            userId: existingUser._id,
            status: 'active',
        }).populate('package');
        if (currentSub && ((_e = currentSub.package) === null || _e === void 0 ? void 0 : _e.priceId) !== priceId) {
            // Old plan, deactivate
            yield subscription_model_1.Subscription.findByIdAndUpdate(currentSub._id, {
                status: 'deactivated',
                remaining: 0,
                currentPeriodStart: null,
                currentPeriodEnd: null,
            });
        }
        // Create or update the current subscription
        yield subscription_model_1.Subscription.findOneAndUpdate({ subscriptionId }, {
            userId: existingUser._id,
            customerId: customer.id,
            package: pricingPlan._id,
            price: amountPaid,
            trxId,
            subscriptionId,
            currentPeriodStart,
            currentPeriodEnd,
            remaining,
            status: 'active',
        }, { upsert: true, new: true });
        yield user_model_1.User.findByIdAndUpdate(existingUser._id, {
            isSubscribed: true,
            hasAccess: true,
            packageName: pricingPlan.title,
        });
    }
    catch (error) {
        throw error instanceof AppError_1.default ? error : new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error updating subscription status');
    }
});
exports.handleSubscriptionUpdated = handleSubscriptionUpdated;
