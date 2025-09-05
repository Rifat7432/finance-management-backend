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

const getContentsFromDB = async (query: any) => {
     const contents = await Content.find({ ...(query.category ? { category: query.category } : {}) });
     if (!contents.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No content found');
     }
     return contents;
};

const getSingleContentFromDB = async (id: string) => {
     const content = await Content.findById(id);
     if (!content || content.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Content not found or deleted');
     }
     return content;
};

const updateContentToDB = async (id: string, payload: any) => {
     const content = await Content.findById(id);
     if (!content || content.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Content not found or deleted');
     }
     const updated = await Content.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update content');
     }
     return updated;
};

const deleteContentFromDB = async (id: string) => {
     const content = await Content.findById(id);
     if (!content || content.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Content not found or deleted');
     }
     const deleted = await Content.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
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
