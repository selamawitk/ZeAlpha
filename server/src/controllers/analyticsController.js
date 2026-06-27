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
  const [weddingCount, giftCount, contributionCount, totalRaisedResult, mostFundedGifts] = await Promise.all([
    Wedding.countDocuments(),
    Gift.countDocuments(),
    Contribution.countDocuments(),
    Gift.aggregate([
      { $group: { _id: null, total: { $sum: '$currentCollected' } } }
    ]),
    Gift.aggregate([
      { $sort: { currentCollected: -1 } },
      { $limit: 5 },
      { $project: { _id: 1, name: 1, currentCollected: 1, totalPrice: 1 } }
    ])
  ]);

  const totalRaised = totalRaisedResult[0]?.total || 0;

  res.json({
    weddingCount,
    giftCount,
    contributionCount,
    totalRaised,
    mostFundedGifts: mostFundedGifts.map(g => ({
      id: g._id,
      name: g.name,
      collected: g.currentCollected,
      totalPrice: g.totalPrice
    }))
  });
};
