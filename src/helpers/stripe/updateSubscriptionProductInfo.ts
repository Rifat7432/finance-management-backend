import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import stripe from '../../config/adapty';
import { IPackage } from '../../app/modules/package/package.interface';

export const updateSubscriptionInfo = async (
  productId: string,
  payload: Partial<IPackage>
): Promise<{
  productId: string;
  regularPriceId: string;
  promoPriceId?: string;
}> => {
  // 1. Update product in Stripe
  const updatedProduct = await stripe.products.update(productId, {
    name: payload.title || undefined,
    description: payload.description || undefined,
  });

  if (!updatedProduct) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update product in Stripe');
  }

  // 2. Map duration → interval
  let interval: 'month' | 'year' = 'month';
  let intervalCount = 1;

  switch (payload.duration) {
    case '1 month':
      interval = 'month';
      intervalCount = 1;
      break;
    case '3 months':
      interval = 'month';
      intervalCount = 3;
      break;
    case '6 months':
      interval = 'month';
      intervalCount = 6;
      break;
    case '1 year':
      interval = 'year';
      intervalCount = 1;
      break;
    default:
      interval = 'month';
      intervalCount = 1;
  }

  // 3. Always create a new regular price
  if (!payload.price) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Regular price is required to update');
  }

  const regularPrice = await stripe.prices.create({
    product: productId,
    unit_amount: Number(payload.price) * 100,
    currency: payload.currency || 'usd',
    recurring: { interval, interval_count: intervalCount },
  });

  if (!regularPrice) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create regular price in Stripe');
  }

  let promoPriceId: string | undefined;

  // 4. Optionally create promo price
  if (payload.promoPrice) {
    const promoPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Number(payload.promoPrice) * 100,
      currency: payload.currency || 'usd',
      recurring: { interval, interval_count: intervalCount },
    });

    if (!promoPrice) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create promo price in Stripe');
    }

    promoPriceId = promoPrice.id;
  }

  // 5. Return updated product + new prices
  return {
    productId: updatedProduct.id,
    regularPriceId: regularPrice.id,
    promoPriceId,
  };
};
