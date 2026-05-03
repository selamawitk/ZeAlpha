import stripe from '../config/stripe.js';

export const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true }
  });
  return paymentIntent;
};

export const constructEvent = (rawBody, signature) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};
