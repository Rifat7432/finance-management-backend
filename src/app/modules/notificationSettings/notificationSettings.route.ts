import express from 'express';
import { NotificationSettingsController } from './notificationSettings.controller';
import validateRequest from '../../middleware/validateRequest';
import { NotificationSettingsValidation } from './notificationSettings.validation';

const router = express.Router();

router.get('/:userId', NotificationSettingsController.getNotificationSettings);

router.patch('/:userId', validateRequest(NotificationSettingsValidation.updateNotificationSettingsZodSchema), NotificationSettingsController.updateNotificationSettings);

router.delete('/:userId', NotificationSettingsController.deleteNotificationSettings);

export const NotificationSettingsRouter = router;
