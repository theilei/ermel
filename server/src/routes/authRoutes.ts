// ============================================================
// Auth routes — /api/auth/*
// ============================================================
import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
} from '../controllers/authController';
import { loginLimiter, registerLimiter, resendLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendLimiter, resendVerification);

export default router;
