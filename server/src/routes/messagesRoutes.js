import { Router } from 'express';
import { MessagesController } from '../controllers/messagesController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public: Submit inquiry form
router.post('/', MessagesController.createMessage);

// Admin Protected: View & manage inquiries
router.get('/', authenticateToken, isAdmin, MessagesController.getMessages);
router.put('/:id/read', authenticateToken, isAdmin, MessagesController.markAsRead);
router.delete('/:id', authenticateToken, isAdmin, MessagesController.deleteMessage);

export default router;
