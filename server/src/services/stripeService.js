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

export const createCheckoutSession = async ({ amount, currency = 'etb', successUrl, cancelUrl, metadata = {} }) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: metadata.giftName || 'Wedding Gift Contribution',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
  return session;
};

export const constructEvent = (rawBody, signature) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};
