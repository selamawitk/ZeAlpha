import express from 'express';
import { optionalProtect, protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getAiRecommendation, getAiPlanner } from '../controllers/aiController.js';

const router = express.Router();
router.post('/recommendation', optionalProtect, getAiRecommendation);
router.post('/planner', protect, authorizeRoles('couple', 'admin'), getAiPlanner);

export default router;
