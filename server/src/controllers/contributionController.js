import Gift from '../models/Gift.js';
import Contribution from '../models/Contribution.js';
import Payment from '../models/Payment.js';
import Wedding from '../models/Wedding.js';
import User from '../models/User.js';
import { emitGiftUpdate, emitActivity, emitNotification, emitNewContribution, emitVendorOrderUpdate, emitGiftSurge } from '../services/socketService.js';
import { createDigitalCard } from '../utils/digitalCard.js';
import { sendGiftReceipt, sendWeddingFundedAlert } from '../services/emailService.js';
import Notification from '../models/Notification.js';
import VendorOrder from '../models/VendorOrder.js';

const CONTRIBUTION_METHODS = ['stripe', 'bank_transfer'];

export const createContribution = async (req, res) => {
  const { giftId, amount, paymentMethod, transactionId, message, isAnonymous, screenshotUrl, guestName, guestPhone } = req.body;

  if (!giftId || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'giftId, amount, and paymentMethod are required' });
  }

  if (!CONTRIBUTION_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' });
  }

  if (paymentMethod === 'bank_transfer' && !screenshotUrl) {
    return res.status(400).json({ message: 'A payment screenshot is required for manual payments' });
  }

  const gift = await Gift.findById(giftId).populate('weddingId');
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

  if (transactionId) {
    const existingContribution = await Contribution.findOne({ transactionId });
    if (existingContribution) {
      return res.status(409).json({ message: 'This transaction has already been processed' });
    }
  }

  if (gift.status !== 'open') {
    return res.status(400).json({ message: 'Gift is not open for contributions' });
  }

  const now = new Date();
  if (gift.isLocked && gift.lockedUntil && gift.lockedUntil > now) {
    return res.status(400).json({ message: 'Gift is reserved by another guest' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Contribution amount must be greater than zero' });
  }

  if (gift.type === 'individual' && gift.currentCollected > 0) {
    return res.status(400).json({ message: 'This gift has already been claimed' });
  }

  const remaining = gift.totalPrice - gift.currentCollected;
  if (amount > remaining) {
    return res.status(400).json({ message: `Only ${remaining} ETB is remaining for this gift` });
  }

  const guestUserId = req.user ? req.user._id : null;
  const contributorName = (guestName || '').trim().slice(0, 100) || (req.user ? req.user.name : 'Guest');

  const contributorEntry = {
    guestId: guestUserId || null,
    name: contributorName,
    phone: guestPhone,
    amount,
    message,
    isAnonymous: !!isAnonymous
  };

  const willCompleteGift = gift.currentCollected + amount >= gift.totalPrice;
  const weddingForCard = gift.weddingId;
  const digitalCardData = willCompleteGift
    ? createDigitalCard(
        { ...gift.toObject(), currentCollected: gift.currentCollected + amount, contributors: [...gift.contributors, contributorEntry] },
        weddingForCard,
        [...gift.contributors, contributorEntry]
      )
    : undefined;

  const updatePayload = {
    $inc: { currentCollected: amount },
    $push: { contributors: contributorEntry },
    $set: { isLocked: false, lockedUntil: null }
  };

  if (willCompleteGift) {
    updatePayload.$set.status = 'fullyFunded';
    updatePayload.$set.digitalCardData = digitalCardData;
    updatePayload.$set.digitalCardUrl = `/api/gifts/${gift._id}/digital-card`;
  }

  const filter = {
    _id: giftId,
    status: 'open',
    isLocked: false,
    currentCollected: { $lte: gift.totalPrice - amount }
  };
  if (gift.type === 'individual') {
    filter.currentCollected = 0;
  }

  const updatedGift = await Gift.findOneAndUpdate(filter, updatePayload, { new: true });
  if (!updatedGift) {
    return res.status(409).json({ message: 'Contribution failed due to concurrent update or gift state change.' });
  }

  const isInstant = paymentMethod === 'stripe';
  const contribution = await Contribution.create({
    guestId: guestUserId,
    giftId: gift._id,
    weddingId: gift.weddingId._id || gift.weddingId,
    amount,
    message,
    guestPhone,
    paymentMethod,
    screenshotUrl,
    transactionId,
    status: isInstant ? 'completed' : 'pending',
    isAnonymous: !!isAnonymous
  });

  await Payment.create({
    guestId: guestUserId,
    giftId: gift._id,
    amount,
    method: paymentMethod,
    status: isInstant ? 'completed' : 'pending',
    transactionId
  });

  const wedding = gift.weddingId;
  if (wedding && isInstant) {
    wedding.stats.totalRaised += amount;
    if (guestUserId) {
      const hasPreviousContribution = await Contribution.exists({
        weddingId: wedding._id,
        guestId: guestUserId,
        status: 'completed',
        _id: { $ne: contribution._id }
      });
      if (!hasPreviousContribution) {
        wedding.stats.guestCount += 1;
      }
    }
    await wedding.save();
  }

  if (isInstant) {
    try {
      if (req.user && req.user.email) {
        await sendGiftReceipt(req.user.email, req.user.name, amount, updatedGift.name, updatedGift.digitalCardUrl);
      }
      if (willCompleteGift) {
        const couple = await User.findById(gift.weddingId.couple);
        if (couple) await sendWeddingFundedAlert(couple.email, updatedGift.name, updatedGift.totalPrice);
      }
    } catch (err) {
      console.error('Email delivery failed:', err);
    }
  }

  const progressPercentage = Math.round((updatedGift.currentCollected / updatedGift.totalPrice) * 100);
  const activity = {
    weddingId: String(updatedGift.weddingId),
    title: `${contributorName} contributed to ${updatedGift.name}`,
    message: `${contributorName} added ${amount} ETB (${progressPercentage}% funded)`,
    type: 'contribution',
    timestamp: new Date()
  };

  emitGiftUpdate(updatedGift);

  // Surge detection - emit surge if gift > 80% funded
  const surgeThreshold = updatedGift.totalPrice * 0.8;
  if (updatedGift.currentCollected >= surgeThreshold && updatedGift.status === 'open') {
    emitGiftSurge(updatedGift);
  }

  emitNewContribution(contribution);
  emitActivity(activity);

  // Save notification to DB
  await Notification.create({
    recipient: gift.weddingId.couple,
    weddingId: gift.weddingId._id || updatedGift.weddingId,
    type: 'contribution',
    title: 'New contribution',
    message: `${contributorName} contributed ${amount} ETB to ${updatedGift.name}`,
    link: `/dashboard`
  });

  emitNotification({
    recipient: gift.weddingId.couple,
    weddingId: gift.weddingId._id || updatedGift.weddingId,
    type: 'contribution',
    title: 'New contribution',
    message: `${contributorName} contributed ${amount} ETB to ${updatedGift.name}`,
    link: `/dashboard`
  });

  // Gift completion notification
  if (willCompleteGift) {
    const completionNotify = {
      recipient: gift.weddingId.couple,
      weddingId: gift.weddingId._id || updatedGift.weddingId,
      type: 'gift_completed',
      title: `${updatedGift.name} Fully Funded!`,
      message: `Your gift "${updatedGift.name}" has reached 100% funding with ${updatedGift.currentCollected} ETB.`,
      link: '/dashboard',
    };
    await Notification.create(completionNotify);
    emitNotification(completionNotify);
    emitActivity({
      weddingId: String(updatedGift.weddingId),
      title: `${updatedGift.name} fully funded`,
      message: `${updatedGift.name} reached 100% funding (${updatedGift.currentCollected} ETB).`,
      type: 'gift_completed',
      timestamp: new Date(),
    });
    if (guestUserId) {
      const contributorNotify = {
        recipient: guestUserId,
        weddingId: gift.weddingId._id || updatedGift.weddingId,
        type: 'gift_completed',
        title: `You helped complete ${updatedGift.name}!`,
        message: `Your contribution helped fully fund "${updatedGift.name}". Thank you!`,
        link: `/w/${weddingForCard?.slug || ''}`,
      };
      await Notification.create(contributorNotify);
      emitNotification(contributorNotify);
    }
  }

  // Auto-create vendor order if gift fully funded and preference is vendor
  if (willCompleteGift && updatedGift.fulfillmentPreference === 'vendor') {
    try {
      const VendorProduct = (await import('../models/VendorProduct.js')).default;
      const product = updatedGift.vendorProductId
        ? await VendorProduct.findById(updatedGift.vendorProductId)
        : null;
      if (product) {
        const order = await VendorOrder.create({
          wedding: gift.weddingId._id || updatedGift.weddingId,
          gift: updatedGift._id,
          vendor: product.vendorId,
          product: product._id,
          couple: gift.weddingId.couple,
          fundedAmount: updatedGift.currentCollected,
          productPrice: product.price,
          status: 'pending',
        });
        const populated = await VendorOrder.findById(order._id)
          .populate('wedding', 'weddingName')
          .populate('gift', 'name')
          .populate('vendor', 'name')
          .populate('product', 'name');

        const notifyData = {
          recipient: gift.weddingId.couple,
          weddingId: gift.weddingId._id || updatedGift.weddingId,
          type: 'order_created',
          title: 'Vendor Order Created',
          message: `Your order for ${updatedGift.name} has been placed with ${populated.vendor?.name || 'vendor'}.`,
          link: '/dashboard/fulfillment',
        };
        await Notification.create(notifyData);
        emitNotification(notifyData);
        emitActivity({
          weddingId: String(updatedGift.weddingId),
          title: `${updatedGift.name} order created`,
          message: `A vendor order was created automatically for ${updatedGift.name}.`,
          type: 'order_created',
          timestamp: new Date(),
        });
        emitVendorOrderUpdate(populated);
      }
    } catch (err) {
      console.error('Auto vendor order creation failed:', err);
    }
  }

  res.status(201).json({ gift: updatedGift, contribution });
};

export const getContributionById = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id)
    .populate('giftId', 'name totalPrice')
    .populate('guestId', 'name email')
    .populate('weddingId', 'weddingName');

  if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

  if (req.user.role !== 'admin' && contribution.guestId && contribution.guestId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to access this contribution' });
  }

  res.json(contribution);
};

