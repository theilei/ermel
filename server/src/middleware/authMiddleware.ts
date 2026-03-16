// ============================================================
// Authentication & verification middleware
// ============================================================
import { Request, Response, NextFunction } from 'express';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userEmail: string;
    userName: string;
    isVerified: boolean;
  }
}

/**
 * requireAuth — blocks unauthenticated users.
 * Returns 401 with the original URL so the frontend can redirect to login.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({
    error: 'Authentication required.',
    redirect: `/login?redirect=${encodeURIComponent(req.originalUrl)}`,
  });
}

/**
 * requireVerified — blocks authenticated but unverified users.
 * Must be used AFTER requireAuth.
 */
export function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.isVerified) {
    return next();
  }
  return res.status(403).json({
    error: 'You must verify your email before accessing this resource.',
    code: 'EMAIL_NOT_VERIFIED',
  });
}
