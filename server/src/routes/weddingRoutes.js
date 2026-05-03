import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createWedding, getWeddings, getWeddingById, updateWedding, deleteWedding, getWeddingAnalytics } from '../controllers/weddingController.js';

const router = express.Router();
router.route('/').post(protect, authorizeRoles('couple', 'admin'), createWedding).get(getWeddings);
router.route('/:id').get(getWeddingById).put(protect, authorizeRoles('couple', 'admin'), updateWedding).delete(protect, authorizeRoles('couple', 'admin'), deleteWedding);
router.route('/:id/analytics').get(protect, authorizeRoles('couple', 'admin'), getWeddingAnalytics);
export default router;
