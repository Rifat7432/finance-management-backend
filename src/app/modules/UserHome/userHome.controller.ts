import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserHomeService } from './userHome.service';
const getAnalytics = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const data = await UserHomeService.getAnalyticsFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Analytics retrieved successfully',
          data: data,
     });
});

export const UserHomeController = {
     getAnalytics,
};
