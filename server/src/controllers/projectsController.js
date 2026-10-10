import { prisma } from '../config/db.js';
import { ImageService } from '../services/imageService.js';

export class ProjectsController {
  /**
   * Get all capital development projects
   * GET /api/projects
   */
  static async getProjects(req, res, next) {
    try {
      const { category, status } = req.query;
      const where = {};

      if (category && category !== 'All' && category !== 'all') {
        where.category = category;
      }
      if (status && status !== 'All' && status !== 'all') {
        where.status = status;
      }

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      const formatted = projects.map((p) => {
        const percent = p.targetAmount > 0 ? Math.min(100, Math.round((p.raisedAmount / p.targetAmount) * 100)) : 0;
        return {
          ...p,
          percentComplete: percent,
          remainingAmount: Math.max(0, p.targetAmount - p.raisedAmount)
        };
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project by ID with backers
   * GET /api/projects/:id
   */
  static async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          donations: {
            orderBy: { date: 'desc' },
            take: 50
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Project not found'
        });
      }

      const percent = project.targetAmount > 0 ? Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100)) : 0;

      return res.status(200).json({
        success: true,
        data: {
          ...project,
          percentComplete: percent,
          remainingAmount: Math.max(0, project.targetAmount - project.raisedAmount)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new capital project
   * POST /api/projects
   */
  static async createProject(req, res, next) {
    try {
      let { title, category, status, targetAmount, raisedAmount, donorCount, image, description } = req.body;

      if (!title || !description || !targetAmount) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Title, description, and capital target amount are required'
        });
      }

      // Handle base64 image or uploaded file
      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'projects');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'projects');
      }

      const project = await prisma.project.create({
        data: {
          title: title.trim(),
          category: category || 'Infrastructure',
          status: status || 'active',
          targetAmount: parseFloat(targetAmount) || 0,
          raisedAmount: parseFloat(raisedAmount) || 0,
          donorCount: parseInt(donorCount, 10) || 0,
          image: image || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80',
          description: description.trim()
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Capital initiative published successfully',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing project
   * PUT /api/projects/:id
   */
  static async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      let { title, category, status, targetAmount, raisedAmount, donorCount, image, description } = req.body;

      if (image && image.startsWith('data:image/')) {
        image = await ImageService.processBase64(image, 'projects');
      }
      if (req.file) {
        image = await ImageService.processUpload(req.file, 'projects');
      }

      const updated = await prisma.project.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(category && { category }),
          ...(status && { status }),
          ...(targetAmount !== undefined && { targetAmount: parseFloat(targetAmount) }),
          ...(raisedAmount !== undefined && { raisedAmount: parseFloat(raisedAmount) }),
          ...(donorCount !== undefined && { donorCount: parseInt(donorCount, 10) }),
          ...(image && { image }),
          ...(description && { description: description.trim() })
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Allocate funds to a project manually
   * POST /api/projects/:id/allocate
   */
  static async allocateFunds(req, res, next) {
    try {
      const { id } = req.params;
      const { addedAmount, donorName } = req.body;

      if (!addedAmount || Number(addedAmount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Valid fund amount is required'
        });
      }

      const numAmount = parseFloat(addedAmount);

      const [updated] = await Promise.all([
        prisma.project.update({
          where: { id },
          data: {
            raisedAmount: { increment: numAmount },
            donorCount: { increment: 1 }
          }
        }),
        prisma.projectDonation.create({
          data: {
            projectId: id,
            donorName: donorName || 'Anonymous Alumnus',
            amount: numAmount
          }
        })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Funds allocated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  static async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.project.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all projects
   * DELETE /api/projects
   */
  static async clearAllProjects(req, res, next) {
    try {
      await prisma.project.deleteMany();

      return res.status(200).json({
        success: true,
        message: 'All projects cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProjectsController;
