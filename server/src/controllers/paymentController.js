import Payment from '../models/Payment.js';
import { createPaymentIntent, createCheckoutSession } from '../services/stripeService.js';

export const createStripeIntent = async (req, res) => {
  const { giftId, amount, currency = 'usd', guestId, contributionId } = req.body;
  if (!giftId || !amount) {
    return res.status(400).json({ message: 'giftId and amount are required' });
  }

  const paymentIntent = await createPaymentIntent({
    amount,
    currency,
    metadata: { giftId, guestId: guestId || req.user?._id || '', contributionId: contributionId || '' }
  });

  res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
};

export const createStripeCheckout = async (req, res) => {
  const { giftId, giftName, amount, currency = 'usd' } = req.body;
  if (!giftId || !amount) {
    return res.status(400).json({ message: 'giftId and amount are required' });
  }

  const Gift = (await import('../models/Gift.js')).default;
  const gift = await Gift.findById(giftId);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });
  if (gift.status !== 'open') return res.status(400).json({ message: 'Gift is not open for contributions' });

  const remaining = gift.totalPrice - gift.currentCollected;
  if (amount > remaining) {
    return res.status(400).json({ message: `Only ${remaining} ETB is remaining for this gift` });
  }

  // Atomically lock the gift for 30 minutes to prevent double-allocation during checkout
  const lockedGift = await Gift.findOneAndUpdate(
    {
      _id: giftId,
      status: 'open',
      $or: [
        { isLocked: false },
        { lockedUntil: { $lt: new Date() } }
      ]
    },
    {
      $set: {
        isLocked: true,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
        lockedBy: req.user?._id || null
      }
    },
    { new: true }
  );

  if (!lockedGift) {
    return res.status(409).json({ message: 'Gift is reserved by another guest' });
  }

  const origin = process.env.CLIENT_URL || 'http://localhost:5173';
  const weddingId = gift.weddingId?._id || gift.weddingId;
  const session = await createCheckoutSession({
    amount,
    currency,
    successUrl: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}&gift_id=${giftId}`,
    cancelUrl: `${origin}/thank-you?cancelled=true&gift_id=${giftId}`,
    metadata: {
      giftId,
      weddingId: String(weddingId),
      giftName: giftName || 'Wedding Gift',
      guestId: req.user?._id?.toString() || 'guest',
    },
  });

  res.json({ url: session.url, sessionId: session.id });
};

export const createPaymentRecord = async (req, res) => {
  const { giftId, amount, method, transactionId, guestId } = req.body;
  const payment = await Payment.create({
    giftId,
    guestId: guestId || req.user._id,
    amount,
    method,
    status: 'pending',
    transactionId
  });
  res.status(201).json(payment);
};

export const getPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate('giftId', 'name totalPrice')
    .populate('guestId', 'name email');
  res.json(payments);
};

export const updatePaymentStatus = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  payment.status = req.body.status || payment.status;
  if (req.body.method) payment.method = req.body.method;
  await payment.save();
  res.json(payment);
};
