import { Router } from 'express';
import { MembersController } from '../controllers/membersController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public: view directory and export CSV
router.get('/', MembersController.getMembers);
router.get('/export/csv', MembersController.exportCsv);
router.get('/:id', MembersController.getMemberById);

// Admin protected
router.post('/', authenticateToken, isAdmin, MembersController.createMember);
router.put('/:id', authenticateToken, isAdmin, MembersController.updateMember);
router.delete('/:id', authenticateToken, isAdmin, MembersController.deleteMember);

export default router;
