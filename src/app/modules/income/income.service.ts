import { StatusCodes } from 'http-status-codes';
import { IIncome } from './income.interface';
import { Income } from './income.model';
import AppError from '../../../errors/AppError';

// Create new income
const createIncomeToDB = async (payload: Partial<IIncome>, userId: string): Promise<IIncome> => {
     const newIncome = await Income.create({ ...payload, userId });
     if (!newIncome) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create income');
     }
     return newIncome;
};

// Get incomes by user
const getUserIncomesFromDB = async (userId: string, query: Partial<IIncome>): Promise<IIncome[]> => {
     const now = new Date();
     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

     const incomes = await Income.find({
          userId,
          ...(query.frequency ? { frequency: query.frequency } : {}),
          createdAt: {
               $gte: startOfMonth,
               $lte: endOfMonth,
          },
     });
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
