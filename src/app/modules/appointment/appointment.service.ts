import { StatusCodes } from 'http-status-codes';
import { Appointment } from './appointment.model';
import AppError from '../../../errors/AppError';
import { IAppointment } from './appointment.model';

const createAppointmentToDB = async (payload: IAppointment): Promise<IAppointment> => {
  const newAppointment = await Appointment.create(payload);
  if (!newAppointment) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create appointment');
  }
  return newAppointment;
};

const getUserAppointmentsFromDB = async (userId: string): Promise<IAppointment[]> => {
  const appointments = await Appointment.find({ userId });
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
};
