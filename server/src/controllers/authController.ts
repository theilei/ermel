// ============================================================
// Authentication controller — register, login, logout, me
// ============================================================
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database';
import { sendVerificationEmail } from '../services/verificationEmailService';
import { sendPasswordResetEmail } from '../services/passwordResetEmailService';
import { addLog } from '../models/ActivityLogDB';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Helpers
function sanitize(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/<[^>]*>/g, '');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.ip || (req.socket?.remoteAddress ?? 'unknown');
}

async function logAuthAttempt(email: string, ipAddress: string, success: boolean) {
  try {
    await pool.query(
      `INSERT INTO auth_logs (email, ip_address, success)
       VALUES ($1, $2, $3)`,
      [email, ipAddress, success],
    );
  } catch (err: any) {
    console.warn('[AUTH LOG] failed to write auth_logs:', err.message);
  }
}

async function invalidateUserSessions(userId: string, keepSid?: string) {
  if (keepSid) {
    await pool.query(
      `DELETE FROM session
       WHERE COALESCE(sess->>'userId', '') = $1
         AND sid <> $2`,
      [userId, keepSid],
    );
    return;
  }

  await pool.query(
    `DELETE FROM session
     WHERE COALESCE(sess->>'userId', '') = $1`,
    [userId],
  );
}

export function csrfToken(req: Request, res: Response) {
  const tokenFactory = (req as any).csrfToken as undefined | (() => string);
  if (!tokenFactory) {
    return res.status(500).json({ error: 'CSRF middleware is not configured.' });
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.json({ csrfToken: tokenFactory() });
}

// ============================================================
// POST /api/auth/register
// ============================================================
export async function register(req: Request, res: Response) {
  try {
    const fullName = sanitize(req.body.fullName);
    const email = sanitize(req.body.email).toLowerCase();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';
    const acceptedTerms = req.body.acceptedTerms === true;
    const acceptedPrivacy = req.body.acceptedPrivacy === true;

    // Validation
    const errors: string[] = [];
    if (!fullName || fullName.length < 2) errors.push('Full name is required (minimum 2 characters).');
    if (!isValidEmail(email)) errors.push('Please enter a valid email address.');
    if (!isStrongPassword(password)) errors.push('Password must be at least 8 characters.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');
    if (!acceptedTerms) errors.push('You must accept the Terms and Conditions.');
    if (!acceptedPrivacy) errors.push('You must accept the Privacy Policy.');

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, accepted_terms, accepted_privacy)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, is_verified`,
      [fullName, email, passwordHash, acceptedTerms, acceptedPrivacy],
    );

    const user = userResult.rows[0];

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    // Send verification email (non-blocking — registration still succeeds if email fails)
    sendVerificationEmail(email, fullName, rawToken)
      .then(() => addLog({
        action: 'Verification email sent',
        entity: 'user',
        entityId: user.id,
        userId: user.id,
        userRole: 'customer',
        userName: fullName,
        details: `Sent to ${email}`,
      }))
      .catch(async (err) => {
        console.error('[EMAIL ERROR] Failed to send verification email:', err.message);
        try {
          await addLog({
            action: 'Verification email failed',
            entity: 'user',
            entityId: user.id,
            userId: user.id,
            userRole: 'customer',
            userName: fullName,
            details: `Send failed to ${email}: ${err.message}`,
          });
        } catch {
          // Ignore logging failure
        }
      });

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.full_name;
    req.session.isVerified = false;
    req.session.user = {
      id: user.id,
      email: user.email,
      role: 'customer',
    };

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isVerified: false,
      },
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Register:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/login
// ============================================================
export async function login(req: Request, res: Response) {
  try {
    const email = sanitize(req.body.email).toLowerCase();
    const password = req.body.password || '';
    const ipAddress = getClientIp(req);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await pool.query(
            `SELECT id, full_name, email, password_hash, is_verified,
              role, failed_login_attempts, lock_until
       FROM users WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      await logAuthAttempt(email, ipAddress, false);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      await logAuthAttempt(email, ipAddress, false);
      await addLog({
        action: 'Blocked login while account locked',
        entity: 'auth',
        userId: user.id,
        userRole: user.role === 'admin' ? 'admin' : 'customer',
        userName: user.full_name,
        details: `${email} attempted login from ${ipAddress}`,
      });
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const attempts = user.failed_login_attempts + 1;

      const lockUntil = attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        `UPDATE users
         SET failed_login_attempts = $1,
             lock_until = COALESCE($2, lock_until),
             updated_at = NOW()
         WHERE id = $3`,
        [attempts, lockUntil, user.id],
      );

      await logAuthAttempt(email, ipAddress, false);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await addLog({
          action: 'Suspicious login threshold reached',
          entity: 'auth',
          userId: user.id,
          userRole: user.role || 'customer',
          userName: user.full_name,
          details: `${email} has ${attempts} failed login attempts from IP ${ipAddress}. Lock applied for ${LOCK_MINUTES} minutes.`,
        });

        return res.status(429).json({
          error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
        });
      }

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Successful login — reset failed attempts
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, lock_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [user.id],
    );

    await logAuthAttempt(email, ipAddress, true);

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.full_name;
    req.session.isVerified = user.is_verified;
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'customer',
    };

    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isVerified: user.is_verified,
        role: user.role === 'admin' ? 'admin' : 'customer',
      },
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Login:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/logout
// ============================================================
export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH ERROR] Logout:', err);
      return res.status(500).json({ error: 'Failed to logout.' });
    }
    res.clearCookie('ermel.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
}

