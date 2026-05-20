import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUser, forgotPassword, resetPassword } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.delete('/me', protect, deleteUser);
export default router;
