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
exports.DateNightService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const dateNight_model_1 = require("./dateNight.model");
const user_model_1 = require("../user/user.model");
const createDateNightToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const newDateNight = yield dateNight_model_1.DateNight.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newDateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create date night');
    }
    return newDateNight;
});
const getDateNightsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    const dateNights = yield dateNight_model_1.DateNight.find({ userId, isDeleted: false });
    const PartnerDateNights = yield dateNight_model_1.DateNight.find({ userId: user === null || user === void 0 ? void 0 : user.partnerId, isDeleted: false });
    if (!dateNights.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No date nights found');
    }
    return [...dateNights, ...PartnerDateNights];
});
const getSingleDateNightFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    return dateNight;
});
const updateDateNightToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    const updated = yield dateNight_model_1.DateNight.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update date night');
    }
    return updated;
});
const deleteDateNightFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    const deleted = yield dateNight_model_1.DateNight.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    return true;
});
exports.DateNightService = {
    createDateNightToDB,
    getDateNightsFromDB,
    getSingleDateNightFromDB,
    updateDateNightToDB,
    deleteDateNightFromDB,
};
