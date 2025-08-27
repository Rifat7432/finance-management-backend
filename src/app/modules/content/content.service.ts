import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Content } from './content.model';

const createContentToDB = async (payload: any) => {
  const newContent = await Content.create(payload);
  if (!newContent) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create content');
  }
  return newContent;
};

const getContentsFromDB = async () => {
  const contents = await Content.find();
  if (!contents.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No content found');
  }
  return contents;
};

const getSingleContentFromDB = async (id: string) => {
  const content = await Content.findById(id);
  if (!content) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Content not found');
  }
  return content;
};

const updateContentToDB = async (id: string, payload: any) => {
  const updated = await Content.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update content');
  }
  return updated;
};

const deleteContentFromDB = async (id: string) => {
  const deleted = await Content.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Content not found');
  }
  return true;
};

export const ContentService = {
  createContentToDB,
  getContentsFromDB,
  getSingleContentFromDB,
  updateContentToDB,
  deleteContentFromDB,
};
