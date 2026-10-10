import { Router } from 'express';
import { NewsController } from '../controllers/newsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', NewsController.getNews);
router.get('/:id', NewsController.getNewsById);

router.post('/', authenticateToken, isAdmin, upload.single('image'), NewsController.createNews);
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), NewsController.updateNews);
router.delete('/:id', authenticateToken, isAdmin, NewsController.deleteNews);

export default router;
