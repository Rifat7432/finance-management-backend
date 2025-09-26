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
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../errors/AppError"));
const stripe_1 = __importDefault(require("../config/stripe"));
// Fetch payment info from the database
const getPaymentInfo = (paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    // const paymentInfo = await PaymentModel.findOne({ paymentIntentId });
    // if (!paymentInfo) {
    //   throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
    // }
    // return paymentInfo;
});
// Get vendor details and ensure they have a Stripe account
const getVendorInfo = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    // const vendorInfo = await ShopModel.findById(shopId)
    //   .populate({
    //     path: 'userId',
    //     select: 'stripeAccountId',
    //   })
    //   .exec();
    // if (!vendorInfo || !vendorInfo.userId || !vendorInfo.userId.stripeAccountId) {
    //   throw new AppError(StatusCodes.BAD_REQUEST, 'Vendor Stripe account not found');
    // }
    // return vendorInfo;
});
// Calculate the admin fee and remaining amount after the fee is deducted
const calculateAdminFee = (paymentAmount, shopId) => __awaiter(void 0, void 0, void 0, function* () {
    // const adminPercentage = await ShopModel.findById(shopId);
    // if (!adminPercentage) {
    //   throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Admin fee percentage not found');
    // }
    // const adminFeeAmount = Math.floor((paymentAmount * adminPercentage.revenue) / 100);
    // const remainingAmount = paymentAmount - adminFeeAmount;
    // return remainingAmount;
});
// Check Stripe balance for available funds
const checkStripeBalance = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    const balance = yield stripe_1.default.balance.retrieve();
    if (balance.available[0].amount < amount * 100) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Insufficient funds in platform account for transfer');
    }
});
// Verify the vendor's Stripe account is active and enabled
const verifyStripeAccount = (stripeAccountId) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield stripe_1.default.accounts.retrieve(stripeAccountId);
    if (account.requirements && account.requirements.disabled_reason) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Vendor's Stripe account is not enabled: ${account.requirements.disabled_reason}`);
    }
});
// Create the transfer to the vendor's Stripe account
const createTransfer = (stripeAccountId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    return stripe_1.default.transfers.create({
        amount: Math.floor(amount * 100), // Convert to cents
        currency: 'usd',
        destination: stripeAccountId,
    });
});
// Create payout to vendor's external bank account or card
const createPayout = (stripeAccountId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const externalAccount = yield stripe_1.default.accounts.listExternalAccounts(stripeAccountId, {
        object: 'bank_account',
    });
    if (!externalAccount.data.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No external bank accounts found for the vendor');
    }
    return stripe_1.default.payouts.create({
        amount: Math.floor(amount * 100), // Convert to cents
        currency: 'usd',
        destination: externalAccount.data[0].id,
        method: 'standard', // Can change to 'instant' for instant payouts
    }, { stripeAccount: stripeAccountId });
});
// Main function to transfer funds to vendor
const transferToVendor = (shopId, paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentInfo = yield getPaymentInfo(paymentIntentId);
        const vendorInfo = yield getVendorInfo(shopId);
        // const remainingAmount = await calculateAdminFee(paymentInfo.totalAmount, shopId);
        // await checkStripeBalance(remainingAmount);
        // await verifyStripeAccount(vendorInfo.userId.stripeAccountId);
        // const transfer = await createTransfer(vendorInfo.userId.stripeAccountId, remainingAmount);
        // const payout = await createPayout(vendorInfo.userId.stripeAccountId, remainingAmount);
        // // Optionally, update payment and order status
        // await PaymentModel.findOneAndUpdate(
        //   { paymentIntentId },
        //   { orderStatus: 'completed' },
        //   { new: true }
        // );
        // await OrderModel.findOneAndUpdate(
        //   { paymentIntentId },
        //   { orderStatus: 'completed' }
        // );
        // Return transfer and payout details
        // return { transfer, payout };
    }
    catch (error) {
        console.error('Transfer failed:', error);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Transfer failed');
    }
});
exports.default = transferToVendor;
