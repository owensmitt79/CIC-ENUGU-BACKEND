import { Router } from 'express';
import { EventsController } from '../controllers/eventsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', EventsController.getEvents);
router.get('/:id', EventsController.getEventById);

router.post('/', authenticateToken, isAdmin, upload.single('image'), EventsController.createEvent);
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), EventsController.updateEvent);
router.delete('/:id', authenticateToken, isAdmin, EventsController.deleteEvent);

export default router;
