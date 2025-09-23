import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { sendNotifications } from '../../../helpers/notificationsHelper';

// ✅ Get notifications for logged-in user
const getNotificationFromDB = async (user: JwtPayload): Promise<{ result: INotification[]; unreadCount: number }> => {
  const result = await Notification.find({ receiver: user.id }).sort({ createdAt: -1 });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  return { result, unreadCount };
};

// ✅ Mark all notifications as read for user
const readNotificationToDB = async (user: JwtPayload): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } }
  );

  return { modifiedCount: result.modifiedCount };
};

// ✅ Get all admin notifications
const adminNotificationFromDB = async (): Promise<INotification[]> => {
  const result = await Notification.find({ type: 'ADMIN' }).sort({ createdAt: -1 });
  return result;
};

// ✅ Mark all admin notifications as read
const adminReadNotificationToDB = async (): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { type: 'ADMIN', read: false },
    { $set: { read: true } }
  );

  return { modifiedCount: result.modifiedCount };
};

// ✅ Send an admin notification (save to DB + push via Firebase)
const adminSendNotificationFromDB = async (payload: { title?: string; message: string; receiver?: string }) => {
  const { title, message, receiver } = payload;

  if (!message) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Message is required');
  }

  // Save notification in DB
  const notificationData: Partial<INotification> = {
    title: title || 'Admin Notification',
    message,
    type: 'ADMIN',
    receiver: receiver ? (receiver as any) : undefined, // cast to ObjectId
    read: false,
  };

  const savedNotification = await Notification.create(notificationData);

  // Trigger Firebase push
  await sendNotifications({
    title: notificationData.title!,
    message: notificationData.message,
    receiver,
    type: 'ADMIN',
  });

  return savedNotification;
};

export const NotificationService = {
  adminNotificationFromDB,
  getNotificationFromDB,
  readNotificationToDB,
  adminReadNotificationToDB,
  adminSendNotificationFromDB,
};
