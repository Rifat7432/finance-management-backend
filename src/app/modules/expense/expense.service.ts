import { StatusCodes } from 'http-status-codes';
import { Expense } from './expense.model';
import AppError from '../../../errors/AppError';
import { IExpense } from './expense.interface';

// Create new expense
const createExpenseToDB = async (payload: Partial<IExpense>,userId:string): Promise<IExpense> => {
  const newExpense = await Expense.create({...payload,userId});
  if (!newExpense) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create expense');
  }
  return newExpense;
};

// Get all expenses for a user
const getUserExpensesFromDB = async (userId: string): Promise<IExpense[]> => {
  const expenses = await Expense.find({ userId });
  if (!expenses.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No expenses found for this user');
  }
  return expenses;
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
  getSingleExpenseFromDB,
  updateExpenseToDB,
  deleteExpenseFromDB,
};
