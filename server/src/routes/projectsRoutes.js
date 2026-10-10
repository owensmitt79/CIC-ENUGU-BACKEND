import { Router } from 'express';
import { ProjectsController } from '../controllers/projectsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public: view capital initiatives
router.get('/', ProjectsController.getProjects);
router.get('/:id', ProjectsController.getProjectById);

// Admin Protected
router.post('/', authenticateToken, isAdmin, upload.single('image'), ProjectsController.createProject);
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), ProjectsController.updateProject);
router.post('/:id/allocate', authenticateToken, isAdmin, ProjectsController.allocateFunds);
router.delete('/:id', authenticateToken, isAdmin, ProjectsController.deleteProject);
router.delete('/', authenticateToken, isAdmin, ProjectsController.clearAllProjects);

export default router;
