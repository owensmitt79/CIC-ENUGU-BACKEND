import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/update-password', authenticateToken, AuthController.updatePassword);
router.post('/update-pin', authenticateToken, AuthController.updatePin);

export default router;
