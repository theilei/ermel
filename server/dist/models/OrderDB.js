"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.getOrdersByCustomerId = getOrdersByCustomerId;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
// ============================================================
// Order Model — PostgreSQL-backed
// ============================================================
const database_1 = __importDefault(require("../config/database"));
function rowToOrder(row) {
    return {
        id: row.id,
        orderNumber: row.order_number,
        quoteId: row.quote_id,
        customerId: row.customer_id || undefined,
        customerName: row.customer_name,
        projectType: row.project_type,
        dimensions: row.dimensions,
        installationStatus: row.installation_status,
        orderDate: row.order_date?.toISOString?.().split('T')[0] || row.order_date,
        installationSchedule: row.installation_schedule?.toISOString?.().split('T')[0] || row.installation_schedule || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function nextOrderNumber() {
    const result = await database_1.default.query("SELECT nextval('order_number_seq') AS seq");
    return `ORD-${String(result.rows[0].seq).padStart(4, '0')}`;
}
async function getAllOrders() {
    const result = await database_1.default.query(`SELECT * FROM qq_orders WHERE deleted_at IS NULL ORDER BY order_date DESC, created_at DESC`);
    return result.rows.map(rowToOrder);
}
async function getOrderById(id) {
    const result = await database_1.default.query(`SELECT * FROM qq_orders WHERE deleted_at IS NULL AND (id::text = $1 OR order_number = $1)`, [id]);
    return result.rows.length > 0 ? rowToOrder(result.rows[0]) : undefined;
}
async function getOrdersByCustomerId(customerId) {
    const result = await database_1.default.query(`SELECT * FROM qq_orders WHERE deleted_at IS NULL AND customer_id = $1
     ORDER BY order_date DESC, created_at DESC`, [customerId]);
    return result.rows.map(rowToOrder);
}
async function createOrder(quoteId, customerId, customerName, projectType, dimensions) {
    const orderNumber = await nextOrderNumber();
    const result = await database_1.default.query(`INSERT INTO qq_orders (order_number, quote_id, customer_id, customer_name, project_type, dimensions)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [orderNumber, quoteId, customerId, customerName, projectType, dimensions]);
    return rowToOrder(result.rows[0]);
}
async function updateOrderStatus(id, status, schedule) {
    const setClauses = ['installation_status = $1'];
    const values = [status];
    if (schedule) {
        setClauses.push('installation_schedule = $2');
        values.push(schedule);
    }
    values.push(id);
    const idIdx = values.length;
    const result = await database_1.default.query(`UPDATE qq_orders SET ${setClauses.join(', ')} WHERE (id::text = $${idIdx} OR order_number = $${idIdx}) AND deleted_at IS NULL RETURNING *`, values);
    return result.rows.length > 0 ? rowToOrder(result.rows[0]) : undefined;
}
//# sourceMappingURL=OrderDB.js.map