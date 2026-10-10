import { Router } from 'express';
import { ConfigController } from '../controllers/configController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public: get association settings, rates and bank details
router.get('/', ConfigController.getConfig);

// Admin Protected: update association settings
router.put('/', authenticateToken, isAdmin, ConfigController.updateConfig);

export default router;
