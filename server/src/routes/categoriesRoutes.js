import { Router } from 'express';
import { CategoriesController } from '../controllers/categoriesController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public: get active categories for checkout
router.get('/', CategoriesController.getCategories);

// Admin Protected: Dues customization & Payers roster inspection
router.get('/:id/payers', authenticateToken, isAdmin, CategoriesController.getCategoryPayers);
router.post('/', authenticateToken, isAdmin, CategoriesController.createCategory);
router.put('/:id', authenticateToken, isAdmin, CategoriesController.updateCategory);
router.delete('/:id', authenticateToken, isAdmin, CategoriesController.deleteCategory);

export default router;
