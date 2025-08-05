import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BudgetService } from './budget.service';

const createBudget = catchAsync(async (req, res) => {
  const userId = req.user?.id
  const result = await BudgetService.createBudgetToDB(req.body,userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Budget created successfully',
    data: result,
  });
});

const getUserBudgets = catchAsync(async (req, res) => {
  const userId = req.user?.id
  const result = await BudgetService.getUserBudgetsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Budgets retrieved successfully',
    data: result,
  });
});

const getSingleBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BudgetService.getSingleBudgetFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Budget retrieved successfully',
    data: result,
  });
});

const updateBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BudgetService.updateBudgetToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Budget updated successfully',
    data: result,
  });
});

const deleteBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  await BudgetService.deleteBudgetFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Budget deleted successfully',
  });
});

export const BudgetController = {
  createBudget,
  getUserBudgets,
  getSingleBudget,
  updateBudget,
  deleteBudget,
};
