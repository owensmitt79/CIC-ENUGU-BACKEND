import { prisma } from '../config/db.js';
import { ImageService } from '../services/imageService.js';

export class EventsController {
  static async getEvents(req, res, next) {
    try {
      const { status } = req.query;
      const where = {};
      if (status) where.status = status;

      const events = await prisma.event.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      return res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req, res, next) {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      return res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req, res, next) {
    try {
      let { title, description, date, displayDate, time, location, fee, status, image, featured } = req.body;
      if (!title || !date || !location) {
        return res.status(400).json({ success: false, message: 'Title, date, and location are required' });
      }

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'events');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'events');
      }

      const event = await prisma.event.create({
        data: {
          title: title.trim(),
          description: description || '',
          date,
          displayDate: displayDate || date,
          time: time || '',
          location: location.trim(),
          fee: fee ? parseFloat(fee) : 0,
          status: status || 'upcoming',
          image: image || '',
          featured: Boolean(featured)
        }
      });

      return res.status(201).json({ success: true, message: 'Event created', data: event });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      let { title, description, date, displayDate, time, location, fee, status, image, featured } = req.body;

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'events');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'events');
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description }),
          ...(date && { date }),
          ...(displayDate !== undefined && { displayDate }),
          ...(time !== undefined && { time }),
          ...(location && { location: location.trim() }),
          ...(fee !== undefined && { fee: parseFloat(fee) }),
          ...(status && { status }),
          ...(image && { image }),
          ...(featured !== undefined && { featured: Boolean(featured) })
        }
      });

      return res.status(200).json({ success: true, message: 'Event updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.event.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default EventsController;
