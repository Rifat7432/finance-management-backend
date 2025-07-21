import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SavingService } from './saving.service';

const createSaving = catchAsync(async (req, res) => {
  const result = await SavingService.createSavingToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Saving created successfully',
    data: result,
  });
});

const getUserSavings = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.body.userId;
  const result = await SavingService.getUserSavingsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Savings retrieved successfully',
    data: result,
  });
});

const getSingleSaving = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SavingService.getSingleSavingFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving retrieved successfully',
    data: result,
  });
});

const updateSaving = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SavingService.updateSavingToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving updated successfully',
    data: result,
  });
});

const deleteSaving = catchAsync(async (req, res) => {
  const { id } = req.params;
  await SavingService.deleteSavingFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving deleted successfully',
  });
});

export const SavingController = {
  createSaving,
  getUserSavings,
  getSingleSaving,
  updateSaving,
  deleteSaving,
};
