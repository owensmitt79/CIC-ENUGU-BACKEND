import { prisma } from '../config/db.js';

export class CategoriesController {
  /**
   * Get all dues categories
   * GET /api/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' }
      });

      return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a dues category
   * POST /api/categories
   */
  static async createCategory(req, res, next) {
    try {
      const { id, name, type, baseAmount, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Category name is required'
        });
      }

      const catId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

      const existing = await prisma.category.findUnique({
        where: { id: catId }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A category with this identifier already exists'
        });
      }

      const category = await prisma.category.create({
        data: {
          id: catId,
          name: name.trim(),
          type: type || 'fixed',
          baseAmount: baseAmount ? parseFloat(baseAmount) : 5000,
          description: description || '',
          active: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Dues category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update or rename a dues category
   * PUT /api/categories/:id
   */
  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, baseAmount, description, active } = req.body;

      const current = await prisma.category.findUnique({
        where: { id }
      });

      if (!current) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Category not found'
        });
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(type && { type }),
          ...(baseAmount !== undefined && { baseAmount: parseFloat(baseAmount) }),
          ...(description !== undefined && { description }),
          ...(active !== undefined && { active })
        }
      });

      // If category name was renamed, retroactively update matching payment records
      if (name && name.trim() !== current.name) {
        await prisma.payment.updateMany({
          where: { paymentType: current.name },
          data: { paymentType: name.trim() }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Dues category updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category
   * DELETE /api/categories/:id
   */
  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.category.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Dues category removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inspect Payers Roster for a specific dues category
   * GET /api/categories/:id/payers
   */
  static async getCategoryPayers(req, res, next) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Category not found'
        });
      }

      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { categoryId: category.id },
            { paymentType: category.name }
          ],
          status: 'Successful'
        },
        orderBy: { date: 'desc' }
      });

      const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

      return res.status(200).json({
        success: true,
        category: category.name,
        totalCollected,
        payerCount: payments.length,
        payers: payments.map((p) => ({
          reference: p.reference,
          receiptNumber: p.receiptNumber,
          name: p.name,
          email: p.email,
          phone: p.phone,
          amount: p.amount,
          date: p.date,
          channel: p.channel
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CategoriesController;
