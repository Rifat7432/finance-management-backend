import { StatusCodes } from 'http-status-codes';
import { Appointment } from './appointment.model';
import AppError from '../../../errors/AppError';
import { IAppointment } from './appointment.interface';
import { TimeSlot } from '../timeSlot/timeSlot.model';

const createAppointmentToDB = async (date: string, time: string, userId: string): Promise<IAppointment | null> => {
     // Find the time slot document for the given date
     const slotDoc = await TimeSlot.findOne({ date });
     if (!slotDoc) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No time slots found for this date');
     }

     // Find the specific slot by time
     const slot = slotDoc.availableSlots.find((s) => s.time === time);
     if (!slot) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
     }

     // Check if the slot is already booked
     if (slot.isBooked) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
     }

     // Mark the slot as booked
     slot.isBooked = true;
     await slotDoc.save();

     // Create an appointment and associate it with the booked slot
     const appointment = await Appointment.create({
          user: userId,
          date,
          time,
          timeSlot: slotDoc._id,
     });

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

  // If the date or time is updated, we need to validate and update the time slots
  if (newDate || newTime) {
    let slotDoc = await TimeSlot.findOne({ date: newDate || oldDate }); // Check the updated date or the old one
    if (!slotDoc) {
      throw new AppError(StatusCodes.NOT_FOUND, 'No time slots found for the given date');
    }

    // If the time is being updated, find the new time slot
    const slot = slotDoc.availableSlots.find((s) => s.time === newTime || s.time === oldTime);
    if (!slot) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Time slot not found');
    }

    // Check if the new time slot is already booked (if changing time)
    if (newTime && slot.isBooked) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Selected time slot is already booked');
    }

    // Mark the old time slot as available if the time is being changed
    if (newTime && oldTime !== newTime) {
      const oldSlot = slotDoc.availableSlots.find((s) => s.time === oldTime);
      if (oldSlot) {
        oldSlot.isBooked = false;
        await slotDoc.save();
      }
    }

    // Mark the new time slot as booked if the time is updated
    if (newTime && oldTime !== newTime) {
      slot.isBooked = true;
      await slotDoc.save();
    }

    // Update the appointment with new details
    appointment.set('date', newDate || appointment.get('date'));
    appointment.set('time', newTime || appointment.get('time'));
    const updatedAppointment = await appointment.save(); // Save the changes

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
