// ============================================================
// Rate limiter presets for auth endpoints
// ============================================================
import rateLimit from 'express-rate-limit';

/** Login: 5 attempts per 15 minutes per IP */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
  statusCode: 429,
});

/** Register: 5 registrations per hour per IP */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
  statusCode: 429,
});

/** Resend verification: 3 per hour per IP */
export const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Resend limit reached. Please try again later.' },
  statusCode: 429,
});
