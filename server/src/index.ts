// ============================================================
// Express API server for Ermel Quote System
// ============================================================
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import {
  sanitizeText,
  cleanPhone,
  isValidPhPhone,
  maskPhone,
  toMeters,
  isValidMeasurement,
  isValidAddress,
  isValidOther,
  sanitizeOther,
} from './validation';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import * as ReservationModel from './models/ReservationDB';
import { listReservedDates as listReservedDatesHandler, validateReservationDate } from './controllers/reservationController';
import { requireAuth, requireVerified } from './middleware/authMiddleware';
import { sessionConfig } from './config/session';
import pool from './config/database';
import { me } from './controllers/authController';
import { csrfProtection } from './middleware/csrf';
import * as QuoteModel from './models/QuoteDB';
import * as NotificationService from './services/notificationService';
import * as AnalyticsService from './services/analyticsService';
import { postAnalyticsEvent } from './controllers/analyticsController';
import { sendQuoteSubmissionEmails } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FEET_PER_METER = 3.280839895;
const PRICE_PER_SQ_FOOT = 350;
const ALLOWED_GLASS_TYPES = new Set(['clear glass', 'bronze glass', 'frosted glass', 'tempered glass']);
const ALLOWED_FRAME_MATERIALS = new Set(['aluminum frame', 'steel frame', 'stainless frame']);
const ALLOWED_COLOR_TINTS = new Set(['clear', 'euro gray', 'dark gray', 'bronze', 'dark bronze', 'green']);
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
  .filter(Boolean)
  .flatMap((value) => String(value).split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

// ---- Middleware ----
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (!isProduction) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0) {
      return callback(new Error('CORS is not configured. Set CORS_ORIGIN or FRONTEND_URL.'), false);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS.'), false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(session(sessionConfig));

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    pool.query(
      `INSERT INTO system_logs (endpoint, method, response_time, status_code)
       VALUES ($1, $2, $3, $4)`,
      [req.originalUrl, req.method, elapsedMs, res.statusCode],
    ).catch((err: any) => {
      console.warn('[SYSTEM LOG] failed to persist request log:', err.message);
    });
  });
  next();
});

// ---- Mount route modules ----
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', paymentRoutes);
app.use('/uploads', express.static('uploads'));
app.post('/api/analytics/events', requireAuth, postAnalyticsEvent);
app.get('/api/user/me', me);

// ---- Protected quote access check ----
app.get('/api/quote-access', requireAuth, requireVerified, (_req, res) => {
  res.json({ allowed: true });
});

// ---- Reservation dates used by the quote calendar ----
app.get('/api/reservations/dates', requireAuth, requireVerified, listReservedDatesHandler);

// ---- Popular materials (approved/confirmed history only) ----
app.get('/api/quotes/popular-materials', requireAuth, requireVerified, async (req, res) => {
  try {
    const projectType = sanitizeText(String(req.query.projectType || '')) || undefined;
    const popularMaterials = await QuoteModel.getPopularMaterials(projectType);
    return res.json({ success: true, data: popularMaterials });
  } catch (err: any) {
    console.error('[POPULAR MATERIALS] error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to load popular material choices.' });
  }
});

// ---- Rate limiter: 5 submissions per IP per hour ----
const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many quote requests. Please try again later.' },
  statusCode: 429,
});

