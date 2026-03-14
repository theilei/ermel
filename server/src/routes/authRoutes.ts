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
} from '../controllers/authController';
import { loginLimiter, registerLimiter, resendLimiter } from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrf';

const router = Router();

router.get('/csrf-token', csrfProtection, csrfToken);
router.post('/register', csrfProtection, registerLimiter, register);
router.post('/login', csrfProtection, loginLimiter, login);
router.post('/logout', csrfProtection, logout);
router.get('/me', me);
router.post('/verify-email', csrfProtection, verifyEmail);
router.post('/resend-verification', csrfProtection, resendLimiter, resendVerification);

export default router;
