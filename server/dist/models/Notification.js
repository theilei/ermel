"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsByUser = getNotificationsByUser;
exports.getUnreadCount = getUnreadCount;
exports.createNotification = createNotification;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
// ============================================================
// Notification Model — PostgreSQL-backed
// ============================================================
const database_1 = __importDefault(require("../config/database"));
function rowToNotification(row) {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        message: row.message,
        type: row.type || undefined,
        relatedQuoteNumber: row.related_quote_number || undefined,
        read: row.read ?? row.is_read,
        createdAt: row.created_at,
    };
}
async function logNotificationEvent(notificationId, eventType) {
    await database_1.default.query(`INSERT INTO notification_logs (notification_id, event_type)
     VALUES ($1, $2)`, [notificationId, eventType]);
}
async function getNotificationsByUser(userId) {
    const result = await database_1.default.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]);
    // Record a one-time "received" event for any notification that has not been marked as received yet.
    await database_1.default.query(`INSERT INTO notification_logs (notification_id, event_type)
     SELECT n.id, 'received'
     FROM notifications n
     WHERE n.user_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM notification_logs nl
         WHERE nl.notification_id = n.id AND nl.event_type = 'received'
       )`, [userId]);
    return result.rows.map(rowToNotification);
}
async function getUnreadCount(userId) {
    const result = await database_1.default.query(`SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = $1 AND read = FALSE`, [userId]);
    return parseInt(result.rows[0].cnt, 10);
}
async function createNotification(userId, title, message, meta) {
    const result = await database_1.default.query(`INSERT INTO notifications (user_id, title, message, type, content, related_quote_number)
     VALUES ($1, $2, $3, $4, $3, $5)
     RETURNING *`, [userId, title, message, meta?.type || null, meta?.relatedQuoteNumber || null]);
    await logNotificationEvent(result.rows[0].id, 'sent');
    return rowToNotification(result.rows[0]);
}
async function markAsRead(id, userId) {
    const result = await database_1.default.query(`UPDATE notifications SET read = TRUE, is_read = TRUE WHERE id = $1 AND user_id = $2`, [id, userId]);
    if ((result.rowCount ?? 0) > 0) {
        await logNotificationEvent(id, 'read');
    }
    return (result.rowCount ?? 0) > 0;
}
async function markAllAsRead(userId) {
    await database_1.default.query(`INSERT INTO notification_logs (notification_id, event_type)
     SELECT n.id, 'read'
     FROM notifications n
     WHERE n.user_id = $1
       AND (n.read = FALSE OR n.is_read = FALSE)
       AND NOT EXISTS (
         SELECT 1 FROM notification_logs nl
         WHERE nl.notification_id = n.id AND nl.event_type = 'read'
       )`, [userId]);
    const result = await database_1.default.query(`UPDATE notifications SET read = TRUE, is_read = TRUE WHERE user_id = $1 AND (read = FALSE OR is_read = FALSE)`, [userId]);
    return result.rowCount ?? 0;
}
//# sourceMappingURL=Notification.js.map