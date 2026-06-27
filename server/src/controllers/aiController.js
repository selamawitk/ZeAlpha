import Gift from '../models/Gift.js';
import Wedding from '../models/Wedding.js';
import { getGiftRecommendation } from '../services/geminiService.js';

export const getAiRecommendation = async (req, res) => {
  try {
    const { weddingId, budget, relationship, intent } = req.body;

    if (!weddingId || !budget) {
      return res.status(400).json({ message: 'weddingId and budget are required' });
    }

    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const gifts = await Gift.find({ weddingId, status: 'open' });

    if (!gifts.length) {
      return res.json({
        recommendedGift: null,
        recommendedAmount: 0,
        reasoning: 'No open gifts available in the registry at this time.',
      });
    }

    const recommendation = await getGiftRecommendation({
      budget: Number(budget),
      relationship: relationship || '',
      intent: intent || '',
      weddingData: { ...wedding.toObject(), gifts: gifts.map(g => g.toObject()) },
    });

    res.json(recommendation);
  } catch (error) {
    console.error('AI recommendation error:', error);
    
    try {
      const { weddingId } = req.body;
      const gifts = await Gift.find({ weddingId, status: 'open' }).sort({ currentCollected: -1, priority: -1 }).limit(3);
      
      if (!gifts.length) {
        return res.json({ recommendedGift: null, recommendedAmount: 0, reasoning: 'No gifts available currently.' });
      }

      const budget = Number(req.body.budget) || 0;
      const affordable = gifts.filter(g => (g.totalPrice - g.currentCollected) <= budget || budget >= g.totalPrice * 0.2);
      const chosen = affordable.length ? affordable[0] : gifts[0];
      const suggestedAmount = Math.min(budget, chosen.totalPrice - chosen.currentCollected);

      res.json({
        recommendedGift: chosen.name,
        recommendedAmount: Math.max(suggestedAmount, Math.ceil(chosen.totalPrice * 0.1)),
        reasoning: `Based on your budget, we suggest contributing to "${chosen.name}" which is ${Math.round((chosen.currentCollected/chosen.totalPrice)*100)}% funded.`,
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Recommendation service unavailable. Please try again.' });
    }
  }
};
