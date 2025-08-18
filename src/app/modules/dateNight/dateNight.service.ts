import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IDateNight } from './dateNight.interface';
import { DateNight } from './dateNight.model';

const createDateNightToDB = async (payload: Partial<IDateNight>): Promise<IDateNight> => {
     const newDateNight = await DateNight.create(payload);
     if (!newDateNight) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create date night');
     }
     return newDateNight;
};

const getDateNightsFromDB = async (): Promise<IDateNight[]> => {
     const dateNights = await DateNight.find();
     if (!dateNights.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No date nights found');
     }
     return dateNights;
};

const getSingleDateNightFromDB = async (id: string): Promise<IDateNight | null> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     return dateNight;
};

const updateDateNightToDB = async (id: string, payload: Partial<IDateNight>): Promise<IDateNight | null> => {
     const updated = await DateNight.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update date night');
     }
     return updated;
};

const deleteDateNightFromDB = async (id: string): Promise<boolean> => {
     const deleted = await DateNight.findByIdAndDelete(id);
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