// ============================================================
// POST /api/quotes — Public quote submission
// ============================================================
app.post('/api/quotes', requireAuth, requireVerified, csrfProtection, quoteLimiter, async (req, res) => {
  try {
    const body = req.body;

    // ---- Server-side validation (never trust frontend) ----
    const errors: string[] = [];

    // Category
    const category = sanitizeText(body.project || '');
    if (!category) errors.push('Project category is required.');
    const categoryOther = body.projectCategoryOther ? sanitizeOther(body.projectCategoryOther) : null;
    if (category.toLowerCase().startsWith('other') && (!categoryOther || !isValidOther(categoryOther))) {
      errors.push('Please specify the "Other" project category.');
    }

    // Glass type
    const glassType = sanitizeText(body.glassType || '');
    if (!glassType) errors.push('Glass type is required.');
    if (glassType && !ALLOWED_GLASS_TYPES.has(glassType.toLowerCase())) {
      errors.push('Glass type must be one of the predefined options.');
    }

    // Frame material
    const material = sanitizeText(body.material || '');
    if (!material) errors.push('Frame material is required.');
    if (material && !ALLOWED_FRAME_MATERIALS.has(material.toLowerCase())) {
      errors.push('Frame material must be one of the predefined options.');
    }

    // Color / tint
    const color = sanitizeText(body.color || '');
    if (!color) errors.push('Color / tint is required.');
    if (color && !ALLOWED_COLOR_TINTS.has(color.toLowerCase())) {
      errors.push('Color / tint must be one of the predefined options.');
    }

    // Materials step no longer accepts custom "other" text inputs.
    const glassTypeOther = sanitizeText(body.glassTypeOther || '');
    const colorOther = sanitizeText(body.colorOther || '');
    if (glassTypeOther || colorOther) {
      errors.push('Custom material values are not allowed. Please choose from predefined options.');
    }

    // Measurements
    const unit = (['cm', 'm', 'ft', 'in'] as const).includes(body.measurementUnit) ? body.measurementUnit : 'cm';
    const rawWidth = parseFloat(body.width);
    const rawHeight = parseFloat(body.height);
    if (isNaN(rawWidth) || !isValidMeasurement(rawWidth, unit)) {
      errors.push('Width must be a positive number (max 100m).');
    }
    if (isNaN(rawHeight) || !isValidMeasurement(rawHeight, unit)) {
      errors.push('Height must be a positive number (max 100m).');
    }

    // Phone
    const phonePlain = cleanPhone(body.phone_plain || body.phone || '');
    if (!isValidPhPhone(phonePlain)) {
      errors.push('Please enter a valid Philippine mobile number (11 digits starting with 09).');
    }

    // Address
    const address = sanitizeText(body.address || '');
    if (!isValidAddress(address)) {
      errors.push('Please enter a complete address (minimum 10 characters).');
    }

    // Reservation date
    const reservationDate = sanitizeText(body.reservationDate || '');
    if (!reservationDate) {
      errors.push('Reservation date is required.');
    } else {
      const dateValidation = validateReservationDate(reservationDate);
      if (!dateValidation.ok) {
        errors.push(dateValidation.message || 'Invalid reservation date.');
      }
    }

    // Name & email are always resolved from authenticated session
    const customer = sanitizeText(req.session.userName || '');
    const email = sanitizeText(req.session.userEmail || '');
    if (!customer) errors.push('Authenticated user name is required.');
    if (!email) errors.push('Authenticated user email is required.');

    // Return all errors
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    // ---- Compute values ----
    const widthM = toMeters(rawWidth, unit);
    const heightM = toMeters(rawHeight, unit);
    const widthCm = widthM * 100;
    const heightCm = heightM * 100;
    const widthFeet = widthM * FEET_PER_METER;
    const heightFeet = heightM * FEET_PER_METER;
    const areaSqFeet = widthFeet * heightFeet;
    const estimatedCost = Math.round(areaSqFeet * PRICE_PER_SQ_FOOT * 100) / 100;
    const notes = sanitizeText(body.notes || '');
    const quantity = parseInt(body.quantity) || 1;

    // ---- Log (masked phone) ----
    console.log(`[QUOTE] New from ${customer} | phone: ${maskPhone(phonePlain)} | ${widthCm}cm x ${heightCm}cm`);

    // ---- Find customer_id if they have a registered account ----
    let customerId: string | undefined;
    try {
      const userResult = await pool.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1`,
        [email]
      );
      if (userResult.rows.length > 0) customerId = userResult.rows[0].id;
    } catch { /* User lookup is best-effort */ }

    // ---- Insert using QuoteDB model ----
    const quote = await QuoteModel.createQuote({
      customerId,
      customerName: customer,
      customerEmail: email,
      customerPhone: phonePlain,
      customerAddress: address,
      projectType: category,
      glassType,
      frameMaterial: material,
      width: widthCm,
      height: heightCm,
      quantity,
      color,
      estimatedCost,
      notes: notes || undefined,
    });

    try {
      await ReservationModel.createReservation(quote.id, reservationDate);
    } catch (reservationErr: any) {
      if (ReservationModel.isReservationConflictError(reservationErr)) {
        await QuoteModel.softDeleteQuote(quote.id);
        return res.status(409).json({ success: false, error: 'The selected reservation date is already booked.' });
      }
      throw reservationErr;
    }

    // Notify admins about new quote
    await AnalyticsService.trackEvent('quote_submitted', req.session?.userId, {
      quoteNumber: quote.quoteNumber,
      projectType: category,
    });
    NotificationService.notifyAdminsNewQuote(quote.quoteNumber, customer).catch(() => {});
    sendQuoteSubmissionEmails(quote).catch((e) => {
      console.error('[EMAIL]', e.message);
    });

    return res.status(201).json({ success: true, data: { id: quote.quoteNumber } });
  } catch (err: any) {
    console.error('[SERVER ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ---- Health check ----
app.get('/api/health', async (_req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW() AS db_time');
    const userCount = await pool.query('SELECT COUNT(*) AS total FROM users');
    const tokenCount = await pool.query('SELECT COUNT(*) AS total FROM email_verification_tokens');
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      database: 'connected',
      db_time: dbCheck.rows[0].db_time,
      tables: {
        users: parseInt(userCount.rows[0].total, 10),
        email_verification_tokens: parseInt(tokenCount.rows[0].total, 10),
      },
    });
  } catch (err: any) {
    res.json({
      status: 'degraded',
      time: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
      code: err.code,
    });
  }
});

// ---- Live view: list all users (dev only) ----
app.get('/api/dev/users', async (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, is_verified, failed_login_attempts,
              lock_until, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ count: result.rows.length, users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- CSRF error handler ----
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  return next(err);
});

// ---- Start ----
async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connection successful.');
  } catch (err: any) {
    console.error('[DB] Connection failed:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      cause: err.cause,
    });
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Ermel Quote API running on port ${PORT}`);
  });
}

startServer().catch((err: any) => {
  console.error('[SERVER] Failed to start:', err.message);
  process.exit(1);
});

export default app;
