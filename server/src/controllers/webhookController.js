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
    const { giftId, contributionId, guestId } = paymentIntent.metadata;

    // Idempotency guard: skip if a Contribution with this transactionId already exists
    const existingContribution = await Contribution.findOne({ transactionId });
    if (existingContribution) {
      return res.json({ received: true });
    }

    await Payment.findOneAndUpdate({ transactionId }, { status: 'completed' }, { upsert: true });

    if (contributionId) {
      const existingContrib = await Contribution.findById(contributionId);
      if (existingContrib && existingContrib.status === 'completed') {
        return res.json({ received: true });
      }
      await Contribution.findByIdAndUpdate(contributionId, { status: 'completed', transactionId });
    }

    if (giftId && contributionId) {
      const contribution = await Contribution.findById(contributionId)
        .populate('guestId', 'name email')
        .populate('giftId')
        .populate('weddingId');

      if (contribution && contribution.giftId) {
        const gift = await Gift.findById(giftId);
        if (gift) {
          const weddingRes = await resolveWedding(gift.weddingId);
          const wasJustCompleted = gift.currentCollected >= gift.totalPrice && gift.status !== 'fullyFunded';
          if (wasJustCompleted) {
            gift.status = 'fullyFunded';
            const digitalCardData = createDigitalCard(
              gift.toObject(),
              contribution.weddingId,
              gift.contributors
            );
            gift.digitalCardData = digitalCardData;
            gift.digitalCardUrl = `/api/gifts/${gift._id}/digital-card`;
          }
          await gift.save();
          emitGiftUpdate(gift);

          if (wasJustCompleted) {
            const coupleId = weddingRes?.couple || contribution.weddingId?.couple;
            const cNotify = { recipient: coupleId, weddingId: contribution.weddingId?._id || contribution.weddingId, type: 'gift_completed', title: `${gift.name} Fully Funded!`, message: `Your gift "${gift.name}" has reached 100% funding with ${gift.currentCollected} ETB.`, link: '/dashboard' };
            await Notification.create(cNotify);
            emitNotification(cNotify);
            emitActivity({ weddingId: String(contribution.weddingId?._id || contribution.weddingId), title: `${gift.name} fully funded`, message: `${gift.name} reached 100% funding (${gift.currentCollected} ETB).`, type: 'gift_completed', timestamp: new Date() });
            if (contribution.guestId?._id) {
              const gNotify = { recipient: contribution.guestId._id, weddingId: contribution.weddingId?._id || contribution.weddingId, type: 'gift_completed', title: `You helped complete ${gift.name}!`, message: `Your contribution helped fully fund "${gift.name}". Thank you!`, link: '/guest' };
              await Notification.create(gNotify);
              emitNotification(gNotify);
            }
          }
        }

        // Record wedding stats
        const wedding = await Wedding.findById(contribution.weddingId?._id || contribution.weddingId);
        if (wedding) {
          wedding.stats.totalRaised = (wedding.stats.totalRaised || 0) + contribution.amount;
          const hasPreviousContribution = await Contribution.exists({
            weddingId: wedding._id,
            guestId: contribution.guestId,
            status: 'completed',
            _id: { $ne: contribution._id }
          });
          if (!hasPreviousContribution) {
            wedding.stats.guestCount = (wedding.stats.guestCount || 0) + 1;
          }
          await wedding.save();
        }

        // Emit events
        emitNewContribution(contribution);
        emitActivity({
          weddingId: String(contribution.weddingId?._id || contribution.weddingId),
          title: `${contribution.guestId?.name || 'A guest'} contributed to ${contribution.giftId?.name || 'a gift'}`,
          message: `${contribution.guestId?.name || 'A guest'} added ${contribution.amount} ETB`,
          type: 'contribution',
          timestamp: new Date()
        });

        // Create notification for couple
        const coupleId = weddingRes?.couple || contribution.weddingId?.couple;
        if (coupleId) {
          await Notification.create({
            recipient: coupleId,
            weddingId: contribution.weddingId?._id || contribution.weddingId,
            type: 'contribution',
            title: 'New contribution received',
            message: `${contribution.guestId?.name || 'A guest'} contributed ${contribution.amount} ETB to ${contribution.giftId?.name || 'a gift'}`,
            link: '/dashboard'
          });
          emitNotification({
            recipient: coupleId,
            weddingId: contribution.weddingId?._id || contribution.weddingId,
            type: 'contribution',
            title: 'New contribution received',
            message: `${contribution.guestId?.name || 'A guest'} contributed ${contribution.amount} ETB to ${contribution.giftId?.name || 'a gift'}`,
            link: '/dashboard'
          });
        }

        // Send email receipts
        try {
          if (contribution.guestId?.email) {
            await sendGiftReceipt(contribution.guestId.email, contribution.guestId.name, contribution.amount, gift.name, gift.digitalCardUrl);
          }
          if (gift.status === 'fullyFunded' && coupleId) {
            const couple = await User.findById(coupleId);
            if (couple) await sendWeddingFundedAlert(couple.email, gift.name, gift.totalPrice);
          }
        } catch (err) {
          console.error('Webhook email error:', err);
        }
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { giftId, giftName, guestId, guestName, guestPhone, message } = session.metadata;
    const amount = session.amount_total / 100;
    const transactionId = session.payment_intent;

    if (giftId && transactionId) {
      const existingContribution = await Contribution.findOne({ transactionId });
      if (!existingContribution) {
        const gift = await Gift.findById(giftId);
        if (gift) {
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
          if (!updatedGift) return res.status(409).json({ message: 'Gift is reserved or unavailable' });

          const contribution = await Contribution.create({
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
            await wedding.save();
          }

          // Send email receipts
          try {
            const guestEmail = session.customer_details?.email || session.customer_email;
            if (guestEmail) {
              await sendGiftReceipt(guestEmail, contributorEntry.name, amount, updatedGift.name, updatedGift.digitalCardUrl);
            }
            if (willComplete && coupleId) {
              const couple = await User.findById(coupleId);
              if (couple?.email) {
                await sendWeddingFundedAlert(couple.email, updatedGift.name, updatedGift.totalPrice);
              }
            }
          } catch (err) {
            console.error('Checkout email error:', err);
          }

          // Surge detection (reuse updatedGift from atomic update above)
          if (updatedGift && updatedGift.currentCollected >= updatedGift.totalPrice * 0.8) {
            const { emitGiftSurge } = await import('../services/socketService.js');
            emitGiftSurge(updatedGift);
          }

          emitGiftUpdate(updatedGift);
          emitNewContribution(contribution);
          emitActivity({
            weddingId: String(gift.weddingId),
            title: `${contributorEntry.name} contributed to ${giftName || gift.name}`,
            message: `${contributorEntry.name} added ${amount} ETB`,
            type: 'contribution',
            timestamp: new Date()
          });

          const coupleId = weddingRes?.couple;
          if (coupleId) {
            await Notification.create({
              recipient: coupleId,
              weddingId: gift.weddingId,
              type: 'contribution',
              title: 'New contribution received',
              message: `${contributorEntry.name} contributed ${amount} ETB to ${giftName || gift.name}`,
              link: '/dashboard'
            });
          }

          // Notify contributor when their payment succeeds (if logged in)
          if (guestId && guestId !== 'guest') {
            await Notification.create({
              recipient: guestId,
              weddingId: gift.weddingId,
              type: 'contribution',
              title: 'Payment Successful',
              message: `Your contribution of ${amount} ETB to ${giftName || gift.name} was successful.`,
              link: '/guest'
            });
          }

          if (willComplete) {
            const digitalCardData = createDigitalCard(
              updatedGift.toObject(),
              weddingRes,
              updatedGift.contributors
            );
            await Gift.findByIdAndUpdate(updatedGift._id, { digitalCardData, digitalCardUrl: `/api/gifts/${updatedGift._id}/digital-card` });

            const cNotify = { recipient: coupleId, weddingId: gift.weddingId, type: 'gift_completed', title: `${giftName || gift.name} Fully Funded!`, message: `Your gift "${giftName || gift.name}" has reached 100% funding with ${updatedGift.currentCollected} ETB.`, link: '/dashboard' };
            await Notification.create(cNotify);
            emitNotification(cNotify);
            emitActivity({ weddingId: String(gift.weddingId), title: `${giftName || gift.name} fully funded`, message: `${giftName || gift.name} reached 100% funding (${updatedGift.currentCollected} ETB).`, type: 'gift_completed', timestamp: new Date() });
            if (guestId && guestId !== 'guest') {
              const gNotify = { recipient: guestId, weddingId: gift.weddingId, type: 'gift_completed', title: `You helped complete ${giftName || gift.name}!`, message: `Your contribution helped fully fund "${giftName || gift.name}". Thank you!`, link: '/guest' };
              await Notification.create(gNotify);
              emitNotification(gNotify);
            }

            // Auto-create vendor order for vendor-fulfillment gifts
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
                    await Notification.create(oNotify);
                    emitNotification(oNotify);
                    emitActivity({ weddingId: String(gift.weddingId), title: `${updatedGift.name} order created`, message: `A vendor order was created automatically for ${updatedGift.name}.`, type: 'order_created', timestamp: new Date() });
                    emitVendorOrderUpdate(populated);
                  }
                }
              } catch (err) {
                console.error('Webhook vendor order creation failed:', err);
              }
            }
          }
        }
      }
    }
  }

  res.json({ received: true });
};
