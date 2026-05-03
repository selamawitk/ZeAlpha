import Wedding from '../models/Wedding.js';
import Gift from '../models/Gift.js';
import Contribution from '../models/Contribution.js';

export const getPublicPlatformStats = async (req, res) => {
  try {
    const weddings = await Wedding.countDocuments();
    const totalRaised = await Gift.aggregate([
      { $group: { _id: null, total: { $sum: '$currentCollected' } } }
    ]);
    const totalRaisedAmount = totalRaised[0]?.total || 0;

    res.json({
      weddingCount: weddings,
      totalRaised: totalRaisedAmount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlatformAnalytics = async (req, res) => {
  const weddings = await Wedding.find();
  const gifts = await Gift.find();
  const contributions = await Contribution.find();

  const totalRaised = gifts.reduce((sum, gift) => sum + gift.currentCollected, 0);
  const mostFundedGifts = gifts
    .sort((a, b) => b.currentCollected - a.currentCollected)
    .slice(0, 5)
    .map((gift) => ({
      id: gift._id,
      name: gift.name,
      collected: gift.currentCollected,
      totalPrice: gift.totalPrice
    }));

  res.json({
    weddingCount: weddings.length,
    giftCount: gifts.length,
    contributionCount: contributions.length,
    totalRaised,
    mostFundedGifts
  });
};
