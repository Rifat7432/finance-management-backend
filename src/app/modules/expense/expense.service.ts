import { StatusCodes } from 'http-status-codes';
import { Expense } from './expense.model';
import AppError from '../../../errors/AppError';
import { IExpense } from './expense.interface';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import mongoose from 'mongoose';
// Create new expense
const createExpenseToDB = async (payload: Partial<IExpense>, userId: string): Promise<IExpense> => {
     const newExpense = await Expense.create({ ...payload, userId });
     if (!newExpense) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create expense');
     }
     return newExpense;
};

// Get all expenses for a user
const getUserExpensesFromDB = async (userId: string): Promise<IExpense[]> => {
     const expenses = await Expense.find({ userId });
     return expenses;
};
// Get all expenses for a user by frequency
const getUserExpensesByFrequencyFromDB = async (userId: string, query: Partial<IExpense>): Promise<IExpense[]> => {
     const today = new Date();
     const monthStart = startOfMonth(today); // First day of current month
     const monthEnd = endOfMonth(today);
     const incomes = await Expense.find({
          userId,
          ...(query.frequency ? { frequency: query.frequency } : {}),
          createdAt: {
               $gte: monthStart,
               $lte: monthEnd,
          },
     });
     return incomes;
};
export const getYearlyExpenseAnalyticsFromDB = async (userId: string, year?: number) => {
  const targetYear = year || new Date().getFullYear();

  const yearStart = startOfYear(new Date(targetYear, 0, 1));
  const yearEnd = endOfYear(new Date(targetYear, 0, 1));



  // Fetch all expenses for the user and year within the range
  const expenses = await Expense.find({
    userId: userId,
    endDate: {
      $gte: yearStart.toISOString(),
      $lte: yearEnd.toISOString(),
    },
  }).lean();

  // Prepare month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Initialize monthly totals with 0
  const monthlyTotals = Array(12).fill(0);

  // Sum amounts per month
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.endDate);
    const monthIndex = expenseDate.getMonth(); // 0-based index (0=Jan)

    monthlyTotals[monthIndex] += expense.amount;
  });

  // Format result
  const formattedResult = monthNames.map((month, index) => ({
    month,
    totalExpenses: monthlyTotals[index]
  }));

  return formattedResult;
};

// Get a single expense
const getSingleExpenseFromDB = async (id: string): Promise<IExpense | null> => {
     const expense = await Expense.findById(id);
     if (!expense) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     return expense;
};

// Update expense
const updateExpenseToDB = async (id: string, payload: Partial<IExpense>): Promise<IExpense | null> => {
     const updated = await Expense.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update expense');
     }
     return updated;
};

// Delete expense
const deleteExpenseFromDB = async (id: string): Promise<boolean> => {
     const deleted = await Expense.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     return true;
};

export const ExpenseService = {
     createExpenseToDB,
     getUserExpensesFromDB,
     getUserExpensesByFrequencyFromDB,
     getYearlyExpenseAnalyticsFromDB,
     getSingleExpenseFromDB,
     updateExpenseToDB,
     deleteExpenseFromDB,
};
