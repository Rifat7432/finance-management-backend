import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IDateNight } from './dateNight.interface';
import { DateNight } from './dateNight.model';
import { User } from '../user/user.model';

const createDateNightToDB = async (userId: string, payload: Partial<IDateNight>): Promise<IDateNight> => {
     const newDateNight = await DateNight.create({ ...payload, userId });
     if (!newDateNight) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create date night');
     }
     return newDateNight;
};

const getDateNightsFromDB = async (userId: string): Promise<IDateNight[]> => {
     const user = await User.findById(userId);
     const dateNights = await DateNight.find({ userId, isDeleted: false });
     const PartnerDateNights = await DateNight.find({ userId: user?.partnerId, isDeleted: false });
     if (!dateNights.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No date nights found');
     }
     return [...dateNights, ...PartnerDateNights];
};

const getSingleDateNightFromDB = async (id: string): Promise<IDateNight | null> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     return dateNight;
};

const updateDateNightToDB = async (id: string, payload: Partial<IDateNight>): Promise<IDateNight | null> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     const updated = await DateNight.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update date night');
     }
     return updated;
};

const deleteDateNightFromDB = async (id: string): Promise<boolean> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     const deleted = await DateNight.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     return true;
};

export const DateNightService = {
     createDateNightToDB,
     getDateNightsFromDB,
     getSingleDateNightFromDB,
     updateDateNightToDB,
     deleteDateNightFromDB,
};
