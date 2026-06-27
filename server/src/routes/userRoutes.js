import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUser, forgotPassword, resetPassword, getUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.get('/:id', protect, authorizeRoles('admin'), getUserById);
router.put('/:id', protect, authorizeRoles('admin'), updateUserProfile);
router.delete('/:id', protect, deleteUser);
router.delete('/me', protect, deleteUser);
export default router;
