import Payment from '../models/Payment.js';
import { createPaymentIntent } from '../services/stripeService.js';

export const createStripeIntent = async (req, res) => {
  const { giftId, amount, currency = 'usd', guestId } = req.body;
  if (!giftId || !amount) {
    return res.status(400).json({ message: 'giftId and amount are required' });
  }

  const paymentIntent = await createPaymentIntent({
    amount,
    currency,
    metadata: { giftId, guestId: guestId || req.user._id }
  });

  res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
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
