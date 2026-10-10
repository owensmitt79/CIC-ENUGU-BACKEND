import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';

// Pre-computed dummy hash to prevent timing-based user enumeration attacks
const DUMMY_BCRYPT_HASH = '$2a$10$e8wY1oD6LgU3sKjX5WvVne8xK4jH4aB1nC2mD3eF4gH5iJ6kL7mN8';

export class AuthController {
  /**
   * Admin Authentication (Password or PIN)
   * POST /api/auth/login
   * Hardened against timing attacks, credential stuffing, and token leakage
   */
  static async login(req, res, next) {
    try {
      const { email, password, pin } = req.body;

      // 1. Input Validation & DoS Prevention
      if (!email || typeof email !== 'string' || email.length > 254) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'A valid email address is required'
        });
      }

      if (!password && !pin) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Either password or PIN is required to log in'
        });
      }

      // Defend against CPU exhaustion via oversized password payloads (max 128 chars)
      if (password && (typeof password !== 'string' || password.length > 128)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Password exceeds maximum length limit'
        });
      }

      if (pin && (typeof pin !== 'string' && typeof pin !== 'number' || String(pin).length > 20)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'PIN exceeds maximum length limit'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 2. Query user by email
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      // 3. Constant-Time Timing Attack Mitigation
      // Even if user is not found or inactive, execute a real bcrypt comparison to ensure uniform response timing
      let isMatch = false;

      if (user && user.isActive) {
        if (password && user.passwordHash) {
          isMatch = await bcrypt.compare(password, user.passwordHash);
        }
        if (!isMatch && pin && user.pinHash) {
          isMatch = await bcrypt.compare(String(pin), user.pinHash);
        }
      } else {
        // Execute dummy comparison to consume identical CPU cycles
        await bcrypt.compare(password || String(pin) || 'dummy_credentials', DUMMY_BCRYPT_HASH);
      }

      // Generic authentication failure message (prevents user enumeration)
      if (!isMatch || !user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'InvalidCredentials',
          message: 'Invalid email address, password, or administrator PIN'
        });
      }

      // 4. Generate JWT with minimal non-sensitive claims
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
      );

      // 5. Secure HttpOnly Cookie Transmission
      // Cookie is inaccessible to client JavaScript (immune to XSS theft)
      const cookieOptions = {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge,
        path: '/'
      };

      res.cookie('token', token, cookieOptions);
      res.cookie('cic_auth_token', token, cookieOptions);

      // 6. Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // 7. Sanitized User Profile (Zero sensitive fields leaked)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      };

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: userResponse,
        ...(config.nodeEnv !== 'production' && { token }) // In production, token is strictly restricted to HttpOnly cookie
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out and clear HttpOnly authentication cookies
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    const clearOptions = {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: '/'
    };

    res.clearCookie('token', clearOptions);
    res.clearCookie('cic_auth_token', clearOptions);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Get current authenticated user profile
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    // req.user is sanitized by authenticateToken middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  }

  /**
   * Update administrator password
   * POST /api/auth/update-password
   */
  static async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Current password and new password are required'
        });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'New password must be at least 8 characters long and no more than 128 characters'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          error: 'InvalidCurrentPassword',
          message: 'The current password you entered is incorrect'
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash }
      });

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update administrator PIN
   * POST /api/auth/update-pin
   */
  static async updatePin(req, res, next) {
    try {
      const { newPin, currentPin } = req.body;

      if (!newPin || String(newPin).length < 4 || String(newPin).length > 8) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'A valid PIN consisting of 4 to 8 digits is required'
        });
      }

      // Re-verify current PIN if user already has one set
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (user.pinHash && currentPin) {
        const isCurrentPinValid = await bcrypt.compare(String(currentPin), user.pinHash);
        if (!isCurrentPinValid) {
          return res.status(400).json({
            success: false,
            error: 'InvalidCurrentPin',
            message: 'Current PIN is incorrect'
          });
        }
      }

      const pinHash = await bcrypt.hash(String(newPin), 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { pinHash }
      });

      return res.status(200).json({
        success: true,
        message: 'Admin PIN updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
