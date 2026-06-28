import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import Gift from '../models/Gift.js';
import { resolveWedding } from '../utils/weddingResolver.js';

const router = express.Router();

// GET all orders (gifts with store delivery)
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const gifts = await Gift.find({ deliveryOptions: 'store', status: 'purchased' })
      .sort({ updatedAt: -1 });
    const orders = [];
    for (const gift of gifts) {
      const wedding = await resolveWedding(gift.weddingId);
      orders.push({
        _id: gift._id,
        orderId: `ORD-${1000 + orders.length}`,
        giftName: gift.name,
        vendor: wedding?.weddingName || 'Unknown Wedding',
        status: gift.status === 'purchased' ? 'ready' : 'pending',
        createdAt: gift.updatedAt,
      });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update order status
router.put('/:id/status', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const gift = await Gift.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!gift) return res.status(404).json({ message: 'Order not found' });
    res.json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
