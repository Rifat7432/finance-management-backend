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
const colors_1 = __importDefault(require("colors"));
const handleSubscriptionCreated_1 = require("./handlers/handleSubscriptionCreated");
const handleSubscriptionDeleted_1 = require("./handlers/handleSubscriptionDeleted");
const handleSubscriptionUpdated_1 = require("./handlers/handleSubscriptionUpdated");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../../shared/logger");
const config_1 = __importDefault(require("../../config"));
const stripe_1 = __importDefault(require("../../config/stripe"));
const user_model_1 = require("../../app/modules/user/user.model");
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.stripe_webhook_secret;
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        logger_1.logger.error(`Webhook signature verification failed: ${error}`);
        return res.status(400).send(`Webhook error: ${error.message}`);
    }
    const eventType = event.type;
    const data = event.data.object;
    logger_1.logger.info(colors_1.default.cyan(`Received Stripe event: ${eventType}`));
    try {
        switch (eventType) {
            case 'customer.subscription.created':
                yield (0, handleSubscriptionCreated_1.handleSubscriptionCreated)(data);
                break;
            case 'customer.subscription.updated':
                yield (0, handleSubscriptionUpdated_1.handleSubscriptionUpdated)(data);
                break;
            case 'customer.subscription.deleted':
                yield (0, handleSubscriptionDeleted_1.handleSubscriptionDeleted)(data);
                break;
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                const customerId = paymentIntent.customer;
                // Optional: find the user and notify or mark failure
                const user = yield user_model_1.User.findOne({ stripeCustomerId: customerId });
                if (user) {
                    // Mark something like "lastPaymentStatus = failed"
                    yield user_model_1.User.findByIdAndUpdate(user._id, {
                        lastPaymentStatus: 'failed',
                        isSubscribed: false,
                        hasAccess: false,
                    });
                    // Optional: send notification or alert to user
                }
                break;
            }
            default:
                logger_1.logger.warn(colors_1.default.bgYellow.black(`Unhandled event type: ${eventType}`));
        }
        res.sendStatus(200);
    }
    catch (error) {
        logger_1.logger.error(`Stripe webhook processing error: ${error}`);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send('Webhook processing failed');
    }
});
exports.default = handleStripeWebhook;
