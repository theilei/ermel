-- ============================================================
-- Migration 012: Schema safety cleanup (backward-compatible)
-- ============================================================
-- Goals:
-- 1) Fix payments status default/check mismatch safely
-- 2) Mark legacy-domain tables as archived (no deletion)
-- 3) Add nullable UUID references to legacy activity_logs
-- 4) Canonicalize notifications read state to is_read (keep read for compatibility)
-- 5) Remove over-restrictive global UNIQUE(reservation_date)
-- 6) Add qq_orders quote uniqueness only when existing data is safe
-- 7) Add safe integrity/index/timestamp improvements

BEGIN;

DO $$
DECLARE
  has_payments boolean;
  rec record;
BEGIN
  has_payments := to_regclass('public.payments') IS NOT NULL;

  IF has_payments THEN
    RAISE NOTICE '[012] payments table found; applying status fix.';

    -- Allow longer values like waiting_approval even if older schema used VARCHAR(10).
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'status'
        AND (data_type = 'character varying' OR data_type = 'character')
    ) THEN
      EXECUTE 'ALTER TABLE public.payments ALTER COLUMN status TYPE VARCHAR(32)';
      RAISE NOTICE '[012] payments.status widened to VARCHAR(32).';
    END IF;

    -- Required fix: set default to waiting_approval.
    EXECUTE 'ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT ''waiting_approval''';

    -- Required fix: normalize old pending rows.
    EXECUTE 'UPDATE public.payments SET status = ''waiting_approval'' WHERE status = ''pending''';

    -- Replace any legacy status check with the new allowed set.
    FOR rec IN
      SELECT c.conname, pg_get_constraintdef(c.oid) AS condef
      FROM pg_constraint c
      WHERE c.conrelid = 'public.payments'::regclass
        AND c.contype = 'c'
    LOOP
      IF rec.condef ~* '\mstatus\M' THEN
        EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', rec.conname);
        RAISE NOTICE '[012] Dropped old payments status check: %', rec.conname;
      END IF;
    END LOOP;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.payments'::regclass
        AND conname = 'payments_status_check'
    ) THEN
      EXECUTE 'ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN (''waiting_approval'', ''paid'', ''expired''))';
      RAISE NOTICE '[012] Added payments_status_check with waiting_approval/paid/expired.';
    END IF;
  ELSE
    RAISE NOTICE '[012] payments table not found; skipped payments status fix.';
  END IF;
END
$$;

DO $$
DECLARE
  tbl text;
  legacy_tables text[] := ARRAY[
    'quotation_quotes',
    'installation_orders',
    'quotes',
    'legacy_orders'
  ];
BEGIN
  FOREACH tbl IN ARRAY legacy_tables
  LOOP
    IF to_regclass(format('public.%s', tbl)) IS NOT NULL THEN
      EXECUTE format(
        'COMMENT ON TABLE public.%I IS %L',
        tbl,
        'LEGACY - DO NOT USE FOR NEW FEATURES'
      );
      RAISE NOTICE '[012] Marked % as LEGACY archive.', tbl;
    ELSE
      RAISE NOTICE '[012] Legacy table % not found; skipped comment.', tbl;
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.activity_logs') IS NOT NULL THEN
    -- Keep old varchar IDs intact; extend with nullable UUID refs.
    ALTER TABLE public.activity_logs
      ADD COLUMN IF NOT EXISTS quote_uuid UUID,
      ADD COLUMN IF NOT EXISTS order_uuid UUID;

    IF to_regclass('public.qq_quotes') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.activity_logs'::regclass
          AND conname = 'activity_logs_quote_uuid_fkey'
      ) THEN
      ALTER TABLE public.activity_logs
        ADD CONSTRAINT activity_logs_quote_uuid_fkey
        FOREIGN KEY (quote_uuid) REFERENCES public.qq_quotes(id) NOT VALID;
      ALTER TABLE public.activity_logs
        VALIDATE CONSTRAINT activity_logs_quote_uuid_fkey;
      RAISE NOTICE '[012] Added activity_logs.quote_uuid FK -> qq_quotes(id).';
    END IF;

    IF to_regclass('public.qq_orders') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.activity_logs'::regclass
          AND conname = 'activity_logs_order_uuid_fkey'
      ) THEN
      ALTER TABLE public.activity_logs
        ADD CONSTRAINT activity_logs_order_uuid_fkey
        FOREIGN KEY (order_uuid) REFERENCES public.qq_orders(id) NOT VALID;
      ALTER TABLE public.activity_logs
        VALIDATE CONSTRAINT activity_logs_order_uuid_fkey;
      RAISE NOTICE '[012] Added activity_logs.order_uuid FK -> qq_orders(id).';
    END IF;

    CREATE INDEX IF NOT EXISTS idx_activity_logs_quote_uuid ON public.activity_logs(quote_uuid);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_order_uuid ON public.activity_logs(order_uuid);
  ELSE
    RAISE NOTICE '[012] activity_logs table not found; skipped UUID extension.';
  END IF;
