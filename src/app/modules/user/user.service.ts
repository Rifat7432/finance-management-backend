import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { User } from './user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
// create user
const createUserToDB = async (payload: IUser): Promise<IUser> => {
     //set role
     const user = await User.isExistUserByEmail(payload.email);
     if (user) {
          throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
     }
     payload.role = USER_ROLES.USER;
     const createUser = await User.create(payload);
     if (!createUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
     }

     //send email
     const otp = generateOTP(4);
     const values = {
          name: createUser.name,
          otp: otp,
          email: createUser.email!,
     };
     const createAccountTemplate = emailTemplate.createAccount(values);
     await emailHelper.sendEmail(createAccountTemplate);

     //save to DB
     const authentication = {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 3 * 60000),
     };
     await User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });

     return createUser;
};

const handleAppleAuthentication = async (payload: {
     email: string;
     appleId: string;
     fullName: {
          givenName: string;
          familyName: string;
     };
}): Promise<any> => {
     const { email, appleId, fullName } = payload;
     // Check if the user already exists by Apple ID or email
     const existingUser = await User.findOne({ email }).select('+password');
     // If user doesn't exist, treat it as a sign-up
     if (!existingUser) {
          // Check if the user is signing up with Apple and email is not already in use
          const userExists = await User.isExistUserByEmail(email);
          if (userExists) {
               throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
          }
          // Create the new user
          const newUser = await User.create({
               email,
               socialId: appleId,
               name: fullName.givenName + ' ' + fullName.familyName,
               authProvider: 'apple',
               password: appleId,
               role: USER_ROLES.USER, // Default role as User
          });
          if (!newUser) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
          }
          // Send OTP for email verification
          const otp = generateOTP(4);
          const values = {
               name: newUser.name,
               otp,
               email: newUser.email,
          };
          const createAccountTemplate = emailTemplate.createAccount(values);
          await emailHelper.sendEmail(createAccountTemplate);
          // Save OTP for later verification
          const authentication = {
               oneTimeCode: otp,
               expireAt: new Date(Date.now() + 3 * 60000), // OTP expiration time of 3 minutes
          };
          await User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });
          return { message: 'Account created successfully, please verify via OTP' };
     }
     // If user exists, perform login
     if (existingUser) {
          // check verified and status
          if (!existingUser.verified) {
               //send mail
               const otp = generateOTP(4);
               const value = { otp, email: existingUser.email };
               const forgetPassword = emailTemplate.resetPassword(value);
               await emailHelper.sendEmail(forgetPassword);
               //save to DB
               const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
               await User.findOneAndUpdate({ email }, { $set: { authentication } });

               throw new AppError(StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
          }
          // check user status
          if (existingUser?.status === 'blocked') {
               throw new AppError(StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
          }
          const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
          // create token
          const accessToken = jwtHelper.createToken(jwtData, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
          const refreshToken = jwtHelper.createToken(jwtData, config.jwt.jwt_refresh_secret as Secret, config.jwt.jwt_refresh_expire_in as string);

          return { accessToken, refreshToken };
     }

     throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
};

const handleGoogleAuthentication = async (payload: { email: string; googleId: string; name: string; email_verified: boolean; picture?: string }): Promise<any> => {
     const { email, googleId, email_verified, name } = payload;

     // Check if the user already exists by Google ID or email
     const existingUser = await User.findOne({ email }).select('+password');

     // If user doesn't exist, treat it as a sign-up
     if (!existingUser) {
          // Check if the user is signing up with Google and email is not already in use
          const userExists = await User.isExistUserByEmail(email);
          if (userExists) {
               throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
          }
          // Create the new user
          const newUser = await User.create({
               image: payload?.picture || '',
               email,
               socialId: googleId,
               verified: email_verified,
               name,
               password: googleId,
               authProvider: 'google',
               role: USER_ROLES.USER, // Default role as User
          });
          if (!newUser) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
          }
          // Send OTP for email verification
          const otp = generateOTP(4);
          const values = {
               name: newUser.name,
               otp,
               email: newUser.email,
          };
          const createAccountTemplate = emailTemplate.createAccount(values);
          await emailHelper.sendEmail(createAccountTemplate);

          // Save OTP for later verification
          const authentication = {
               oneTimeCode: otp,
               expireAt: new Date(Date.now() + 3 * 60000), // OTP expiration time of 3 minutes
          };
          await User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });

          return { message: 'Account created successfully, please verify via OTP' };
     }
     // If user exists, perform login
     if (existingUser) {
          // check verified and status
          if (!existingUser.verified) {
               //send mail
               const otp = generateOTP(4);
               const value = { otp, email: existingUser.email };
               const forgetPassword = emailTemplate.resetPassword(value);
               await emailHelper.sendEmail(forgetPassword);

               //save to DB
               const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
               await User.findOneAndUpdate({ email }, { $set: { authentication } });

               throw new AppError(StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
          }

          // check user status
          if (existingUser?.status === 'blocked') {
               throw new AppError(StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
          }

          const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
          // create token
          const accessToken = jwtHelper.createToken(jwtData, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
          const refreshToken = jwtHelper.createToken(jwtData, config.jwt.jwt_refresh_secret as Secret, config.jwt.jwt_refresh_expire_in as string);

          return { accessToken, refreshToken };
     }

     throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
};

// get user profile
const getUserProfileFromDB = async (user: JwtPayload): Promise<Partial<IUser>> => {
     const { id } = user;
     const isExistUser = await User.isExistUserById(id);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     return isExistUser;
};

// update user profile
const updateProfileToDB = async (user: JwtPayload, payload: Partial<IUser>): Promise<Partial<IUser | null>> => {
     const { id } = user;
     const isExistUser = await User.isExistUserById(id);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //unlink file here
     if (payload.image) {
          unlinkFile(isExistUser.image);
     }

     const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

     return updateDoc;
};

const verifyUserPassword = async (userId: string, password: string) => {
     const user = await User.findById(userId).select('+password');
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
     }
     const isPasswordValid = await User.isMatchPassword(password, user.password);
     return isPasswordValid;
};
const deleteUser = async (id: string) => {
     const isExistUser = await User.isExistUserById(id);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     await User.findByIdAndUpdate(id, {
          $set: { isDeleted: true },
     });

     return true;
};
export const UserService = {
     createUserToDB,
     getUserProfileFromDB,
     updateProfileToDB,
     deleteUser,
     verifyUserPassword,
     handleAppleAuthentication,
     handleGoogleAuthentication,
};
