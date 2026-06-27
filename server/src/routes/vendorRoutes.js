import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getVendors, getVendorById, createVendor, updateVendor, deleteVendor,
  getVendorProducts, createVendorProduct, updateVendorProduct, deleteVendorProduct,
  getVendorOrders, createVendorOrder, updateVendorOrderStatus,
  getCoupleOrders, getVendorAnalytics,
} from '../controllers/vendorController.js';

const router = express.Router();

// Vendor CRUD — admin only
router.get('/', protect, authorizeRoles('admin'), getVendors);
router.get('/:id', protect, authorizeRoles('admin'), getVendorById);
router.post('/', protect, authorizeRoles('admin'), createVendor);
router.put('/:id', protect, authorizeRoles('admin'), updateVendor);
router.delete('/:id', protect, authorizeRoles('admin'), deleteVendor);

// Products — admin only
router.get('/:vendorId/products', protect, authorizeRoles('admin'), getVendorProducts);
router.post('/products', protect, authorizeRoles('admin'), createVendorProduct);
router.put('/products/:id', protect, authorizeRoles('admin'), updateVendorProduct);
router.delete('/products/:id', protect, authorizeRoles('admin'), deleteVendorProduct);

// Orders — admin
router.get('/orders/all', protect, authorizeRoles('admin'), getVendorOrders);
router.post('/orders', protect, authorizeRoles('admin'), createVendorOrder);
router.put('/orders/:id/status', protect, authorizeRoles('admin'), updateVendorOrderStatus);

// Orders — couple
router.get('/orders/couple', protect, authorizeRoles('couple'), getCoupleOrders);

// Analytics — admin
router.get('/analytics/summary', protect, authorizeRoles('admin'), getVendorAnalytics);

export default router;
