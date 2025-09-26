"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const appointment_model_1 = require("./appointment.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
const notification_model_1 = require("../notification/notification.model");
const firebaseHelper_1 = require("../../../helpers/firebaseHelper");
const createAppointmentToDB = (date, time, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
    }
    // Validate time (HH:mm or HH:mm:ss)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timeRegex.test(time)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
    }
    // Check if an appointment already exists for the given date and time
    const existingAppointment = yield appointment_model_1.Appointment.findOne({ date, time });
    if (existingAppointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Time slot already booked');
    }
    // Create the appointment
    const appointment = yield appointment_model_1.Appointment.create({
        user: userId,
        date,
        time,
    });
    // Send notification only to the user who booked the appointment, if their settings allow
    const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId });
    if (userSetting === null || userSetting === void 0 ? void 0 : userSetting.appointmentNotification) {
        if (userSetting.deviceTokenList && userSetting.deviceTokenList.length > 0) {
            yield firebaseHelper_1.firebaseHelper.sendNotification([{ id: String(userSetting.userId), deviceToken: userSetting.deviceTokenList[0] }], {
                title: 'New Appointment Booked',
                body: `Appointment booked for ${date} at ${time}`,
            }, userSetting.deviceTokenList, 'multiple', { appointmentId: String(appointment._id) });
        }
        yield notification_model_1.Notification.create({
            title: 'New Appointment Booked',
            message: `Appointment booked for ${date} at ${time}`,
            receiver: userSetting.userId,
            type: 'APPOINTMENT',
            read: false,
        });
    }
    return appointment;
});
const getUserAppointmentsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = yield appointment_model_1.Appointment.find({ userId });
    if (!appointments.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No appointments found for this user');
    }
    return appointments;
});
const getAllAppointmentsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = yield appointment_model_1.Appointment.find();
    if (!appointments.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No appointments found for this user');
    }
    return appointments;
});
const getSingleAppointmentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    return appointment;
});
const updateAppointmentToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Retrieve the existing appointment
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    // Handle case where appointment time or date is updated
    const newDate = payload.date;
    const newTime = payload.time;
    const oldDate = appointment.get('date');
    const oldTime = appointment.get('time');
    // If the date or time is updated, validate and check for double booking
    if (newDate || newTime) {
        // Validate new date if provided
        if (newDate) {
            const parsedDate = new Date(newDate);
            if (isNaN(parsedDate.getTime())) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
            }
        }
        // Validate new time if provided
        if (newTime) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(newTime)) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
            }
        }
        // Check if another appointment already exists for the new date and time
        const checkDate = newDate || oldDate;
        const checkTime = newTime || oldTime;
        const existingAppointment = yield appointment_model_1.Appointment.findOne({ date: checkDate, time: checkTime, _id: { $ne: id } });
        if (existingAppointment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Time slot already booked');
        }
        // Update the appointment with new details
        appointment.set('date', newDate || oldDate);
        appointment.set('time', newTime || oldTime);
        const updatedAppointment = yield appointment.save();
        return updatedAppointment;
    }
    // If the date and time are not updated, simply update other fields
    const updated = yield appointment_model_1.Appointment.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update appointment');
    }
    return updated;
});
const deleteAppointmentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield appointment_model_1.Appointment.findByIdAndDelete(id);
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    return true;
});
exports.AppointmentService = {
    createAppointmentToDB,
    getUserAppointmentsFromDB,
    getSingleAppointmentFromDB,
    updateAppointmentToDB,
    deleteAppointmentFromDB,
    getAllAppointmentsFromDB,
};
