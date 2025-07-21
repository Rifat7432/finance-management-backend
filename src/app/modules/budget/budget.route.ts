import express from 'express';
import { BudgetController } from './budget.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { BudgetValidation } from './budget.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(BudgetValidation.createBudgetZodSchema),
  BudgetController.createBudget
);

router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  BudgetController.getUserBudgets
);

router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  BudgetController.getSingleBudget
);

router.patch(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(BudgetValidation.updateBudgetZodSchema),
  BudgetController.updateBudget
);

router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  BudgetController.deleteBudget
);

export const BudgetRouter = router;
