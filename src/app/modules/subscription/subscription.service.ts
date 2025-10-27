import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Subscription } from './subscription.model';
import { ISubscription } from './subscription.interface';
import fetch from 'node-fetch';
import config from '../../../config';

// 🔍 Verify subscription with Adapty API
const verifyWithAdapty = async (subscriptionId: string) => {
  const res = await fetch(`https://api.adapty.io/api/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${config.adapty_secret_key}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new AppError(StatusCodes.BAD_REQUEST, 'Adapty verification failed');
  return res.json();
};

// 🟢 Create a new subscription (from frontend SDK)
const createSubscriptionToDB = async (
  userId: string,
  payload: Partial<ISubscription>
): Promise<ISubscription> => {
  const adaptyData = await verifyWithAdapty(payload.subscriptionId!);

  if (adaptyData.status !== 'active') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Subscription is not active');
  }

  const subscription = await Subscription.create({
    ...payload,
    userId,
    status: adaptyData.status,
    expiryDate: adaptyData.expiry_date,
    lastVerified: new Date(),
  });

  if (!subscription) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription');
  }

  return subscription;
};

// 🟣 Get current subscription (auto re-verify)
const getSubscriptionStatusFromDB = async (userId: string): Promise<ISubscription | null> => {
  const subscription = await Subscription.findOne({ userId });
  if (!subscription) throw new AppError(StatusCodes.NOT_FOUND, 'No subscription found');

  const adaptyData = await verifyWithAdapty(subscription.subscriptionId);
  const updated = await Subscription.findByIdAndUpdate(
    subscription._id,
    {
      status: adaptyData.status,
      expiryDate: adaptyData.expiry_date,
      lastVerified: new Date(),
    },
    { new: true }
  );

  return updated;
};

// 🔵 Handle Adapty webhook event (improved + resilient)
const handleWebhookEventToDB = async (webhookData: any) => {
  try {
    const {
      subscription_id,
      product_id,
      purchase_token,
      event_type,
      status,
      expires_at,
    } = webhookData;

    // Optional: double-verify with Adapty for accuracy
    const adaptyData = await verifyWithAdapty(subscription_id).catch(() => null);

    const updateData = {
      status: adaptyData?.status || status,
      productId: adaptyData?.product_id || product_id,
      purchaseToken: adaptyData?.purchase_token || purchase_token,
      expiryDate: adaptyData?.expiry_date || expires_at,
      lastVerified: new Date(),
    };

    // Upsert: update if exists, create if not
    await Subscription.findOneAndUpdate(
      { subscriptionId: subscription_id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log(`✅ Webhook processed: ${event_type} for ${subscription_id}`);
  } catch (error) {
    console.error('❌ Webhook handling failed:', error);
  }
};

// 🟠 Manual verification (cron / admin check)
const verifySubscriptionToDB = async (userId: string): Promise<ISubscription> => {
  const subscription = await Subscription.findOne({ userId });
  if (!subscription) throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');

  const adaptyData = await verifyWithAdapty(subscription.subscriptionId);
  const updated = await Subscription.findByIdAndUpdate(
    subscription._id,
    {
      status: adaptyData.status,
      expiryDate: adaptyData.expiry_date,
      lastVerified: new Date(),
    },
    { new: true }
  );

  if (!updated) throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
  return updated;
};

export const SubscriptionService = {
  createSubscriptionToDB,
  getSubscriptionStatusFromDB,
  handleWebhookEventToDB,
  verifySubscriptionToDB,
};
