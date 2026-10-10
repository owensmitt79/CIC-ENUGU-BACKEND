import { prisma } from '../config/db.js';
import { ReportService } from '../services/reportService.js';

export class MembersController {
  /**
   * List members with search and chapter filters
   * GET /api/members
   */
  static async getMembers(req, res, next) {
    try {
      const { search, chapter, duesStatus, page, limit, all } = req.query;

      const where = { active: true };

      if (chapter && chapter !== 'All' && chapter !== 'all') {
        where.chapter = { contains: chapter };
      }

      if (duesStatus && duesStatus !== 'All' && duesStatus !== 'all') {
        where.duesStatus = duesStatus;
      }

      if (search) {
        const query = search.trim();
        where.OR = [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
          { profession: { contains: query } },
          { chapter: { contains: query } }
        ];
      }

      if (all === 'true') {
        const members = await prisma.member.findMany({
          where,
          orderBy: { name: 'asc' }
        });
        return res.status(200).json({
          success: true,
          count: members.length,
          data: members
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * pageSize;

      const [total, members] = await Promise.all([
        prisma.member.count({ where }),
        prisma.member.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { name: 'asc' }
        })
      ]);

      return res.status(200).json({
        success: true,
        pagination: {
          total,
          page: pageNum,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get member by ID
   * GET /api/members/:id
   */
  static async getMemberById(req, res, next) {
    try {
      const { id } = req.params;
      const member = await prisma.member.findUnique({
        where: { id }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'Member not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new alumni member
   * POST /api/members
   */
  static async createMember(req, res, next) {
    try {
      const { name, email, phone, chapter, profession, duesStatus, avatar, bio, joinYear } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Name, email, and phone number are required'
        });
      }

      const existing = await prisma.member.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A member with this email address is already registered'
        });
      }

      const member = await prisma.member.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          chapter: chapter || 'Enugu',
          profession: profession || '',
          duesStatus: duesStatus || 'Up to Date',
          avatar: avatar || '',
          bio: bio || '',
          joinYear: joinYear ? parseInt(joinYear, 10) : 1995
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update member details
   * PUT /api/members/:id
   */
  static async updateMember(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, phone, chapter, profession, duesStatus, avatar, bio, joinYear, active } = req.body;

      const updated = await prisma.member.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(email && { email: email.trim().toLowerCase() }),
          ...(phone && { phone: phone.trim() }),
          ...(chapter && { chapter }),
          ...(profession !== undefined && { profession }),
          ...(duesStatus && { duesStatus }),
          ...(avatar !== undefined && { avatar }),
          ...(bio !== undefined && { bio }),
          ...(joinYear && { joinYear: parseInt(joinYear, 10) }),
          ...(active !== undefined && { active })
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Member updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete member
   * DELETE /api/members/:id
   */
  static async deleteMember(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.member.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Member deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export members roster to CSV
   * GET /api/members/export/csv
   */
  static async exportCsv(req, res, next) {
    try {
      const members = await prisma.member.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      });

      const csvData = ReportService.membersToCsv(members);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cic_alumni_members_roster.csv"');
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }
}

export default MembersController;