END
$$;

DO $notify$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    -- Canonical column for read state.
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN;

    -- Keep compatibility with older code paths that still reference read.
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS read BOOLEAN;

    -- Required migration step.
    UPDATE public.notifications
    SET is_read = COALESCE(is_read, read, FALSE),
        read = COALESCE(is_read, read, FALSE)
    WHERE is_read IS NULL
       OR read IS NULL
       OR is_read <> read;

    ALTER TABLE public.notifications
      ALTER COLUMN is_read SET DEFAULT FALSE,
      ALTER COLUMN read SET DEFAULT FALSE;

    ALTER TABLE public.notifications
      ALTER COLUMN is_read SET NOT NULL,
      ALTER COLUMN read SET NOT NULL;

    COMMENT ON COLUMN public.notifications.read IS 'DEPRECATED - use is_read for new features';

    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

    -- Optional timestamp hardening for mutable row state.
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE OR REPLACE FUNCTION public.sync_notifications_read_flags()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.is_read := COALESCE(NEW.is_read, NEW.read, FALSE);
      NEW.read := NEW.is_read;
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trg_notifications_sync_read_flags'
    ) THEN
      CREATE TRIGGER trg_notifications_sync_read_flags
      BEFORE INSERT OR UPDATE ON public.notifications
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_notifications_read_flags();
    END IF;

    RAISE NOTICE '[012] notifications canonicalized to is_read; read kept as deprecated compatibility column.';
  ELSE
    RAISE NOTICE '[012] notifications table not found; skipped cleanup.';
  END IF;
END
$notify$;

DO $$
DECLARE
  rec record;
BEGIN
  IF to_regclass('public.reservations') IS NOT NULL THEN
    -- Remove global one-day-only restriction.
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.reservations'::regclass
        AND conname = 'reservations_date_unique'
    ) THEN
      ALTER TABLE public.reservations DROP CONSTRAINT reservations_date_unique;
      RAISE NOTICE '[012] Dropped reservations_date_unique constraint.';
    END IF;

    -- Defensive cleanup for unnamed/alternate unique index on reservation_date.
    FOR rec IN
      SELECT i.indexname
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_class ic ON ic.relname = i.indexname
      JOIN pg_index pi ON pi.indexrelid = ic.oid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(pi.indkey)
      WHERE n.nspname = 'public'
        AND i.tablename = 'reservations'
        AND pi.indisunique = TRUE
      GROUP BY i.indexname
      HAVING COUNT(*) = 1
         AND MIN(a.attname) = 'reservation_date'
    LOOP
      EXECUTE format('DROP INDEX IF EXISTS public.%I', rec.indexname);
      RAISE NOTICE '[012] Dropped unique reservations index on reservation_date: %', rec.indexname;
    END LOOP;

    CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
  ELSE
    RAISE NOTICE '[012] reservations table not found; skipped uniqueness fix.';
  END IF;
END
$$;

DO $$
DECLARE
  duplicate_count bigint := 0;
BEGIN
  IF to_regclass('public.qq_orders') IS NOT NULL THEN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
      SELECT quote_id
      FROM public.qq_orders
      GROUP BY quote_id
      HAVING COUNT(*) > 1
    ) d;

    IF duplicate_count = 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.qq_orders'::regclass
          AND conname = 'qq_orders_quote_unique'
      ) THEN
        ALTER TABLE public.qq_orders
          ADD CONSTRAINT qq_orders_quote_unique UNIQUE (quote_id);
        RAISE NOTICE '[012] Added qq_orders_quote_unique constraint.';
      ELSE
        RAISE NOTICE '[012] qq_orders_quote_unique already exists.';
      END IF;
    ELSE
      RAISE NOTICE '[012] Skipped qq_orders_quote_unique. Found % duplicate quote_id groups.', duplicate_count;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_qq_orders_quote ON public.qq_orders(quote_id);
  ELSE
    RAISE NOTICE '[012] qq_orders table not found; skipped quote uniqueness check.';
  END IF;
END
$$;

DO $$
BEGIN
  -- Keep key query paths indexed without destructive changes.
  IF to_regclass('public.payments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
  END IF;

  IF to_regclass('public.reservations') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_quote_id ON public.reservations(quote_id);
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
  END IF;
END
$$;

COMMIT;
