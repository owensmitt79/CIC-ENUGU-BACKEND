import { prisma } from '../config/db.js';
import { ImageService } from '../services/imageService.js';

export class GalleryController {
  static async getGallery(req, res, next) {
    try {
      const { category } = req.query;
      const where = {};
      if (category && category !== 'All' && category !== 'all') {
        where.category = category;
      }

      const items = await prisma.galleryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
      next(error);
    }
  }

  static async createGalleryItem(req, res, next) {
    try {
      let { title, category, image, caption, date } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Image title is required' });
      }

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'gallery');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'gallery');
      }

      if (!image) {
        return res.status(400).json({ success: false, message: 'Image file or data URL is required' });
      }

      const item = await prisma.galleryItem.create({
        data: {
          title: title.trim(),
          category: category || 'Reunions',
          image,
          caption: caption || '',
          date: date || new Date().toISOString().split('T')[0]
        }
      });

      return res.status(201).json({ success: true, message: 'Gallery item added', data: item });
    } catch (error) {
      next(error);
    }
  }

  static async deleteGalleryItem(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.galleryItem.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Gallery item removed' });
    } catch (error) {
      next(error);
    }
  }
}

export default GalleryController;
