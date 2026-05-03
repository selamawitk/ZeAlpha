import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getPlatformAnalytics, getPublicPlatformStats } from '../controllers/analyticsController.js';

const router = express.Router();
router.route('/public').get(getPublicPlatformStats);
router.route('/platform').get(protect, authorizeRoles('admin'), getPlatformAnalytics);
export default router;