export const updateContributionStatus = async (req, res) => {
  const { status } = req.body;
  const contribution = await Contribution.findById(req.params.id)
    .populate('guestId', 'name email')
    .populate('giftId')
    .populate('weddingId');

  if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

  const oldStatus = contribution.status;
  if (oldStatus === status) {
    return res.status(400).json({ message: 'Contribution already has that status' });
  }

  contribution.status = status;
  await contribution.save();

  if (status === 'completed' && oldStatus !== 'completed') {
    const updatedGift = await Gift.findById(contribution.giftId._id).populate('weddingId');
    if (!updatedGift) return res.status(404).json({ message: 'Gift not found' });

    const giftJustCompleted = updatedGift.currentCollected >= updatedGift.totalPrice && updatedGift.status !== 'fullyFunded';
    if (giftJustCompleted) {
      updatedGift.status = 'fullyFunded';
      const wedding = contribution.weddingId?._id
        ? contribution.weddingId
        : await Wedding.findById(contribution.weddingId);
      if (wedding) {
        const digitalCardData = createDigitalCard(updatedGift.toObject(), wedding, updatedGift.contributors);
        updatedGift.digitalCardData = digitalCardData;
        updatedGift.digitalCardUrl = `/api/gifts/${updatedGift._id}/digital-card`;
      }
      await updatedGift.save();

      const completionNotify = {
        recipient: updatedGift.weddingId.couple,
        weddingId: updatedGift.weddingId._id,
        type: 'gift_completed',
        title: `${updatedGift.name} Fully Funded!`,
        message: `Your gift "${updatedGift.name}" has reached 100% funding with ${updatedGift.currentCollected} ETB.`,
        link: '/dashboard',
      };
      await Notification.create(completionNotify);
      emitNotification(completionNotify);
      emitActivity({
        weddingId: String(updatedGift.weddingId._id),
        title: `${updatedGift.name} fully funded`,
        message: `${updatedGift.name} reached 100% funding (${updatedGift.currentCollected} ETB).`,
        type: 'gift_completed',
        timestamp: new Date(),
      });
      if (contribution.guestId?._id) {
        const contributorNotify = {
          recipient: contribution.guestId._id,
          weddingId: updatedGift.weddingId._id,
          type: 'gift_completed',
          title: `You helped complete ${updatedGift.name}!`,
          message: `Your contribution helped fully fund "${updatedGift.name}". Thank you!`,
          link: '/guest',
        };
        await Notification.create(contributorNotify);
        emitNotification(contributorNotify);
      }
    }

    try {
      if (contribution.guestId) {
        await sendGiftReceipt(contribution.guestId.email, contribution.guestId.name, contribution.amount, updatedGift.name, updatedGift.digitalCardUrl);
        if (updatedGift.currentCollected >= updatedGift.totalPrice) {
          const couple = await User.findById(contribution.weddingId.couple);
          if (couple) await sendWeddingFundedAlert(couple.email, updatedGift.name, updatedGift.totalPrice);
        }
        emitGiftUpdate(updatedGift);
      }
    } catch (err) {
      console.error('Manual verification email failed:', err);
    }

    const wedding = await Wedding.findById(contribution.weddingId._id);
    if (wedding) {
      wedding.stats.totalRaised += contribution.amount;
      if (contribution.guestId) {
        const hasOtherCompleted = await Contribution.exists({
          weddingId: wedding._id,
          guestId: contribution.guestId._id,
          status: 'completed',
          _id: { $ne: contribution._id }
        });
        if (!hasOtherCompleted) wedding.stats.guestCount += 1;
      }
      await wedding.save();
    }

    if (updatedGift.currentCollected >= updatedGift.totalPrice && updatedGift.fulfillmentPreference === 'vendor') {
      try {
        const VendorProduct = (await import('../models/VendorProduct.js')).default;
        const product = updatedGift.vendorProductId
          ? await VendorProduct.findById(updatedGift.vendorProductId)
          : null;
        if (product) {
          const order = await VendorOrder.create({
            wedding: updatedGift.weddingId._id,
            gift: updatedGift._id,
            vendor: product.vendorId,
            product: product._id,
            couple: updatedGift.weddingId.couple,
            fundedAmount: updatedGift.currentCollected,
            productPrice: product.price,
            status: 'pending',
          });
          const populated = await VendorOrder.findById(order._id)
            .populate('wedding', 'weddingName')
            .populate('gift', 'name')
            .populate('vendor', 'name')
            .populate('product', 'name');

          const notifyData = {
            recipient: updatedGift.weddingId.couple,
            weddingId: updatedGift.weddingId._id,
            type: 'order_created',
            title: 'Vendor Order Created',
            message: `Your order for ${updatedGift.name} has been placed with ${populated.vendor?.name || 'vendor'}.`,
            link: '/dashboard/fulfillment',
          };
          await Notification.create(notifyData);
          emitNotification(notifyData);
          emitActivity({
            weddingId: String(updatedGift.weddingId._id),
            title: `${updatedGift.name} order created`,
            message: `A vendor order was created automatically for ${updatedGift.name}.`,
            type: 'order_created',
            timestamp: new Date(),
          });
          emitVendorOrderUpdate(populated);
        }
      } catch (err) {
        console.error('Auto vendor order creation (manual verify) failed:', err);
      }
    }
  }

  emitNewContribution(contribution);
  res.json(contribution);
};

