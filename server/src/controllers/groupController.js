import crypto from 'crypto';
import ContributionGroup from '../models/ContributionGroup.js';
import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import Contribution from '../models/Contribution.js';
import Payment from '../models/Payment.js';
import { emitGiftUpdate, emitActivity, emitNotification } from '../services/socketService.js';
import Notification from '../models/Notification.js';

export const createGroup = async (req, res) => {
  try {
    const { weddingId, giftId, name, targetAmount, members } = req.body;
    if (!weddingId || !giftId || !name || !targetAmount) {
      return res.status(400).json({ message: 'weddingId, giftId, name, and targetAmount are required' });
    }

    const wedding = await Wedding.findById(weddingId);
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

    const gift = await Gift.findById(giftId);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    const group = await ContributionGroup.create({
      weddingId,
      giftId,
      name,
      totalAmount: 0,
      targetAmount,
      members: members || [],
      inviteToken: crypto.randomBytes(16).toString('hex'),
      status: 'forming'
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await ContributionGroup.findById(req.params.id)
      .populate('members.guestId', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { name, amount } = req.body;
    if (!name || !amount) {
      return res.status(400).json({ message: 'Name and amount are required' });
    }

    const group = await ContributionGroup.findOne({ inviteToken: req.params.token, status: 'forming' });
    if (!group) return res.status(404).json({ message: 'Invalid or expired invite' });

    const remaining = group.targetAmount - group.totalAmount;
    if (amount > remaining) {
      return res.status(400).json({ message: `Only ${remaining} remaining in this group` });
    }

    group.members.push({
      guestId: req.user?._id || null,
      name,
      amount,
      paid: false
    });
    group.totalAmount += amount;

    if (group.totalAmount >= group.targetAmount) {
      group.status = 'funded';
    }

    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberPaid = async (req, res) => {
  try {
    const { memberId } = req.params;
    const group = await ContributionGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = group.members.id(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    member.paid = true;
    member.paidAt = new Date();
    await group.save();

    try {
      await Contribution.create({
        guestId: member.guestId,
        giftId: group.giftId,
        weddingId: group.weddingId,
        amount: member.amount,
        paymentMethod: 'bank_transfer',
        status: member.guestId ? 'completed' : 'pending',
        message: `Group contribution via "${group.name}"`,
        groupId: group._id
      });
      await Payment.create({
        guestId: member.guestId,
        giftId: group.giftId,
        amount: member.amount,
        method: 'bank_transfer',
        status: 'completed'
      });
    } catch (err) {
      console.error('Group contribution creation failed:', err);
    }

    const allPaid = group.members.every(m => m.paid);
    if (allPaid && group.status === 'funded') {
      group.status = 'completed';
      await group.save();

      const gift = await Gift.findById(group.giftId);
      if (gift) {
        const totalGroupAmount = group.members.reduce((s, m) => s + m.amount, 0);
        gift.currentCollected += totalGroupAmount;
        if (gift.currentCollected >= gift.totalPrice) {
          gift.status = 'fullyFunded';
        }
        await gift.save();
        emitGiftUpdate(gift);
      }

      emitActivity({
        weddingId: String(group.weddingId),
        title: `Group "${group.name}" completed`,
        message: `All members have paid for the group gift "${group.name}".`,
        type: 'group_completed',
        timestamp: new Date()
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupsByWedding = async (req, res) => {
  try {
    const groups = await ContributionGroup.find({ weddingId: req.params.weddingId })
      .populate('giftId', 'name totalPrice imageUrl')
      .populate('members.guestId', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
