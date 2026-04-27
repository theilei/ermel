"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================
// Auth routes — /api/auth/*
// ============================================================
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const csrf_1 = require("../middleware/csrf");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/csrf-token', csrf_1.csrfProtection, authController_1.csrfToken);
router.post('/register', rateLimiter_1.registerLimiter, authController_1.register);
router.post('/login', rateLimiter_1.loginLimiter, authController_1.login);
router.post('/logout', csrf_1.csrfProtection, authController_1.logout);
router.get('/me', authController_1.me);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/resend-verification', csrf_1.csrfProtection, rateLimiter_1.resendLimiter, authController_1.resendVerification);
router.post('/change-password', csrf_1.csrfProtection, authMiddleware_1.requireAuth, authController_1.changePassword);
router.post('/forgot-password', rateLimiter_1.forgotPasswordLimiter, authController_1.forgotPassword);
router.get('/verify-reset-token', authController_1.verifyResetToken);
router.post('/reset-password', rateLimiter_1.resetPasswordLimiter, authController_1.resetPassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map