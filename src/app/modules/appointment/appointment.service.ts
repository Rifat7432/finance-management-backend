import { StatusCodes } from 'http-status-codes';
import { Appointment } from './appointment.model';
import AppError from '../../../errors/AppError';
import { IAppointment } from './appointment.interface';

import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { Notification } from '../notification/notification.model';
import { firebaseHelper } from '../../../helpers/firebaseHelper';

const createAppointmentToDB = async (date: string, time: string, userId: string): Promise<IAppointment | null> => {
     // Validate date
     const parsedDate = new Date(date);
     if (isNaN(parsedDate.getTime())) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid date format');
     }

     // Validate time (HH:mm or HH:mm:ss)
     const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
     if (!timeRegex.test(time)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
     }

     // Check if an appointment already exists for the given date and time
     const existingAppointment = await Appointment.findOne({ date, time });
     if (existingAppointment) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
     }

     // Create the appointment
     const appointment = await Appointment.create({
          user: userId,
          date,
          time,
     });

     // Send notification only to the user who booked the appointment, if their settings allow
     const userSetting = await NotificationSettings.findOne({ userId });
     if (userSetting?.appointmentNotification) {
          if (userSetting.deviceTokenList && userSetting.deviceTokenList.length > 0) {
               await firebaseHelper.sendNotification(
                    [{ id: String(userSetting.userId), deviceToken: userSetting.deviceTokenList[0] }],
                    {
                         title: 'New Appointment Booked',
                         body: `Appointment booked for ${date} at ${time}`,
                    },
                    userSetting.deviceTokenList,
                    'multiple',
                    { appointmentId: String(appointment._id) }
               );
          }
          await Notification.create({
               title: 'New Appointment Booked',
               message: `Appointment booked for ${date} at ${time}`,
               receiver: userSetting.userId,
               type: 'APPOINTMENT',
               read: false,
          });
     }

     return appointment;
};

const getUserAppointmentsFromDB = async (userId: string): Promise<IAppointment[]> => {
     const appointments = await Appointment.find({ userId });
     if (!appointments.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No appointments found for this user');
     }
     return appointments;
};
const getAllAppointmentsFromDB = async (): Promise<IAppointment[]> => {
     const appointments = await Appointment.find();
     if (!appointments.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No appointments found for this user');
     }
     return appointments;
};

const getSingleAppointmentFromDB = async (id: string): Promise<IAppointment | null> => {
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     return appointment;
};

const updateAppointmentToDB = async (id: string, payload: Partial<IAppointment>): Promise<IAppointment | null> => {
     // Retrieve the existing appointment
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }

     // Handle case where appointment time or date is updated
     const newDate = (payload as any).date;
     const newTime = (payload as any).time;
     const oldDate = appointment.get('date');
     const oldTime = appointment.get('time');

     // If the date or time is updated, validate and check for double booking
     if (newDate || newTime) {
          // Validate new date if provided
          if (newDate) {
               const parsedDate = new Date(newDate);
               if (isNaN(parsedDate.getTime())) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid date format');
               }
          }
          // Validate new time if provided
          if (newTime) {
               const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
               if (!timeRegex.test(newTime)) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
               }
          }

          // Check if another appointment already exists for the new date and time
          const checkDate = newDate || oldDate;
          const checkTime = newTime || oldTime;
          const existingAppointment = await Appointment.findOne({ date: checkDate, time: checkTime, _id: { $ne: id } });
          if (existingAppointment) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
          }

          // Update the appointment with new details
          appointment.set('date', newDate || oldDate);
          appointment.set('time', newTime || oldTime);
          const updatedAppointment = await appointment.save();
          return updatedAppointment;
     }

     // If the date and time are not updated, simply update other fields
     const updated = await Appointment.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update appointment');
     }
     return updated;
};


const deleteAppointmentFromDB = async (id: string): Promise<boolean> => {
     const deleted = await Appointment.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     return true;
};

export const AppointmentService = {
     createAppointmentToDB,
     getUserAppointmentsFromDB,
     getSingleAppointmentFromDB,
     updateAppointmentToDB,
     deleteAppointmentFromDB,
     getAllAppointmentsFromDB,
};
