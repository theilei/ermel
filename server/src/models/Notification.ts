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
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return result.rows.map(rowToNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = $1 AND read = FALSE`,
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
    `INSERT INTO notifications (user_id, title, message, type, related_quote_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, message, meta?.type || null, meta?.relatedQuoteNumber || null]
  );
  return rowToNotification(result.rows[0]);
}

export async function markAsRead(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );
  return result.rowCount ?? 0;
}
