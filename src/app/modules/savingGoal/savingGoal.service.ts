import { StatusCodes } from 'http-status-codes';
import { SavingGoal } from './savingGoal.model';
import AppError from '../../../errors/AppError';
import { ISavingGoal } from './savingGoal.model';

const createSavingGoalToDB = async (payload: ISavingGoal): Promise<ISavingGoal> => {
  const newGoal = await SavingGoal.create(payload);
  if (!newGoal) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create saving goal');
  }
  return newGoal;
};

const getUserSavingGoalsFromDB = async (userId: string): Promise<ISavingGoal[]> => {
  const goals = await SavingGoal.find({ userId });
  if (!goals.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No saving goals found for this user');
  }
  return goals;
};

const getSingleSavingGoalFromDB = async (id: string): Promise<ISavingGoal | null> => {
  const goal = await SavingGoal.findById(id);
  if (!goal) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
  }
  return goal;
};

const updateSavingGoalToDB = async (id: string, payload: Partial<ISavingGoal>): Promise<ISavingGoal | null> => {
  const updated = await SavingGoal.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update saving goal');
  }
  return updated;
};

const deleteSavingGoalFromDB = async (id: string): Promise<boolean> => {
  const deleted = await SavingGoal.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
  }
  return true;
};

export const SavingGoalService = {
  createSavingGoalToDB,
  getUserSavingGoalsFromDB,
  getSingleSavingGoalFromDB,
  updateSavingGoalToDB,
  deleteSavingGoalFromDB,
};
