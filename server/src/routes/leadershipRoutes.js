import { Router } from 'express';
import { LeadershipController } from '../controllers/leadershipController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public: view executive leadership council
router.get('/', LeadershipController.getLeadership);
router.get('/:id', LeadershipController.getLeaderById);

// Admin protected
router.post('/', authenticateToken, isAdmin, upload.single('image'), LeadershipController.createLeader);
router.put('/reorder', authenticateToken, isAdmin, LeadershipController.reorderLeadership);
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), LeadershipController.updateLeader);
router.delete('/:id', authenticateToken, isAdmin, LeadershipController.deleteLeader);

export default router;
