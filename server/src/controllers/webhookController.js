import { constructEvent } from '../services/stripeService.js';
import Payment from '../models/Payment.js';
import Contribution from '../models/Contribution.js';
import Gift from '../models/Gift.js';
import { emitGiftUpdate } from '../services/socketService.js';

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructEvent(req.body, signature);
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  const paymentIntent = event.data.object;

  if (event.type === 'payment_intent.succeeded') {
    const transactionId = paymentIntent.id;
    const { giftId, contributionId } = paymentIntent.metadata;

    // 1. Update Payment
    await Payment.findOneAndUpdate({ transactionId }, { status: 'completed' });

    // 2. Update Contribution status
    if (contributionId) {
      await Contribution.findByIdAndUpdate(contributionId, { status: 'completed' });
    }

    // 3. IMPORTANT: Update Gift and trigger "fully funded" check
    if (giftId) {
      const gift = await Gift.findById(giftId);
      if (gift) {
        // Trigger real-time updates and funding checks
        if (gift.currentCollected >= gift.totalPrice) {
          gift.status = 'fullyFunded';
          await gift.save();
        }
        emitGiftUpdate(gift);
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const transactionId = paymentIntent.id;
    await Payment.findOneAndUpdate({ transactionId }, { status: 'failed' });
    
    if (paymentIntent.metadata.contributionId) {
      await Contribution.findByIdAndUpdate(paymentIntent.metadata.contributionId, { status: 'failed' });
    }
  }

  res.json({ received: true });
};