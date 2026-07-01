import { constructEvent } from '../services/stripeService.js';
import Payment from '../models/Payment.js';
import Contribution from '../models/Contribution.js';
import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import User from '../models/User.js';
import { createDigitalCard } from '../utils/digitalCard.js';
import { emitGiftUpdate, emitNewContribution, emitActivity, emitNotification } from '../services/socketService.js';
import { sendGiftReceipt, sendWeddingFundedAlert } from '../services/emailService.js';
import Notification from '../models/Notification.js';
import { resolveWedding } from '../utils/weddingResolver.js';

const saveNotif = async (data) => {
  try {
    const n = await Notification.create(data);
    emitNotification(n);
    return n;
  } catch (err) {
    console.error('Failed to create notification:', err.message, data);
  }
};

const safeEmit = (fn) => {
  try { fn(); } catch (err) { console.error('Emit error:', err.message); }
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructEvent(req.body, signature);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  const paymentIntent = event.data.object;
  console.log(`Webhook received: ${event.type} for ${event.type === 'checkout.session.completed' ? `session ${paymentIntent.id}` : `pi ${paymentIntent.id}`}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { giftId, giftName, guestId, guestName, guestEmail, guestPhone, message } = session.metadata;
    const amount = session.amount_total / 100;
    const transactionId = session.payment_intent;

    if (!giftId || !transactionId) {
      console.error('Missing giftId or transactionId in checkout.session.completed');
      return res.json({ received: true });
    }

    const existingContribution = await Contribution.findOne({ transactionId });
    if (existingContribution) {
      console.log('Contribution already exists for transaction', transactionId);
      return res.json({ received: true });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      console.error('Gift not found for checkout session:', giftId);
      return res.json({ received: true });
    }

    const weddingRes = await resolveWedding(gift.weddingId);

    const contributorEntry = {
      guestId: guestId !== 'guest' ? guestId : null,
      name: guestName || session.customer_details?.name || session.customer_email || 'Guest',
      phone: guestPhone || '',
      amount,
      message: message || '',
      isAnonymous: false,
      timestamp: new Date()
    };

    const willComplete = gift.currentCollected + amount >= gift.totalPrice;

    const updatedGift = await Gift.findOneAndUpdate(
      { _id: giftId, currentCollected: { $lte: gift.totalPrice - amount } },
      {
        $inc: { currentCollected: amount },
        $push: { contributors: contributorEntry },
        $set: willComplete ? {
          status: 'fullyFunded',
          isLocked: false,
          lockedUntil: null,
          lockedBy: null
        } : { isLocked: false, lockedUntil: null, lockedBy: null }
      },
      { new: true }
    );

    if (!updatedGift) {
      console.error('Gift update failed — concurrency/overfunding issue:', { giftId, amount, currentCollected: gift.currentCollected, totalPrice: gift.totalPrice });
      return res.json({ received: true });
    }

    await Contribution.create({
      guestId: guestId !== 'guest' ? guestId : null,
      giftId,
      weddingId: gift.weddingId,
      amount,
      guestPhone: guestPhone || '',
      message: message || '',
      paymentMethod: 'stripe',
      transactionId,
      status: 'completed',
    });

    await Payment.create({
      guestId: guestId !== 'guest' ? guestId : null,
      giftId,
      amount,
      method: 'stripe',
      status: 'completed',
      transactionId
    });

    const wedding = weddingRes;
    if (wedding) {
      wedding.stats.totalRaised = (wedding.stats.totalRaised || 0) + amount;
      await wedding.save().catch(err => console.error('Wedding stats save error:', err));
    }

    // Email receipts
    safeEmit(async () => {
      try {
        const receiptEmail = guestEmail || session.customer_details?.email || session.customer_email;
        if (receiptEmail) {
          await sendGiftReceipt(receiptEmail, contributorEntry.name, amount, updatedGift.name, updatedGift.digitalCardUrl);
        }
        if (willComplete && weddingRes?.couple) {
          const couple = await User.findById(weddingRes.couple);
          if (couple?.email) {
            await sendWeddingFundedAlert(couple.email, updatedGift.name, updatedGift.totalPrice);
          }
        }
      } catch (err) {
        console.error('Checkout email error:', err);
      }
    });

    // Surge detection
    if (updatedGift.currentCollected >= updatedGift.totalPrice * 0.8) {
      try {
        const { emitGiftSurge } = await import('../services/socketService.js');
        emitGiftSurge(updatedGift);
      } catch (err) {
        console.error('Surge detection error:', err);
      }
    }

    emitGiftUpdate(updatedGift);
    emitNewContribution({ giftId, weddingId: gift.weddingId, amount, guestName: contributorEntry.name });

    safeEmit(() => emitActivity({
      weddingId: String(gift.weddingId),
      title: `${contributorEntry.name} contributed to ${giftName || gift.name}`,
      message: `${contributorEntry.name} added ${amount} ETB`,
      type: 'contribution',
      timestamp: new Date()
    }));

    // Notify couple
    const coupleId = weddingRes?.couple;
    if (coupleId) {
      await saveNotif({
        recipient: coupleId,
        weddingId: gift.weddingId,
        type: 'contribution',
        title: 'New contribution received',
        message: `${contributorEntry.name} contributed ${amount} ETB to ${giftName || gift.name}`,
        link: '/dashboard'
      });
    }

    // Notify contributor (logged-in guests only)
    if (guestId && guestId !== 'guest') {
      await saveNotif({
        recipient: guestId,
        weddingId: gift.weddingId,
        type: 'contribution',
        title: 'Payment Successful',
        message: `Your contribution of ${amount} ETB to ${giftName || gift.name} was successful.`,
        link: '/guest'
      });
    }

    // Handle fully funded
    if (willComplete) {
      const digitalCardData = createDigitalCard(
        updatedGift.toObject(),
        weddingRes,
        updatedGift.contributors
      );
      await Gift.findByIdAndUpdate(updatedGift._id, { digitalCardData, digitalCardUrl: `/api/gifts/${updatedGift._id}/digital-card` }).catch(err => console.error('Digital card save error:', err));

      await saveNotif({
        recipient: coupleId,
        weddingId: gift.weddingId,
        type: 'gift_completed',
        title: `${giftName || gift.name} Fully Funded!`,
        message: `Your gift "${giftName || gift.name}" has reached 100% funding with ${updatedGift.currentCollected} ETB.`,
        link: '/dashboard'
      });

      safeEmit(() => emitActivity({
        weddingId: String(gift.weddingId),
        title: `${giftName || gift.name} fully funded`,
        message: `${giftName || gift.name} reached 100% funding (${updatedGift.currentCollected} ETB).`,
        type: 'gift_completed',
        timestamp: new Date()
      }));

      if (guestId && guestId !== 'guest') {
        await saveNotif({
          recipient: guestId,
          weddingId: gift.weddingId,
          type: 'gift_completed',
          title: `You helped complete ${giftName || gift.name}!`,
          message: `Your contribution helped fully fund "${giftName || gift.name}". Thank you!`,
          link: '/guest'
        });
      }

      // Auto-create vendor order
      if (updatedGift.fulfillmentPreference === 'vendor') {
        try {
          const VendorProduct = (await import('../models/VendorProduct.js')).default;
          const VendorOrder = (await import('../models/VendorOrder.js')).default;
          const product = updatedGift.vendorProductId
            ? await VendorProduct.findById(updatedGift.vendorProductId)
            : null;
          if (product) {
            const order = await VendorOrder.create({
              wedding: gift.weddingId,
              gift: updatedGift._id,
              vendor: product.vendorId,
              product: product._id,
              couple: coupleId,
              fundedAmount: updatedGift.currentCollected,
              productPrice: product.price,
              status: 'pending',
            });
            const populated = await VendorOrder.findById(order._id)
              .populate('wedding', 'weddingName')
              .populate('gift', 'name')
              .populate('vendor', 'name')
              .populate('product', 'name');
            if (populated) {
              const { emitVendorOrderUpdate } = await import('../services/socketService.js');
              const oNotify = { recipient: coupleId, weddingId: gift.weddingId, type: 'order_created', title: 'Vendor Order Created', message: `Your order for ${updatedGift.name} has been placed with ${populated.vendor?.name || 'vendor'}.`, link: '/dashboard/fulfillment' };
              await saveNotif(oNotify);
              safeEmit(() => emitActivity({ weddingId: String(gift.weddingId), title: `${updatedGift.name} order created`, message: `A vendor order was created automatically for ${updatedGift.name}.`, type: 'order_created', timestamp: new Date() }));
              emitVendorOrderUpdate(populated);
            }
          }
        } catch (err) {
          console.error('Vendor order creation failed:', err);
        }
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const transactionId = paymentIntent.id;
    try {
      const existingContribution = await Contribution.findOne({ transactionId });
      if (existingContribution) {
        return res.json({ received: true });
      }
      await Payment.findOneAndUpdate({ transactionId }, { status: 'completed' }, { upsert: true }).catch(() => {});
    } catch (err) {
      console.error('payment_intent.succeeded handler error:', err);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const transactionId = paymentIntent.id;
    try {
      await Payment.findOneAndUpdate({ transactionId }, { status: 'failed' }).catch(() => {});
      if (paymentIntent.metadata.contributionId) {
        await Contribution.findByIdAndUpdate(paymentIntent.metadata.contributionId, { status: 'failed' }).catch(() => {});
      }
    } catch (err) {
      console.error('payment_intent.payment_failed handler error:', err);
    }
  }

  res.json({ received: true });
};
