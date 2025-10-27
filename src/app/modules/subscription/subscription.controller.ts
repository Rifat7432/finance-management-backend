import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubscriptionService } from './subscription.service';

// 🟢 Create Subscription
const createSubscription = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await SubscriptionService.createSubscriptionToDB(user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Subscription created successfully',
    data: result,
  });
});

// 🟣 Get Subscription Status
const getSubscriptionStatus = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await SubscriptionService.getSubscriptionStatusFromDB(user.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription status retrieved successfully',
    data: result,
  });
});



// 🟠 Manual Verify
const verifySubscription = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await SubscriptionService.verifySubscriptionToDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription verified successfully',
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  getSubscriptionStatus,
  verifySubscription,
};
