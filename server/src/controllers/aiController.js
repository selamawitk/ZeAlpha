import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import { getGiftRecommendation, getRegistryPlanner } from '../services/geminiService.js';

export const getAiRecommendation = async (req, res) => {
  try {
    const { weddingId, budget, relationship, intent } = req.body;

    if (!weddingId || !budget) {
      return res.status(400).json({ message: 'weddingId and budget are required' });
    }

    const wedding = await Wedding.findById(weddingId).populate('couple', 'name');
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const gifts = await Gift.find({ weddingId, status: { $in: ['open', 'approved'] } }).lean();

    const recommendation = await getGiftRecommendation({
      budget: Number(budget),
      relationship: relationship || '',
      weddingData: {
        weddingName: wedding.weddingName,
        coupleName: wedding.couple?.name || '',
        weddingDate: wedding.weddingDate,
        gifts: gifts.map(g => ({
          _id: g._id,
          name: g.name,
          totalPrice: g.totalPrice,
          currentCollected: g.currentCollected,
          type: g.type,
          category: g.category,
        })),
      },
    });

    res.json({ recommendations: Array.isArray(recommendation) ? recommendation : [recommendation] });
  } catch (error) {
    console.error('AI recommendation error:', error);

    try {
      const { weddingId } = req.body;
      const gifts = await Gift.find({ weddingId, status: { $in: ['open', 'approved'] } })
        .sort({ currentCollected: -1, priority: -1 })
        .limit(3)
        .lean();

      if (!gifts.length) {
        return res.json({ recommendations: [{ giftId: null, giftName: null, reason: 'No gifts available currently.', recommendedAmount: 0, action: 'create_new' }] });
      }

      const budget = Number(req.body.budget) || 0;
      const chosen = gifts[0];
      const suggestedAmount = Math.min(budget, chosen.totalPrice - chosen.currentCollected);

      res.json({
        recommendations: [{
          giftId: chosen._id,
          giftName: chosen.name,
          reason: `Based on your budget, we suggest contributing to "${chosen.name}" which is ${Math.round((chosen.currentCollected / chosen.totalPrice) * 100)}% funded.`,
          recommendedAmount: Math.max(suggestedAmount, Math.ceil(chosen.totalPrice * 0.1)),
          action: 'join_existing',
        }],
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Recommendation service unavailable. Please try again.' });
    }
  }
};

export const getAiPlanner = async (req, res) => {
  try {
    const { weddingId, question } = req.body;

    if (!weddingId || !question) {
      return res.status(400).json({ message: 'weddingId and question are required' });
    }

    const wedding = await Wedding.findById(weddingId).populate('couple', 'name');
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const gifts = await Gift.find({ weddingId }).lean();

    const result = await getRegistryPlanner({
      weddingData: {
        weddingName: wedding.weddingName,
        coupleName: wedding.couple?.name || '',
        weddingDate: wedding.weddingDate,
        gifts: gifts.map(g => ({
          name: g.name,
          totalPrice: g.totalPrice,
          currentCollected: g.currentCollected,
          type: g.type,
          category: g.category,
        })),
      },
      question,
    });

    res.json(result);
  } catch (error) {
    console.error('AI planner error:', error);
    res.status(500).json({ message: 'Planning service unavailable. Please try again.' });
  }
};
