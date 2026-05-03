import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import { createDigitalCard } from '../utils/digitalCard.js';

export const addGift = async (req, res) => {
  const { weddingId, type, name, description, imageUrl, totalPrice, deliveryOptions, category, priority } = req.body;
  const wedding = await Wedding.findById(weddingId);
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const gift = await Gift.create({
    weddingId,
    type,
    name,
    description,
    imageUrl,
    totalPrice,
    deliveryOptions,
    category,
    priority: priority || 1
  });

  res.status(201).json(gift);
};

export const getGifts = async (req, res) => {
  const { weddingId } = req.params;
  const { maxPrice } = req.query;

  const query = { weddingId };
  if (maxPrice) {
    query.totalPrice = { $lte: Number(maxPrice) };
  }

  const gifts = await Gift.find(query);
  res.json(gifts);
};

export const getGiftById = async (req, res) => {
  const gift = await Gift.findById(req.params.id).populate('weddingId');
  if (!gift) return res.status(404).json({ message: 'Gift not found' });
  res.json(gift);
};

export const getDigitalCard = async (req, res) => {
  const gift = await Gift.findById(req.params.id).populate('weddingId');
  if (!gift) return res.status(404).json({ message: 'Gift not found' });
  if (!gift.digitalCardData) return res.status(404).json({ message: 'Digital card not available yet' });
  res.json(JSON.parse(gift.digitalCardData));
};

export const lockGift = async (req, res) => {
  const gift = await Gift.findById(req.params.id);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });
  if (gift.status !== 'open') {
    return res.status(400).json({ message: 'Only open gifts can be reserved' });
  }

  const now = new Date();
  if (gift.isLocked && gift.lockedUntil && gift.lockedUntil > now) {
    return res.status(400).json({ message: 'Gift is already reserved' });
  }

  gift.isLocked = true;
  gift.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
  await gift.save();

  res.json({ message: 'Gift reserved for 10 minutes', gift });
};

export const toggleLock = async (req, res) => {
  const gift = await Gift.findById(req.params.id);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

  if (gift.type !== 'individual') {
    return res.status(400).json({ message: 'Only unique gifts can be locked' });
  }

  if (gift.status !== 'open') {
    return res.status(400).json({ message: 'Only open gifts can be locked' });
  }

  const now = new Date();
  if (gift.isLocked && gift.lockedUntil && gift.lockedUntil > now) {
    return res.status(400).json({ message: 'Gift is already reserved' });
  }

  gift.isLocked = true;
  gift.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
  await gift.save();

  res.json({ message: 'Gift locked for 10 minutes', gift });
};

export const unlockGift = async (req, res) => {
  const gift = await Gift.findById(req.params.id);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

  gift.isLocked = false;
  gift.lockedUntil = null;
  await gift.save();

  res.json({ message: 'Gift reservation removed', gift });
};

export const updateGiftSettlement = async (req, res) => {
  const { deliveryOptions } = req.body;
  const gift = await Gift.findById(req.params.id);
  if (!gift) return res.status(404).json({ message: 'Gift not found' });

  const wedding = await Wedding.findById(gift.weddingId);
  if (!wedding || new Date() < wedding.weddingDate) {
    return res.status(400).json({ message: 'Settlement only available after wedding date' });
  }

  if (gift.currentCollected >= gift.totalPrice) {
    gift.deliveryOptions = deliveryOptions;
    gift.status = deliveryOptions === 'store' ? 'purchased' : 'cashedOut';
  } else {
    if (deliveryOptions !== 'cashout') {
      return res.status(400).json({ message: 'Partially funded gifts can only be cashed out' });
    }
    gift.deliveryOptions = 'cashout';
    gift.status = 'cashedOut';
  }

  await gift.save();
  res.json(gift);
};

export const getWeddingRegistry = async (req, res) => {
  const { slug } = req.params;
  const wedding = await Wedding.findOne({ slug }).populate('couple', 'name');
  if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

  const gifts = await Gift.find({ weddingId: wedding._id });
  res.json({ wedding, gifts });
};

export const getGiftRecommendations = async (req, res) => {
  const { weddingId } = req.params;
  const { maxPrice } = req.query;

  const query = { weddingId, status: 'open' };
  if (maxPrice) {
    query.totalPrice = { $lte: Number(maxPrice) };
  }

  const gifts = await Gift.find(query)
    .sort({ currentCollected: -1, priority: -1 })
    .limit(6);

  const suggestions = gifts.map((gift) => ({
    id: gift._id,
    name: gift.name,
    type: gift.type,
    collected: gift.currentCollected,
    totalPrice: gift.totalPrice,
    remaining: gift.totalPrice - gift.currentCollected,
    progress: gift.totalPrice > 0 ? Math.round((gift.currentCollected / gift.totalPrice) * 100) : 0,
    category: gift.category
  }));

  res.json({ suggestions });
};