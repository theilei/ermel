-- ============================================================
-- Migration 009: Consent timestamps for terms and privacy
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ;

-- Backfill existing records that already accepted consent flags.
UPDATE users
SET accepted_terms_at = COALESCE(accepted_terms_at, created_at)
WHERE accepted_terms = TRUE
  AND accepted_terms_at IS NULL;

UPDATE users
SET accepted_privacy_at = COALESCE(accepted_privacy_at, created_at)
WHERE accepted_privacy = TRUE
  AND accepted_privacy_at IS NULL;

CREATE OR REPLACE FUNCTION sync_users_consent_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.accepted_terms = TRUE THEN
    IF NEW.accepted_terms_at IS NULL THEN
      NEW.accepted_terms_at := NOW();
    END IF;
  ELSE
    NEW.accepted_terms_at := NULL;
  END IF;

  IF NEW.accepted_privacy = TRUE THEN
    IF NEW.accepted_privacy_at IS NULL THEN
      NEW.accepted_privacy_at := NOW();
    END IF;
  ELSE
    NEW.accepted_privacy_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_consent_timestamps ON users;

CREATE TRIGGER trg_users_consent_timestamps
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_users_consent_timestamps();
