import express from 'express';
import { optionalProtect } from '../middleware/authMiddleware.js';
import { getAiRecommendation } from '../controllers/aiController.js';

const router = express.Router();
router.post('/recommendation', optionalProtect, getAiRecommendation);

export default router;
