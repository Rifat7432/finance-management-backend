import express from 'express';
import { AppointmentController } from './appointment.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { AppointmentValidation } from './appointment.validation';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), validateRequest(AppointmentValidation.createAppointmentZodSchema), AppointmentController.createAppointment);

router.get('/', auth(USER_ROLES.USER, USER_ROLES.ADMIN), AppointmentController.getUserAppointments);
router.get('/all/appointment', auth(USER_ROLES.ADMIN), AppointmentController.getAllAppointments);

router.get('/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN), AppointmentController.getSingleAppointment);

router.patch('/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN), validateRequest(AppointmentValidation.updateAppointmentZodSchema), AppointmentController.updateAppointment);

router.delete('/:id', auth(USER_ROLES.USER, USER_ROLES.ADMIN), AppointmentController.deleteAppointment);

export const AppointmentRouter = router;
