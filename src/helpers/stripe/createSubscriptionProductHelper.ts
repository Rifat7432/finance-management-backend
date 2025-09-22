import { StatusCodes } from 'http-status-codes';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';
import { IPackage } from '../../app/modules/package/package.interface';

export const createSubscriptionProduct = async (
  payload: Partial<IPackage>
): Promise<{
  productId: string;
  regularPriceId: string;
  promoPriceId?: string;
}> => {
  // Create Product in Stripe
  const product = await stripe.products.create({
    name: payload.title as string,
    description: payload.description as string,
  });

  if (!product) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create product in Stripe');
  }

  // Interval mapping (flexible)
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

  // Create Regular Price
  if (!payload.price) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Regular price is required');
  }

  const regularPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Number(payload.price) * 100,
    currency: payload.currency || 'usd',
    recurring: { interval, interval_count: intervalCount },
  });

  if (!regularPrice) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create regular price in Stripe');
  }

  let promoPriceId: string | undefined;

  // Create Promo Price if admin provided
  if (payload.promoPrice) {
    const promoPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Number(payload.promoPrice) * 100,
      currency: payload.currency || 'usd',
      recurring: { interval, interval_count: intervalCount },
    });

    if (!promoPrice) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create promo price in Stripe');
    }

    promoPriceId = promoPrice.id;
  }

  return {
    productId: product.id,
    regularPriceId: regularPrice.id,
    promoPriceId,
  };
};
