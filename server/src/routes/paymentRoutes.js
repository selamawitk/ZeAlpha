import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createStripeIntent, createPaymentRecord, getPayments, updatePaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();
router.post('/stripe-intent', protect, createStripeIntent);
router.route('/').post(protect, createPaymentRecord).get(protect, authorizeRoles('admin'), getPayments);
router.route('/:id/status').put(protect, authorizeRoles('admin'), updatePaymentStatus);
export default router;
