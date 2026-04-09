"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuotes = getAllQuotes;
exports.getQuoteById = getQuoteById;
exports.getQuotesByEmail = getQuotesByEmail;
exports.getQuotesByCustomerId = getQuotesByCustomerId;
exports.createQuote = createQuote;
exports.updateQuote = updateQuote;
exports.softDeleteQuote = softDeleteQuote;
exports.expireOldQuotes = expireOldQuotes;
exports.getPopularMaterials = getPopularMaterials;
exports.getDashboardMetrics = getDashboardMetrics;
// ============================================================
// Quote Model — PostgreSQL-backed
// ============================================================
const database_1 = __importDefault(require("../config/database"));
function rowToQuote(row) {
    const originalEstimatedCost = parseFloat(row.estimated_cost);
    const updatedCost = row.updated_cost !== null && row.updated_cost !== undefined
        ? parseFloat(row.updated_cost)
        : undefined;
    const normalizedPaymentStatus = row.payment_status === 'pending'
        ? 'waiting_approval'
        : row.payment_status;
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
        status: row.status,
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
                status: normalizedPaymentStatus || undefined,
                proofFile: row.payment_proof_file || undefined,
                adminRejectionReason: row.payment_admin_rejection_reason || undefined,
            }
            : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function isMissingRelationOrColumn(err) {
    // Postgres: undefined_table=42P01, undefined_column=42703
    return err?.code === '42P01' || err?.code === '42703';
}
function rowToLegacyQuote(row) {
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
        status: row.status ?? 'pending',
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
async function nextQuoteNumber() {
    const result = await database_1.default.query("SELECT nextval('quote_number_seq') AS seq");
    return `Q-${String(result.rows[0].seq).padStart(4, '0')}`;
}
async function getAllQuotes() {
    const result = await database_1.default.query(`SELECT q.*, r.reservation_date, r.status AS reservation_status,
            p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
            p.admin_rejection_reason AS payment_admin_rejection_reason
     FROM qq_quotes q
     LEFT JOIN reservations r ON r.quote_id = q.id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL
     ORDER BY q.submission_date DESC, q.created_at DESC`);
    return result.rows.map(rowToQuote);
}
async function getQuoteById(id) {
    try {
        // Support lookup by UUID or quote_number
        const result = await database_1.default.query(`SELECT q.*, r.reservation_date, r.status AS reservation_status,
              p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
              p.admin_rejection_reason AS payment_admin_rejection_reason
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id
       LEFT JOIN payments p ON p.quote_id = q.id
       WHERE q.deleted_at IS NULL AND (q.id::text = $1 OR q.quote_number = $1)`, [id]);
        return result.rows.length > 0 ? rowToQuote(result.rows[0]) : undefined;
    }
    catch (err) {
        if (!isMissingRelationOrColumn(err))
            throw err;
        try {
            // Legacy fallback for older schemas
            const legacy = await database_1.default.query(`SELECT *
         FROM quotation_quotes
         WHERE id = $1`, [id]);
            return legacy.rows.length > 0 ? rowToLegacyQuote(legacy.rows[0]) : undefined;
        }
        catch (legacyErr) {
            if (!isMissingRelationOrColumn(legacyErr))
                throw legacyErr;
            return undefined;
        }
    }
}
async function getQuotesByEmail(email) {
    try {
        const result = await database_1.default.query(`SELECT q.*, r.reservation_date, r.status AS reservation_status,
              p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
              p.admin_rejection_reason AS payment_admin_rejection_reason
       FROM qq_quotes q
       LEFT JOIN reservations r ON r.quote_id = q.id
       LEFT JOIN payments p ON p.quote_id = q.id
       WHERE q.deleted_at IS NULL AND LOWER(q.customer_email) = LOWER($1)
       ORDER BY q.submission_date DESC, q.created_at DESC`, [email]);
        return result.rows.map(rowToQuote);
    }
    catch (err) {
        if (!isMissingRelationOrColumn(err))
            throw err;
        try {
            // Legacy fallback for older schemas
            const legacy = await database_1.default.query(`SELECT *
         FROM quotation_quotes
         WHERE LOWER(customer_email) = LOWER($1)
         ORDER BY submission_date DESC, created_at DESC`, [email]);
            return legacy.rows.map(rowToLegacyQuote);
        }
        catch (legacyErr) {
            if (!isMissingRelationOrColumn(legacyErr))
                throw legacyErr;
            return [];
        }
    }
}
async function getQuotesByCustomerId(customerId) {
    const result = await database_1.default.query(`SELECT q.*, r.reservation_date, r.status AS reservation_status,
            p.payment_method, p.status AS payment_status, p.proof_file AS payment_proof_file,
            p.admin_rejection_reason AS payment_admin_rejection_reason
     FROM qq_quotes q
     LEFT JOIN reservations r ON r.quote_id = q.id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL AND q.customer_id = $1
     ORDER BY q.submission_date DESC, q.created_at DESC`, [customerId]);
    return result.rows.map(rowToQuote);
}
async function createQuote(data) {
    const quoteNumber = await nextQuoteNumber();
    const result = await database_1.default.query(`INSERT INTO qq_quotes (
      quote_number, customer_id, customer_name, customer_email, customer_phone,
      customer_address, project_type, glass_type, frame_material,
      width, height, quantity, color, estimated_cost, updated_cost, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULL, $15)
    RETURNING *`, [
        quoteNumber, data.customerId || null, data.customerName, data.customerEmail,
        data.customerPhone, data.customerAddress, data.projectType, data.glassType,
        data.frameMaterial, data.width, data.height, data.quantity, data.color,
        data.estimatedCost, data.notes || null,
    ]);
    return rowToQuote(result.rows[0]);
}
async function updateQuote(id, updates) {
    const existing = await getQuoteById(id);
    if (!existing)
        return undefined;
    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let idx = 1;
    const fieldMap = {
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
        if (updates[key] !== undefined) {
            fields.push(`${col} = $${idx}`);
            values.push(updates[key]);
            idx++;
        }
    }
    if (fields.length === 0)
        return existing;
    values.push(existing.id);
    const result = await database_1.default.query(`UPDATE qq_quotes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return result.rows.length > 0 ? rowToQuote(result.rows[0]) : undefined;
}
async function softDeleteQuote(id) {
    const result = await database_1.default.query(`UPDATE qq_quotes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return (result.rowCount ?? 0) > 0;
}
async function expireOldQuotes() {
    try {
        const result = await database_1.default.query(`UPDATE qq_quotes SET status = 'expired'
       WHERE status = 'approved' AND expiry_date < CURRENT_DATE AND deleted_at IS NULL`);
        return result.rowCount ?? 0;
    }
    catch (err) {
        if (!isMissingRelationOrColumn(err))
            throw err;
        try {
            // Legacy schema without soft-delete support
            const legacy = await database_1.default.query(`UPDATE quotation_quotes SET status = 'expired'
         WHERE status = 'approved' AND expiry_date < CURRENT_DATE`);
            return legacy.rowCount ?? 0;
        }
        catch (legacyErr) {
            if (!isMissingRelationOrColumn(legacyErr))
                throw legacyErr;
            return 0;
        }
    }
}
const POPULAR_CHOICE_STATUSES = ['approved', 'customer_accepted', 'converted_to_order'];
async function getPopularMaterials(projectType) {
    const statuses = POPULAR_CHOICE_STATUSES;
    const projectFilter = projectType?.trim() || null;
    const query = `
    WITH filtered AS (
      SELECT
        glass_type,
        color,
        frame_material,
        COALESCE(updated_at, created_at, submission_date::timestamp) AS picked_at
      FROM qq_quotes
      WHERE deleted_at IS NULL
        AND status = ANY($1::text[])
        AND ($2::text IS NULL OR LOWER(project_type) = LOWER($2))
    ),
    sample AS (
      SELECT COUNT(*)::int AS total FROM filtered
    ),
    top_glass AS (
      SELECT glass_type, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
      FROM filtered
      WHERE COALESCE(TRIM(glass_type), '') <> ''
      GROUP BY glass_type
      ORDER BY picks DESC, last_picked_at DESC, glass_type ASC
      LIMIT 1
    ),
    top_color AS (
      SELECT color, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
      FROM filtered
      WHERE COALESCE(TRIM(color), '') <> ''
      GROUP BY color
      ORDER BY picks DESC, last_picked_at DESC, color ASC
      LIMIT 1
    ),
    top_frame AS (
      SELECT frame_material, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
      FROM filtered
      WHERE COALESCE(TRIM(frame_material), '') <> ''
      GROUP BY frame_material
      ORDER BY picks DESC, last_picked_at DESC, frame_material ASC
      LIMIT 1
    )
    SELECT
      (SELECT glass_type FROM top_glass) AS glass_type,
      (SELECT color FROM top_color) AS color,
      (SELECT frame_material FROM top_frame) AS frame_material,
      (SELECT total FROM sample) AS sample_size
  `;
    try {
        const result = await database_1.default.query(query, [statuses, projectFilter]);
        const row = result.rows[0] || {};
        return {
            glassType: row.glass_type || null,
            color: row.color || null,
            frameMaterial: row.frame_material || null,
            sampleSize: Number(row.sample_size || 0),
        };
    }
    catch (err) {
        if (!isMissingRelationOrColumn(err))
            throw err;
        const legacyQuery = `
      WITH filtered AS (
        SELECT
          glass_type,
          color,
          frame_material,
          COALESCE(created_at, submission_date::timestamp) AS picked_at
        FROM quotation_quotes
        WHERE status = ANY($1::text[])
          AND ($2::text IS NULL OR LOWER(project_type) = LOWER($2))
      ),
      sample AS (
        SELECT COUNT(*)::int AS total FROM filtered
      ),
      top_glass AS (
        SELECT glass_type, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
        FROM filtered
        WHERE COALESCE(TRIM(glass_type), '') <> ''
        GROUP BY glass_type
        ORDER BY picks DESC, last_picked_at DESC, glass_type ASC
        LIMIT 1
      ),
      top_color AS (
        SELECT color, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
        FROM filtered
        WHERE COALESCE(TRIM(color), '') <> ''
        GROUP BY color
        ORDER BY picks DESC, last_picked_at DESC, color ASC
        LIMIT 1
      ),
      top_frame AS (
        SELECT frame_material, COUNT(*)::int AS picks, MAX(picked_at) AS last_picked_at
        FROM filtered
        WHERE COALESCE(TRIM(frame_material), '') <> ''
        GROUP BY frame_material
        ORDER BY picks DESC, last_picked_at DESC, frame_material ASC
        LIMIT 1
      )
      SELECT
        (SELECT glass_type FROM top_glass) AS glass_type,
        (SELECT color FROM top_color) AS color,
        (SELECT frame_material FROM top_frame) AS frame_material,
        (SELECT total FROM sample) AS sample_size
    `;
        const legacyResult = await database_1.default.query(legacyQuery, [statuses, projectFilter]);
        const row = legacyResult.rows[0] || {};
        return {
            glassType: row.glass_type || null,
            color: row.color || null,
            frameMaterial: row.frame_material || null,
            sampleSize: Number(row.sample_size || 0),
        };
    }
}
async function getDashboardMetrics() {
    const countsResult = await database_1.default.query(`WITH active_installation_quotes AS (
       SELECT q.id
       FROM qq_quotes q
       JOIN payments p ON p.quote_id = q.id
       JOIN reservations r ON r.quote_id = q.id
       WHERE q.deleted_at IS NULL
         AND q.status = 'approved'
         AND p.status = 'paid'
         AND r.status = 'approved'
         AND r.reservation_date IS NOT NULL
         AND r.reservation_date >= CURRENT_DATE
     )
     SELECT
       COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'pending')::int AS pending_inquiries,
       COUNT(*) FILTER (WHERE q.deleted_at IS NULL)::int AS total_quotes,
       COUNT(*) FILTER (WHERE q.deleted_at IS NULL AND q.status = 'approved')::int AS approved_quotes,
       (SELECT COUNT(*)::int FROM active_installation_quotes) AS active_installations
     FROM qq_quotes q`);
    const counts = countsResult.rows[0] || {};
    const activeRows = await database_1.default.query(`SELECT
       q.quote_number,
       q.customer_name,
       q.project_type,
       q.width,
       q.height,
       q.quantity,
       q.color,
       COALESCE(q.updated_cost, q.estimated_cost, 0) AS effective_cost,
       q.status,
       r.reservation_date::text AS reservation_date
     FROM qq_quotes q
     JOIN payments p ON p.quote_id = q.id AND p.status = 'paid'
     JOIN reservations r ON r.quote_id = q.id
     WHERE q.deleted_at IS NULL
       AND q.status = 'approved'
       AND r.status = 'approved'
       AND r.reservation_date >= CURRENT_DATE
     ORDER BY r.reservation_date ASC, q.created_at DESC`);
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
            status: row.status,
            reservationDate: row.reservation_date,
        })),
    };
}
//# sourceMappingURL=QuoteDB.js.map