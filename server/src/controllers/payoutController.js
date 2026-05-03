import Payout from '../models/Payout.js';
import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import User from '../models/User.js';
import { sendPayoutNotification } from '../services/emailService.js';

export const requestPayout = async (req, res) => {
  const { weddingId, giftIds, totalAmount, method, accountDetails } = req.body;

  // Validate wedding
  const wedding = await Wedding.findById(weddingId);
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  // Ensure user is the couple
  if (wedding.couple.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the couple can request payouts' });
  }

  // Validate gifts
  if (!Array.isArray(giftIds) || giftIds.length === 0) {
    return res.status(400).json({ message: 'At least one gift must be specified' });
  }

  const gifts = await Gift.find({ _id: { $in: giftIds }, weddingId });
  if (gifts.length !== giftIds.length) {
    return res.status(404).json({ message: 'Some gifts not found or not part of this wedding' });
  }

  // Check if all gifts are fully funded or (wedding date passed and >70% funded)
  const now = new Date();
  const weddingDatePassed = wedding.weddingDate < now;
  const unfundedGifts = gifts.filter(gift => {
    if (gift.status === 'fullyFunded') return false;
    if (weddingDatePassed) {
      const progress = gift.totalPrice > 0 ? (gift.currentCollected / gift.totalPrice) * 100 : 0;
      return progress < 70; // Allow if >=70%
    }
    return true; // Not fully funded and wedding not passed
  });

  if (unfundedGifts.length > 0) {
    return res.status(400).json({ message: 'All gifts must be fully funded, or wedding date must have passed with gifts at least 70% funded' });
  }

  // Validate total amount
  const calculatedTotal = gifts.reduce((sum, gift) => sum + gift.currentCollected, 0);
  if (totalAmount !== calculatedTotal) {
    return res.status(400).json({ message: 'Total amount does not match the sum of gift collections' });
  }

  // Validate method
  if (!['store', 'telebirr', 'bank_transfer'].includes(method)) {
    return res.status(400).json({ message: 'Invalid payout method' });
  }

  // For store fulfillment, no account details needed
  if (method === 'store') {
    await Gift.updateMany({ _id: { $in: giftIds } }, { $set: { status: 'purchased' } });
    res.status(201).json({ message: 'Gifts marked for partner store fulfillment' });
  } else {
    // For cashout, require account details
    if (!accountDetails) {
      return res.status(400).json({ message: 'Account details required for cashout' });
    }

    // Create payout request
    const payout = await Payout.create({
      weddingId,
      giftIds,
      totalAmount,
      method,
      accountDetails,
      status: 'pending'
    });

    // Mark gifts as cashed out
    await Gift.updateMany({ _id: { $in: giftIds } }, { $set: { status: 'cashedOut' } });

    res.status(201).json(payout);
  }
};

export const getPayouts = async (req, res) => {
  const payouts = await Payout.find()
    .populate('weddingId', 'weddingName couple')
    .populate('giftIds', 'name totalPrice');
  res.json(payouts);
};

export const updatePayoutStatus = async (req, res) => {
  const { status, adminNotes } = req.body;
  
  // Populate weddingId and couple to get the email address
  const payout = await Payout.findById(req.params.id)
    .populate({
      path: 'weddingId',
      populate: { path: 'couple', select: 'email name' }
    });

  if (!payout) return res.status(404).json({ message: 'Payout not found' });

  const oldStatus = payout.status;
  payout.status = status || payout.status;
  payout.adminNotes = adminNotes || payout.adminNotes;

  if (status === 'completed') {
    payout.processedAt = new Date();
  }

  await payout.save();

  // Trigger Email Notification when payout is moved to 'completed'
  if (status === 'completed' && oldStatus !== 'completed') {
    const couple = payout.weddingId?.couple;
    if (couple && couple.email) {
      try {
        await sendPayoutNotification(
          couple.email,
          payout.totalAmount,
          payout.method
        );
      } catch (error) {
        console.error('Email notification failed:', error);
        // We don't block the response if email fails, but we log it
      }
    }
  }

  res.json(payout);
};