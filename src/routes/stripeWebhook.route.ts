// src/routes/stripeWebhook.route.ts
import express from 'express';
import handleStripeWebhook from '../helpers/stripe/handleStripeWebhook';




const router = express.Router();

// Stripe requires raw body for signature verification
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      await handleStripeWebhook(req, res);
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

export const stripeWebhookRoute = router;