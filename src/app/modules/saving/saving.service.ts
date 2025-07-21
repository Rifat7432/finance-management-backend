import { StatusCodes } from 'http-status-codes';
import { Saving } from './saving.model';
import AppError from '../../../errors/AppError';
import { ISaving } from './saving.model';

const createSavingToDB = async (payload: ISaving): Promise<ISaving> => {
  const newSaving = await Saving.create(payload);
  if (!newSaving) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create saving');
  }
  return newSaving;
};

const getUserSavingsFromDB = async (userId: string): Promise<ISaving[]> => {
  const savings = await Saving.find({ userId });
  if (!savings.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No savings found for this user');
  }
  return savings;
};

const getSingleSavingFromDB = async (id: string): Promise<ISaving | null> => {
  const saving = await Saving.findById(id);
  if (!saving) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Saving not found');
  }
  return saving;
};

const updateSavingToDB = async (id: string, payload: Partial<ISaving>): Promise<ISaving | null> => {
  const updated = await Saving.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update saving');
  }
  return updated;
};

const deleteSavingFromDB = async (id: string): Promise<boolean> => {
  const deleted = await Saving.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Saving not found');
  }
  return true;
};

export const SavingService = {
  createSavingToDB,
  getUserSavingsFromDB,
  getSingleSavingFromDB,
  updateSavingToDB,
  deleteSavingFromDB,
};
