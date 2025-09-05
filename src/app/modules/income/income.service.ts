import { StatusCodes } from 'http-status-codes';
import { IIncome } from './income.interface';
import { Income } from './income.model';
import AppError from '../../../errors/AppError';
import { startOfMonth, endOfMonth } from 'date-fns';
// Create new income
const createIncomeToDB = async (payload: Partial<IIncome>, userId: string): Promise<IIncome> => {
     const newIncome = await Income.create({ ...payload, userId });
     if (!newIncome) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create income');
     }
     return newIncome;
};

// Get incomes by user
const getUserIncomesFromDB = async (userId: string): Promise<IIncome[]> => {
     const incomes = await Income.find({ userId, isDeleted: false });
     return incomes;
};
// Get incomes by user  by frequency
const getUserIncomesByFrequencyFromDB = async (userId: string, query: Partial<IIncome>): Promise<IIncome[]> => {
     const today = new Date();
     const monthStart = startOfMonth(today); // First day of current month
     const monthEnd = endOfMonth(today);
     const incomes = await Income.find({
          isDeleted: false,
          userId,
          ...(query.frequency ? { frequency: query.frequency } : {}),
          createdAt: {
               $gte: monthStart,
               $lte: monthEnd,
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
     if (income.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income Deleted');
     }
     return income;
};

// Update income by ID
const updateIncomeToDB = async (id: string, payload: Partial<IIncome>): Promise<IIncome | null> => {
     const isIncomeExist = await Income.findOne({ _id: id, isDeleted: false });
     if (!isIncomeExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
     }
     const updated = await Income.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update income');
     }
     return updated;
};

// Delete income (soft delete)
const deleteIncomeFromDB = async (id: string): Promise<boolean> => {
     const isIncomeExist = await Income.findOne({ _id: id, isDeleted: false });
     if (!isIncomeExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income is already deleted or not found');
     }
     const deleted = await Income.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
     }
     return true;
};

export const IncomeService = {
     createIncomeToDB,
     getUserIncomesFromDB,
     getUserIncomesByFrequencyFromDB,
     getSingleIncomeFromDB,
     updateIncomeToDB,
     deleteIncomeFromDB,
};
