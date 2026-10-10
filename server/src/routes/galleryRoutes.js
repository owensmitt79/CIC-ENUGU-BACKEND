import { Router } from 'express';
import { GalleryController } from '../controllers/galleryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', GalleryController.getGallery);
router.post('/', authenticateToken, isAdmin, upload.single('image'), GalleryController.createGalleryItem);
router.delete('/:id', authenticateToken, isAdmin, GalleryController.deleteGalleryItem);

export default router;
