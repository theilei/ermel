"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyOrderModel = void 0;
// ============================================================
// Legacy Order Model — DB-backed general order tracking
// ============================================================
const database_1 = __importDefault(require("../config/database"));
function rowToOrder(row) {
    return {
        id: row.order_number,
        orderNumber: row.order_number,
        customer: row.customer,
        project: row.project,
        material: row.material,
        glassType: row.glass_type,
        dimensions: row.dimensions,
        width: parseFloat(row.width),
        height: parseFloat(row.height),
        estimatedCost: parseFloat(row.estimated_cost),
        approvedCost: row.approved_cost ? parseFloat(row.approved_cost) : null,
        status: row.status,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        paid: row.paid,
        paymentUploaded: row.payment_uploaded,
        scheduledDate: row.scheduled_date ? new Date(row.scheduled_date).toISOString().split('T')[0] : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function rowToOrderFromQuote(row) {
    const width = Number(row.width || 0);
    const height = Number(row.height || 0);
    const quantity = Number(row.quantity || 1);
    const dimensions = `${width}cm x ${height}cm x ${quantity}`;
    const scheduledDate = row.scheduled_date
        ? new Date(row.scheduled_date).toISOString().split('T')[0]
        : null;
    return {
        id: row.order_number,
        orderNumber: row.order_number,
        customer: row.customer,
        project: row.project,
        material: row.material,
        glassType: row.glass_type,
        dimensions,
        width,
        height,
        estimatedCost: Number(row.estimated_cost || 0),
        approvedCost: Number(row.approved_cost || 0),
        status: row.status,
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || null,
        notes: row.notes || null,
        paid: Boolean(row.paid),
        paymentUploaded: Boolean(row.payment_uploaded),
        scheduledDate,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
exports.LegacyOrderModel = {
    async getAll() {
        const [legacyResult, quoteResult] = await Promise.all([
            database_1.default.query('SELECT * FROM legacy_orders'),
            database_1.default.query(`SELECT
           q.quote_number AS order_number,
           q.customer_name AS customer,
           q.project_type AS project,
           q.frame_material AS material,
           q.glass_type,
           q.width,
           q.height,
           q.quantity,
           COALESCE(q.updated_cost, q.estimated_cost, 0) AS estimated_cost,
           COALESCE(q.updated_cost, q.estimated_cost, 0) AS approved_cost,
           CASE
             WHEN p.status = 'paid' AND r.reservation_date IS NOT NULL AND r.reservation_date > CURRENT_DATE THEN 'installation'
             WHEN p.status = 'paid' THEN 'fabrication'
             WHEN q.status IN ('approved', 'customer_accepted', 'converted_to_order') THEN 'ordering'
             ELSE 'quotation'
           END AS status,
           q.customer_phone AS phone,
           q.customer_email AS email,
           q.customer_address AS address,
           q.notes,
           (p.status = 'paid') AS paid,
           (p.id IS NOT NULL) AS payment_uploaded,
           r.reservation_date AS scheduled_date,
           q.created_at,
           q.updated_at
         FROM qq_quotes q
         LEFT JOIN payments p ON p.quote_id = q.id
         LEFT JOIN reservations r ON r.quote_id = q.id
         WHERE q.deleted_at IS NULL
           AND p.status = 'paid'`),
        ]);
        const combined = [
            ...legacyResult.rows.map(rowToOrder),
            ...quoteResult.rows.map(rowToOrderFromQuote),
        ];
        return combined.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },
    async getById(id) {
        const { rows } = await database_1.default.query('SELECT * FROM legacy_orders WHERE order_number = $1 OR id::text = $1', [id]);
        return rows[0] ? rowToOrder(rows[0]) : null;
    },
    async getByEmail(email) {
        const { rows } = await database_1.default.query('SELECT * FROM legacy_orders WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC', [email]);
        return rows.map(rowToOrder);
    },
    async getSummary() {
        const [legacySummary, quoteSummary] = await Promise.all([
            database_1.default.query(`SELECT
           COUNT(*) FILTER (WHERE (paid = TRUE OR payment_uploaded = TRUE)) AS total_orders,
           COALESCE(SUM(COALESCE(approved_cost, estimated_cost)) FILTER (WHERE (paid = TRUE OR payment_uploaded = TRUE)), 0) AS total_revenue,
           COUNT(*) FILTER (
             WHERE (paid = TRUE OR payment_uploaded = TRUE)
               AND scheduled_date IS NOT NULL
               AND scheduled_date > CURRENT_DATE
           ) AS active_orders
         FROM legacy_orders`),
            database_1.default.query(`SELECT
           COUNT(*) FILTER (WHERE p.status = 'paid') AS total_orders,
           COALESCE(SUM(COALESCE(q.updated_cost, q.estimated_cost, 0)) FILTER (WHERE p.status = 'paid'), 0) AS total_revenue,
           COUNT(*) FILTER (
             WHERE p.status = 'paid'
               AND r.reservation_date IS NOT NULL
               AND r.reservation_date > CURRENT_DATE
           ) AS active_orders
         FROM qq_quotes q
         LEFT JOIN payments p ON p.quote_id = q.id
         LEFT JOIN reservations r ON r.quote_id = q.id
         WHERE q.deleted_at IS NULL`),
        ]);
        const legacyRow = legacySummary.rows[0] || {};
        const quoteRow = quoteSummary.rows[0] || {};
        return {
            totalOrders: Number(legacyRow.total_orders || 0) + Number(quoteRow.total_orders || 0),
            totalRevenue: Number(legacyRow.total_revenue || 0) + Number(quoteRow.total_revenue || 0),
            activeOrders: Number(legacyRow.active_orders || 0) + Number(quoteRow.active_orders || 0),
        };
    },
    async create(data) {
        const year = new Date().getFullYear();
        const seqResult = await database_1.default.query("SELECT nextval('legacy_order_seq') AS seq");
        const seq = String(seqResult.rows[0].seq).padStart(3, '0');
        const orderNumber = `EGA-${year}-${seq}`;
        const { rows } = await database_1.default.query(`INSERT INTO legacy_orders (order_number, customer, project, material, glass_type, dimensions, width, height, estimated_cost, phone, email, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`, [orderNumber, data.customer, data.project, data.material, data.glassType, data.dimensions,
            data.width, data.height, data.estimatedCost, data.phone, data.email, data.address || null, data.notes || null]);
        return rowToOrder(rows[0]);
    },
    async updateStatus(id, status, scheduledDate) {
        const { rows } = await database_1.default.query(`UPDATE legacy_orders
       SET status = $1, scheduled_date = $2
       WHERE order_number = $3 OR id::text = $3
       RETURNING *`, [status, scheduledDate || null, id]);
        return rows[0] ? rowToOrder(rows[0]) : null;
    },
    async updateCost(id, approvedCost) {
        const { rows } = await database_1.default.query(`UPDATE legacy_orders
       SET approved_cost = $1, paid = FALSE
       WHERE order_number = $2 OR id::text = $2
       RETURNING *`, [approvedCost, id]);
        return rows[0] ? rowToOrder(rows[0]) : null;
    },
    async markPaymentUploaded(id) {
        const { rows } = await database_1.default.query(`UPDATE legacy_orders
       SET payment_uploaded = TRUE,
           paid = TRUE
       WHERE order_number = $1 OR id::text = $1
       RETURNING *`, [id]);
        return rows[0] ? rowToOrder(rows[0]) : null;
    },
};
//# sourceMappingURL=LegacyOrder.js.map