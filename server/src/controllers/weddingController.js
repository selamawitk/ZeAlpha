import Wedding from '../models/Wedding.js';
import Gift from '../models/Gift.js';
import Contribution from '../models/Contribution.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const createSlug = (name, id) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${id.toString().slice(-6)}`;
};

export const createWedding = async (req, res) => {
  const { weddingName, weddingDate, description, bannerImage, payoutSettings } = req.body;
  const wedding = await Wedding.create({
    couple: req.user._id,
    weddingName,
    weddingDate,
    description,
    bannerImage,
    payoutSettings,
    slug: createSlug(weddingName, req.user._id)
  });

  const user = await User.findById(req.user._id);
  if (user) {
    user.managedWedding = wedding._id;
    await user.save();
  }

  res.status(201).json(wedding);
};

export const getWeddings = async (req, res) => {
  const weddings = await Wedding.find().populate('couple', 'name email');
  res.json(weddings);
};

export const getWeddingById = async (req, res) => {
  const wedding = await Wedding.findById(req.params.id).populate('couple', 'name email').lean();
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const gifts = await Gift.find({ weddingId: wedding._id });
  wedding.gifts = gifts;
  res.json(wedding);
};

export const updateWedding = async (req, res) => {
  const wedding = await Wedding.findById(req.params.id);
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  if (req.user.role === 'couple' && wedding.couple.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this wedding' });
  }

  wedding.weddingName = req.body.weddingName || wedding.weddingName;
  wedding.weddingDate = req.body.weddingDate || wedding.weddingDate;
  wedding.description = req.body.description || wedding.description;
  wedding.bannerImage = req.body.bannerImage || wedding.bannerImage;
  wedding.payoutSettings = { ...wedding.payoutSettings, ...req.body.payoutSettings };

  const updated = await wedding.save();
  res.json(updated);
};

export const deleteWedding = async (req, res) => {
  const wedding = await Wedding.findById(req.params.id);
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  if (req.user.role === 'couple' && wedding.couple.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this wedding' });
  }

  const giftIds = (await Gift.find({ weddingId: wedding._id }).select('_id')).map((gift) => gift._id);
  await Gift.deleteMany({ weddingId: wedding._id });
  await Contribution.deleteMany({ weddingId: wedding._id });
  await Payment.deleteMany({ giftId: { $in: giftIds } });

  if (req.user.managedWedding?.toString() === wedding._id.toString()) {
    const user = await User.findById(req.user._id);
    if (user) {
      user.managedWedding = undefined;
      await user.save();
    }
  }

  await wedding.remove();
  res.json({ message: 'Wedding removed' });
};

export const getWeddingAnalytics = async (req, res) => {
  const wedding = await Wedding.findById(req.params.id).populate('couple', 'name email');
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const gifts = await Gift.find({ weddingId: wedding._id });
  const contributions = await Contribution.find({ weddingId: wedding._id });
  const totalRaised = gifts.reduce((sum, gift) => sum + gift.currentCollected, 0);

  const popularGifts = gifts
    .sort((a, b) => b.currentCollected - a.currentCollected)
    .slice(0, 5)
    .map((gift) => ({
      id: gift._id,
      name: gift.name,
      status: gift.status,
      collected: gift.currentCollected,
      totalPrice: gift.totalPrice
    }));

  const contributorMap = contributions.reduce((acc, contribution) => {
    const key = String(contribution.guestId);
    if (!acc[key]) {
      acc[key] = { guestId: contribution.guestId, total: 0, count: 0 };
    }
    acc[key].total += contribution.amount;
    acc[key].count += 1;
    return acc;
  }, {});

  const topContributors = Object.values(contributorMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  res.json({
    wedding,
    totalRaised,
    giftCount: gifts.length,
    contributionCount: contributions.length,
    popularGifts,
    topContributors
  });
};
