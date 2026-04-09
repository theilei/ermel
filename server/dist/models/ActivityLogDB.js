"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLog = addLog;
exports.getAllLogs = getAllLogs;
exports.getLogsByQuote = getLogsByQuote;
exports.getLogsByOrder = getLogsByOrder;
// ============================================================
// Activity Log Model — PostgreSQL-backed
// ============================================================
const database_1 = __importDefault(require("../config/database"));
function rowToLog(row) {
    return {
        id: row.id,
        userId: row.user_id || undefined,
        action: row.action,
        entity: row.entity || undefined,
        entityId: row.entity_id || undefined,
        quoteId: row.quote_id || undefined,
        orderId: row.order_id || undefined,
        userRole: row.user_role,
        userName: row.user_name,
        details: row.details || undefined,
        createdAt: row.created_at,
    };
}
async function addLog(entry) {
    const action = entry.action || entry.event || 'Unknown action';
    const result = await database_1.default.query(`INSERT INTO qq_activity_logs (user_id, action, entity, entity_id, quote_id, order_id, user_role, user_name, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [
        entry.userId || null,
        action,
        entry.entity || null,
        entry.entityId || null,
        entry.quoteId || null,
        entry.orderId || null,
        entry.userRole,
        entry.userName,
        entry.details || null,
    ]);
    return rowToLog(result.rows[0]);
}
async function getAllLogs() {
    const result = await database_1.default.query(`SELECT * FROM qq_activity_logs ORDER BY created_at DESC LIMIT 200`);
    return result.rows.map(rowToLog);
}
async function getLogsByQuote(quoteId) {
    const result = await database_1.default.query(`SELECT * FROM qq_activity_logs WHERE quote_id::text = $1 ORDER BY created_at DESC`, [quoteId]);
    return result.rows.map(rowToLog);
}
async function getLogsByOrder(orderId) {
    const result = await database_1.default.query(`SELECT * FROM qq_activity_logs WHERE order_id::text = $1 ORDER BY created_at DESC`, [orderId]);
    return result.rows.map(rowToLog);
}
//# sourceMappingURL=ActivityLogDB.js.map