import pool from '../config/database';

export type AnalyticsEventType =
  | 'quote_started'
  | 'quote_submitted'
  | 'quote_approved'
  | 'quote_accepted';

export async function trackEvent(
  eventType: AnalyticsEventType,
  userId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO analytics_events (event_type, user_id, metadata)
       VALUES ($1, $2, $3::jsonb)`,
      [eventType, userId || null, JSON.stringify(metadata || {})],
    );
  } catch (err: any) {
    console.warn('[ANALYTICS] failed to track event:', err.message);
  }
}

export async function getAdminAnalyticsSummary() {
  const [totals, monthly, approvals, conversion] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total_quotes FROM qq_quotes WHERE deleted_at IS NULL`),
    pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
              COUNT(*)::int AS total
       FROM qq_quotes
       WHERE deleted_at IS NULL
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) DESC
       LIMIT 12`,
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
         COUNT(*)::int AS total
       FROM qq_quotes
       WHERE deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'customer_accepted')::int AS accepted,
         COUNT(*) FILTER (WHERE status = 'approved')::int AS approved
       FROM qq_quotes
       WHERE deleted_at IS NULL`,
    ),
  ]);

  const totalQuotes = totals.rows[0]?.total_quotes ?? 0;
  const approved = approvals.rows[0]?.approved ?? 0;
  const approvalBase = approvals.rows[0]?.total ?? 0;
  const accepted = conversion.rows[0]?.accepted ?? 0;
  const conversionBase = conversion.rows[0]?.approved ?? 0;

  return {
    totalQuotes,
    approvalRate: approvalBase > 0 ? Number(((approved / approvalBase) * 100).toFixed(2)) : 0,
    conversionRate: conversionBase > 0 ? Number(((accepted / conversionBase) * 100).toFixed(2)) : 0,
    monthlyTrends: monthly.rows.map((row) => ({ month: row.month, total: row.total })),
  };
}
