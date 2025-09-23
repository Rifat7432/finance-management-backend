import { Package } from '../package/package.model';
import { ISubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import stripe from '../../../config/stripe';
import { User } from '../user/user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import config from '../../../config';

const subscriptionDetailsFromDB = async (id: string): Promise<{ subscription: ISubscription | {} }> => {
     const subscription = await Subscription.findOne({ userId: id }).populate('package', 'title credit duration').lean();

     if (!subscription) {
          return { subscription: {} }; // Return empty object if no subscription found
     }

     const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

     // Check subscription status and update database accordingly
     if (subscriptionFromStripe?.status !== 'active') {
          await Promise.all([User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
     }
     return { subscription };
};

const companySubscriptionDetailsFromDB = async (id: string): Promise<{ subscription: ISubscription | {} }> => {
     const subscription = await Subscription.findOne({ userId: id }).populate('package', 'title credit').lean();
     if (!subscription) {
          return { subscription: {} }; // Return empty object if no subscription found
     }

     const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

     // Check subscription status and update database accordingly
     if (subscriptionFromStripe?.status !== 'active') {
          await Promise.all([User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
     }

     return { subscription };
};

const subscriptionsFromDB = async (query: Record<string, unknown>): Promise<ISubscription[]> => {
     const conditions: any[] = [];

     const { searchTerm, limit, page, paymentType } = query;

     // Handle search term - search in both package title and user details
     if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
          const trimmedSearchTerm = searchTerm.trim();

          // Find matching packages by title or paymentType
          const matchingPackageIds = await Package.find({
               $or: [{ title: { $regex: trimmedSearchTerm, $options: 'i' } }, { paymentType: { $regex: trimmedSearchTerm, $options: 'i' } }],
          }).distinct('_id');

          // Find matching users by email, name, company, etc.
          const matchingUserIds = await User.find({
               $or: [
                    { email: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { name: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { company: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { contact: { $regex: trimmedSearchTerm, $options: 'i' } },
               ],
          }).distinct('_id');

          // Create search conditions
          const searchConditions = [];

          if (matchingPackageIds.length > 0) {
               searchConditions.push({ package: { $in: matchingPackageIds } });
          }

          if (matchingUserIds.length > 0) {
               searchConditions.push({ userId: { $in: matchingUserIds } });
          }

          // Only add search condition if we found matching packages or users
          if (searchConditions.length > 0) {
               conditions.push({ $or: searchConditions });
          } else {
               // If no matches found, return empty result early
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Handle payment type filter
     if (paymentType && typeof paymentType === 'string' && paymentType.trim()) {
          const packageIdsWithPaymentType = await Package.find({
               paymentType: paymentType.trim(),
          }).distinct('_id');

          if (packageIdsWithPaymentType.length > 0) {
               conditions.push({ package: { $in: packageIdsWithPaymentType } });
          } else {
               // If no packages match the payment type, return empty result
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Build final query conditions
     const whereConditions = conditions.length > 0 ? { $and: conditions } : {};

     // Pagination
     const pages = Math.max(1, parseInt(page as string) || 1);
     const size = Math.max(1, Math.min(100, parseInt(limit as string) || 10)); // Limit max size
     const skip = (pages - 1) * size;

     try {
          // Execute query with population
          const result = await Subscription.find(whereConditions)
               .populate([
                    {
                         path: 'package',
                         select: 'title paymentType credit description',
                    },
                    {
                         path: 'userId',
                         select: 'email name linkedIn contact company website',
                    },
               ])
               .select('userId package price trxId currentPeriodStart currentPeriodEnd status createdAt updatedAt')
               .sort({ createdAt: -1 }) // Add sorting by creation date
               .skip(skip)
               .limit(size)
               .lean(); // Use lean() for better performance

          // Get total count for pagination
          const count = await Subscription.countDocuments(whereConditions);

          const data: any = {
               data: result,
               meta: {
                    page: pages,
                    limit: size,
                    total: count,
                    totalPages: Math.ceil(count / size),
               },
          };

          return data;
     } catch (error) {
          console.error('Error fetching subscriptions:', error);
          throw new Error('Failed to fetch subscriptions');
     }
};


 const upgradeSubscriptionToDB = async (userId: string, packageId: string) => {
  // 1. Find active subscription in DB
  const activeSubscription = await Subscription.findOne({
    userId,
    status: 'active',
  });

  if (!activeSubscription || !activeSubscription.subscriptionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'No active subscription found to upgrade');
  }

  // 2. Get new package info
  const packageDoc = await Package.findById(packageId);
  if (!packageDoc || !packageDoc.priceId) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Package not found or missing Stripe Regular Price ID');
  }

  // 3. Ensure user exists & has Stripe customer ID
  const user = await User.findById(userId).select('+stripeCustomerId');
  if (!user || !user.stripeCustomerId) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
  }

  // 4. Retrieve existing subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    activeSubscription.subscriptionId
  );

  if (!stripeSubscription || stripeSubscription.status !== 'active') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'No active subscription found in Stripe');
  }

  // 5. Upgrade subscription → always to new regular price
  const updatedSubscription = await stripe.subscriptions.update(
    activeSubscription.subscriptionId,
    {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: packageDoc.priceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        userId,
        packageId: packageDoc._id.toString(),
      },
    }
  );

  // 6. Update DB record
  await Subscription.findByIdAndUpdate(activeSubscription._id, {
    package: packageDoc._id,
    updatedAt: new Date(),
  });

  return {
    subscriptionId: updatedSubscription.id,
    status: updatedSubscription.status,
  };
};


const cancelSubscriptionToDB = async (userId: string) => {
     const activeSubscription = await Subscription.findOne({
          userId,
          status: 'active',
     });

     if (!activeSubscription || !activeSubscription.subscriptionId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No active subscription found to cancel');
     }

     const stripeSub = await stripe.subscriptions.retrieve(activeSubscription.subscriptionId);
     if (stripeSub.status === 'canceled') {
          return { success: true, message: 'Already canceled' };
     }

     await stripe.subscriptions.cancel(activeSubscription.subscriptionId);

     await Subscription.findOneAndUpdate({ userId, status: 'active' }, { status: 'canceled' }, { new: true });

     return { success: true, message: 'Subscription canceled successfully' };
};

const successMessage = async (sessionId: string) => {
     const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
     });

     return {
          status: session.payment_status,
          subscriptionId: session.subscription,
          customerEmail: session.customer_email,
     };
};

const createSubscriptionSetupIntoDB = async (userId: string, packageId: string) => {
     const user = await User.findById(userId).select('+stripeCustomerId');
     if (!user || !user.stripeCustomerId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
     }

     // Create customer if not exists
     let customerId = user.stripeCustomerId;
     if (!customerId) {
          const customer = await stripe.customers.create({ email: user.email });
          customerId = customer.id;
          user.stripeCustomerId = customerId;
          await user.save();
     }

     // Create SetupIntent to collect card/payment method
     const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          usage: 'off_session',
     });

     return {
          clientSecret: setupIntent.client_secret,
          customerId,
     };
};

