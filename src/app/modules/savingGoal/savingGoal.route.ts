import express from 'express';
import { SavingGoalController } from './savingGoal.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { SavingGoalValidation } from './savingGoal.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(SavingGoalValidation.createSavingGoalZodSchema),
  SavingGoalController.createSavingGoal
);

router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingGoalController.getUserSavingGoals
);

router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingGoalController.getSingleSavingGoal
);

router.patch(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(SavingGoalValidation.updateSavingGoalZodSchema),
  SavingGoalController.updateSavingGoal
);

router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingGoalController.deleteSavingGoal
);

export const SavingGoalRouter = router;
