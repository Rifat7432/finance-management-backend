import { StatusCodes } from 'http-status-codes';
import { Debt } from './debt.model';
import AppError from '../../../errors/AppError';
import { IDebt } from './debt.interface';

// Create new debt
const createDebtToDB = async (payload: Partial<IDebt>,userId:string): Promise<IDebt> => {
  const newDebt = await Debt.create({...payload,userId});
  if (!newDebt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create debt');
  }
  return newDebt;
};

// Get all debts for a user
const getUserDebtsFromDB = async (userId: string): Promise<IDebt[]> => {
  const debts = await Debt.find({ userId });
  if (!debts.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No debts found for this user');
  }
  return debts;
};

// Get a single debt
const getSingleDebtFromDB = async (id: string): Promise<IDebt | null> => {
  const debt = await Debt.findById(id);
  if (!debt) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found');
  }
  return debt;
};

// Update debt
const updateDebtToDB = async (id: string, payload: Partial<IDebt>): Promise<IDebt | null> => {
  const updated = await Debt.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update debt');
  }
  return updated;
};

// Delete debt
const deleteDebtFromDB = async (id: string): Promise<boolean> => {
  const deleted = await Debt.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found');
  }
  return true;
};

export const DebtService = {
  createDebtToDB,
  getUserDebtsFromDB,
  getSingleDebtFromDB,
  updateDebtToDB,
  deleteDebtFromDB,
};
