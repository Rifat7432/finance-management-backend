import express from 'express';
import { SavingController } from './saving.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { SavingValidation } from './saving.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(SavingValidation.createSavingZodSchema),
  SavingController.createSaving
);

router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingController.getUserSavings
);

router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingController.getSingleSaving
);

router.patch(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(SavingValidation.updateSavingZodSchema),
  SavingController.updateSaving
);

router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  SavingController.deleteSaving
);

export const SavingRouter = router;
