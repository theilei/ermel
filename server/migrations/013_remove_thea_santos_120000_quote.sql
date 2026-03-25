-- Remove the specific Thea Santos quote worth PHP 120,000 from active views.
-- This migration is idempotent and only targets the requested record(s).

UPDATE qq_quotes
SET deleted_at = COALESCE(deleted_at, NOW())
WHERE deleted_at IS NULL
  AND LOWER(TRIM(customer_name)) = 'thea santos'
  AND COALESCE(updated_cost, estimated_cost) = 120000;

-- Legacy schema fallback (if present).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotation_quotes'
      AND column_name = 'deleted_at'
  ) THEN
    UPDATE quotation_quotes
    SET deleted_at = COALESCE(deleted_at, NOW())
    WHERE LOWER(TRIM(customer_name)) = 'thea santos'
      AND estimated_cost = 120000;
  END IF;
END $$;
