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
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const emailHelper_1 = require("../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const generateOTP_1 = __importDefault(require("../../../utils/generateOTP"));
const config_1 = __importDefault(require("../../../config"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
// create user
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    //set role
    const user = yield user_model_1.User.isExistUserByEmail(payload.email);
    if (user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
    }
    payload.role = user_1.USER_ROLES.USER;
    const createUser = yield user_model_1.User.create(payload);
    if (!createUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    //send email
    const otp = (0, generateOTP_1.default)(4);
    const values = {
        name: createUser.name,
        otp: otp,
        email: createUser.email,
    };
    const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
    emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
    //save to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
    };
    yield user_model_1.User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });
    return createUser;
});
const handleAppleAuthentication = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, appleId, fullName } = payload;
    // Check if the user already exists by Apple ID or email
    const existingUser = yield user_model_1.User.findOne({ email }).select('+password');
    // If user doesn't exist, treat it as a sign-up
    if (!existingUser) {
        // Check if the user is signing up with Apple and email is not already in use
        const userExists = yield user_model_1.User.isExistUserByEmail(email);
        if (userExists) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
        }
        // Create the new user
        const newUser = yield user_model_1.User.create({
            email,
            socialId: appleId,
            name: fullName.givenName + ' ' + fullName.familyName,
            authProvider: 'apple',
            password: appleId,
            role: user_1.USER_ROLES.USER, // Default role as User
        });
        if (!newUser) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
        }
        // Send OTP for email verification
        const otp = (0, generateOTP_1.default)(4);
        const values = {
            name: newUser.name,
            otp,
            email: newUser.email,
        };
        const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
        emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
        // Save OTP for later verification
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 3 * 60000), // OTP expiration time of 3 minutes
        };
        yield user_model_1.User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });
        return { message: 'Account created successfully, please verify via OTP' };
    }
    // If user exists, perform login
    if (existingUser) {
        // check verified and status
        if (!existingUser.verified) {
            //send mail
            const otp = (0, generateOTP_1.default)(4);
            const value = { otp, email: existingUser.email };
            const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
            emailHelper_1.emailHelper.sendEmail(forgetPassword);
            //save to DB
            const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
            yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
        }
        // check user status
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.status) === 'blocked') {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
        }
        const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
        // create token
        const accessToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const refreshToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
        return { accessToken, refreshToken };
    }
    throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
});
const handleGoogleAuthentication = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, googleId, email_verified, name } = payload;
    // Check if the user already exists by Google ID or email
    const existingUser = yield user_model_1.User.findOne({ email }).select('+password');
    // If user doesn't exist, treat it as a sign-up
    if (!existingUser) {
        // Check if the user is signing up with Google and email is not already in use
        const userExists = yield user_model_1.User.isExistUserByEmail(email);
        if (userExists) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
        }
        // Create the new user
        const newUser = yield user_model_1.User.create({
            image: (payload === null || payload === void 0 ? void 0 : payload.picture) || '',
            email,
            socialId: googleId,
            verified: email_verified,
            name,
            password: googleId,
            authProvider: 'google',
            role: user_1.USER_ROLES.USER, // Default role as User
        });
        if (!newUser) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
        }
        // Send OTP for email verification
        const otp = (0, generateOTP_1.default)(4);
        const values = {
            name: newUser.name,
            otp,
            email: newUser.email,
        };
        const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
        emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
        // Save OTP for later verification
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 3 * 60000), // OTP expiration time of 3 minutes
        };
        yield user_model_1.User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });
        return { message: 'Account created successfully, please verify via OTP' };
    }
    // If user exists, perform login
    if (existingUser) {
        // check verified and status
        if (!existingUser.verified) {
            //send mail
            const otp = (0, generateOTP_1.default)(4);
            const value = { otp, email: existingUser.email };
            const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
            emailHelper_1.emailHelper.sendEmail(forgetPassword);
            //save to DB
            const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
            yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
        }
        // check user status
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.status) === 'blocked') {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
        }
        const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
        // create token
        const accessToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const refreshToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
        return { accessToken, refreshToken };
    }
    throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
});
// get user profile
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
// update user profile
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //unlink file here
    if (payload.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const verifyUserPassword = (userId, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+password');
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const isPasswordValid = yield user_model_1.User.isMatchPassword(password, user.password);
    return isPasswordValid;
});
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    yield user_model_1.User.findByIdAndUpdate(id, {
        $set: { isDeleted: true },
    });
    return true;
});
exports.UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    deleteUser,
    verifyUserPassword,
    handleAppleAuthentication,
    handleGoogleAuthentication,
};
