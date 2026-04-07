"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuoteUpdate = createQuoteUpdate;
exports.getQuoteUpdatesByQuoteId = getQuoteUpdatesByQuoteId;
const database_1 = __importDefault(require("../config/database"));
function rowToQuoteUpdate(row) {
    return {
        id: row.id,
        quoteId: row.quote_id,
        status: row.status || undefined,
        estimatedPrice: row.estimated_price !== null && row.estimated_price !== undefined
            ? parseFloat(row.estimated_price)
            : undefined,
        updatedPrice: row.updated_price !== null && row.updated_price !== undefined
            ? parseFloat(row.updated_price)
            : undefined,
        adminRemark: row.admin_remark || undefined,
        adminName: row.admin_name || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function createQuoteUpdate(data) {
    const result = await database_1.default.query(`INSERT INTO quote_updates (
      quote_id, status, estimated_price, updated_price, admin_remark, admin_name
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`, [
        data.quoteId,
        data.status || null,
        data.estimatedPrice ?? null,
        data.updatedPrice ?? null,
        data.adminRemark || null,
        data.adminName || null,
    ]);
    return rowToQuoteUpdate(result.rows[0]);
}
async function getQuoteUpdatesByQuoteId(quoteId) {
    const result = await database_1.default.query(`SELECT * FROM quote_updates WHERE quote_id = $1 ORDER BY created_at DESC`, [quoteId]);
    return result.rows.map(rowToQuoteUpdate);
}
//# sourceMappingURL=QuoteUpdateDB.js.map