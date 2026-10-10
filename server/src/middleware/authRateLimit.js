import rateLimit from 'express-rate-limit';

/**
 * Dedicated Authentication Rate Limiter
 * Defends against brute-force password guessing, PIN enumeration, and credential stuffing.
 * Maximum 5 login attempts per IP per 15 minutes.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each IP to 5 failed login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many failed login attempts from this IP address. Account access temporarily locked for 15 minutes to prevent unauthorized access.'
  }
});

/**
 * Sensitive Security Actions Limiter (Password / PIN change)
 * Maximum 10 requests per 15 minutes
 */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests for sensitive credential updates. Please wait before trying again.'
  }
});

export default { loginRateLimiter, sensitiveActionLimiter };
