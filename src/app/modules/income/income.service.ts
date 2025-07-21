import { StatusCodes } from "http-status-codes";
import { IIncome } from "./income.interface";
import { Income } from "./income.model";
import AppError from "../../../errors/AppError";


// Create new income
const createIncomeToDB = async (payload: IIncome): Promise<IIncome> => {
  const newIncome = await Income.create(payload);
  if (!newIncome) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create income');
  }
  return newIncome;
};

// Get incomes by user
const getUserIncomesFromDB = async (userId: string): Promise<IIncome[]> => {
  const incomes = await Income.find({ userId });
  if (!incomes || incomes.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No incomes found for this user');
  }
  return incomes;
};

// Get single income by ID
const getSingleIncomeFromDB = async (id: string): Promise<IIncome | null> => {
  const income = await Income.findById(id);
  if (!income) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
  }
  return income;
};

// Update income by ID
const updateIncomeToDB = async (id: string, payload: Partial<IIncome>): Promise<IIncome | null> => {
  const updated = await Income.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update income');
  }
  return updated;
};

// Delete income (hard delete)
const deleteIncomeFromDB = async (id: string): Promise<boolean> => {
  const deleted = await Income.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
  }
  return true;
};

export const IncomeService = {
  createIncomeToDB,
  getUserIncomesFromDB,
  getSingleIncomeFromDB,
  updateIncomeToDB,
  deleteIncomeFromDB,
};
