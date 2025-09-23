import { StatusCodes } from 'http-status-codes';
import { NotificationSettings } from './notificationSettings.model';
import { INotificationSetting } from './notificationSettings.interface';
import AppError from '../../../errors/AppError';

const createNotificationSettingsToDB = async (payload: Partial<INotificationSetting>): Promise<INotificationSetting> => {
  const exists = await NotificationSettings.findOne({ userId: payload.userId });
  if (exists) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Notification settings already exist for this user');
  }
  const newSettings = await NotificationSettings.create(payload);
  if (!newSettings) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create notification settings');
  }
  return newSettings;
};

const getNotificationSettingsFromDB = async (userId: string): Promise<INotificationSetting | null> => {
  const settings = await NotificationSettings.findOne({ userId });
  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Notification settings not found');
  }
  return settings;
};

const updateNotificationSettingsToDB = async (userId: string, payload: Partial<INotificationSetting>): Promise<INotificationSetting | null> => {
  const updated = await NotificationSettings.findOneAndUpdate({ userId }, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update notification settings');
  }
  return updated;
};

const deleteNotificationSettingsFromDB = async (userId: string): Promise<boolean> => {
  const deleted = await NotificationSettings.findOneAndDelete({ userId });
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Notification settings not found');
  }
  return true;
};

export const NotificationSettingsService = {
  createNotificationSettingsToDB,
  getNotificationSettingsFromDB,
  updateNotificationSettingsToDB,
  deleteNotificationSettingsFromDB,
};
