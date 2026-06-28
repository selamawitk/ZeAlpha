import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createStripeIntent, createStripeCheckout, createPaymentRecord, getPayments, updatePaymentStatus, createTelebirrPayment } from '../controllers/paymentController.js';

const router = express.Router();
router.post('/stripe-intent', optionalProtect, createStripeIntent);
router.post('/create-checkout-session', optionalProtect, createStripeCheckout);
router.post('/telebirr', optionalProtect, createTelebirrPayment);
router.route('/').post(protect, createPaymentRecord).get(protect, authorizeRoles('admin'), getPayments);
router.route('/:id/status').put(protect, authorizeRoles('admin'), updatePaymentStatus);
export default router;
