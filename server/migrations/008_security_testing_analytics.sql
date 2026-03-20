-- ============================================================
-- Migration 008: Security, analytics, and monitoring support
-- ============================================================

-- 1) Login attempt audit table
CREATE TABLE IF NOT EXISTS auth_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(254) NOT NULL,
    ip_address  VARCHAR(64) NOT NULL,
    success     BOOLEAN NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_email_created ON auth_logs(email, created_at DESC);

-- 2) Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(64) NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type_created ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON analytics_events(user_id, created_at DESC);

-- 3) API/system monitoring logs
CREATE TABLE IF NOT EXISTS system_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint       TEXT NOT NULL,
    method         VARCHAR(16) NOT NULL,
    response_time  NUMERIC(10,3) NOT NULL,
    status_code    INTEGER NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_status_created ON system_logs(status_code, created_at DESC);

-- 4) Notification compatibility columns and tracking logs
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(64);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_quote_number VARCHAR(20);

-- Keep old and new read columns in sync for existing rows
UPDATE notifications
SET is_read = COALESCE(is_read, read),
    content = COALESCE(content, message)
WHERE TRUE;

CREATE TABLE IF NOT EXISTS notification_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id  UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    event_type       VARCHAR(16) NOT NULL CHECK (event_type IN ('sent', 'received', 'read')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON notification_logs(notification_id, created_at DESC);
