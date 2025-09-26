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
exports.SubscriptionController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const subscription_service_1 = require("./subscription.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const subscriptions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_service_1.SubscriptionService.subscriptionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription list retrieved successfully',
        data: result,
    });
}));
const subscriptionDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = yield subscription_service_1.SubscriptionService.subscriptionDetailsFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription details retrieved successfully',
        data: result.subscription,
    });
}));
const cancelSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = yield subscription_service_1.SubscriptionService.cancelSubscriptionToDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Cancel subscription successfully',
        data: result,
    });
}));
// create subscription intents
const createSubscriptionSetup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const packageId = req.params.id;
    const result = yield subscription_service_1.SubscriptionService.createSubscriptionSetupIntoDB(id, packageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Create Intent successfully',
        data: {
            customerId: result.customerId,
            clientSecret: result.clientSecret,
        },
    });
}));
//create subscription
const createSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const packageId = req.params.id;
    const result = yield subscription_service_1.SubscriptionService.createSubscriptionIntoDB({
        userId: id,
        paymentMethodId: req.body.paymentMethodId,
        packageId,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Create checkout session successfully',
        data: {
            subscriptionId: result.subscriptionId,
            clientSecret: result.clientSecret,
        },
    });
}));
// update subscriptions
const updateSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const packageId = req.params.id;
    const result = yield subscription_service_1.SubscriptionService.upgradeSubscriptionToDB(id, packageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription upgraded successfully',
        data: {
            url: result.subscriptionId,
        },
    });
}));
const orderSuccess = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.query.session_id;
    const session = yield subscription_service_1.SubscriptionService.successMessage(sessionId);
    res.render('success', { session });
}));
// Assuming you have OrderServices imported properly
const orderCancel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('cancel');
}));
exports.SubscriptionController = {
    subscriptions,
    subscriptionDetails,
    updateSubscription,
    cancelSubscription,
    orderSuccess,
    orderCancel,
    createSubscription,
    createSubscriptionSetup,
};
