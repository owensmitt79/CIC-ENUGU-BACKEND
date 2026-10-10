import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/db.js';

/**
 * Authentication Middleware
 * Validates JWT token from HttpOnly cookie or Authorization header
 */
export async function authenticateToken(req, res, next) {
  try {
    // 1. Try to read token from cookies first (HttpOnly)
    let token = req.cookies?.token || req.cookies?.cic_auth_token;

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required to access this resource'
      });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret);

    // 4. Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Account not found or has been deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TokenExpired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'InvalidToken',
      message: 'Authentication token is invalid or malformed'
    });
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user if valid token present, but does not block requests if not
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.token || req.cookies?.cic_auth_token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_) {
    // Ignore invalid tokens for optional auth
  }
  next();
}

export default authenticateToken;
