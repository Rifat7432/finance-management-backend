import { StatusCodes } from 'http-status-codes';
import { Ad } from './ad.model';
import AppError from '../../../errors/AppError';
import { IAd } from './ad.interface';


const createAdToDB = async (payload: IAd): Promise<IAd> => {
  const newAd = await Ad.create(payload);
  if (!newAd) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create ad');
  }
  return newAd;
};

const getAdsFromDB = async (): Promise<IAd[]> => {
  const ads = await Ad.find();
  if (!ads.length) {
    throw new AppError(StatusCodes.NOT_FOUND, 'No ads found');
  }
  return ads;
};

const getSingleAdFromDB = async (id: string): Promise<IAd | null> => {
  const ad = await Ad.findById(id);
  if (!ad) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found');
  }
  return ad;
};

const updateAdToDB = async (id: string, payload: Partial<IAd>): Promise<IAd | null> => {
  const updated = await Ad.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update ad');
  }
  return updated;
};

const deleteAdFromDB = async (id: string): Promise<boolean> => {
  const deleted = await Ad.findByIdAndDelete(id);
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
