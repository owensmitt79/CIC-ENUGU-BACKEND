import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { ImageService } from '../services/imageService.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

/**
 * Handle multipart image file upload or base64 JSON upload
 * POST /api/upload
 */
router.post('/', authenticateToken, isAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const { folder = 'general', base64 } = req.body;

    let imageUrl = '';

    if (req.file) {
      imageUrl = await ImageService.processUpload(req.file, folder);
    } else if (base64) {
      imageUrl = await ImageService.processBase64(base64, folder);
    } else {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'No file or base64 image data was provided in request'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl
    });
  } catch (error) {
    next(error);
  }
});

export default router;
