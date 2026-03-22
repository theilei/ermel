import pool from '../config/database';

export type PaymentMethod = 'qrph' | 'cash';
export type PaymentStatus = 'waiting_approval' | 'paid' | 'expired';

const STATUS_WAITING_APPROVAL = 'waiting_approval';
const STATUS_LEGACY_PENDING = 'pending';

function normalizePaymentStatusForRead(status: string | undefined | null): PaymentStatus {
  if (status === STATUS_LEGACY_PENDING) return STATUS_WAITING_APPROVAL;
  if (status === 'paid') return 'paid';
  if (status === 'expired') return 'expired';
  return STATUS_WAITING_APPROVAL;
}

function isLegacyStatusConstraintError(err: any): boolean {
  if (err?.code === '22001') return true;
  if (err?.code === '23514') return true;
  return false;
}

export interface Payment {
  id: string;
  quoteId: string;
  quoteNumber?: string;
  customerEmail?: string;
  customerName?: string;
  reservationDate?: string;
  quoteStatus?: string;
  projectType?: string;
  amountDue?: number;
  paymentMethod: PaymentMethod;
  proofFile?: string;
  proofMime?: string;
  status: PaymentStatus;
  adminRejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToPayment(row: any): Payment {
  return {
    id: row.id,
    quoteId: row.quote_id,
    quoteNumber: row.quote_number || undefined,
    customerEmail: row.customer_email || undefined,
    customerName: row.customer_name || undefined,
    reservationDate: row.reservation_date?.toISOString?.().split('T')[0] || row.reservation_date || undefined,
    quoteStatus: row.quote_status || undefined,
    projectType: row.project_type || undefined,
    amountDue: row.amount_due !== undefined && row.amount_due !== null ? Number(row.amount_due) : undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    proofFile: row.proof_file || undefined,
    proofMime: row.proof_mime || undefined,
    status: normalizePaymentStatusForRead(row.status),
    adminRejectionReason: row.admin_rejection_reason || undefined,
    submittedAt: row.submitted_at || undefined,
    verifiedAt: row.verified_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPaymentByQuoteId(quoteId: string): Promise<Payment | undefined> {
  const result = await pool.query(
    `SELECT p.*, q.quote_number, q.customer_email, q.customer_name, q.status AS quote_status, r.reservation_date
     FROM payments p
     JOIN qq_quotes q ON q.id = p.quote_id
     LEFT JOIN reservations r ON r.quote_id = q.id
     WHERE p.quote_id = $1
     LIMIT 1`,
    [quoteId]
  );
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function getPaymentByQuoteIdentifier(quoteIdentifier: string): Promise<Payment | undefined> {
  const result = await pool.query(
    `SELECT p.*, q.quote_number, q.customer_email, q.customer_name, q.status AS quote_status, r.reservation_date
     FROM payments p
     JOIN qq_quotes q ON q.id = p.quote_id
     LEFT JOIN reservations r ON r.quote_id = q.id
     WHERE q.id::text = $1 OR q.quote_number = $1
     LIMIT 1`,
    [quoteIdentifier]
  );
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function createPayment(quoteId: string, paymentMethod: PaymentMethod): Promise<Payment> {
  let result;
  try {
    result = await pool.query(
      `INSERT INTO payments (quote_id, payment_method, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (quote_id) DO UPDATE
         SET payment_method = EXCLUDED.payment_method,
             status = CASE
               WHEN payments.status = 'paid' THEN 'paid'
               WHEN payments.status = 'expired' THEN 'expired'
               ELSE $3
             END,
             admin_rejection_reason = CASE
               WHEN payments.status IN ('paid', 'expired') THEN payments.admin_rejection_reason
               ELSE NULL
             END,
             updated_at = NOW()
       RETURNING *`,
      [quoteId, paymentMethod, STATUS_WAITING_APPROVAL]
    );
  } catch (err: any) {
    if (!isLegacyStatusConstraintError(err)) throw err;
    result = await pool.query(
      `INSERT INTO payments (quote_id, payment_method, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (quote_id) DO UPDATE
         SET payment_method = EXCLUDED.payment_method,
             status = CASE
               WHEN payments.status = 'paid' THEN 'paid'
               WHEN payments.status = 'expired' THEN 'expired'
               ELSE $3
             END,
             admin_rejection_reason = CASE
               WHEN payments.status IN ('paid', 'expired') THEN payments.admin_rejection_reason
               ELSE NULL
             END,
             updated_at = NOW()
       RETURNING *`,
      [quoteId, paymentMethod, STATUS_LEGACY_PENDING]
    );
  }

  const row = result.rows[0];
  return rowToPayment(row);
}

export async function markPaymentSubmitted(
  quoteId: string,
  payload: { proofFile?: string; proofMime?: string }
): Promise<Payment | undefined> {
  let result;
  try {
    result = await pool.query(
      `UPDATE payments
       SET proof_file = $2,
           proof_mime = $3,
           status = $4,
           admin_rejection_reason = NULL,
           submitted_at = NOW()
       WHERE quote_id = $1
       RETURNING *`,
      [quoteId, payload.proofFile || null, payload.proofMime || null, STATUS_WAITING_APPROVAL]
    );
  } catch (err: any) {
    if (!isLegacyStatusConstraintError(err)) throw err;
    result = await pool.query(
      `UPDATE payments
       SET proof_file = $2,
           proof_mime = $3,
           status = $4,
           admin_rejection_reason = NULL,
           submitted_at = NOW()
       WHERE quote_id = $1
       RETURNING *`,
      [quoteId, payload.proofFile || null, payload.proofMime || null, STATUS_LEGACY_PENDING]
    );
  }
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function clearPaymentProof(quoteId: string): Promise<Payment | undefined> {
  let result;
  try {
    result = await pool.query(
      `UPDATE payments
       SET proof_file = NULL,
           proof_mime = NULL,
           submitted_at = NULL,
           admin_rejection_reason = NULL,
           status = $2
       WHERE quote_id = $1 AND status <> 'paid'
       RETURNING *`,
      [quoteId, STATUS_WAITING_APPROVAL]
    );
  } catch (err: any) {
    if (!isLegacyStatusConstraintError(err)) throw err;
    result = await pool.query(
      `UPDATE payments
       SET proof_file = NULL,
           proof_mime = NULL,
           submitted_at = NULL,
           admin_rejection_reason = NULL,
           status = $2
       WHERE quote_id = $1 AND status <> 'paid'
       RETURNING *`,
      [quoteId, STATUS_LEGACY_PENDING]
    );
  }
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function markPaymentPaid(quoteId: string): Promise<Payment | undefined> {
  const result = await pool.query(
    `UPDATE payments
     SET status = 'paid',
         verified_at = NOW(),
         admin_rejection_reason = NULL
     WHERE quote_id = $1
     RETURNING *`,
    [quoteId]
  );
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function rejectPayment(quoteId: string, reason: string): Promise<Payment | undefined> {
  let result;
  try {
    result = await pool.query(
      `UPDATE payments
       SET status = $3,
           admin_rejection_reason = $2,
           verified_at = NULL
       WHERE quote_id = $1
       RETURNING *`,
      [quoteId, reason, STATUS_WAITING_APPROVAL]
    );
  } catch (err: any) {
    if (!isLegacyStatusConstraintError(err)) throw err;
    result = await pool.query(
      `UPDATE payments
       SET status = $3,
           admin_rejection_reason = $2,
           verified_at = NULL
       WHERE quote_id = $1
       RETURNING *`,
      [quoteId, reason, STATUS_LEGACY_PENDING]
    );
  }
  return result.rows.length > 0 ? rowToPayment(result.rows[0]) : undefined;
}

export async function expireOldPendingPayments(): Promise<number> {
  const result = await pool.query(
    `WITH overdue AS (
       SELECT q.id AS quote_id
       FROM qq_quotes q
       LEFT JOIN payments p ON p.quote_id = q.id
       WHERE q.status = 'approved'
         AND q.created_at + INTERVAL '3 days' < NOW()
         AND (p.id IS NULL OR p.status <> 'paid')
     ), updated_quotes AS (
       UPDATE qq_quotes q
       SET status = 'cancelled'
       FROM overdue o
       WHERE q.id = o.quote_id
       RETURNING q.id
     ), upsert_payments AS (
       INSERT INTO payments (quote_id, payment_method, status)
       SELECT o.quote_id, 'cash', 'expired' FROM overdue o
       ON CONFLICT (quote_id) DO UPDATE
         SET status = 'expired',
             updated_at = NOW()
       RETURNING quote_id
     )
     SELECT (SELECT COUNT(*) FROM updated_quotes) AS quote_count,
            (SELECT COUNT(*) FROM upsert_payments) AS payment_count`
  );

  return Number(result.rows[0]?.quote_count || 0);
}

export async function listPaymentsForAdmin(): Promise<Payment[]> {
  const result = await pool.query(
    `SELECT p.*, q.quote_number, q.customer_email, q.customer_name, q.status AS quote_status,
            q.project_type, COALESCE(q.updated_cost, q.estimated_cost) AS amount_due,
            r.reservation_date
     FROM payments p
     JOIN qq_quotes q ON q.id = p.quote_id
     LEFT JOIN reservations r ON r.quote_id = q.id
     WHERE p.payment_method = 'qrph'
       AND p.proof_file IS NOT NULL
     ORDER BY p.created_at DESC`
  );

  return result.rows.map(rowToPayment);
}
