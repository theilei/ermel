-- ============================================================
-- Migration 011: Quote Payments System
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id               UUID NOT NULL REFERENCES qq_quotes(id) ON DELETE CASCADE,
    payment_method         VARCHAR(10) NOT NULL,
    proof_file             TEXT,
    proof_mime             VARCHAR(100),
    status                 VARCHAR(10) NOT NULL DEFAULT 'pending',
    admin_rejection_reason TEXT,
    submitted_at           TIMESTAMPTZ,
    verified_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_quote_unique UNIQUE (quote_id),
    CONSTRAINT payments_method_check CHECK (payment_method IN ('qrph', 'cash')),
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payments_updated_at') THEN
            CREATE TRIGGER trg_payments_updated_at
                BEFORE UPDATE ON payments
                FOR EACH ROW
                EXECUTE FUNCTION set_updated_at();
        END IF;
    END IF;
END $$;
