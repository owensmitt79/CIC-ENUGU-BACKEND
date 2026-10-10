import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Admin Protected: Executive Dashboard Analytics
router.get('/dashboard', authenticateToken, isAdmin, ReportsController.getDashboardStats);
router.get('/monthly', authenticateToken, isAdmin, ReportsController.getMonthlyBreakdown);

export default router;
