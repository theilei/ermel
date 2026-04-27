// ============================================================
// Auth routes — /api/auth/*
// ============================================================
import { Router } from 'express';
import {
  csrfToken,
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../controllers/authController';
import {
  loginLimiter,
  registerLimiter,
  resendLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrf';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/csrf-token', csrfProtection, csrfToken);
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', csrfProtection, logout);
router.get('/me', me);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', csrfProtection, resendLimiter, resendVerification);
router.post('/change-password', csrfProtection, requireAuth, changePassword);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

export default router;