// ============================================================
// GET /api/auth/me
// ============================================================
export async function me(req: Request, res: Response) {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, is_verified, role FROM users WHERE id = $1`,
      [req.session.userId],
    );

    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      return res.json({ authenticated: false, user: null });
    }

    const user = result.rows[0];

    // Keep session in sync
    req.session.isVerified = user.is_verified;
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'customer',
    };

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isVerified: user.is_verified,
        role: user.role === 'admin' ? 'admin' : 'customer',
      },
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Me:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/verify-email
// ============================================================
export async function verifyEmail(req: Request, res: Response) {
  try {
    const rawToken = req.body.token || '';

    if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 10) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    const tokenHash = hashToken(rawToken);

    // Find token
    const tokenResult = await pool.query(
      `SELECT evt.id, evt.user_id, evt.expires_at, evt.used_at, u.is_verified
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token_hash = $1`,
      [tokenHash],
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    const token = tokenResult.rows[0];

    // Already used
    if (token.used_at) {
      return res.status(400).json({
        error: 'This verification link has already been used.',
        alreadyVerified: token.is_verified,
      });
    }

    // Expired
    if (new Date(token.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'This verification link has expired. Please request a new one.',
        expired: true,
      });
    }

    // Mark token as used and verify user — single transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
        [token.id],
      );
      const verifiedUserResult = await client.query(
        `SELECT full_name FROM users WHERE id = $1 LIMIT 1`,
        [token.user_id],
      );
      await client.query(
        `UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`,
        [token.user_id],
      );
      const userName = verifiedUserResult.rows[0]?.full_name || 'Customer';
      await client.query(
        `INSERT INTO qq_activity_logs (user_id, action, entity, entity_id, user_role, user_name, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          token.user_id,
          'Email verified',
          'user',
          token.user_id,
          'customer',
          userName,
          'Verification token consumed successfully',
        ],
      );
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Update session if logged in
    if (req.session && req.session.userId === token.user_id) {
      req.session.isVerified = true;
    }

    return res.json({ message: 'Email verified successfully.', verified: true });
  } catch (err: any) {
    console.error('[AUTH ERROR] Verify email:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/resend-verification
// ============================================================
export async function resendVerification(req: Request, res: Response) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in to resend verification.' });
    }

    const userId = req.session.userId;

    // Get user
    const userResult = await pool.query(
      `SELECT id, full_name, email, is_verified FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'Your email is already verified.' });
    }

    // Check resend limit: max 3 per hour
    const recentResendAttempts = await pool.query(
      `SELECT COUNT(*) as cnt
       FROM qq_activity_logs
       WHERE user_id = $1
         AND action = 'Verification email resent'
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId],
    );

    if (parseInt(recentResendAttempts.rows[0].cnt, 10) >= 3) {
      return res.status(429).json({
        error: 'You can only request 3 verification emails per hour. Please try again later.',
      });
    }

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    // Send email
    await sendVerificationEmail(user.email, user.full_name, rawToken);

    await addLog({
      action: 'Verification email resent',
      entity: 'user',
      entityId: user.id,
      userId: user.id,
      userRole: 'customer',
      userName: user.full_name,
      details: `Resent to ${user.email}`,
    });

    return res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err: any) {
    console.error('[AUTH ERROR] Resend verification:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/change-password
// ============================================================
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userId = req.session.userId;
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmNewPassword = typeof req.body.confirmNewPassword === 'string' ? req.body.confirmNewPassword : '';

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'Please fill in all password fields.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    const userResult = await pool.query(
      `SELECT id, full_name, email, role, password_hash
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_attempts = 0,
           lock_until = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId],
    );

    await pool.query(
      `UPDATE password_resets
       SET used_at = NOW()
       WHERE user_id = $1
         AND used_at IS NULL`,
      [userId],
    );

    await invalidateUserSessions(userId, req.sessionID);

    await addLog({
      action: 'Password changed',
      entity: 'auth',
      userId,
      userRole: user.role === 'admin' ? 'admin' : 'customer',
      userName: user.full_name,
      details: `Password updated from profile for ${user.email}`,
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('[AUTH ERROR] Change password:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
export async function forgotPassword(req: Request, res: Response) {
  const genericResponse = {
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  try {
    const email = sanitize(req.body.email).toLowerCase();
    const ipAddress = getClientIp(req);

    if (!isValidEmail(email)) {
      return res.json(genericResponse);
    }

    const userResult = await pool.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = userResult.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await pool.query(
      `UPDATE password_resets
       SET used_at = NOW()
       WHERE user_id = $1
         AND used_at IS NULL`,
      [user.id],
    );

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, expiresAt, ipAddress],
    );

    await sendPasswordResetEmail(user.email, user.full_name, rawToken);

    await addLog({
      action: 'Password reset requested',
      entity: 'auth',
      userId: user.id,
      userRole: user.role === 'admin' ? 'admin' : 'customer',
      userName: user.full_name,
      details: `Reset requested from IP ${ipAddress}`,
    });

    return res.json(genericResponse);
  } catch (err: any) {
    console.error('[AUTH ERROR] Forgot password:', err.message);
    return res.json(genericResponse);
  }
}

// ============================================================
// GET /api/auth/verify-reset-token
// ============================================================
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const rawToken = sanitize(req.query.token);

    if (!rawToken || rawToken.length < 20) {
      return res.status(400).json({ valid: false, error: 'Invalid reset token.' });
    }

    const tokenHash = hashToken(rawToken);
    const tokenResult = await pool.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash],
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset token.' });
    }

    const token = tokenResult.rows[0];
    if (token.used_at) {
      return res.status(400).json({ valid: false, error: 'This reset link has already been used.' });
    }

    if (new Date(token.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, error: 'This reset link has expired.' });
    }

    return res.json({ valid: true });
  } catch (err: any) {
    console.error('[AUTH ERROR] Verify reset token:', err.message);
    return res.status(500).json({ valid: false, error: 'Internal server error.' });
  }
}

// ============================================================
// POST /api/auth/reset-password
// ============================================================
export async function resetPassword(req: Request, res: Response) {
  try {
    const rawToken = typeof req.body.token === 'string' ? req.body.token : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmNewPassword = typeof req.body.confirmNewPassword === 'string' ? req.body.confirmNewPassword : '';

    if (!rawToken || rawToken.length < 20) {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'Please fill in all password fields.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const tokenHash = hashToken(rawToken);
    const tokenResult = await pool.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.full_name, u.email, u.role
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1
       LIMIT 1`,
      [tokenHash],
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const tokenRow = tokenResult.rows[0];
    if (tokenRow.used_at) {
      return res.status(400).json({ error: 'This reset link has already been used.' });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired.' });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users
         SET password_hash = $1,
             failed_login_attempts = 0,
             lock_until = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [nextPasswordHash, tokenRow.user_id],
      );

      await client.query(
        `UPDATE password_resets
         SET used_at = NOW()
         WHERE id = $1`,
        [tokenRow.id],
      );

      await client.query(
        `UPDATE password_resets
         SET used_at = NOW()
         WHERE user_id = $1
           AND used_at IS NULL`,
        [tokenRow.user_id],
      );

      await client.query(
        `DELETE FROM session
         WHERE COALESCE(sess->>'userId', '') = $1`,
        [tokenRow.user_id],
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    await addLog({
      action: 'Password reset completed',
      entity: 'auth',
      userId: tokenRow.user_id,
      userRole: tokenRow.role === 'admin' ? 'admin' : 'customer',
      userName: tokenRow.full_name,
      details: `Password reset via token for ${tokenRow.email}`,
    });

    return res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err: any) {
    console.error('[AUTH ERROR] Reset password:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
