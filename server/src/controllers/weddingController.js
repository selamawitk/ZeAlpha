import Wedding from '../models/Wedding.js';
import Gift from '../models/Gift.js';
import Contribution from '../models/Contribution.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { emitActivity } from '../services/socketService.js';

const createSlug = (name, id) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${id.toString().slice(-6)}`;
};

export const createWedding = async (req, res) => {
  const { weddingName, weddingDate, description, bannerImage, payoutSettings } = req.body;

  const parsedDate = new Date(weddingDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid wedding date' });
  }
  if (parsedDate <= new Date()) {
    return res.status(400).json({ message: 'Wedding date must be in the future' });
  }

  let slug = createSlug(weddingName, req.user._id);
  let attempts = 0;
  while (await Wedding.findOne({ slug }) && attempts < 5) {
    slug = createSlug(weddingName, req.user._id) + '-' + Date.now().toString(36);
    attempts++;
  }
  const wedding = await Wedding.create({
    couple: req.user._id,
    weddingName,
    weddingDate,
    description,
    bannerImage,
    payoutSettings,
    slug
  });

  const user = await User.findById(req.user._id);
  if (user) {
    user.managedWedding = wedding._id;
    await user.save();
  }

  emitActivity({
    weddingId: String(wedding._id),
    title: `Wedding created: ${wedding.weddingName}`,
    message: `${wedding.weddingName}'s registry is now open for contributions`,
    type: 'wedding_created',
    timestamp: new Date()
  });

  res.status(201).json(wedding);
};

export const getWeddings = async (req, res) => {
  const { q } = req.query;
  let query = {};
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingUsers = await User.find({
      name: regex,
      role: { $in: ['couple'] }
    }).select('_id managedWedding');

    const coupleIds = matchingUsers.filter(u => u.managedWedding).map(u => u._id);
    query = {
      $or: [
        { weddingName: regex },
        { couple: { $in: coupleIds } },
        { slug: regex }
      ]
    };
  }
  const weddings = await Wedding.find(query).populate('couple', 'name email');
  res.json(weddings);
};

export const getWeddingBySlug = async (req, res) => {
  const wedding = await Wedding.findOne({ slug: req.params.slug }).populate('couple', 'name email').lean();
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
  const gifts = await Gift.find({ weddingId: wedding._id });
  const coupleId = wedding.couple?._id || wedding.couple;
  const isCoupleAdmin = req.user && (String(coupleId) === String(req.user._id) || req.user.role === 'admin');
  if (!isCoupleAdmin) {
    const privacy = wedding.privacySettings || {};
    gifts.forEach(g => {
      if (!privacy.showGuestNames) {
        g.contributors.forEach(c => { if (!c.isAnonymous) c.name = 'Guest'; });
      }
      if (!privacy.showContributionAmounts) {
        g.contributors.forEach(c => { c.amount = undefined; });
      }
    });
  }
  wedding.gifts = gifts;
  res.json(wedding);
};

export const getWeddingById = async (req, res) => {
  const wedding = await Wedding.findById(req.params.id).populate('couple', 'name email').lean();
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const gifts = await Gift.find({ weddingId: wedding._id });
  const coupleId = wedding.couple?._id || wedding.couple;
  const isCoupleAdmin = req.user && (String(coupleId) === String(req.user._id) || req.user.role === 'admin');
  if (!isCoupleAdmin) {
    const privacy = wedding.privacySettings || {};
    gifts.forEach(g => {
      if (!privacy.showGuestNames) {
        g.contributors.forEach(c => { if (!c.isAnonymous) c.name = 'Guest'; });
      }
      if (!privacy.showContributionAmounts) {
        g.contributors.forEach(c => { c.amount = undefined; });
      }
    });
  }
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
  if (req.body.weddingDate) {
    const parsedDate = new Date(req.body.weddingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid wedding date' });
    }
    wedding.weddingDate = parsedDate;
  }
  wedding.description = req.body.description || wedding.description;
  wedding.bannerImage = req.body.bannerImage || wedding.bannerImage;
  wedding.payoutSettings = { ...wedding.payoutSettings, ...req.body.payoutSettings };
  if (req.body.privacySettings) {
    wedding.privacySettings = { ...wedding.privacySettings, ...req.body.privacySettings };
  }
  if (req.body.giftPreferences) {
    wedding.giftPreferences = { ...wedding.giftPreferences, ...req.body.giftPreferences };
  }
  if (req.body.conversionSettings) {
    wedding.conversionSettings = { ...wedding.conversionSettings, ...req.body.conversionSettings };
  }

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

  await Wedding.deleteOne({ _id: wedding._id });
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

  const topContributorsData = Object.values(contributorMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topContributors = await Promise.all(topContributorsData.map(async (entry) => {
    const user = await User.findById(entry.guestId).select('name email');
    return { ...entry, guestId: entry.guestId, name: user?.name || 'Unknown', email: user?.email || '' };
  }));

  res.json({
    wedding,
    totalRaised,
    giftCount: gifts.length,
    contributionCount: contributions.length,
    popularGifts,
    topContributors
  });
};
