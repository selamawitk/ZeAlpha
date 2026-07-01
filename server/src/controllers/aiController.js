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
      const { weddingId, budget, relationship } = req.body;
      const gifts = await Gift.find({ weddingId, status: { $in: ['open', 'approved'] } })
        .sort({ currentCollected: -1, priority: -1 })
        .limit(3)
        .lean();

      const b = Number(budget) || 0;
      const rel = relationship || 'guest';

      if (!gifts.length) {
        const defaultGifts = [
          { name: 'Traditional Coffee Set', price: 3500, reason: `${rel} like you can gift a traditional Ethiopian coffee set — a meaningful and cultural present for the new couple.` },
          { name: 'Kitchen Blender & Mixer', price: 2500, reason: `A practical kitchen essential for any Ethiopian household, perfect for a ${rel} to give.` },
        ];
        return res.json({
          recommendations: defaultGifts.map(g => ({
            giftId: null,
            giftName: g.name,
            reason: g.reason,
            recommendedAmount: Math.min(b, g.price),
            action: 'create_new',
          })),
        });
      }

      const results = gifts.slice(0, 2).map(g => {
        const remaining = g.totalPrice - g.currentCollected;
        const suggestedAmount = remaining <= b ? remaining : Math.max(Math.ceil(g.totalPrice * 0.1), Math.min(b, remaining));
        return {
          giftId: g._id,
          giftName: g.name,
          reason: `As a ${rel}, you can help fund "${g.name}" — it's ${Math.round((g.currentCollected / g.totalPrice) * 100)}% funded with ${remaining.toLocaleString()} ETB remaining.`,
          recommendedAmount: Math.min(b, suggestedAmount),
          action: 'join_existing',
        };
      });

      const isAffordable = results.some(r => r.recommendedAmount >= 500);
      if (!isAffordable && b >= 1000) {
        results.push({
          giftId: null,
          giftName: 'Ethiopian Coffee Ceremony Set',
          reason: `A classic Ethiopian gift that any ${rel} would be proud to give — perfect for your ${b.toLocaleString()} ETB budget.`,
          recommendedAmount: Math.min(b, 3500),
          action: 'create_new',
        });
      }

      res.json({ recommendations: results.slice(0, 3) });
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
    // Fallback: heuristic suggestions based on the question
    try {
      const { weddingId } = req.body;
      const gifts = await Gift.find({ weddingId }).sort({ priority: -1, currentCollected: -1 }).limit(5).lean();

      const q = (req.body.question || '').toLowerCase();
      const wantsTraditional = q.includes('tradition') || q.includes('cultural') || q.includes('ethiopian') || q.includes('coffee');
      const wantsKitchen = q.includes('kitchen') || q.includes('cook') || q.includes('blender');
      const wantsElectronics = q.includes('electronic') || q.includes('tv') || q.includes('fridge');
      const wantsFurniture = q.includes('furniture') || q.includes('sofa') || q.includes('bed');
      const wantsShareable = q.includes('share') || q.includes('fractional') || q.includes('group');

      const allSuggestions = [
        { name: 'Traditional Coffee Ceremony Set', category: 'Traditional', estimatedPrice: 3500, type: 'fractional', reason: 'An essential Ethiopian wedding gift — guests love contributing to this cultural centerpiece.', shareableNote: null },
        { name: 'Habesha Kemis Set (2)', category: 'Traditional', estimatedPrice: 4000, type: 'fractional', reason: 'Beautiful traditional dresses for the bride, a meaningful registry addition.', shareableNote: null },
        { name: 'Kitchen Blender & Mixer Set', category: 'Kitchen', estimatedPrice: 4500, type: 'fractional', reason: 'A must-have for Ethiopian cooking — perfect for making sauces, spices, and smoothies.', shareableNote: null },
        { name: 'Stainless Steel Cookware Set', category: 'Kitchen', estimatedPrice: 8000, type: 'fractional', reason: 'Essential for daily cooking, durable and long-lasting for the new home.', shareableNote: 'At 8,000 ETB, multiple guests can each contribute a portion.' },
        { name: '50" LED Smart TV', category: 'Electronics', estimatedPrice: 25000, type: 'fractional', reason: 'Perfect for family entertainment and hosting guests — a high-impact group gift.', shareableNote: '25,000 ETB is ideal for 5-10 guests to contribute together.' },
        { name: 'Refrigerator (Double Door)', category: 'Electronics', estimatedPrice: 35000, type: 'fractional', reason: 'Essential for every Ethiopian home to store ingredients for large family meals.', shareableNote: 'A 35,000 ETB fridge works great as a shared gift for many guests.' },
        { name: 'Living Room Sofa Set', category: 'Furniture', estimatedPrice: 15000, type: 'fractional', reason: 'The centerpiece of the living room where guests are welcomed and hosted.', shareableNote: 'At 15,000 ETB, guests can contribute in fractions of 1,000-3,000 ETB each.' },
        { name: 'Queen Size Bed Frame + Mattress', category: 'Furniture', estimatedPrice: 20000, type: 'fractional', reason: 'A fundamental need for every new couple starting their home together.', shareableNote: '20,000 ETB works best as 4-5 guests contribute 4,000-5,000 ETB each.' },
        { name: 'Dining Table + 6 Chairs', category: 'Furniture', estimatedPrice: 18000, type: 'fractional', reason: 'Perfect for hosting family dinners and holiday celebrations in the new home.', shareableNote: '18,000 ETB is great for multiple guests to split.' },
        { name: 'Mesob (Traditional Woven Table)', category: 'Traditional', estimatedPrice: 5000, type: 'fractional', reason: 'A culturally significant Ethiopian item for serving injera during family meals.', shareableNote: null },
        { name: 'Electric Pressure Cooker', category: 'Kitchen', estimatedPrice: 3000, type: 'unique', reason: 'An affordable, practical gift that speeds up daily Ethiopian cooking.', shareableNote: null },
        { name: 'Mixer & Coffee Grinder Set', category: 'Kitchen', estimatedPrice: 2500, type: 'unique', reason: 'Essential for Ethiopian coffee ceremonies and daily spice grinding.', shareableNote: null },
      ];

      let filtered = allSuggestions;
      if (wantsTraditional) filtered = filtered.filter(s => s.category === 'Traditional');
      else if (wantsKitchen) filtered = filtered.filter(s => s.category === 'Kitchen');
      else if (wantsElectronics) filtered = filtered.filter(s => s.category === 'Electronics');
      else if (wantsFurniture) filtered = filtered.filter(s => s.category === 'Furniture');
      if (wantsShareable) filtered = filtered.filter(s => s.type === 'fractional');

      if (!filtered.length) filtered = allSuggestions;

      const suggestions = filtered.slice(0, 5);

      const hasGifts = gifts.length > 0;
      let summary;
      if (hasGifts) {
        const fundedCount = gifts.filter(g => g.currentCollected >= g.totalPrice).length;
        const totalNeeded = gifts.reduce((s, g) => s + (g.totalPrice - g.currentCollected), 0);
        summary = `You have ${gifts.length} gifts (${fundedCount} fully funded) with ${totalNeeded.toLocaleString()} ETB still needed. ${suggestions.length > 0 ? 'Consider adding ' + suggestions.slice(0, 3).map(s => `"${s.name}"`).join(', ') + ' to round out your registry. Make big items shareable so guests can contribute together.' : ''}`;
      } else {
        summary = `Start with ${suggestions.slice(0, 3).map(s => `"${s.name}"`).join(', ')}. Traditional items make meaningful gifts, kitchen essentials are always practical, and larger furniture pieces work well as shared group gifts. Make anything over 5,000 ETB shareable so multiple guests can contribute.`;
      }

      res.json({ suggestions, summary });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Planning service unavailable. Please try again.' });
    }
  }
};
