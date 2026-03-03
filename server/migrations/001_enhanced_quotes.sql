-- ============================================================
-- Database Migration: Enhanced Quote System
-- Run against PostgreSQL ermel database
-- ============================================================

-- Create quotes table if not already present
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns (idempotent)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_category_other TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS glass_type_other TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS color_other TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS width_m NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS height_m NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS width_cm NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS width_ft NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS height_ft NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS phone_hash TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS address TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_phone_hash ON quotes (phone_hash);
