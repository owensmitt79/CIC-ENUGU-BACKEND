import { prisma } from '../config/db.js';
import { ImageService } from '../services/imageService.js';

export class LeadershipController {
  /**
   * Get all leadership council members
   * GET /api/leadership
   */
  static async getLeadership(req, res, next) {
    try {
      const leaders = await prisma.leadership.findMany({
        where: { active: true },
        orderBy: { order: 'asc' }
      });

      return res.status(200).json({
        success: true,
        count: leaders.length,
        data: leaders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get executive leader by ID
   * GET /api/leadership/:id
   */
  static async getLeaderById(req, res, next) {
    try {
      const { id } = req.params;
      const leader = await prisma.leadership.findUnique({
        where: { id }
      });

      if (!leader) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Leadership profile not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: leader
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create an executive council member
   * POST /api/leadership
   */
  static async createLeader(req, res, next) {
    try {
      let { name, role, office, bio, image, order, email, phone } = req.body;

      if (!name || !role || !bio) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Name, role, and biography are required'
        });
      }

      // Handle base64 image if provided
      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'leadership');
      }

      // Handle file upload if req.file exists
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'leadership');
      }

      const count = await prisma.leadership.count();
      const orderVal = order !== undefined ? parseInt(order, 10) : count + 1;

      const leader = await prisma.leadership.create({
        data: {
          name: name.trim(),
          role: role.trim(),
          office: office || '',
          bio: bio.trim(),
          image: image || '',
          order: orderVal,
          email: email || '',
          phone: phone || '',
          active: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Executive council member added successfully',
        data: leader
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an executive council member
   * PUT /api/leadership/:id
   */
  static async updateLeader(req, res, next) {
    try {
      const { id } = req.params;
      let { name, role, office, bio, image, order, email, phone, active } = req.body;

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'leadership');
      }

      if (req.file) {
        image = await ImageService.processUpload(req.file, 'leadership');
      }

      const updated = await prisma.leadership.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(role && { role: role.trim() }),
          ...(office !== undefined && { office }),
          ...(bio && { bio: bio.trim() }),
          ...(image && { image }),
          ...(order !== undefined && { order: parseInt(order, 10) }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(active !== undefined && { active })
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Executive council profile updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete executive council member
   * DELETE /api/leadership/:id
   */
  static async deleteLeader(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.leadership.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Executive council member deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder leadership roster
   * PUT /api/leadership/reorder
   */
  static async reorderLeadership(req, res, next) {
    try {
      const { items } = req.body; // Array of { id, order }

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'An array of items with id and order is required'
        });
      }

      await Promise.all(
        items.map((item) =>
          prisma.leadership.update({
            where: { id: item.id },
            data: { order: parseInt(item.order, 10) }
          })
        )
      );

      return res.status(200).json({
        success: true,
        message: 'Leadership hierarchy reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LeadershipController;
