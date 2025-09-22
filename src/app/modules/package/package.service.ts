import { StatusCodes } from 'http-status-codes';
import { IPackage } from './package.interface';
import { Package } from './package.model';
import mongoose from 'mongoose';
import { createSubscriptionProduct } from '../../../helpers/stripe/createSubscriptionProductHelper';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
import { updateSubscriptionInfo } from '../../../helpers/stripe/updateSubscriptionProductInfo';
import QueryBuilder from '../../builder/QueryBuilder';

export const createPackageToDB = async (payload: IPackage): Promise<IPackage | null> => {
     // 1. Prepare payload for Stripe
     const productPayload: Partial<IPackage> = {
          title: payload.title,
          description: payload.description,
          duration: payload.duration,
          price: Number(payload.price),
          promoPrice: payload.promoPrice, // optional promo price
          currency: payload.currency, // optional currency
     };

     // 2. Create Stripe Product + Prices
     const product = await createSubscriptionProduct(productPayload);

     if (!product) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription product in Stripe');
     }

     // 3. Save Stripe IDs to package payload
     payload.productId = product.productId;
     payload.priceId = product.regularPriceId;
     if (product.promoPriceId) {
          payload.promoPriceId = product.promoPriceId;
     }

     // 4. Save package to MongoDB
     const result = await Package.create(payload);
     if (!result) {
          // If DB save fails, clean up Stripe product
          await stripe.products.del(product.productId);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Package in DB');
     }

     // 5. Return saved package
     return result;
};

const updatePackageToDB = async (id: string, payload: Partial<IPackage>): Promise<IPackage | null> => {
     // 1. Check if package exists
     const isExistPackage = await Package.findById(id);
     if (!isExistPackage) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     // 2. Update product & prices in Stripe
     const updatedProduct = await updateSubscriptionInfo(isExistPackage.productId!, payload);

     if (!updatedProduct) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update subscription product in Stripe');
     }

     // 3. Sync Stripe IDs back to payload
     payload.productId = updatedProduct.productId;
     payload.priceId = updatedProduct.regularPriceId;
     payload.promoPriceId = updatedProduct.promoPriceId;

     // 4. Update in DB
     const updatedPackage = await Package.findByIdAndUpdate(id, payload, {
          new: true,
          runValidators: true,
     });

     if (!updatedPackage) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update package');
     }

     return updatedPackage;
};

const getPackageFromDB = async (queryParms: Record<string, unknown>) => {
     const query: any = {
          isDeleted: false,
     };

     const queryBuilder = new QueryBuilder(Package.find(query), queryParms);
     const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
     console.log(packages);
     const meta = await queryBuilder.countTotal();
     return {
          packages,
          meta,
     };
};
const getPackageByUserFromDB = async (queryParms: Record<string, unknown>) => {
     const query: any = {
          status: 'active',
          isDeleted: false,
     };

     const queryBuilder = new QueryBuilder(Package.find(query), queryParms);
     const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          packages,
          meta,
     };
};

const getPackageDetailsFromDB = async (id: string): Promise<IPackage | null> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ID');
     }
     const result = await Package.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }
     return result;
};

const deletePackageToDB = async (id: string): Promise<IPackage | null> => {
     const isExistPackage = await Package.findById(id);
     if (!isExistPackage) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     try {
          // 1. Get all prices linked to this product
          const prices = await stripe.prices.list({ product: isExistPackage.productId });

          // 2. Deactivate all prices (regular + promo)
          for (const price of prices.data) {
               if (price.active) {
                    await stripe.prices.update(price.id, { active: false });
               }
          }

          // 3. Archive the product instead of deleting
          await stripe.products.update(isExistPackage.productId!, {
               active: false,
               metadata: {
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'system', // you can replace with current user info
               },
          });

          // 4. Soft delete in MongoDB
          const result = await Package.findByIdAndUpdate(
               id,
               {
                    status: 'inactive',
                    isDeleted: true,
                    deletedAt: new Date(),
                    priceId: undefined,
                    promoPriceId: undefined,
               },
               { new: true },
          );

          if (!result) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete package');
          }

          return result;
     } catch (stripeError: any) {
          // If Stripe product doesn’t exist, still mark package deleted in DB
          if (stripeError.type === 'StripeInvalidRequestError') {
               console.warn(`Stripe product ${isExistPackage.productId} not found, updating DB only`);

               return await Package.findByIdAndUpdate(
                    id,
                    {
                         status: 'inactive',
                         isDeleted: true,
                         deletedAt: new Date(),
                         priceId: undefined,
                         promoPriceId: undefined,
                    },
                    { new: true },
               );
          }

          throw new AppError(StatusCodes.BAD_REQUEST, `Failed to delete package: ${stripeError.message}`);
     }
};

export const PackageService = {
     createPackageToDB,
     updatePackageToDB,
     getPackageFromDB,
     getPackageDetailsFromDB,
     deletePackageToDB,
     getPackageByUserFromDB,
};
