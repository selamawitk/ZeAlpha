import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { requestPayout, getPayouts, updatePayoutStatus } from '../controllers/payoutController.js';

const router = express.Router();
router.route('/').post(protect, authorizeRoles('couple', 'admin'), requestPayout).get(protect, authorizeRoles('admin'), getPayouts);
router.route('/:id/status').put(protect, authorizeRoles('admin'), updatePayoutStatus);
export default router;
