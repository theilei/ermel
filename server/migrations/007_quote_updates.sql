-- ============================================================
-- Migration 007: Quote updates history + price/status extensions
-- ============================================================

ALTER TABLE qq_quotes
  ADD COLUMN IF NOT EXISTS updated_cost NUMERIC(12,2);

CREATE INDEX IF NOT EXISTS idx_qq_quotes_updated_cost ON qq_quotes(updated_cost);

CREATE TABLE IF NOT EXISTS quote_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES qq_quotes(id) ON DELETE CASCADE,
  status VARCHAR(30),
  estimated_price NUMERIC(12,2),
  updated_price NUMERIC(12,2),
  admin_remark TEXT,
  admin_name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_updates_quote_id ON quote_updates(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_updates_created_at ON quote_updates(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_quote_updates_updated_at') THEN
    CREATE TRIGGER trg_quote_updates_updated_at
      BEFORE UPDATE ON quote_updates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type VARCHAR(60),
  ADD COLUMN IF NOT EXISTS related_quote_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_notifications_related_quote ON notifications(related_quote_number);
