import express from 'express';
import { CalculatorController } from './calculator.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();



router.get('/saving-calculator',auth(USER_ROLES.USER),CalculatorController.getSavingCalculator)

export const CalculatorRouter = router;
