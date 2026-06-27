import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createContribution, getContributions, getContributionById, refundContribution, updateContributionStatus, downloadReceipt, getMyContributions } from '../controllers/contributionController.js';

const router = express.Router();
router.route('/').post(optionalProtect, createContribution).get(protect, getContributions);
router.get('/my', protect, getMyContributions);
router.get('/:id/receipt', protect, downloadReceipt);
router.route('/:id').get(protect, getContributionById).put(protect, authorizeRoles('admin'), updateContributionStatus).delete(protect, authorizeRoles('admin'), refundContribution);
export default router;
