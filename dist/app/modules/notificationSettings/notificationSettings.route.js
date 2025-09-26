"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingsRouter = void 0;
const express_1 = __importDefault(require("express"));
const notificationSettings_controller_1 = require("./notificationSettings.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const notificationSettings_validation_1 = require("./notificationSettings.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.default)(notificationSettings_validation_1.NotificationSettingsValidation.createNotificationSettingsZodSchema), notificationSettings_controller_1.NotificationSettingsController.createNotificationSettings);
router.get('/:userId', notificationSettings_controller_1.NotificationSettingsController.getNotificationSettings);
router.patch('/:userId', (0, validateRequest_1.default)(notificationSettings_validation_1.NotificationSettingsValidation.updateNotificationSettingsZodSchema), notificationSettings_controller_1.NotificationSettingsController.updateNotificationSettings);
router.delete('/:userId', notificationSettings_controller_1.NotificationSettingsController.deleteNotificationSettings);
exports.NotificationSettingsRouter = router;
