import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginRateLimiter, sensitiveActionLimiter } from '../middleware/authRateLimit.js';

const router = Router();

// Apply strict rate limiting to login endpoint to prevent brute-forcing
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);

// Apply sensitive action rate limiter to password and PIN modifications
router.post('/update-password', authenticateToken, sensitiveActionLimiter, AuthController.updatePassword);
router.post('/update-pin', authenticateToken, sensitiveActionLimiter, AuthController.updatePin);

export default router;
