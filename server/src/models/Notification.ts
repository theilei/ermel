// ============================================================
// Notification Model — PostgreSQL-backed
// ============================================================
import pool from '../config/database';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  relatedQuoteNumber?: string;
  read: boolean;
  createdAt: string;
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type || undefined,
    relatedQuoteNumber: row.related_quote_number || undefined,
    read: row.is_read ?? row.read,
    createdAt: row.created_at,
  };
}

async function logNotificationEvent(notificationId: string, eventType: 'sent' | 'received' | 'read'): Promise<void> {
  await pool.query(
    `INSERT INTO notification_logs (notification_id, event_type)
     VALUES ($1, $2)`,
    [notificationId, eventType],
  );
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );

  // Record a one-time "received" event for any notification that has not been marked as received yet.
  await pool.query(
    `INSERT INTO notification_logs (notification_id, event_type)
     SELECT n.id, 'received'
     FROM notifications n
     WHERE n.user_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM notification_logs nl
         WHERE nl.notification_id = n.id AND nl.event_type = 'received'
       )`,
    [userId],
  );

  return result.rows.map(rowToNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM notifications
     WHERE user_id = $1
       AND COALESCE(is_read, read, FALSE) = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].cnt, 10);
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  meta?: { type?: string; relatedQuoteNumber?: string }
): Promise<Notification> {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, content, related_quote_number)
     VALUES ($1, $2, $3, $4, $3, $5)
     RETURNING *`,
    [userId, title, message, meta?.type || null, meta?.relatedQuoteNumber || null]
  );

  await logNotificationEvent(result.rows[0].id, 'sent');
  return rowToNotification(result.rows[0]);
}

export async function markAsRead(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE, read = TRUE WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if ((result.rowCount ?? 0) > 0) {
    await logNotificationEvent(id, 'read');
  }
  return (result.rowCount ?? 0) > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  await pool.query(
    `INSERT INTO notification_logs (notification_id, event_type)
     SELECT n.id, 'read'
     FROM notifications n
     WHERE n.user_id = $1
       AND COALESCE(n.is_read, n.read, FALSE) = FALSE
       AND NOT EXISTS (
         SELECT 1 FROM notification_logs nl
         WHERE nl.notification_id = n.id AND nl.event_type = 'read'
       )`,
    [userId],
  );

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE,
         read = TRUE
     WHERE user_id = $1
       AND COALESCE(is_read, read, FALSE) = FALSE`,
    [userId]
  );
  return result.rowCount ?? 0;
}
