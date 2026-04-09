"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireVerified = requireVerified;
exports.requireAdmin = requireAdmin;
const ActivityLogDB_1 = require("../models/ActivityLogDB");
/**
 * requireAuth — blocks unauthenticated users.
 * Returns 401 with the original URL so the frontend can redirect to login.
 */
function requireAuth(req, res, next) {
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
function requireVerified(req, res, next) {
    if (req.session && req.session.isVerified) {
        return next();
    }
    return res.status(403).json({
        error: 'You must verify your email before accessing this resource.',
        code: 'EMAIL_NOT_VERIFIED',
    });
}
function requireAdmin(req, res, next) {
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
    void (0, ActivityLogDB_1.addLog)({
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
//# sourceMappingURL=authMiddleware.js.map