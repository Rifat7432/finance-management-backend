import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { TimeSlotService } from './timeSlot.service';

const createTimeSlot = catchAsync(async (req, res) => {
     const result = await TimeSlotService.createTimeSlotToDB(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Time slot created successfully',
          data: result,
     });
});

const getTimeSlots = catchAsync(async (req, res) => {
     const { date } = req.query;
     const dateStr = Array.isArray(date) ? String(date[0]) : (typeof date === 'string' ? date : undefined);
     const result = await TimeSlotService.getTimeSlotsFromDB(dateStr);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Time slots retrieved successfully',
          data: result,
     });
});

const getSingleTimeSlot = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await TimeSlotService.getSingleTimeSlotFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Time slot retrieved successfully',
          data: result,
     });
});

const updateTimeSlot = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await TimeSlotService.updateTimeSlotToDB(id, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Time slot updated successfully',
          data: result,
     });
});

const deleteTimeSlot = catchAsync(async (req, res) => {
     const { id } = req.params;
     await TimeSlotService.deleteTimeSlotFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Time slot deleted successfully',
     });
});

export const TimeSlotController = {
     createTimeSlot,
     getTimeSlots,
     getSingleTimeSlot,
     updateTimeSlot,
     deleteTimeSlot,
};
