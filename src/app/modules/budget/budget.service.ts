import { StatusCodes } from 'http-status-codes';
import { Budget } from './budget.model';
import AppError from '../../../errors/AppError';
import { IBudget } from './budget.interface';


const createBudgetToDB = async (payload: Partial<IBudget>,userId:string): Promise<IBudget> => {
  const newBudget = await Budget.create({...payload,userId});
  if (!newBudget) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create budget');
  }
  return newBudget;
};

const getUserBudgetsFromDB = async (userId: string): Promise<IBudget[]> => {
  const budgets = await Budget.find({ userId });
  if (!budgets.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No budgets found for this user');
  }
  return budgets;
};

const getSingleBudgetFromDB = async (id: string): Promise<IBudget | null> => {
  const budget = await Budget.findById(id);
  if (!budget) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Budget not found');
  }
  return budget;
};

const updateBudgetToDB = async (id: string, payload: Partial<IBudget>): Promise<IBudget | null> => {
  const updated = await Budget.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update budget');
  }
  return updated;
};

const deleteBudgetFromDB = async (id: string): Promise<boolean> => {
  const deleted = await Budget.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Budget not found');
  }
  return true;
};

export const BudgetService = {
  createBudgetToDB,
  getUserBudgetsFromDB,
  getSingleBudgetFromDB,
  updateBudgetToDB,
  deleteBudgetFromDB,
};