export const getContributions = async (req, res) => {
  const query = {};
  if (req.user.role !== 'admin') {
    query.guestId = req.user._id;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.giftId) {
    query.giftId = req.query.giftId;
  }
  if (req.query.weddingId) {
    query.weddingId = req.query.weddingId;
  }

  const contributions = await Contribution.find(query)
    .populate('giftId', 'name totalPrice')
    .populate('guestId', 'name email');
  res.json(contributions);
};



export const refundContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

  if (contribution.status === 'refunded') {
    return res.status(400).json({ message: 'This contribution has already been refunded' });
  }

  // Attempt Stripe refund if applicable
  if (contribution.paymentMethod === 'stripe' && contribution.transactionId) {
    try {
      const stripe = (await import('../config/stripe.js')).default;
      if (stripe) {
        await stripe.refunds.create({ payment_intent: contribution.transactionId });
      }
    } catch (err) {
      console.error('Stripe refund failed:', err);
    }
  }

  const gift = await Gift.findById(contribution.giftId);
  if (gift) {
    gift.currentCollected = Math.max(0, gift.currentCollected - contribution.amount);
    gift.contributors = gift.contributors.filter(
      c => !(c.guestId && contribution.guestId && c.guestId.toString() === contribution.guestId.toString() && c.amount === contribution.amount)
    );

    if (gift.currentCollected < gift.totalPrice) {
      gift.status = 'open';
      gift.digitalCardData = undefined;
      gift.digitalCardUrl = undefined;
    }

    await gift.save();
    emitGiftUpdate(gift);
  }

  const wedding = await Wedding.findById(contribution.weddingId);
  if (wedding) {
    wedding.stats.totalRaised = Math.max(0, wedding.stats.totalRaised - contribution.amount);
    const otherContributionsExist = await Contribution.exists({
      weddingId: wedding._id,
      guestId: contribution.guestId,
      status: 'completed',
      _id: { $ne: contribution._id }
    });

    if (!otherContributionsExist) {
      wedding.stats.guestCount = Math.max(0, wedding.stats.guestCount - 1);
    }
    await wedding.save();
  }

  contribution.status = 'refunded';
  await contribution.save();

  res.json({ message: 'Contribution refunded and gift totals adjusted', contribution });
};

