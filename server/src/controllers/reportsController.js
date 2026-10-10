import { prisma } from '../config/db.js';

export class ReportsController {
  /**
   * Get Executive Dashboard KPIs & Analytics
   * GET /api/reports/dashboard
   */
  static async getDashboardStats(req, res, next) {
    try {
      const [
        totalMembers,
        successfulPayments,
        projects,
        recentPayments
      ] = await Promise.all([
        prisma.member.count({ where: { active: true } }),
        prisma.payment.findMany({
          where: { status: 'Successful' },
          select: {
            amount: true,
            paymentType: true,
            date: true,
            timestamp: true
          }
        }),
        prisma.project.findMany({
          select: {
            id: true,
            title: true,
            targetAmount: true,
            raisedAmount: true,
            donorCount: true,
            status: true
          }
        }),
        prisma.payment.findMany({
          take: 10,
          orderBy: { date: 'desc' }
        })
      ]);

      // Calculate total funds collected
      const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

      // Revenue breakdown by category
      const categoryMap = {};
      successfulPayments.forEach((p) => {
        const cat = p.paymentType || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + p.amount;
      });

      const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
      }));

      // Project stats
      const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
      const totalProjectTarget = projects.reduce((sum, p) => sum + p.targetAmount, 0);
      const totalProjectRaised = projects.reduce((sum, p) => sum + p.raisedAmount, 0);

      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            totalRevenue,
            totalTransactions: successfulPayments.length,
            totalMembers,
            activeProjectsCount,
            totalProjectTarget,
            totalProjectRaised
          },
          categoryBreakdown,
          recentPayments: recentPayments.map((p) => ({ ...p, timestamp: Number(p.timestamp) }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get monthly revenue breakdown
   * GET /api/reports/monthly
   */
  static async getMonthlyBreakdown(req, res, next) {
    try {
      const payments = await prisma.payment.findMany({
        where: { status: 'Successful' },
        select: { amount: true, date: true }
      });

      const monthlyMap = {};
      payments.forEach((p) => {
        const monthKey = (p.date || '').substring(0, 7); // "YYYY-MM"
        if (monthKey) {
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.amount;
        }
      });

      const monthlyData = Object.entries(monthlyMap)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, total]) => ({ month, total }));

      return res.status(200).json({
        success: true,
        data: monthlyData
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportsController;
