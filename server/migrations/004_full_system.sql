-- ============================================================
-- Migration 004: Full System — UUID-based tables with soft deletes
-- Replaces in-memory models with real PostgreSQL persistence
-- ============================================================

-- Enable UUID generation (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Add role column to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- 2. Quotation Quotes table (UUID-based, replaces quotation_quotes)
-- ============================================================
CREATE TABLE IF NOT EXISTS qq_quotes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number     VARCHAR(10) NOT NULL UNIQUE,
    customer_id      UUID REFERENCES users(id),
    customer_name    VARCHAR(200) NOT NULL,
    customer_email   VARCHAR(254) NOT NULL,
    customer_phone   VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    project_type     VARCHAR(100) NOT NULL,
    glass_type       VARCHAR(100) NOT NULL,
    frame_material   VARCHAR(100) NOT NULL,
    width            NUMERIC(10,2) NOT NULL,
    height           NUMERIC(10,2) NOT NULL,
    quantity         INTEGER NOT NULL DEFAULT 1,
    color            VARCHAR(50) NOT NULL DEFAULT 'Clear',
    estimated_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
    status           VARCHAR(30) NOT NULL DEFAULT 'pending',
    submission_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    rejection_reason TEXT,
    approved_date    DATE,
    expiry_date      DATE,
    accepted_date    DATE,
    declined_date    DATE,
    converted_date   DATE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

-- Sequence for quote numbers (Q-0001, Q-0002, ...)
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START WITH 1;

CREATE INDEX IF NOT EXISTS idx_qq_quotes_status ON qq_quotes(status);
CREATE INDEX IF NOT EXISTS idx_qq_quotes_customer_email ON qq_quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_qq_quotes_customer_id ON qq_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_qq_quotes_submission_date ON qq_quotes(submission_date);
CREATE INDEX IF NOT EXISTS idx_qq_quotes_deleted_at ON qq_quotes(deleted_at);

-- ============================================================
-- 3. Installation Orders table (UUID-based)
-- ============================================================
CREATE TABLE IF NOT EXISTS qq_orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number          VARCHAR(10) NOT NULL UNIQUE,
    quote_id              UUID NOT NULL REFERENCES qq_quotes(id),
    customer_id           UUID REFERENCES users(id),
    customer_name         VARCHAR(200) NOT NULL,
    project_type          VARCHAR(100) NOT NULL,
    dimensions            VARCHAR(100) NOT NULL,
    installation_status   VARCHAR(30) NOT NULL DEFAULT 'materials_ordered',
    order_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    installation_schedule DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);

-- Sequence for order numbers (ORD-0001, ORD-0002, ...)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

CREATE INDEX IF NOT EXISTS idx_qq_orders_status ON qq_orders(installation_status);
CREATE INDEX IF NOT EXISTS idx_qq_orders_quote ON qq_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_qq_orders_customer_id ON qq_orders(customer_id);

-- ============================================================
-- 4. Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- ============================================================
-- 5. Activity Logs table (UUID-based)
-- ============================================================
CREATE TABLE IF NOT EXISTS qq_activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(200) NOT NULL,
    entity      VARCHAR(50),
    entity_id   VARCHAR(50),
    quote_id    UUID REFERENCES qq_quotes(id),
    order_id    UUID REFERENCES qq_orders(id),
    user_role   VARCHAR(20) NOT NULL DEFAULT 'admin',
    user_name   VARCHAR(100) NOT NULL DEFAULT 'System',
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qq_al_quote ON qq_activity_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_qq_al_order ON qq_activity_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_qq_al_user ON qq_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_qq_al_created ON qq_activity_logs(created_at);

-- ============================================================
-- 6. Helper function for updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-update updated_at on modifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_qq_quotes_updated_at') THEN
        CREATE TRIGGER trg_qq_quotes_updated_at
            BEFORE UPDATE ON qq_quotes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_qq_orders_updated_at') THEN
        CREATE TRIGGER trg_qq_orders_updated_at
            BEFORE UPDATE ON qq_orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