export const downloadReceipt = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id)
      .populate('giftId', 'name totalPrice')
      .populate('weddingId', 'weddingName weddingDate')
      .populate('guestId', 'name email');

    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

    if (req.user.role !== 'admin' && contribution.guestId && contribution.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this receipt' });
    }

    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>ZeAlpha Receipt</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #2d2218; }
  .header { text-align: center; border-bottom: 2px solid #B8860B; padding-bottom: 20px; margin-bottom: 20px; }
  .header h1 { color: #B8860B; margin: 0; font-size: 28px; }
  .header p { color: #6f6257; margin: 4px 0 0; }
  .details { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .details td { padding: 8px 12px; border-bottom: 1px solid #e7d6c1; }
  .details td:first-child { font-weight: 600; color: #6f6257; width: 140px; }
  .amount { font-size: 24px; font-weight: 700; color: #B8860B; text-align: center; padding: 16px; }
  .footer { text-align: center; margin-top: 30px; color: #6f6257; font-size: 12px; border-top: 1px solid #e7d6c1; padding-top: 16px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .status-completed { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
</style></head>
<body>
  <div class="header">
    <h1>ZeAlpha</h1>
    <p>Wedding Gift Contribution Receipt</p>
  </div>
  <table class="details">
    <tr><td>Receipt #</td><td>${contribution._id}</td></tr>
    <tr><td>Date</td><td>${new Date(contribution.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
    <tr><td>Wedding</td><td>${contribution.weddingId?.weddingName || 'N/A'}</td></tr>
    <tr><td>Gift</td><td>${contribution.giftId?.name || 'N/A'}</td></tr>
    <tr><td>Contributor</td><td>${contribution.guestId?.name || 'Guest'}</td></tr>
    <tr><td>Email</td><td>${contribution.guestId?.email || 'N/A'}</td></tr>
    <tr><td>Payment Method</td><td>${contribution.paymentMethod === 'stripe' ? 'Card (Stripe)' : 'Bank Transfer'}</td></tr>
    <tr><td>Status</td><td><span class="status-badge status-${contribution.status}">${contribution.status}</span></td></tr>
  </table>
  <div class="amount">${contribution.amount.toLocaleString()} ETB</div>
  ${contribution.message ? `<p style="font-style:italic;color:#6f6257;text-align:center">"${contribution.message}"</p>` : ''}
  <div class="footer">
    <p>ZeAlpha — Collaborative Wedding Gifts</p>
    <p>Thank you for your contribution!</p>
  </div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${contribution._id}.html`);
    res.send(receiptHtml);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};

export const getMyContributions = async (req, res) => {
  try {
    const query = { guestId: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.giftId) query.giftId = req.query.giftId;

    const contributions = await Contribution.find(query)
      .populate('giftId', 'name totalPrice imageUrl')
      .populate('weddingId', 'weddingName slug')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};