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
exports.AdService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ad_model_1 = require("./ad.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const createAdToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const newAd = yield ad_model_1.Ad.create(payload);
    if (!newAd) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create ad');
    }
    return newAd;
});
const getAdsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const ads = yield ad_model_1.Ad.find({ isDeleted: false });
    if (!ads.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No ads found');
    }
    return ads;
});
const getSingleAdFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const [ad] = yield ad_model_1.Ad.aggregate([
        {
            $match: {
                isDeleted: false,
                startDate: { $lte: now.toISOString() },
                endDate: { $gte: now.toISOString() },
            },
        },
        { $sample: { size: 1 } }, // pick only 1 random ad
    ]);
    return ad;
});
const updateAdToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const ad = yield ad_model_1.Ad.findById(id);
    if (!ad || ad.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ad not found or deleted');
    }
    const updated = yield ad_model_1.Ad.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update ad');
    }
    return updated;
});
const deleteAdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const ad = yield ad_model_1.Ad.findById(id);
    if (!ad || ad.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ad not found or deleted');
    }
    const deleted = yield ad_model_1.Ad.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ad not found');
    }
    return true;
});
exports.AdService = {
    createAdToDB,
    getAdsFromDB,
    getSingleAdFromDB,
    updateAdToDB,
    deleteAdFromDB,
};
