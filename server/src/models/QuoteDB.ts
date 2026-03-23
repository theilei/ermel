// ============================================================
// Quote Model — PostgreSQL-backed
// ============================================================
import pool from '../config/database';

export type QuoteStatus =
  | 'pending'
  | 'rejected'
  | 'draft'
  | 'approved'
  | 'cancelled'
  | 'customer_accepted'
  | 'customer_declined'
  | 'converted_to_order'
  | 'expired';

export interface Quote {
  id: string;          // UUID
  quoteNumber: string; // Q-0001 format
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  projectType: string;
  glassType: string;
  frameMaterial: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  originalEstimatedCost: number;
  estimatedCost: number;
  updatedCost?: number;
  status: QuoteStatus;
  submissionDate: string;
  rejectionReason?: string;
  approvedDate?: string;
  expiryDate?: string;
  acceptedDate?: string;
  declinedDate?: string;
  convertedDate?: string;
  notes?: string;
  reservationDate?: string;
  reservationStatus?: 'pending' | 'approved' | 'rejected' | 'expired';
  payment?: {
    paymentMethod?: 'qrph' | 'cash';
    status?: 'waiting_approval' | 'pending' | 'paid' | 'expired';
    proofFile?: string;
    adminRejectionReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardActiveInstallation {
  id: string;
  customerName: string;
  projectType: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  estimatedCost: number;
  status: QuoteStatus;
  reservationDate: string;
}

export interface DashboardMetrics {
  pendingInquiries: number;
  activeInstallations: number;
  totalQuotes: number;
  approvedQuotes: number;
  activeInstallationEntries: DashboardActiveInstallation[];
}

function rowToQuote(row: any): Quote {
  const originalEstimatedCost = parseFloat(row.estimated_cost);
  const updatedCost = row.updated_cost !== null && row.updated_cost !== undefined
    ? parseFloat(row.updated_cost)
    : undefined;

  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    projectType: row.project_type,
    glassType: row.glass_type,
    frameMaterial: row.frame_material,
    width: parseFloat(row.width),
    height: parseFloat(row.height),
    quantity: row.quantity,
    color: row.color,
    originalEstimatedCost,
    estimatedCost: updatedCost ?? originalEstimatedCost,
    updatedCost,
    status: row.status as QuoteStatus,
    submissionDate: row.submission_date?.toISOString?.().split('T')[0] || row.submission_date,
    rejectionReason: row.rejection_reason || undefined,
    approvedDate: row.approved_date?.toISOString?.().split('T')[0] || row.approved_date || undefined,
    expiryDate: row.expiry_date?.toISOString?.().split('T')[0] || row.expiry_date || undefined,
    acceptedDate: row.accepted_date?.toISOString?.().split('T')[0] || row.accepted_date || undefined,
    declinedDate: row.declined_date?.toISOString?.().split('T')[0] || row.declined_date || undefined,
    convertedDate: row.converted_date?.toISOString?.().split('T')[0] || row.converted_date || undefined,
    notes: row.notes || undefined,
    reservationDate: row.reservation_date?.toISOString?.().split('T')[0] || row.reservation_date || undefined,
    reservationStatus: row.reservation_status || undefined,
    payment: row.payment_method || row.payment_status || row.payment_proof_file
      ? {
          paymentMethod: row.payment_method || undefined,
          status: row.payment_status || undefined,
          proofFile: row.payment_proof_file || undefined,
          adminRejectionReason: row.payment_admin_rejection_reason || undefined,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingRelationOrColumn(err: any): boolean {
  // Postgres: undefined_table=42P01, undefined_column=42703
  return err?.code === '42P01' || err?.code === '42703';
}

function rowToLegacyQuote(row: any): Quote {
  const estimated = row.estimated_cost !== null && row.estimated_cost !== undefined
    ? parseFloat(row.estimated_cost)
    : 0;

  return {
    id: row.id,
    quoteNumber: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    projectType: row.project_type,
    glassType: row.glass_type,
    frameMaterial: row.frame_material,
    width: parseFloat(row.width),
    height: parseFloat(row.height),
    quantity: row.quantity ?? 1,
    color: row.color ?? 'Clear',
    originalEstimatedCost: estimated,
    estimatedCost: estimated,
    status: (row.status as QuoteStatus) ?? 'pending',
    submissionDate: row.submission_date?.toISOString?.().split('T')[0] || row.submission_date,
    rejectionReason: row.rejection_reason || undefined,
    approvedDate: row.approved_date?.toISOString?.().split('T')[0] || row.approved_date || undefined,
    expiryDate: row.expiry_date?.toISOString?.().split('T')[0] || row.expiry_date || undefined,
    acceptedDate: row.accepted_date?.toISOString?.().split('T')[0] || row.accepted_date || undefined,
    declinedDate: row.declined_date?.toISOString?.().split('T')[0] || row.declined_date || undefined,
    convertedDate: row.converted_date?.toISOString?.().split('T')[0] || row.converted_date || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Generate next quote number Q-0001, Q-0002, etc.
async function nextQuoteNumber(): Promise<string> {
  const result = await pool.query("SELECT nextval('quote_number_seq') AS seq");
  return `Q-${String(result.rows[0].seq).padStart(4, '0')}`;
}

export async function getAllQuotes(): Promise<Quote[]> {
  const result = await pool.query(
    `SELECT q.*, r.reservation_date, r.status AS reservation_status,
            p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
            p.admin_rejection_reason AS payment_admin_rejection_reason
     FROM qq_quotes q
     LEFT JOIN reservations r ON r.quote_id = q.id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL
     ORDER BY q.submission_date DESC, q.created_at DESC`
  );
  return result.rows.map(rowToQuote);
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  try {
    // Support lookup by UUID or quote_number
    const result = await pool.query(
      `SELECT q.*, r.reservation_date, r.status AS reservation_status,
              p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
              p.admin_rejection_reason AS payment_admin_rejection_reason
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id
       LEFT JOIN payments p ON p.quote_id = q.id
       WHERE q.deleted_at IS NULL AND (q.id::text = $1 OR q.quote_number = $1)`,
      [id]
    );
    return result.rows.length > 0 ? rowToQuote(result.rows[0]) : undefined;
  } catch (err: any) {
    if (!isMissingRelationOrColumn(err)) throw err;

    try {
      // Legacy fallback for older schemas
      const legacy = await pool.query(
        `SELECT *
         FROM quotation_quotes
         WHERE id = $1`,
        [id]
      );
      return legacy.rows.length > 0 ? rowToLegacyQuote(legacy.rows[0]) : undefined;
    } catch (legacyErr: any) {
      if (!isMissingRelationOrColumn(legacyErr)) throw legacyErr;
      return undefined;
    }
  }
}

export async function getQuotesByEmail(email: string): Promise<Quote[]> {
  try {
    const result = await pool.query(
      `SELECT q.*, r.reservation_date, r.status AS reservation_status,
              p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
              p.admin_rejection_reason AS payment_admin_rejection_reason
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id
       LEFT JOIN payments p ON p.quote_id = q.id
       WHERE q.deleted_at IS NULL AND LOWER(q.customer_email) = LOWER($1)
       ORDER BY q.submission_date DESC, q.created_at DESC`,
      [email]
    );
    return result.rows.map(rowToQuote);
  } catch (err: any) {
    if (!isMissingRelationOrColumn(err)) throw err;

    try {
      // Legacy fallback for older schemas
      const legacy = await pool.query(
        `SELECT *
         FROM quotation_quotes
         WHERE LOWER(customer_email) = LOWER($1)
         ORDER BY submission_date DESC, created_at DESC`,
        [email]
      );
      return legacy.rows.map(rowToLegacyQuote);
    } catch (legacyErr: any) {
      if (!isMissingRelationOrColumn(legacyErr)) throw legacyErr;
      return [];
    }
  }
}

export async function getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
  const result = await pool.query(
    `SELECT q.*, r.reservation_date, r.status AS reservation_status,
            p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
            p.admin_rejection_reason AS payment_admin_rejection_reason
     FROM qq_quotes q
     LEFT JOIN reservations r ON r.quote_id = q.id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL AND q.customer_id = $1
     ORDER BY q.submission_date DESC, q.created_at DESC`,
    [customerId]
  );
  return result.rows.map(rowToQuote);
}

export interface CreateQuoteData {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  projectType: string;
  glassType: string;
  frameMaterial: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  estimatedCost: number;
  notes?: string;
}

export async function createQuote(data: CreateQuoteData): Promise<Quote> {
  const quoteNumber = await nextQuoteNumber();
  const result = await pool.query(
    `INSERT INTO qq_quotes (
      quote_number, customer_id, customer_name, customer_email, customer_phone,
      customer_address, project_type, glass_type, frame_material,
      width, height, quantity, color, estimated_cost, updated_cost, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULL, $15)
    RETURNING *`,
    [
      quoteNumber, data.customerId || null, data.customerName, data.customerEmail,
      data.customerPhone, data.customerAddress, data.projectType, data.glassType,
      data.frameMaterial, data.width, data.height, data.quantity, data.color,
      data.estimatedCost, data.notes || null,
    ]
  );
  return rowToQuote(result.rows[0]);
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
  const existing = await getQuoteById(id);
  if (!existing) return undefined;

  // Build dynamic SET clause
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    customerName: 'customer_name',
    customerEmail: 'customer_email',
    customerPhone: 'customer_phone',
    customerAddress: 'customer_address',
    projectType: 'project_type',
    glassType: 'glass_type',
    frameMaterial: 'frame_material',
    width: 'width',
    height: 'height',
    quantity: 'quantity',
    color: 'color',
    estimatedCost: 'estimated_cost',
    updatedCost: 'updated_cost',
    status: 'status',
    rejectionReason: 'rejection_reason',
    approvedDate: 'approved_date',
    expiryDate: 'expiry_date',
    acceptedDate: 'accepted_date',
    declinedDate: 'declined_date',
    convertedDate: 'converted_date',
    notes: 'notes',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((updates as any)[key] !== undefined) {
      fields.push(`${col} = $${idx}`);
      values.push((updates as any)[key]);
      idx++;
    }
  }

  if (fields.length === 0) return existing;

  values.push(existing.id);
  const result = await pool.query(
    `UPDATE qq_quotes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows.length > 0 ? rowToQuote(result.rows[0]) : undefined;
}

export async function softDeleteQuote(id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE qq_quotes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function expireOldQuotes(): Promise<number> {
  try {
    const result = await pool.query(
      `UPDATE qq_quotes SET status = 'expired'
       WHERE status = 'approved' AND expiry_date < CURRENT_DATE AND deleted_at IS NULL`
    );
    return result.rowCount ?? 0;
  } catch (err: any) {
    if (!isMissingRelationOrColumn(err)) throw err;

    try {
      // Legacy schema without soft-delete support
      const legacy = await pool.query(
        `UPDATE quotation_quotes SET status = 'expired'
         WHERE status = 'approved' AND expiry_date < CURRENT_DATE`
      );
      return legacy.rowCount ?? 0;
    } catch (legacyErr: any) {
      if (!isMissingRelationOrColumn(legacyErr)) throw legacyErr;
      return 0;
    }
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const hasPaymentStatus = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'qq_quotes'
        AND column_name = 'payment_status'
    ) AS exists`
  );

  const paymentStatusExists = Boolean(hasPaymentStatus.rows[0]?.exists);

  const hasReservationDate = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'qq_quotes'
        AND column_name = 'reservation_date'
    ) AS exists`
  );

  const reservationDateExists = Boolean(hasReservationDate.rows[0]?.exists);
  const reservationExpr = reservationDateExists
    ? 'COALESCE(q.reservation_date, r.reservation_date)'
    : 'r.reservation_date';

  const countsQuery = paymentStatusExists
    ? `SELECT
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'pending')::int AS pending_inquiries,
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL)::int AS total_quotes,
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'approved')::int AS approved_quotes,
         COUNT(*) FILTER (
           WHERE q.deleted_at IS NULL
             AND q.status = 'approved'
             AND q.payment_status = 'paid'
             AND ${reservationExpr} IS NOT NULL
         )::int AS active_installations
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id`
    : `SELECT
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'pending')::int AS pending_inquiries,
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL)::int AS total_quotes,
         COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'approved')::int AS approved_quotes,
         0::int AS active_installations
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id`;

  const countsResult = await pool.query(countsQuery);
  const counts = countsResult.rows[0] || {};

  const activeRows = paymentStatusExists
    ? await pool.query(
        `SELECT
           q.quote_number,
           q.customer_name,
           q.project_type,
           q.width,
           q.height,
           q.quantity,
           q.color,
           COALESCE(q.updated_cost, q.estimated_cost, 0) AS effective_cost,
           q.status,
           ${reservationExpr}::text AS reservation_date
         FROM qq_quotes q
         LEFT JOIN reservations r ON r.quote_id = q.id
         WHERE q.deleted_at IS NULL
           AND q.status = 'approved'
           AND q.payment_status = 'paid'
           AND ${reservationExpr} IS NOT NULL
         ORDER BY ${reservationExpr} ASC, q.created_at DESC`
      )
    : { rows: [] as any[] };

  return {
    pendingInquiries: Number(counts.pending_inquiries || 0),
    activeInstallations: Number(counts.active_installations || 0),
    totalQuotes: Number(counts.total_quotes || 0),
    approvedQuotes: Number(counts.approved_quotes || 0),
    activeInstallationEntries: activeRows.rows.map((row) => ({
      id: row.quote_number,
      customerName: row.customer_name,
      projectType: row.project_type,
      width: Number(row.width || 0),
      height: Number(row.height || 0),
      quantity: Number(row.quantity || 0),
      color: row.color,
      estimatedCost: Number(row.effective_cost || 0),
      status: row.status as QuoteStatus,
      reservationDate: row.reservation_date,
    })),
  };
}
