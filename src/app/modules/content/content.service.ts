import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Content } from './content.model';


import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { Notification } from '../notification/notification.model';
import { firebaseHelper } from '../../../helpers/firebaseHelper';

const createContentToDB = async (payload: any) => {
      const newContent = await Content.create(payload);
      if (!newContent) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create content');
      }

      // Find all users with contentNotification enabled
      const settings = await NotificationSettings.find({ contentNotification: true });
      if (settings && settings.length > 0) {
           await Promise.all(settings.map(async (setting) => {
                const notificationPromises = [];
                if (setting.deviceTokenList && setting.deviceTokenList.length > 0) {
                     // Send push notification
                     notificationPromises.push(
                          firebaseHelper.sendNotification(
                               [{ id: String(setting.userId), deviceToken: setting.deviceTokenList[0] }],
                               {
                                    title: 'New Content Available',
                                    body: newContent.title,
                               },
                               setting.deviceTokenList,
                               'multiple',
                               { contentId: String(newContent._id) }
                          )
                     );
                }
                // Store notification in DB
                notificationPromises.push(
                     Notification.create({
                          title: 'New Content Available',
                          message: newContent.title,
                          receiver: setting.userId,
                          type: 'ADMIN',
                          read: false,
                     })
                );
                await Promise.all(notificationPromises);
           }));
      }
      return newContent;
};

const getContentsFromDB = async (query: any) => {
     const contents = await Content.find({ ...(query.category ? { category: query.category } : {}) ,isDeleted:false});
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
