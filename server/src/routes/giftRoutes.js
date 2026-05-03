import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { addGift, getGifts, getGiftById, getDigitalCard, toggleLock, unlockGift, getWeddingRegistry, getGiftRecommendations, updateGiftSettlement } from '../controllers/giftController.js';

const router = express.Router();
router.route('/').post(protect, authorizeRoles('couple', 'admin'), addGift);
router.route('/wedding/:weddingId').get(getGifts);
router.route('/recommendations/:weddingId').get(getGiftRecommendations);
router.route('/registry/:slug').get(getWeddingRegistry); // Public route
router.route('/:id/digital-card').get(getDigitalCard);
router.route('/:id/toggle-lock').post(protect, toggleLock);
router.route('/:id/unlock').post(protect, unlockGift);
router.route('/:id/settlement').put(protect, authorizeRoles('couple', 'admin'), updateGiftSettlement);
router.route('/:id').get(getGiftById);
export default router;
