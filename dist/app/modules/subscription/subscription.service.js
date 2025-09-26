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
const package_model_1 = require("../package/package.model");
const subscription_model_1 = require("./subscription.model");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const user_model_1 = require("../user/user.model");
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const subscriptionDetailsFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findOne({ userId: id }).populate('package', 'title credit duration').lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }
    const subscriptionFromStripe = yield stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
    // Check subscription status and update database accordingly
    if ((subscriptionFromStripe === null || subscriptionFromStripe === void 0 ? void 0 : subscriptionFromStripe.status) !== 'active') {
        yield Promise.all([user_model_1.User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), subscription_model_1.Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
    }
    return { subscription };
});
const companySubscriptionDetailsFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findOne({ userId: id }).populate('package', 'title credit').lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }
    const subscriptionFromStripe = yield stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
    // Check subscription status and update database accordingly
    if ((subscriptionFromStripe === null || subscriptionFromStripe === void 0 ? void 0 : subscriptionFromStripe.status) !== 'active') {
        yield Promise.all([user_model_1.User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), subscription_model_1.Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
    }
    return { subscription };
});
const subscriptionsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const conditions = [];
    const { searchTerm, limit, page, paymentType } = query;
    // Handle search term - search in both package title and user details
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
        const trimmedSearchTerm = searchTerm.trim();
        // Find matching packages by title or paymentType
        const matchingPackageIds = yield package_model_1.Package.find({
            $or: [{ title: { $regex: trimmedSearchTerm, $options: 'i' } }, { paymentType: { $regex: trimmedSearchTerm, $options: 'i' } }],
        }).distinct('_id');
        // Find matching users by email, name, company, etc.
        const matchingUserIds = yield user_model_1.User.find({
            $or: [
                { email: { $regex: trimmedSearchTerm, $options: 'i' } },
                { name: { $regex: trimmedSearchTerm, $options: 'i' } },
                { company: { $regex: trimmedSearchTerm, $options: 'i' } },
                { contact: { $regex: trimmedSearchTerm, $options: 'i' } },
            ],
        }).distinct('_id');
        // Create search conditions
        const searchConditions = [];
        if (matchingPackageIds.length > 0) {
            searchConditions.push({ package: { $in: matchingPackageIds } });
        }
        if (matchingUserIds.length > 0) {
            searchConditions.push({ userId: { $in: matchingUserIds } });
        }
        // Only add search condition if we found matching packages or users
        if (searchConditions.length > 0) {
            conditions.push({ $or: searchConditions });
        }
        else {
            // If no matches found, return empty result early
            return {
                data: [],
                meta: {
                    page: parseInt(page) || 1,
                    total: 0,
                },
            };
        }
    }
    // Handle payment type filter
    if (paymentType && typeof paymentType === 'string' && paymentType.trim()) {
        const packageIdsWithPaymentType = yield package_model_1.Package.find({
            paymentType: paymentType.trim(),
        }).distinct('_id');
        if (packageIdsWithPaymentType.length > 0) {
            conditions.push({ package: { $in: packageIdsWithPaymentType } });
        }
        else {
            // If no packages match the payment type, return empty result
            return {
                data: [],
                meta: {
                    page: parseInt(page) || 1,
                    total: 0,
                },
            };
        }
    }
    // Build final query conditions
    const whereConditions = conditions.length > 0 ? { $and: conditions } : {};
    // Pagination
    const pages = Math.max(1, parseInt(page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Limit max size
    const skip = (pages - 1) * size;
    try {
        // Execute query with population
        const result = yield subscription_model_1.Subscription.find(whereConditions)
            .populate([
            {
                path: 'package',
                select: 'title paymentType credit description',
            },
            {
                path: 'userId',
                select: 'email name linkedIn contact company website',
            },
        ])
            .select('userId package price trxId currentPeriodStart currentPeriodEnd status createdAt updatedAt')
            .sort({ createdAt: -1 }) // Add sorting by creation date
            .skip(skip)
            .limit(size)
            .lean(); // Use lean() for better performance
        // Get total count for pagination
        const count = yield subscription_model_1.Subscription.countDocuments(whereConditions);
        const data = {
            data: result,
            meta: {
                page: pages,
                limit: size,
                total: count,
                totalPages: Math.ceil(count / size),
            },
        };
        return data;
    }
    catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw new Error('Failed to fetch subscriptions');
    }
});
const upgradeSubscriptionToDB = (userId, packageId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find active subscription in DB
    const activeSubscription = yield subscription_model_1.Subscription.findOne({
        userId,
        status: 'active',
    });
    if (!activeSubscription || !activeSubscription.subscriptionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No active subscription found to upgrade');
    }
    // 2. Get new package info
    const packageDoc = yield package_model_1.Package.findById(packageId);
    if (!packageDoc || !packageDoc.priceId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found or missing Stripe Regular Price ID');
    }
    // 3. Ensure user exists & has Stripe customer ID
    const user = yield user_model_1.User.findById(userId).select('+stripeCustomerId');
    if (!user || !user.stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
    }
    // 4. Retrieve existing subscription from Stripe
    const stripeSubscription = yield stripe_1.default.subscriptions.retrieve(activeSubscription.subscriptionId);
    if (!stripeSubscription || stripeSubscription.status !== 'active') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No active subscription found in Stripe');
    }
    // 5. Upgrade subscription → always to new regular price
    const updatedSubscription = yield stripe_1.default.subscriptions.update(activeSubscription.subscriptionId, {
        items: [
            {
                id: stripeSubscription.items.data[0].id,
                price: packageDoc.priceId,
            },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
            userId,
            packageId: packageDoc._id.toString(),
        },
    });
    // 6. Update DB record
    yield subscription_model_1.Subscription.findByIdAndUpdate(activeSubscription._id, {
        package: packageDoc._id,
        updatedAt: new Date(),
    });
    return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
    };
});
const cancelSubscriptionToDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const activeSubscription = yield subscription_model_1.Subscription.findOne({
        userId,
        status: 'active',
    });
    if (!activeSubscription || !activeSubscription.subscriptionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No active subscription found to cancel');
    }
    const stripeSub = yield stripe_1.default.subscriptions.retrieve(activeSubscription.subscriptionId);
    if (stripeSub.status === 'canceled') {
        return { success: true, message: 'Already canceled' };
    }
    yield stripe_1.default.subscriptions.cancel(activeSubscription.subscriptionId);
    yield subscription_model_1.Subscription.findOneAndUpdate({ userId, status: 'active' }, { status: 'canceled' }, { new: true });
    return { success: true, message: 'Subscription canceled successfully' };
});
const successMessage = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield stripe_1.default.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
    });
    return {
        status: session.payment_status,
        subscriptionId: session.subscription,
        customerEmail: session.customer_email,
    };
});
const createSubscriptionSetupIntoDB = (userId, packageId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+stripeCustomerId');
    if (!user || !user.stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
    }
    // Create customer if not exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = yield stripe_1.default.customers.create({ email: user.email });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        yield user.save();
    }
    // Create SetupIntent to collect card/payment method
    const setupIntent = yield stripe_1.default.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
    });
    return {
        clientSecret: setupIntent.client_secret,
        customerId,
    };
});
const createSubscriptionIntoDB = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, paymentMethodId, packageId, }) {
    var _b, _c, _d, _e;
    const user = yield user_model_1.User.findById(userId).select('+stripeCustomerId');
    const pkg = yield package_model_1.Package.findById(packageId);
    if (!user || !user.stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
    }
    if (!pkg || !pkg.priceId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package or Stripe Price IDs not found');
    }
    // Attach payment method
    yield stripe_1.default.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
    });
    yield stripe_1.default.customers.update(user.stripeCustomerId, {
        invoice_settings: {
            default_payment_method: paymentMethodId,
        },
    });
    // Always start with 1 month free trial
    const phases = [
        {
            items: [{ price: pkg.priceId }],
            trial: 30 * 24 * 60 * 60, // 1 month in seconds
        },
    ];
    // If promo price exists → add promo phase
    if (pkg.promoPriceId) {
        phases.push({
            items: [{ price: pkg.promoPriceId }],
            iterations: 3, // 3 billing cycles (3 months promo)
        });
    }
    // Then continue with regular price
    phases.push({
        items: [{ price: pkg.priceId }],
        iterations: null, // ongoing until cancelled
    });
    // Create subscription schedule
    const schedule = yield stripe_1.default.subscriptionSchedules.create({
        customer: user.stripeCustomerId,
        start_date: 'now',
        end_behavior: 'release',
        phases,
        expand: ['subscription.latest_invoice.payment_intent'],
    });
    const subscription = schedule.subscription;
    // Save subscription in DB
    yield subscription_model_1.Subscription.create({
        userId: user._id,
        package: pkg._id,
        subscriptionId: subscription.id,
        customerId: user.stripeCustomerId,
        trxId: ((_c = (_b = subscription.latest_invoice) === null || _b === void 0 ? void 0 : _b.payment_intent) === null || _c === void 0 ? void 0 : _c.id) || '',
        price: pkg.price,
        remaining: 0, // Set this as needed, e.g. pkg.credit or similar
        status: subscription.status === 'active' ? 'active' : (subscription.status === 'canceled' ? 'cancel' : subscription.status),
        currentPeriodStart: String(subscription.current_period_start),
        currentPeriodEnd: String(subscription.current_period_end),
    });
    return {
        subscriptionId: subscription.id,
        scheduleId: schedule.id,
        clientSecret: (_e = (_d = subscription.latest_invoice) === null || _d === void 0 ? void 0 : _d.payment_intent) === null || _e === void 0 ? void 0 : _e.client_secret,
    };
});
exports.SubscriptionService = {
    subscriptionDetailsFromDB,
    subscriptionsFromDB,
    companySubscriptionDetailsFromDB,
    upgradeSubscriptionToDB,
    cancelSubscriptionToDB,
    successMessage,
    createSubscriptionSetupIntoDB,
    createSubscriptionIntoDB,
};
