// ============================================================
// Database migration for enhanced quote system (PostgreSQL)
// Run: npm run migrate
// ============================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ermel',
});

const MIGRATION_SQL = `
-- Create quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  project TEXT NOT NULL,
  material TEXT NOT NULL,
  glass_type TEXT NOT NULL,
  dimensions TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  approved_cost NUMERIC,
  status TEXT DEFAULT 'inquiry',
  created_date DATE DEFAULT CURRENT_DATE,
  scheduled_date DATE,
  phone TEXT,
  email TEXT,
  notes TEXT,
  paid BOOLEAN DEFAULT FALSE,
  payment_uploaded BOOLEAN DEFAULT FALSE,
  -- New columns for enhanced quotation system
  project_category_other TEXT,
  glass_type_other TEXT,
  color_other TEXT,
  width_m NUMERIC,
  height_m NUMERIC,
  width_cm NUMERIC,
  height_cm NUMERIC,
  width_ft NUMERIC,
  height_ft NUMERIC,
  phone_hash TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to existing table (safe: IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='project_category_other') THEN
    ALTER TABLE quotes ADD COLUMN project_category_other TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='glass_type_other') THEN
    ALTER TABLE quotes ADD COLUMN glass_type_other TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='color_other') THEN
    ALTER TABLE quotes ADD COLUMN color_other TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='width_m') THEN
    ALTER TABLE quotes ADD COLUMN width_m NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='height_m') THEN
    ALTER TABLE quotes ADD COLUMN height_m NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='width_cm') THEN
    ALTER TABLE quotes ADD COLUMN width_cm NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='height_cm') THEN
    ALTER TABLE quotes ADD COLUMN height_cm NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='width_ft') THEN
    ALTER TABLE quotes ADD COLUMN width_ft NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='height_ft') THEN
    ALTER TABLE quotes ADD COLUMN height_ft NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='phone_hash') THEN
    ALTER TABLE quotes ADD COLUMN phone_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='address') THEN
    ALTER TABLE quotes ADD COLUMN address TEXT;
  END IF;
END
$$;

-- Index for rate-limiting lookups and address retention policy
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_phone_hash ON quotes (phone_hash);
`;

async function migrate() {
  console.log('[MIGRATE] Running database migration...');
  try {
    await pool.query(MIGRATION_SQL);
    console.log('[MIGRATE] Migration completed successfully.');
  } catch (err: any) {
    console.error('[MIGRATE] Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
