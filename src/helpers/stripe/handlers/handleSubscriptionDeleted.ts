import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import stripe from '../../../config/adapty';
import AppError from '../../../errors/AppError';
import { Subscription } from '../../../app/modules/subscription/subscription.model';
import { User } from '../../../app/modules/user/user.model';
// const User:any = "";
// const Subscription:any = "";

export const handleSubscriptionDeleted = async (data: Stripe.Subscription) => {
     const subscription = await stripe.subscriptions.retrieve(data.id);

     const userSubscription = await Subscription.findOne({
          customerId: subscription.customer,
          status: 'active',
     });

     if (!userSubscription) throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found.');

     await Subscription.findByIdAndUpdate(userSubscription._id, {
          status: 'cancel',
          remaining: 0,
          currentPeriodStart: null,
          currentPeriodEnd: null,
     });

     const user = await User.findById(userSubscription.userId);
     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');

     await User.findByIdAndUpdate(user._id, {
          hasAccess: false,
          isSubscribed: false,
          packageName: null,
     });
};
