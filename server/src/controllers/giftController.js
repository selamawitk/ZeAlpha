import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import { createDigitalCard } from '../utils/digitalCard.js';
import { emitGiftUpdate, emitActivity, emitGiftSurge } from '../services/socketService.js';
import Notification from '../models/Notification.js';
import { emitNotification } from '../services/socketService.js';

export const addGift = async (req, res) => {
  try {
    const { weddingId, type, name, description, imageUrl, totalPrice, deliveryOptions, category, priority, fulfillmentPreference, vendorId, vendorProductId } = req.body;

    if (weddingId && weddingId.match(/^[a-f\d]{24}$/i)) {
      const wedding = await Wedding.findById(weddingId);
      if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
      if (req.user.role === 'couple' && wedding.couple.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to add gifts to this wedding' });
      }
    }

    const gift = await Gift.create({
      weddingId,
      type,
      name,
      description,
      imageUrl,
      totalPrice,
      deliveryOptions,
      fulfillmentPreference: fulfillmentPreference || 'cash',
      category,
      priority: priority || 1,
      vendorId: fulfillmentPreference === 'vendor' ? vendorId : null,
      vendorProductId: fulfillmentPreference === 'vendor' ? vendorProductId : null,
    });

    emitGiftUpdate(gift);
    emitActivity({
      weddingId: String(weddingId),
      title: `New gift added: ${gift.name}`,
      message: `${gift.name} was added to the registry (${gift.type})`,
      type: 'gift_created',
      timestamp: new Date()
    });

    res.status(201).json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGifts = async (req, res) => {
  try {
    const weddingId = req.params.weddingId || req.query.weddingId;
    const { maxPrice } = req.query;

    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding ID is required' });
    }

    const query = { weddingId };
    if (maxPrice) query.totalPrice = { $lte: Number(maxPrice) };

    const gifts = await Gift.find(query);
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGiftById = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id).populate('weddingId');
    if (!gift) return res.status(404).json({ message: 'Gift not found' });
    res.json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGift = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    if (gift.weddingId && gift.weddingId.match(/^[a-f\d]{24}$/i)) {
      const wedding = await Wedding.findById(gift.weddingId);
      if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
      if (req.user.role === 'couple' && wedding.couple.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const { name, description, imageUrl, totalPrice, deliveryOptions, category, priority, fulfillmentPreference, vendorId, vendorProductId } = req.body;
    if (name) gift.name = name;
    if (description !== undefined) gift.description = description;
    if (imageUrl !== undefined) gift.imageUrl = imageUrl;
    if (totalPrice) {
      if (Number(totalPrice) < gift.currentCollected) {
        return res.status(400).json({ message: `Total price cannot be less than the already collected amount (${gift.currentCollected} ETB)` });
      }
      gift.totalPrice = Number(totalPrice);
    }
    if (deliveryOptions) gift.deliveryOptions = deliveryOptions;
    if (fulfillmentPreference) gift.fulfillmentPreference = fulfillmentPreference;
    if (category) gift.category = category;
    if (priority) gift.priority = priority;
    if (fulfillmentPreference === 'vendor') {
      gift.vendorId = vendorId || null;
      gift.vendorProductId = vendorProductId || null;
    } else {
      gift.vendorId = null;
      gift.vendorProductId = null;
    }

    await gift.save();
    emitGiftUpdate(gift);
    res.json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    if (gift.weddingId && gift.weddingId.match(/^[a-f\d]{24}$/i)) {
      const wedding = await Wedding.findById(gift.weddingId);
      if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
      if (req.user.role === 'couple' && wedding.couple.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    await Gift.findByIdAndDelete(req.params.id);
    await Contribution.deleteMany({ giftId: req.params.id });
    await Payment.deleteMany({ giftId: req.params.id });

    res.json({ message: 'Gift removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDigitalCard = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id).populate('weddingId');
    if (!gift) return res.status(404).json({ message: 'Gift not found' });
    if (!gift.digitalCardData) return res.status(404).json({ message: 'Digital card not available yet' });
    res.json(JSON.parse(gift.digitalCardData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLock = async (req, res) => {
  try {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    const gift = await Gift.findOneAndUpdate(
      { _id: req.params.id, type: 'individual', status: 'open', isLocked: false },
      { $set: { isLocked: true, lockedUntil } },
      { new: true }
    );
    if (!gift) {
      const existing = await Gift.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Gift not found' });
      if (existing.type !== 'individual') return res.status(400).json({ message: 'Only unique gifts can be locked' });
      if (existing.status !== 'open') return res.status(400).json({ message: 'Only open gifts can be locked' });
      return res.status(409).json({ message: 'Gift is already reserved' });
    }

    res.json({ message: 'Gift locked for 10 minutes', gift });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlockGift = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    gift.isLocked = false;
    gift.lockedUntil = null;
    await gift.save();

    emitGiftUpdate(gift);

    res.json({ message: 'Gift reservation removed', gift });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGiftSettlement = async (req, res) => {
  try {
    const { deliveryOptions } = req.body;

    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    if (gift.weddingId && gift.weddingId.match(/^[a-f\d]{24}$/i)) {
      const wedding = await Wedding.findById(gift.weddingId);
      if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
      if (new Date() < new Date(wedding.weddingDate)) {
        return res.status(400).json({ message: 'Settlement only available after wedding date' });
      }
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

    emitGiftUpdate(gift);
    emitActivity({
      weddingId: String(gift.weddingId._id || gift.weddingId),
      title: `Gift settled: ${gift.name}`,
      message: `${gift.name} was settled as ${deliveryOptions}`,
      type: 'gift_settled',
      timestamp: new Date()
    });

    res.json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeddingRegistry = async (req, res) => {
  try {
    const { slug } = req.params;

    const wedding = await Wedding.findOne({ slug }).populate('couple', 'name email');
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

    const gifts = await Gift.find({ weddingId: wedding._id });

    const registry = {
      _id: wedding._id,
      slug: wedding.slug,
      weddingCode: wedding.weddingCode,
      coupleId: wedding.couple,
      weddingName: wedding.weddingName,
      weddingDate: wedding.weddingDate,
      description: wedding.description,
      bannerImage: wedding.bannerImage,
      privacySettings: wedding.privacySettings,
      gifts
    };

    res.json({ success: true, registry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSurgingGifts = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const query = { weddingId, status: 'open' };
    const gifts = await Gift.find(query);
    const surging = gifts.filter(g => {
      const progress = g.totalPrice > 0 ? (g.currentCollected / g.totalPrice) * 100 : 0;
      return progress > 80 && g.status === 'open';
    }).map(g => ({
      ...g.toObject(),
      surgeProgress: Math.round((g.currentCollected / g.totalPrice) * 100),
      remainingAmount: g.totalPrice - g.currentCollected
    }));
    res.json(surging);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGiftRecommendations = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { maxPrice } = req.query;

    const query = { weddingId, status: 'open' };
    if (maxPrice) query.totalPrice = { $lte: Number(maxPrice) };

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};