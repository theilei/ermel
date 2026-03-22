-- ============================================================
-- Migration 012: Align payment status lifecycle to waiting_approval
-- ============================================================

ALTER TABLE payments
ALTER COLUMN status TYPE VARCHAR(32);

ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_status_check;

UPDATE payments
SET status = 'waiting_approval'
WHERE status = 'pending';

ALTER TABLE payments
ADD CONSTRAINT payments_status_check
CHECK (status IN ('waiting_approval', 'paid', 'expired'));
