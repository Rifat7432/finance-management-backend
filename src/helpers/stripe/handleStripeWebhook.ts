import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { handleSubscriptionCreated } from './handlers/handleSubscriptionCreated';
import { handleSubscriptionDeleted } from './handlers/handleSubscriptionDeleted';
import { handleSubscriptionUpdated } from './handlers/handleSubscriptionUpdated';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../shared/logger';
import config from '../../config';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';
import { User } from '../../app/modules/user/user.model';

const handleStripeWebhook = async (req: Request, res: Response) => {
     const signature = req.headers['stripe-signature'] as string;
     const webhookSecret = config.stripe.stripe_webhook_secret as string;

     let event: Stripe.Event;

     try {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
     } catch (error) {
          logger.error(`Webhook signature verification failed: ${error}`);
          return res.status(400).send(`Webhook error: ${(error as Error).message}`);
     }

     const eventType = event.type;
     const data = event.data.object as Stripe.Subscription | Stripe.Account;

     logger.info(colors.cyan(`Received Stripe event: ${eventType}`));

     try {
          switch (eventType) {
               case 'customer.subscription.created':
                    await handleSubscriptionCreated(data as Stripe.Subscription);
                    break;

               case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(data as Stripe.Subscription);
                    break;

               case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(data as Stripe.Subscription);
                    break;
               case 'payment_intent.payment_failed': {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    const customerId = paymentIntent.customer as string;
                    // Optional: find the user and notify or mark failure
                    const user = await User.findOne({ stripeCustomerId: customerId });

                    if (user) {
                         // Mark something like "lastPaymentStatus = failed"
                         await User.findByIdAndUpdate(user._id, {
                              lastPaymentStatus: 'failed',
                              isSubscribed: false,
                              hasAccess: false,
                         });

                         // Optional: send notification or alert to user
                    }

                    break;
               }
               default:
                    logger.warn(colors.bgYellow.black(`Unhandled event type: ${eventType}`));
          }

          res.sendStatus(200);
     } catch (error) {
          logger.error(`Stripe webhook processing error: ${error}`);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Webhook processing failed');
     }
};

export default handleStripeWebhook;
