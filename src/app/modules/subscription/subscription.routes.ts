import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { SubscriptionValidation } from './subscription.validation';
import { SubscriptionController } from './subscription.controller';

const router = express.Router();

// 🟢 Create Subscription
router.post('/', auth(USER_ROLES.USER), validateRequest(SubscriptionValidation.createSubscriptionZodSchema), SubscriptionController.createSubscription);

// 🟣 Get Subscription Status
router.get('/', auth(USER_ROLES.USER), SubscriptionController.getSubscriptionStatus);

// // 🔵 Webhook (no auth - Adapty server only)
// router.post('/webhook', validateRequest(SubscriptionValidation.webhookZodSchema), SubscriptionController.handleWebhook);

// 🟠 Manual Verify
router.post('/verify/:userId', validateRequest(SubscriptionValidation.verifySubscriptionZodSchema), SubscriptionController.verifySubscription);

export const SubscriptionRouter = router;
