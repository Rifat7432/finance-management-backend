import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
     const createAdmin: any = await User.create(payload);
     if (!createAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
     }
     if (createAdmin) {
          await User.findByIdAndUpdate({ _id: createAdmin?._id }, { verified: true }, { new: true });
     }
     return createAdmin;
};

const getUserSubscriptionsFromDB = async () => {
     const result = await Subscription.aggregate([
          {
               $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
               },
          },
          { $unwind: '$user' },
          {
               $project: {
                    _id: 0,
                    name: '$user.name',
                    email: '$user.email',
                    phone: { $ifNull: ['$user.phone', '(319) 555-0115'] },
                    image: '$user.image',
                    status: {
                         $switch: {
                              branches: [
                                   { case: { $eq: ['$status', 'active'] }, then: 'Active' },
                                   { case: { $eq: ['$status', 'expired'] }, then: 'Expired' },
                                   { case: { $eq: ['$status', 'cancel'] }, then: 'Inactive' },
                                   { case: { $eq: ['$status', 'deactivated'] }, then: 'Inactive' },
                              ],
                              default: 'Unknown',
                         },
                    },
                    startDate: '$currentPeriodStart',
                    endDate: '$currentPeriodEnd',
               },
          },
          {
               $sort: { startDate: -1 },
          },
     ]);

     return result;
};
const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
     const isExistAdmin = await User.findByIdAndDelete(id);
     if (!isExistAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
     }
     return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
     const admins = await User.find({ role: 'ADMIN' }).select('name email profile contact location');
     return admins;
};

export const AdminService = {
     createAdminToDB,
     deleteAdminFromDB,
     getAdminFromDB,
     getUserSubscriptionsFromDB
};
