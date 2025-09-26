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
exports.PackageService = exports.createPackageToDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const package_model_1 = require("./package.model");
const mongoose_1 = __importDefault(require("mongoose"));
const createSubscriptionProductHelper_1 = require("../../../helpers/stripe/createSubscriptionProductHelper");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const updateSubscriptionProductInfo_1 = require("../../../helpers/stripe/updateSubscriptionProductInfo");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createPackageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Prepare payload for Stripe
    const productPayload = {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        price: Number(payload.price),
        promoPrice: payload.promoPrice, // optional promo price
        currency: payload.currency, // optional currency
    };
    // 2. Create Stripe Product + Prices
    const product = yield (0, createSubscriptionProductHelper_1.createSubscriptionProduct)(productPayload);
    if (!product) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subscription product in Stripe');
    }
    // 3. Save Stripe IDs to package payload
    payload.productId = product.productId;
    payload.priceId = product.regularPriceId;
    if (product.promoPriceId) {
        payload.promoPriceId = product.promoPriceId;
    }
    // 4. Save package to MongoDB
    const result = yield package_model_1.Package.create(payload);
    if (!result) {
        // If DB save fails, clean up Stripe product
        yield stripe_1.default.products.del(product.productId);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Package in DB');
    }
    // 5. Return saved package
    return result;
});
exports.createPackageToDB = createPackageToDB;
const updatePackageToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if package exists
    const isExistPackage = yield package_model_1.Package.findById(id);
    if (!isExistPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    }
    // 2. Update product & prices in Stripe
    const updatedProduct = yield (0, updateSubscriptionProductInfo_1.updateSubscriptionInfo)(isExistPackage.productId, payload);
    if (!updatedProduct) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update subscription product in Stripe');
    }
    // 3. Sync Stripe IDs back to payload
    payload.productId = updatedProduct.productId;
    payload.priceId = updatedProduct.regularPriceId;
    payload.promoPriceId = updatedProduct.promoPriceId;
    // 4. Update in DB
    const updatedPackage = yield package_model_1.Package.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!updatedPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update package');
    }
    return updatedPackage;
});
const getPackageFromDB = (queryParms) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        isDeleted: false,
    };
    const queryBuilder = new QueryBuilder_1.default(package_model_1.Package.find(query), queryParms);
    const packages = yield queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
    console.log(packages);
    const meta = yield queryBuilder.countTotal();
    return {
        packages,
        meta,
    };
});
const getPackageByUserFromDB = (queryParms) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        status: 'active',
        isDeleted: false,
    };
    const queryBuilder = new QueryBuilder_1.default(package_model_1.Package.find(query), queryParms);
    const packages = yield queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
    const meta = yield queryBuilder.countTotal();
    return {
        packages,
        meta,
    };
});
const getPackageDetailsFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ID');
    }
    const result = yield package_model_1.Package.findById(id);
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    }
    return result;
});
const deletePackageToDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistPackage = yield package_model_1.Package.findById(id);
    if (!isExistPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    }
    try {
        // 1. Get all prices linked to this product
        const prices = yield stripe_1.default.prices.list({ product: isExistPackage.productId });
        // 2. Deactivate all prices (regular + promo)
        for (const price of prices.data) {
            if (price.active) {
                yield stripe_1.default.prices.update(price.id, { active: false });
            }
        }
        // 3. Archive the product instead of deleting
        yield stripe_1.default.products.update(isExistPackage.productId, {
            active: false,
            metadata: {
                deleted_at: new Date().toISOString(),
                deleted_by: 'system', // you can replace with current user info
            },
        });
        // 4. Soft delete in MongoDB
        const result = yield package_model_1.Package.findByIdAndUpdate(id, {
            status: 'inactive',
            isDeleted: true,
            deletedAt: new Date(),
            priceId: undefined,
            promoPriceId: undefined,
        }, { new: true });
        if (!result) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete package');
        }
        return result;
    }
    catch (stripeError) {
        // If Stripe product doesn’t exist, still mark package deleted in DB
        if (stripeError.type === 'StripeInvalidRequestError') {
            console.warn(`Stripe product ${isExistPackage.productId} not found, updating DB only`);
            return yield package_model_1.Package.findByIdAndUpdate(id, {
                status: 'inactive',
                isDeleted: true,
                deletedAt: new Date(),
                priceId: undefined,
                promoPriceId: undefined,
            }, { new: true });
        }
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Failed to delete package: ${stripeError.message}`);
    }
});
exports.PackageService = {
    createPackageToDB: exports.createPackageToDB,
    updatePackageToDB,
    getPackageFromDB,
    getPackageDetailsFromDB,
    deletePackageToDB,
    getPackageByUserFromDB,
};
