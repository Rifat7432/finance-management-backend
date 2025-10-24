import { StatusCodes } from 'http-status-codes';
import { Ad } from './ad.model';
import AppError from '../../../errors/AppError';
import { IAd } from './ad.interface';
import { deleteFileFromS3 } from '../../middleware/uploadFileToS3';

const createAdToDB = async (payload: IAd): Promise<IAd> => {
     const newAd = await Ad.create(payload);
     if (!newAd) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create ad');
     }
     return newAd;
};

const getAdsFromDB = async (): Promise<IAd[]> => {
     const ads = await Ad.find({ isDeleted: false });
     if (!ads.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No ads found');
     }
     return ads;
};

const getSingleAdFromDB = async (): Promise<IAd | null> => {
     const now = new Date();
     const [ad] = await Ad.aggregate([
          {
               $match: {
                    isDeleted: false,
                    startDate: { $lte: now.toISOString() },
                    endDate: { $gte: now.toISOString() },
               },
          },
          { $sample: { size: 1 } }, // pick only 1 random ad
     ]);
     return ad;
};

const updateAdToDB = async (id: string, payload: Partial<IAd>): Promise<IAd | null> => {
     const ad = await Ad.findById(id);
     if (!ad || ad.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found or deleted');
     }
     if (payload.url) {
          deleteFileFromS3(ad.url);
     }
     const updated = await Ad.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update ad');
     }
     return updated;
};

const deleteAdFromDB = async (id: string): Promise<boolean> => {
     const ad = await Ad.findById(id);
     if (!ad || ad.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found or deleted');
     }
     const deleted = await Ad.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found');
     }
     return true;
};

export const AdService = {
     createAdToDB,
     getAdsFromDB,
     getSingleAdFromDB,
     updateAdToDB,
     deleteAdFromDB,
};
