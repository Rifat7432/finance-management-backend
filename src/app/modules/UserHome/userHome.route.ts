import express from 'express';
import { UserHomeController } from './userHome.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();



router.get('/',auth(USER_ROLES.USER),UserHomeController.getAnalytics)

export const UserHomeRouter = router;
