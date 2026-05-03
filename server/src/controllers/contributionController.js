import Gift from '../models/Gift.js';
import Contribution from '../models/Contribution.js';
import Payment from '../models/Payment.js';
import Wedding from '../models/Wedding.js';
import User from '../models/User.js';
import { emitGiftUpdate, emitActivity, emitNotification } from '../services/socketService.js';
import { createDigitalCard } from '../utils/digitalCard.js';
import { sendGiftReceipt, sendWeddingFundedAlert } from '../services/emailService.js';

export const createContribution = async (req, res) => {
  const { giftId, amount, paymentMethod, transactionId, message, isAnonymous, screenshotUrl } = req.body;

  if (!giftId || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'giftId, amount, and paymentMethod are required' });
  }

  const gift = await Gift.findById(giftId).populate('weddingId');
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

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

  const contributorEntry = {
    guestId: req.user._id,
    name: req.user.name,
    amount,
    message,
    isAnonymous: !!isAnonymous
  };

  const willCompleteGift = gift.currentCollected + amount >= gift.totalPrice;
  const digitalCardData = willCompleteGift
    ? createDigitalCard(
        { ...gift.toObject(), currentCollected: gift.currentCollected + amount, contributors: [...gift.contributors, contributorEntry] },
        gift.weddingId,
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
    guestId: req.user._id,
    giftId: gift._id,
    weddingId: gift.weddingId._id,
    amount,
    message,
    paymentMethod,
    screenshotUrl,
    transactionId,
    status: isInstant ? 'completed' : 'pending',
    isAnonymous: !!isAnonymous
  });

  await Payment.create({
    guestId: req.user._id,
    giftId: gift._id,
    amount,
    method: paymentMethod,
    status: isInstant ? 'completed' : 'pending',
    transactionId
  });

  const wedding = await Wedding.findById(gift.weddingId._id);
  if (wedding && isInstant) {
    wedding.stats.totalRaised += amount;
    const hasPreviousContribution = await Contribution.exists({
      weddingId: wedding._id,
      guestId: req.user._id,
      status: 'completed',
      _id: { $ne: contribution._id }
    });
    if (!hasPreviousContribution) {
      wedding.stats.guestCount += 1;
    }
    await wedding.save();
  }

  // --- EMAIL TRIGGER (INSTANT) ---
  if (isInstant) {
    try {
      await sendGiftReceipt(req.user.email, req.user.name, amount, updatedGift.name, updatedGift.digitalCardUrl);
      if (willCompleteGift) {
        const couple = await User.findById(gift.weddingId.couple);
        if (couple) await sendWeddingFundedAlert(couple.email, updatedGift.name, updatedGift.totalPrice);
      }
    } catch (err) {
      console.error("Email delivery failed:", err);
    }
  }

  const progressPercentage = Math.round((updatedGift.currentCollected / updatedGift.totalPrice) * 100);
  const activity = {
    weddingId: String(updatedGift.weddingId._id),
    title: `${req.user.name} contributed to ${updatedGift.name}`,
    message: `${req.user.name} added ${amount} ETB (${progressPercentage}% funded)`,
    type: 'contribution',
    timestamp: new Date()
  };

  emitGiftUpdate(updatedGift);
  emitActivity(activity);
  emitNotification({
    recipient: updatedGift.weddingId.couple,
    weddingId: updatedGift.weddingId._id,
    type: 'contribution',
    title: 'New contribution',
    message: `${req.user.name} contributed ${amount} ETB to ${updatedGift.name}`,
    link: `/weddings/${updatedGift.weddingId._id}/gifts/${updatedGift._id}`
  });

  res.status(201).json({ gift: updatedGift, contribution });
};

export const updateContributionStatus = async (req, res) => {
  const { status } = req.body;
  const contribution = await Contribution.findById(req.params.id)
    .populate('guestId', 'name email')
    .populate('giftId')
    .populate('weddingId');

  if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

  const oldStatus = contribution.status;
  contribution.status = status;
  await contribution.save();

  // --- ADMIN APPROVAL LOGIC ---
  if (status === 'completed' && oldStatus !== 'completed') {
    const gift = await Gift.findById(contribution.giftId._id);
    if (gift) {
      gift.currentCollected += contribution.amount;
      gift.contributors.push({
        guestId: contribution.guestId._id,
        name: contribution.guestId.name,
        amount: contribution.amount,
        message: contribution.message,
        isAnonymous: contribution.isAnonymous,
        timestamp: contribution.createdAt
      });

      let fundedAlertSent = false;
      if (gift.currentCollected >= gift.totalPrice) {
        gift.status = 'fullyFunded';
        fundedAlertSent = true;
      }
      await gift.save();

      // --- EMAIL TRIGGER (MANUAL VERIFIED) ---
      try {
        await sendGiftReceipt(contribution.guestId.email, contribution.guestId.name, contribution.amount, gift.name, gift.digitalCardUrl);
        if (fundedAlertSent) {
          const couple = await User.findById(contribution.weddingId.couple);
          if (couple) await sendWeddingFundedAlert(couple.email, gift.name, gift.totalPrice);
        }
      } catch (err) {
        console.error("Manual verification email failed:", err);
      }

      emitGiftUpdate(gift);
    }

    const wedding = await Wedding.findById(contribution.weddingId._id);
    if (wedding) {
      wedding.stats.totalRaised += contribution.amount;
      const hasOtherCompleted = await Contribution.exists({
        weddingId: wedding._id,
        guestId: contribution.guestId._id,
        status: 'completed',
        _id: { $ne: contribution._id }
      });
      if (!hasOtherCompleted) wedding.stats.guestCount += 1;
      await wedding.save();
    }
  }

  res.json(contribution);
};

export const getContributions = async (req, res) => {
  const contributions = await Contribution.find()
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

  const gift = await Gift.findById(contribution.giftId);
  if (gift) {
    gift.currentCollected = Math.max(0, gift.currentCollected - contribution.amount);
    gift.contributors = gift.contributors.filter(
      c => !(c.guestId.toString() === contribution.guestId.toString() && c.amount === contribution.amount)
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