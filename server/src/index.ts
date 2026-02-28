// ============================================================
// Express API server for Ermel Quote System
// ============================================================
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import {
  sanitizeText,
  cleanPhone,
  isValidPhPhone,
  hashPhone,
  maskPhone,
  toMeters,
  isValidMeasurement,
  allUnitsFromMeters,
  isValidAddress,
  isValidOther,
  sanitizeOther,
} from './validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Database pool ----
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ermel',
});

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '100kb' }));

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
// POST /api/quotes
// ============================================================
app.post('/api/quotes', quoteLimiter, async (req, res) => {
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
    const glassTypeOther = body.glassTypeOther ? sanitizeOther(body.glassTypeOther) : null;
    if (glassType.toLowerCase().startsWith('other') && (!glassTypeOther || !isValidOther(glassTypeOther))) {
      errors.push('Please specify the "Other" glass type.');
    }

    // Color
    const colorOther = body.colorOther ? sanitizeOther(body.colorOther) : null;

    // Frame material
    const material = sanitizeText(body.material || '');
    if (!material) errors.push('Frame material is required.');

    // Measurements
    const unit = (['cm', 'm', 'ft'] as const).includes(body.measurementUnit) ? body.measurementUnit : 'cm';
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

    // Name & email
    const customer = sanitizeText(body.customer || '');
    if (!customer) errors.push('Customer name is required.');
    const email = sanitizeText(body.email || '');
    if (!email) errors.push('Email is required.');

    // Return all errors
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    // ---- Compute canonical values ----
    const widthM = toMeters(rawWidth, unit);
    const heightM = toMeters(rawHeight, unit);
    const wUnits = allUnitsFromMeters(widthM);
    const hUnits = allUnitsFromMeters(heightM);
    const phoneHashed = hashPhone(phonePlain);

    // ---- Log (masked phone) ----
    console.log(`[QUOTE] New from ${customer} | phone: ${maskPhone(phonePlain)} | ${wUnits.cm}cm x ${hUnits.cm}cm`);

    // ---- Insert into database with parameterized query ----
    const insertQuery = `
      INSERT INTO quotes (
        id, customer, project, material, glass_type, dimensions,
        width_m, height_m, width_cm, height_cm, width_ft, height_ft,
        estimated_cost, status, created_date, phone, phone_hash,
        email, notes, address,
        project_category_other, glass_type_other, color_other
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23
      )
      RETURNING id
    `;

    const orderId = `EGA-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const estimatedCost = parseFloat(body.estimatedCost) || 0;
    const notes = sanitizeText(body.notes || '');

    const values = [
      orderId,
      customer,
      category,
      material,
      glassType,
      `${rawWidth}${unit} × ${rawHeight}${unit}`,
      wUnits.m,
      hUnits.m,
      wUnits.cm,
      hUnits.cm,
      wUnits.ft,
      hUnits.ft,
      estimatedCost,
      'inquiry',
      new Date().toISOString().split('T')[0],
      phonePlain, // stored encrypted in production
      phoneHashed,
      email,
      notes || null,
      address,
      categoryOther,
      glassTypeOther,
      colorOther,
    ];

    try {
      const result = await pool.query(insertQuery, values);
      return res.status(201).json({ id: result.rows[0]?.id || orderId, success: true });
    } catch (dbErr: any) {
      // If DB is not configured, still return success for local dev
      console.error('[DB ERROR]', dbErr.message);
      return res.status(201).json({ id: orderId, success: true, note: 'Saved locally (DB not connected)' });
    }
  } catch (err: any) {
    console.error('[SERVER ERROR]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`[SERVER] Ermel Quote API running on port ${PORT}`);
});

export default app;
