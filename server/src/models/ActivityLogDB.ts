// ============================================================
// Activity Log Model — PostgreSQL-backed
// ============================================================
import pool from '../config/database';

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  quoteId?: string;
  orderId?: string;
  userRole: 'admin' | 'customer';
  userName: string;
  details?: string;
  createdAt: string;
}

function rowToLog(row: any): ActivityLog {
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

// Legacy alias: some existing code uses 'event' instead of 'action'
export interface AddLogEntry {
  event?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  quoteId?: string;
  orderId?: string;
  userId?: string;
  userRole: 'admin' | 'customer';
  userName: string;
  details?: string;
}

export async function addLog(entry: AddLogEntry): Promise<ActivityLog> {
  const action = entry.action || entry.event || 'Unknown action';
  const result = await pool.query(
    `INSERT INTO qq_activity_logs (user_id, action, entity, entity_id, quote_id, order_id, user_role, user_name, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      entry.userId || null,
      action,
      entry.entity || null,
      entry.entityId || null,
      entry.quoteId || null,
      entry.orderId || null,
      entry.userRole,
      entry.userName,
      entry.details || null,
    ]
  );
  return rowToLog(result.rows[0]);
}

export async function getAllLogs(): Promise<ActivityLog[]> {
  const result = await pool.query(
    `SELECT * FROM qq_activity_logs ORDER BY created_at DESC LIMIT 200`
  );
  return result.rows.map(rowToLog);
}

export async function getLogsByQuote(quoteId: string): Promise<ActivityLog[]> {
  const result = await pool.query(
    `SELECT * FROM qq_activity_logs WHERE quote_id::text = $1 ORDER BY created_at DESC`,
    [quoteId]
  );
  return result.rows.map(rowToLog);
}

export async function getLogsByOrder(orderId: string): Promise<ActivityLog[]> {
  const result = await pool.query(
    `SELECT * FROM qq_activity_logs WHERE order_id::text = $1 ORDER BY created_at DESC`,
    [orderId]
  );
  return result.rows.map(rowToLog);
}
