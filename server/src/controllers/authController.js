import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';

export class AuthController {
  /**
   * Admin Authentication (Password or PIN)
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password, pin } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Email address is required'
        });
      }

      if (!password && !pin) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Either password or PIN is required to log in'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'InvalidCredentials',
          message: 'Invalid credentials or inactive administrative account'
        });
      }

      // Check Password or PIN
      let isMatch = false;
      if (password && user.passwordHash) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      }
      if (!isMatch && pin && user.pinHash) {
        isMatch = await bcrypt.compare(String(pin), user.pinHash);
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'InvalidCredentials',
          message: 'Incorrect password or administrator PIN'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Set HttpOnly Cookie
      const cookieOptions = {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge,
        path: '/'
      };

      res.cookie('token', token, cookieOptions);
      res.cookie('cic_auth_token', token, cookieOptions);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

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
        token, // Included for Bearer header or client token storage
        user: userResponse
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out and clear HttpOnly cookies
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
    return res.status(200).json({
      success: true,
      user: req.user
    });
  }

  /**
   * Update password
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

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

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
      const { newPin } = req.body;
      if (!newPin || String(newPin).length < 4) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'A valid PIN consisting of at least 4 digits is required'
        });
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
