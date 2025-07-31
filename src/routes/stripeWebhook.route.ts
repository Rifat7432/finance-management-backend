// src/routes/stripeWebhook.route.ts
import express from 'express';
import handleStripeWebhook from '../helpers/stripe/handleStripeWebhook';


const router = express.Router();

// Stripe requires raw body for signature verification
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export const stripeWebhookRoute = router;