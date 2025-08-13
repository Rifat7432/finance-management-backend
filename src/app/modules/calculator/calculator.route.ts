import express from 'express';
import { CalculatorController } from './calculator.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/saving-calculator', auth(USER_ROLES.USER), CalculatorController.getSavingCalculator);
router.get('/loan-repayment-calculator', auth(USER_ROLES.USER), CalculatorController.getLoanRepaymentCalculator);
router.get('/inflation-calculator', auth(USER_ROLES.USER), CalculatorController.getInflationCalculator);

export const CalculatorRouter = router;
