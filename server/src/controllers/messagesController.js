import { prisma } from '../config/db.js';

export class MessagesController {
  static async getMessages(req, res, next) {
    try {
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
      next(error);
    }
  }

  static async createMessage(req, res, next) {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
      }

      const msg = await prisma.message.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone || '',
          subject: subject || 'Secretariat Inquiry',
          message: message.trim()
        }
      });

      return res.status(201).json({ success: true, message: 'Message sent successfully', data: msg });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await prisma.message.update({
        where: { id },
        data: { read: true }
      });
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.message.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default MessagesController;
