// ============================================================
// Authentication controller — register, login, logout, me
// ============================================================
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database';
import { sendVerificationEmail } from '../services/verificationEmailService';
import { addLog } from '../models/ActivityLogDB';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export function csrfToken(req: Request, res: Response) {
  const tokenFactory = (req as any).csrfToken as undefined | (() => string);
  if (!tokenFactory) {
    return res.status(500).json({ error: 'CSRF middleware is not configured.' });
  }
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, is_verified,
              failed_login_attempts, lock_until
       FROM users WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check account lock
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.lock_until).getTime() - Date.now()) / 60000,
      );
      return res.status(423).json({
        error: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const attempts = user.failed_login_attempts + 1;
      const lockUntil =
        attempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;

      await pool.query(
        `UPDATE users SET failed_login_attempts = $1, lock_until = $2, updated_at = NOW()
         WHERE id = $3`,
        [attempts, lockUntil, user.id],
      );

      if (lockUntil) {
        return res.status(423).json({
          error: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
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

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.full_name;
    req.session.isVerified = user.is_verified;

    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isVerified: user.is_verified,
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
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, is_verified FROM users WHERE id = $1`,
      [req.session.userId],
    );

    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    // Keep session in sync
    req.session.isVerified = user.is_verified;

    return res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isVerified: user.is_verified,
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
