// ============================================================
// Authentication & verification middleware
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { addLog } from '../models/ActivityLogDB';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: 'admin' | 'customer';
    };
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
  if (req.session && (req.session.user || req.session.userId)) {
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

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || (!req.session.user && !req.session.userId)) {
    return res.status(401).json({
      error: 'Authentication required.',
      redirect: `/login?redirect=${encodeURIComponent(req.originalUrl)}`,
    });
  }

  const role = req.session?.user?.role;
  if (role === 'admin') {
    return next();
  }

  void addLog({
    action: 'Unauthorized admin access attempt',
    entity: 'auth',
    userId: req.session?.userId,
    userRole: 'customer',
    userName: req.session?.userEmail || 'Unknown',
    details: `Blocked ${req.method} ${req.originalUrl}`,
  }).catch(() => {
    // Keep auth guard resilient even when logging fails.
  });

  return res.status(403).json({ error: 'Forbidden. Admin access required.' });
}
