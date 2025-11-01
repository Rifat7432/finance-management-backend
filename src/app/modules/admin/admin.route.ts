import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { NotificationSettingsValidation } from '../notificationSettings/notificationSettings.validation';
const router = express.Router();

router.get('/users/finance-track', auth(USER_ROLES.ADMIN), AdminController.getUserFinancialOverview);
router.get('/user/expenses-details/:userId', auth(USER_ROLES.ADMIN), AdminController.getMonthlyExpenseAnalytics);

router.patch('/appointments/:userId', auth(USER_ROLES.ADMIN), AdminController.updateAppointmentStatus);

router.get('/notification-settings/:userId', auth(USER_ROLES.ADMIN), AdminController.getNotificationSettings);

router.patch('/notification-settings/:userId', auth(USER_ROLES.ADMIN), validateRequest(NotificationSettingsValidation.updateNotificationSettingsZodSchema), AdminController.updateNotificationSettings);

export const AdminRoutes = router;
