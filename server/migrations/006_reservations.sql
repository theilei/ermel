-- ============================================================
-- Migration 006: Reservations for installation scheduling
-- ============================================================

CREATE TABLE IF NOT EXISTS reservations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id         UUID NOT NULL REFERENCES qq_quotes(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reservations_quote_unique UNIQUE (quote_id),
    CONSTRAINT reservations_date_unique UNIQUE (reservation_date),
    CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reservations_updated_at') THEN
        CREATE TRIGGER trg_reservations_updated_at
            BEFORE UPDATE ON reservations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
