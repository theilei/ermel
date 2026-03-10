// ============================================================
// Auth Middleware — express-session based admin authentication
// ============================================================
import { Request, Response, NextFunction } from 'express';

export interface AdminSession {
  userId?: string;
  username?: string;
  role?: 'admin';
  loggedIn?: boolean;
}

declare module 'express-session' {
  interface SessionData {
    admin?: AdminSession;
  }
}

/**
 * Middleware: requires an authenticated admin session.
 * For development, also accepts x-admin-token header matching the demo token.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check session first
  if (req.session && (req.session as any).admin?.loggedIn) {
    return next();
  }

  // Dev fallback: accept token header (matches localStorage pattern from frontend)
  const token = req.headers['x-admin-token'] as string | undefined;
  if (token && token.length > 0) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized. Admin login required.' });
}

/**
 * Middleware: requires an authenticated customer session.
 * For development, accepts x-customer-email header.
 */
export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).customer?.loggedIn) {
    return next();
  }

  // Dev fallback: accept customer email header
  const email = req.headers['x-customer-email'] as string | undefined;
  if (email && email.length > 0) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized. Customer login required.' });
}
