import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createGroup, getGroup, joinGroup, updateMemberPaid, getGroupsByWedding } from '../controllers/groupController.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('couple', 'admin'), createGroup);

router.get('/wedding/:weddingId', getGroupsByWedding);
router.get('/:id', getGroup);
router.post('/join/:token', optionalProtect, joinGroup);
router.put('/:groupId/members/:memberId/pay', protect, updateMemberPaid);

export default router;
