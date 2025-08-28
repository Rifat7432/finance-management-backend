import express from 'express';
import { TimeSlotController } from './timeSlot.controller';
import validateRequest from '../../middleware/validateRequest';
import { TimeSlotValidation } from './timeSlot.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(TimeSlotValidation.createTimeSlotZodSchema),
  TimeSlotController.createTimeSlot
);

router.get(
  '/',
  TimeSlotController.getTimeSlots
);

router.get(
  '/:id',
  TimeSlotController.getSingleTimeSlot
);

router.patch(
  '/:id',
  validateRequest(TimeSlotValidation.updateTimeSlotZodSchema),
  TimeSlotController.updateTimeSlot
);

router.delete(
  '/:id',
  TimeSlotController.deleteTimeSlot
);

// Booking endpoint
router.post(
  '/book',
  validateRequest(TimeSlotValidation.bookTimeSlotZodSchema),
  TimeSlotController.bookTimeSlot
);

export const TimeSlotRouter = router;
