import Payout from '../models/Payout.js';
import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPayoutNotification } from '../services/emailService.js';
import { emitWithdrawalUpdate, emitNotification } from '../services/socketService.js';

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

  // Require account details
  if (!accountDetails) {
    return res.status(400).json({ message: 'Account details required for payout' });
  }

  // Create payout request
  const payout = await Payout.create({
    weddingId,
    giftIds,
    totalAmount,
    method: 'bank_transfer',
    accountDetails,
    status: 'pending'
  });

  // Create notification
  await Notification.create({
    recipient: wedding.couple,
    weddingId,
    type: 'withdrawal_created',
    title: 'Payout Request Submitted',
    message: `Your payout request of ${totalAmount} ETB has been submitted for processing.`,
    link: '/dashboard/wallet'
  });

  emitWithdrawalUpdate(payout);

  res.status(201).json(payout);
};

export const getPayouts = async (req, res) => {
  const payouts = await Payout.find()
    .populate('weddingId', 'weddingName couple')
    .populate('giftIds', 'name totalPrice');
  res.json(payouts);
};

export const getPayoutsByWedding = async (req, res) => {
  const payouts = await Payout.find({ weddingId: req.params.weddingId })
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

  if (status === 'approved') {
    await Gift.updateMany(
      { _id: { $in: payout.giftIds } },
      { $set: { status: 'cashedOut', deliveryOptions: 'cashout' } }
    );
  }

  if (status === 'completed') {
    payout.processedAt = new Date();
  }

  await payout.save();

  // Create in-app notification
  const couple = payout.weddingId?.couple;
  if (couple) {
    const statusTitles = {
      approved: 'Payout Approved', processing: 'Payout Processing', completed: 'Payout Completed', rejected: 'Payout Rejected'
    };
    const notifType = status === 'approved' || status === 'completed' ? 'withdrawal_approved' : 'withdrawal_created';
    await Notification.create({
      recipient: couple._id,
      weddingId: payout.weddingId._id,
      type: notifType,
      title: statusTitles[status] || `Payout ${status}`,
      message: `Your payout request for ${payout.totalAmount} ETB has been ${status === 'completed' ? 'processed and sent to your bank account' : status}.`,
      link: '/dashboard/wallet'
    });
  }

  emitWithdrawalUpdate(payout);

  // Trigger Email Notification when payout is moved to 'completed'
  if (status === 'completed' && oldStatus !== 'completed') {
    if (couple && couple.email) {
      try {
        await sendPayoutNotification(
          couple.email,
          payout.totalAmount,
          'bank_transfer'
        );
      } catch (error) {
        console.error('Email notification failed:', error);
      }
    }
  }

  res.json(payout);
};