import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Subscription } from './subscription.model';
import { ISubscription } from './subscription.interface';
import fetch from 'node-fetch';
import config from '../../../config';

// 🔍 Verify subscription with RevenueCat API (optional)
const verifyWithRevenueCat = async (appUserId: string) => {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
    headers: {
      Authorization: `Bearer ${config.revenuecat_secret_key}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new AppError(StatusCodes.BAD_REQUEST, 'RevenueCat verification failed');
  return res.json();
};

// 🟢 Create subscription (initial data from app)
const createSubscriptionToDB = async (
  userId: string,
  payload: Partial<ISubscription>
): Promise<ISubscription> => {
  const subscription = await Subscription.create({
    ...payload,
    userId,
    status: payload.status || 'active',
    lastVerified: new Date(),
  });

  if (!subscription) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription');
  }

  return subscription;
};

// 🔵 Handle RevenueCat webhook
const handleWebhookEventToDB = async (webhookData: any) => {
  try {
    const {
      event,
      app_user_id,
      product_id,
      purchase_token,
      event_type,
      expiration_at_ms,
      period_type,
    } = webhookData;

    const updateData = {
      status: event_type === 'CANCELLATION' ? 'canceled' : 'active',
      productId: product_id,
      purchaseToken: purchase_token,
      expiryDate: expiration_at_ms ? new Date(expiration_at_ms) : undefined,
      lastVerified: new Date(),
    };

    await Subscription.findOneAndUpdate(
      { subscriptionId: app_user_id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log(`✅ RevenueCat webhook processed: ${event_type} for ${app_user_id}`);
  } catch (error) {
    console.error('❌ RevenueCat webhook failed:', error);
  }
};

// 🟠 Manual verification (optional)
const verifySubscriptionToDB = async (userId: string): Promise<ISubscription> => {
  const subscription = await Subscription.findOne({ userId });
  if (!subscription) throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');

  const adaptyData = await verifyWithRevenueCat(subscription.subscriptionId);
  const updated = await Subscription.findByIdAndUpdate(
    subscription._id,
    {
      status: adaptyData.subscriber.entitlements.active ? 'active' : 'canceled',
      expiryDate: new Date(adaptyData.subscriber.expiration_date),
      lastVerified: new Date(),
    },
    { new: true }
  );

  if (!updated) throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
  return updated;
};

export const SubscriptionService = {
  createSubscriptionToDB,
  handleWebhookEventToDB,
  verifySubscriptionToDB,
};
