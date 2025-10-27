import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import stripe from '../../../config/adapty';
import AppError from '../../../errors/AppError';
import { User } from '../../../app/modules/user/user.model';
import { Package } from '../../../app/modules/package/package.model';
import { Subscription } from '../../../app/modules/subscription/subscription.model';
const formatUnixToDate = (timestamp: number) => new Date(timestamp * 1000);

export const handleSubscriptionUpdated = async (data: Stripe.Subscription) => {
     try {
          const subscription = await stripe.subscriptions.retrieve(data.id);
          const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
          const priceId = subscription.items.data[0]?.price?.id;
          const invoice = (await stripe.invoices.retrieve(subscription.latest_invoice as string)) as Stripe.Invoice;

          const trxId = (invoice as any)?.payment_intent?.toString() || '';
          const amountPaid = invoice.total / 100;
          const remaining = subscription.items.data[0]?.quantity || 0;
          const currentPeriodStart = formatUnixToDate((subscription as any).current_period_start);
          const currentPeriodEnd = formatUnixToDate((subscription as any).current_period_end);
          const subscriptionId = subscription.id;

          if (!customer?.email) throw new AppError(StatusCodes.BAD_REQUEST, 'No email found for customer.');

          const existingUser = await User.findOne({ email: customer.email });
          if (!existingUser) throw new AppError(StatusCodes.NOT_FOUND, `User not found for email: ${customer.email}`);

          const pricingPlan = await Package.findOne({ priceId });
          if (!pricingPlan) throw new AppError(StatusCodes.NOT_FOUND, `Package with priceId ${priceId} not found`);

          const currentSub = await Subscription.findOne({
               userId: existingUser._id,
               status: 'active',
          }).populate('package');

          if (currentSub && (currentSub.package as any)?.priceId !== priceId) {
               // Old plan, deactivate
               await Subscription.findByIdAndUpdate(currentSub._id, {
                    status: 'deactivated',
                    remaining: 0,
                    currentPeriodStart: null,
                    currentPeriodEnd: null,
               });
          }

          // Create or update the current subscription
          await Subscription.findOneAndUpdate(
               { subscriptionId },
               {
                    userId: existingUser._id,
                    customerId: customer.id,
                    package: pricingPlan._id,
                    price: amountPaid,
                    trxId,
                    subscriptionId,
                    currentPeriodStart,
                    currentPeriodEnd,
                    remaining,
                    status: 'active',
               },
               { upsert: true, new: true },
          );

          await User.findByIdAndUpdate(existingUser._id, {
               isSubscribed: true,
               hasAccess: true,
               packageName: pricingPlan.title,
          });
     } catch (error) {
          throw error instanceof AppError ? error : new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error updating subscription status');
     }
};
