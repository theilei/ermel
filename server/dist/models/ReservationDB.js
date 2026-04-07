"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReservations = listReservations;
exports.listReservationsByStatus = listReservationsByStatus;
exports.listReservedDates = listReservedDates;
exports.getReservationByQuoteId = getReservationByQuoteId;
exports.createReservation = createReservation;
exports.updateReservationStatus = updateReservationStatus;
exports.rescheduleReservation = rescheduleReservation;
exports.isReservationConflictError = isReservationConflictError;
const database_1 = __importDefault(require("../config/database"));
function toDateOnly(value) {
    if (!value)
        return '';
    if (typeof value === 'string') {
        const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m)
            return m[1];
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) {
            const y = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${y}-${mm}-${dd}`;
        }
        return value;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getFullYear();
        const mm = String(value.getMonth() + 1).padStart(2, '0');
        const dd = String(value.getDate()).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    }
    return String(value);
}
function rowToReservation(row) {
    return {
        id: row.id,
        quoteId: row.quote_id,
        quoteNumber: row.quote_number || undefined,
        customerName: row.customer_name || undefined,
        customerEmail: row.customer_email || undefined,
        projectType: row.project_type || undefined,
        reservationDate: toDateOnly(row.reservation_date),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
    };
}
async function listReservations() {
    const result = await database_1.default.query(`SELECT r.*, q.quote_number, q.customer_name, q.customer_email, q.project_type
     FROM reservations r
     JOIN qq_quotes q ON q.id = r.quote_id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL
       AND q.status = 'approved'
       AND p.status = 'paid'
     ORDER BY r.reservation_date ASC, r.created_at DESC`);
    return result.rows.map(rowToReservation);
}
async function listReservationsByStatus(status) {
    const result = await database_1.default.query(`SELECT r.*, q.quote_number, q.customer_name, q.customer_email, q.project_type
     FROM reservations r
     JOIN qq_quotes q ON q.id = r.quote_id
     LEFT JOIN payments p ON p.quote_id = q.id
     WHERE q.deleted_at IS NULL AND r.status = $1
       AND q.status = 'approved'
       AND p.status = 'paid'
     ORDER BY r.reservation_date ASC, r.created_at DESC`, [status]);
    return result.rows.map(rowToReservation);
}
async function listReservedDates() {
    const result = await database_1.default.query(`SELECT DISTINCT r.reservation_date
     FROM reservations r
     WHERE r.reservation_date IS NOT NULL
     ORDER BY reservation_date ASC`);
    return result.rows.map((r) => toDateOnly(r.reservation_date));
}
async function getReservationByQuoteId(quoteId) {
    const result = await database_1.default.query(`SELECT * FROM reservations WHERE quote_id = $1 LIMIT 1`, [quoteId]);
    return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}
async function createReservation(quoteId, reservationDate) {
    const result = await database_1.default.query(`INSERT INTO reservations (quote_id, reservation_date, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`, [quoteId, reservationDate]);
    return rowToReservation(result.rows[0]);
}
async function updateReservationStatus(id, status) {
    const result = await database_1.default.query(`UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
    return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}
async function rescheduleReservation(id, reservationDate) {
    const result = await database_1.default.query(`UPDATE reservations
     SET reservation_date = $1, status = 'pending'
     WHERE id = $2
     RETURNING *`, [reservationDate, id]);
    return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}
function isReservationConflictError(err) {
    const code = err?.code;
    const constraint = err?.constraint;
    return code === '23505' && (constraint === 'reservations_date_unique' || constraint === 'reservations_quote_unique');
}
//# sourceMappingURL=ReservationDB.js.map