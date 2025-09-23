import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

// ✅ Get user notifications
const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  const result = await NotificationService.getNotificationFromDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User notifications retrieved successfully',
    data: result,
  });
});

// ✅ Mark user notifications as read
const markUserNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  const result = await NotificationService.readNotificationToDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User notifications marked as read',
    data: result,
  });
});

// ✅ Get admin notifications
const getAdminNotifications = catchAsync(async (_req: Request, res: Response) => {
  const result = await NotificationService.adminNotificationFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notifications retrieved successfully',
    data: result,
  });
});

// ✅ Mark admin notifications as read
const markAdminNotificationsAsRead = catchAsync(async (_req: Request, res: Response) => {
  const result = await NotificationService.adminReadNotificationToDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notifications marked as read',
    data: result,
  });
});

// ✅ Send admin push notification
const sendAdminNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.adminSendNotificationFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notification sent successfully',
    data: result,
  });
});

export const NotificationController = {
  getUserNotifications,
  markUserNotificationsAsRead,
  getAdminNotifications,
  markAdminNotificationsAsRead,
  sendAdminNotification,
};
