import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
const router = express.Router();

router.post('/create-admin', auth(USER_ROLES.ADMIN), validateRequest(AdminValidation.createAdminZodSchema), AdminController.createAdmin);

router.get('/get-admin', auth(USER_ROLES.ADMIN), AdminController.getAdmin);
router.get('/subscription', auth(USER_ROLES.ADMIN), AdminController.getUserSubscriptions);

router.delete('/:id', auth(USER_ROLES.ADMIN), AdminController.deleteAdmin);


export const AdminRoutes = router;