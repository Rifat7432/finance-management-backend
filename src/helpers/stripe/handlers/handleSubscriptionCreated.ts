import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
import { Package } from '../../../app/modules/package/package.model';
import { User } from '../../../app/modules/user/user.model';
import { Subscription } from '../../../app/modules/subscription/subscription.model';
import { sendNotifications } from '../../notificationsHelper';

const formatUnixToIsoUtc = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().replace('Z', '+00:00');
};

export const handleSubscriptionCreated = async (data: Stripe.Subscription) => {
  try {
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found!');

    const customer = await stripe.customers.retrieve(data.customer as string) as Stripe.Customer;
    const priceId = data.items.data[0]?.price?.id;
    const invoice = await stripe.invoices.retrieve(data.latest_invoice as string);
    const trxId = (invoice as any)?.payment_intent?.toString() || '';
    const amountPaid = invoice.total / 100;

    const remaining = data.items.data[0]?.quantity || 0;
    const currentPeriodStart = formatUnixToIsoUtc((data as any).current_period_start);
    const currentPeriodEnd = formatUnixToIsoUtc((data as any).current_period_end);
    const subscriptionId = data.id;

    if (!customer?.email) throw new AppError(StatusCodes.BAD_REQUEST, 'No email found for the customer');

    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) throw new AppError(StatusCodes.NOT_FOUND, `User not found for email: ${customer.email}`);

    const pricingPlan = await Package.findOne({ priceId });
    if (!pricingPlan) throw new AppError(StatusCodes.NOT_FOUND, `Pricing plan not found for Price ID: ${priceId}`);

    const alreadySubscribed = await Subscription.findOne({
      userId: existingUser._id,
      status: 'active',
    });

    if (alreadySubscribed) {
      throw new AppError(StatusCodes.CONFLICT, 'User already has an active subscription');
    }

    const newSubscription = new Subscription({
      userId: existingUser._id,
      customerId: customer.id,
      package: pricingPlan._id,
      status: 'active',
      price: amountPaid,
      trxId,
      remaining,
      currentPeriodStart,
      currentPeriodEnd,
      subscriptionId,
    });

    await newSubscription.save();

    await User.findByIdAndUpdate(
      existingUser._id,
      {
        isSubscribed: true,
        hasAccess: true,
        isFreeTrial: false,
        trialExpireAt: null,
        packageName: pricingPlan.title,
      },
      { new: true },
    );

    await sendNotifications({
      title: `${existingUser.name}`,
      receiver: adminUser._id,
      message: `A new subscription has been purchased by ${existingUser.name}`,
      type: 'ORDER',
    });

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in handleSubscriptionCreated: ${error instanceof Error ? error.message : error}`
    );
  }
};
