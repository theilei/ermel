-- ============================================================
-- Migration 005: Legacy orders table (admin dashboard orders)
-- These are the general project/order tracking entries separate
-- from the quotation-based installation orders.
-- ============================================================

CREATE TABLE IF NOT EXISTS legacy_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  TEXT NOT NULL UNIQUE,
  customer      TEXT NOT NULL,
  project       TEXT NOT NULL,
  material      TEXT NOT NULL DEFAULT 'Aluminum Frame',
  glass_type    TEXT NOT NULL DEFAULT 'Clear Glass',
  dimensions    TEXT NOT NULL DEFAULT '',
  width         NUMERIC(10,2) NOT NULL DEFAULT 0,
  height        NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_cost  NUMERIC(12,2),
  status        TEXT NOT NULL DEFAULT 'inquiry'
                CHECK (status IN ('inquiry','quotation','ordering','fabrication','installation')),
  phone         TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  address       TEXT,
  notes         TEXT,
  paid          BOOLEAN NOT NULL DEFAULT FALSE,
  payment_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_date DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER legacy_orders_updated_at
  BEFORE UPDATE ON legacy_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence for order numbers (EGA-YYYY-NNN)
CREATE SEQUENCE IF NOT EXISTS legacy_order_seq START WITH 1;
