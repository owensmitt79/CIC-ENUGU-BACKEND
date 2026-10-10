import { prisma } from '../config/db.js';
import { ImageService } from '../services/imageService.js';

export class NewsController {
  static async getNews(req, res, next) {
    try {
      const news = await prisma.news.findMany({
        orderBy: { date: 'desc' }
      });
      return res.status(200).json({ success: true, count: news.length, data: news });
    } catch (error) {
      next(error);
    }
  }

  static async getNewsById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await prisma.news.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ success: false, message: 'News item not found' });
      return res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  static async createNews(req, res, next) {
    try {
      let { title, summary, content, category, date, displayDate, image, author, featured } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
      }

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'news');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'news');
      }

      const itemDate = date || new Date().toISOString().split('T')[0];
      const item = await prisma.news.create({
        data: {
          title: title.trim(),
          summary: summary || '',
          content: content.trim(),
          category: category || 'General',
          date: itemDate,
          displayDate: displayDate || itemDate,
          image: image || '',
          author: author || 'National Secretariat',
          featured: Boolean(featured)
        }
      });

      return res.status(201).json({ success: true, message: 'News article published', data: item });
    } catch (error) {
      next(error);
    }
  }

  static async updateNews(req, res, next) {
    try {
      const { id } = req.params;
      let { title, summary, content, category, date, displayDate, image, author, featured } = req.body;

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'news');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'news');
      }

      const updated = await prisma.news.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(summary !== undefined && { summary }),
          ...(content && { content: content.trim() }),
          ...(category && { category }),
          ...(date && { date }),
          ...(displayDate !== undefined && { displayDate }),
          ...(image && { image }),
          ...(author !== undefined && { author }),
          ...(featured !== undefined && { featured: Boolean(featured) })
        }
      });

      return res.status(200).json({ success: true, message: 'News article updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNews(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.news.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'News article deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default NewsController;
