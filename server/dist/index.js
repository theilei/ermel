"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================
// Express API server for Ermel Quote System
// ============================================================
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const validation_1 = require("./validation");
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const ReservationModel = __importStar(require("./models/ReservationDB"));
const reservationController_1 = require("./controllers/reservationController");
const authMiddleware_1 = require("./middleware/authMiddleware");
const session_1 = require("./config/session");
const database_1 = __importDefault(require("./config/database"));
const authController_1 = require("./controllers/authController");
const csrf_1 = require("./middleware/csrf");
const QuoteModel = __importStar(require("./models/QuoteDB"));
const NotificationService = __importStar(require("./services/notificationService"));
const AnalyticsService = __importStar(require("./services/analyticsService"));
const analyticsController_1 = require("./controllers/analyticsController");
const emailService_1 = require("./services/emailService");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
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
app.use(express_1.default.json({ limit: '100kb' }));
app.use((0, express_session_1.default)(session_1.sessionConfig));
app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
        database_1.default.query(`INSERT INTO system_logs (endpoint, method, response_time, status_code)
       VALUES ($1, $2, $3, $4)`, [req.originalUrl, req.method, elapsedMs, res.statusCode]).catch((err) => {
            console.warn('[SYSTEM LOG] failed to persist request log:', err.message);
        });
    });
    next();
});
// ---- Mount route modules ----
app.use('/api/auth', authRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/customer', customerRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api', paymentRoutes_1.default);
app.use('/uploads', express_1.default.static('uploads'));
app.post('/api/analytics/events', authMiddleware_1.requireAuth, analyticsController_1.postAnalyticsEvent);
app.get('/api/user/me', authController_1.me);
// ---- Protected quote access check ----
app.get('/api/quote-access', authMiddleware_1.requireAuth, authMiddleware_1.requireVerified, (_req, res) => {
    res.json({ allowed: true });
});
// ---- Reservation dates used by the quote calendar ----
app.get('/api/reservations/dates', authMiddleware_1.requireAuth, authMiddleware_1.requireVerified, reservationController_1.listReservedDates);
// ---- Popular materials (approved/confirmed history only) ----
app.get('/api/quotes/popular-materials', authMiddleware_1.requireAuth, authMiddleware_1.requireVerified, async (req, res) => {
    try {
        const projectType = (0, validation_1.sanitizeText)(String(req.query.projectType || '')) || undefined;
        const popularMaterials = await QuoteModel.getPopularMaterials(projectType);
        return res.json({ success: true, data: popularMaterials });
    }
    catch (err) {
        console.error('[POPULAR MATERIALS] error:', err.message);
        return res.status(500).json({ success: false, message: 'Unable to load popular material choices.' });
    }
});
// ---- Rate limiter: 5 submissions per IP per hour ----
const quoteLimiter = (0, express_rate_limit_1.default)({
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
app.post('/api/quotes', authMiddleware_1.requireAuth, authMiddleware_1.requireVerified, csrf_1.csrfProtection, quoteLimiter, async (req, res) => {
    try {
        const body = req.body;
        // ---- Server-side validation (never trust frontend) ----
        const errors = [];
        // Category
        const category = (0, validation_1.sanitizeText)(body.project || '');
        if (!category)
            errors.push('Project category is required.');
        const categoryOther = body.projectCategoryOther ? (0, validation_1.sanitizeOther)(body.projectCategoryOther) : null;
        if (category.toLowerCase().startsWith('other') && (!categoryOther || !(0, validation_1.isValidOther)(categoryOther))) {
            errors.push('Please specify the "Other" project category.');
        }
        // Glass type
        const glassType = (0, validation_1.sanitizeText)(body.glassType || '');
        if (!glassType)
            errors.push('Glass type is required.');
        if (glassType && !ALLOWED_GLASS_TYPES.has(glassType.toLowerCase())) {
            errors.push('Glass type must be one of the predefined options.');
        }
        // Frame material
        const material = (0, validation_1.sanitizeText)(body.material || '');
        if (!material)
            errors.push('Frame material is required.');
        if (material && !ALLOWED_FRAME_MATERIALS.has(material.toLowerCase())) {
            errors.push('Frame material must be one of the predefined options.');
        }
        // Color / tint
        const color = (0, validation_1.sanitizeText)(body.color || '');
        if (!color)
            errors.push('Color / tint is required.');
        if (color && !ALLOWED_COLOR_TINTS.has(color.toLowerCase())) {
            errors.push('Color / tint must be one of the predefined options.');
        }
        // Materials step no longer accepts custom "other" text inputs.
        const glassTypeOther = (0, validation_1.sanitizeText)(body.glassTypeOther || '');
        const colorOther = (0, validation_1.sanitizeText)(body.colorOther || '');
        if (glassTypeOther || colorOther) {
            errors.push('Custom material values are not allowed. Please choose from predefined options.');
        }
        // Measurements
        const unit = ['cm', 'm', 'ft', 'in'].includes(body.measurementUnit) ? body.measurementUnit : 'cm';
        const rawWidth = parseFloat(body.width);
        const rawHeight = parseFloat(body.height);
        if (isNaN(rawWidth) || !(0, validation_1.isValidMeasurement)(rawWidth, unit)) {
            errors.push('Width must be a positive number (max 100m).');
        }
        if (isNaN(rawHeight) || !(0, validation_1.isValidMeasurement)(rawHeight, unit)) {
            errors.push('Height must be a positive number (max 100m).');
        }
        // Phone
        const phonePlain = (0, validation_1.cleanPhone)(body.phone_plain || body.phone || '');
        if (!(0, validation_1.isValidPhPhone)(phonePlain)) {
            errors.push('Please enter a valid Philippine mobile number (11 digits starting with 09).');
        }
        // Address
        const address = (0, validation_1.sanitizeText)(body.address || '');
        if (!(0, validation_1.isValidAddress)(address)) {
            errors.push('Please enter a complete address (minimum 10 characters).');
        }
        // Reservation date
        const reservationDate = (0, validation_1.sanitizeText)(body.reservationDate || '');
        if (!reservationDate) {
            errors.push('Reservation date is required.');
        }
        else {
            const dateValidation = (0, reservationController_1.validateReservationDate)(reservationDate);
            if (!dateValidation.ok) {
                errors.push(dateValidation.message || 'Invalid reservation date.');
            }
        }
        // Name & email are always resolved from authenticated session
        const customer = (0, validation_1.sanitizeText)(req.session.userName || '');
        const email = (0, validation_1.sanitizeText)(req.session.userEmail || '');
        if (!customer)
            errors.push('Authenticated user name is required.');
        if (!email)
            errors.push('Authenticated user email is required.');
        // Return all errors
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors.join(' ') });
        }
        // ---- Compute values ----
        const widthM = (0, validation_1.toMeters)(rawWidth, unit);
        const heightM = (0, validation_1.toMeters)(rawHeight, unit);
        const widthCm = widthM * 100;
        const heightCm = heightM * 100;
        const widthFeet = widthM * FEET_PER_METER;
        const heightFeet = heightM * FEET_PER_METER;
        const areaSqFeet = widthFeet * heightFeet;
        const estimatedCost = Math.round(areaSqFeet * PRICE_PER_SQ_FOOT * 100) / 100;
        const notes = (0, validation_1.sanitizeText)(body.notes || '');
        const quantity = parseInt(body.quantity) || 1;
        // ---- Log (masked phone) ----
        console.log(`[QUOTE] New from ${customer} | phone: ${(0, validation_1.maskPhone)(phonePlain)} | ${widthCm}cm x ${heightCm}cm`);
        // ---- Find customer_id if they have a registered account ----
        let customerId;
        try {
            const userResult = await database_1.default.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1`, [email]);
            if (userResult.rows.length > 0)
                customerId = userResult.rows[0].id;
        }
        catch { /* User lookup is best-effort */ }
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
        }
        catch (reservationErr) {
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
        NotificationService.notifyAdminsNewQuote(quote.quoteNumber, customer).catch(() => { });
        (0, emailService_1.sendQuoteSubmissionEmails)(quote).catch((e) => {
            console.error('[EMAIL]', e.message);
        });
        return res.status(201).json({ success: true, data: { id: quote.quoteNumber } });
    }
    catch (err) {
        console.error('[SERVER ERROR]', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});
// ---- Health check ----
app.get('/api/health', async (_req, res) => {
    try {
        const dbCheck = await database_1.default.query('SELECT NOW() AS db_time');
        const userCount = await database_1.default.query('SELECT COUNT(*) AS total FROM users');
        const tokenCount = await database_1.default.query('SELECT COUNT(*) AS total FROM email_verification_tokens');
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
    }
    catch (err) {
        res.json({
            status: 'degraded',
            time: new Date().toISOString(),
            database: 'disconnected',
            error: err.message,
        });
    }
});
// ---- Live view: list all users (dev only) ----
app.get('/api/dev/users', async (_req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production.' });
    }
    try {
        const result = await database_1.default.query(`SELECT id, full_name, email, is_verified, failed_login_attempts,
              lock_until, created_at, updated_at
       FROM users ORDER BY created_at DESC`);
        res.json({ count: result.rows.length, users: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ---- CSRF error handler ----
app.use((err, _req, res, next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return next(err);
});
// ---- Start ----
async function startServer() {
    try {
        await database_1.default.query('SELECT 1');
        console.log('[DB] Connection successful.');
    }
    catch (err) {
        console.error('[DB] Connection failed:', err.message);
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`[SERVER] Ermel Quote API running on port ${PORT}`);
    });
}
startServer().catch((err) => {
    console.error('[SERVER] Failed to start:', err.message);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map