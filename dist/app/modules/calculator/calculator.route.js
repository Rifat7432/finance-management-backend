"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorRouter = void 0;
const express_1 = __importDefault(require("express"));
const calculator_controller_1 = require("./calculator.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.get('/saving-calculator', (0, auth_1.default)(user_1.USER_ROLES.USER), calculator_controller_1.CalculatorController.getSavingCalculator);
router.get('/loan-repayment-calculator', (0, auth_1.default)(user_1.USER_ROLES.USER), calculator_controller_1.CalculatorController.getLoanRepaymentCalculator);
router.get('/inflation-calculator', (0, auth_1.default)(user_1.USER_ROLES.USER), calculator_controller_1.CalculatorController.getInflationCalculator);
exports.CalculatorRouter = router;
