import express from 'express';
import { DateNightController } from './dateNight.controller';
import validateRequest from '../../middleware/validateRequest';
import { DateNightValidation } from './dateNight.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(DateNightValidation.createDateNightZodSchema),
  DateNightController.createDateNight
);

router.get(
  '/',
  DateNightController.getDateNights
);

router.get(
  '/:id',
  DateNightController.getSingleDateNight
);

router.patch(
  '/:id',
  validateRequest(DateNightValidation.updateDateNightZodSchema),
  DateNightController.updateDateNight
);

router.delete(
  '/:id',
  DateNightController.deleteDateNight
);

export const DateNightRouter = router;
