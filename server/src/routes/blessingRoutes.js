import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { addBlessing, getBlessings, addReaction, deleteBlessing, approveBlessing } from '../controllers/blessingController.js';

const router = express.Router();

const blessingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many blessings. Please wait before sending another.',
});

router.post('/', blessingLimiter, addBlessing);
router.get('/:weddingId', getBlessings);
router.post('/:id/reactions', addReaction);
router.patch('/:id/approval', protect, approveBlessing);
router.delete('/:id', protect, authorizeRoles('admin'), deleteBlessing);

export default router;
