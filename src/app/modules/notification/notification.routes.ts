import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';

const router = express.Router();

// ✅ User notifications
router.get(
  '/',
  auth(USER_ROLES.USER),
  NotificationController.getUserNotifications
);

router.patch(
  '/',
  auth(USER_ROLES.USER),
  NotificationController.markUserNotificationsAsRead
);

// ✅ Admin notifications
router.get(
  '/admin',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.getAdminNotifications
);

router.patch(
  '/admin',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.markAdminNotificationsAsRead
);

// ✅ Send admin push notification
router.post(
  '/admin/send',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.sendAdminNotification
);

export const NotificationRoutes = router;
