import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationSettingsService } from './notificationSettings.service';

const createNotificationSettings = catchAsync(async (req, res) => {
  const result = await NotificationSettingsService.createNotificationSettingsToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Notification settings created successfully',
    data: result,
  });
});

const getNotificationSettings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await NotificationSettingsService.getNotificationSettingsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification settings retrieved successfully',
    data: result,
  });
});

const updateNotificationSettings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await NotificationSettingsService.updateNotificationSettingsToDB(userId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification settings updated successfully',
    data: result,
  });
});

const deleteNotificationSettings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  await NotificationSettingsService.deleteNotificationSettingsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification settings deleted successfully',
  });
});

export const NotificationSettingsController = {
  createNotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
  deleteNotificationSettings,
};
