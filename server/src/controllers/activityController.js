import Activity from '../models/Activity.js';

export const getActivities = async (req, res) => {
  try {
    const { weddingId, limit = 50 } = req.query;
    const query = {};
    if (weddingId) query.weddingId = weddingId;
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
