import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createContribution, getContributions, getContributionById, refundContribution, updateContributionStatus } from '../controllers/contributionController.js';

const router = express.Router();
router.route('/').post(protect, createContribution).get(protect, authorizeRoles('admin'), getContributions);
router.route('/:id').get(protect, getContributionById).put(protect, authorizeRoles('admin'), updateContributionStatus).delete(protect, authorizeRoles('admin'), refundContribution);
export default router;