const createSubscriptionIntoDB = async ({
  userId,
  paymentMethodId,
  packageId,
}: {
  userId: string;
  paymentMethodId: string;
  packageId: string;
}) => {
  const user = await User.findById(userId).select('+stripeCustomerId');
  const pkg = await Package.findById(packageId);

  if (!user || !user.stripeCustomerId) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
  }
  if (!pkg || !pkg.priceId) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Package or Stripe Price IDs not found');
  }

  // Attach payment method
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.stripeCustomerId,
  });

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // Always start with 1 month free trial
  const phases: any[] = [
    {
      items: [{ price: pkg.priceId }],
      trial: 30 * 24 * 60 * 60, // 1 month in seconds
    },
  ];

  // If promo price exists → add promo phase
  if (pkg.promoPriceId) {
    phases.push({
      items: [{ price: pkg.promoPriceId }],
      iterations: 3, // 3 billing cycles (3 months promo)
    });
  }

  // Then continue with regular price
  phases.push({
    items: [{ price: pkg.priceId }],
    iterations: null, // ongoing until cancelled
  });

  // Create subscription schedule
  const schedule = await stripe.subscriptionSchedules.create({
    customer: user.stripeCustomerId,
    start_date: 'now',
    end_behavior: 'release',
    phases,
    expand: ['subscription.latest_invoice.payment_intent'],
  });

  const subscription = schedule.subscription as any;

  // Save subscription in DB
     await Subscription.create({
          userId: user._id,
          package: pkg._id,
          subscriptionId: subscription.id,
          customerId: user.stripeCustomerId,
          trxId: subscription.latest_invoice?.payment_intent?.id || '',
          price: pkg.price,
          remaining: 0, // Set this as needed, e.g. pkg.credit or similar
          status: subscription.status === 'active' ? 'active' : (subscription.status === 'canceled' ? 'cancel' : subscription.status),
          currentPeriodStart: String(subscription.current_period_start),
          currentPeriodEnd: String(subscription.current_period_end),
     });

  return {
    subscriptionId: subscription.id,
    scheduleId: schedule.id,
    clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
  };
};





export const SubscriptionService = {
     subscriptionDetailsFromDB,
     subscriptionsFromDB,
     companySubscriptionDetailsFromDB,
     upgradeSubscriptionToDB,
     cancelSubscriptionToDB,
     successMessage,
     createSubscriptionSetupIntoDB,
     createSubscriptionIntoDB,
};
