-- ============================================================
-- Migration 008: Consent timestamp columns for users
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ;
