import pool from '../config/database';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Reservation {
  id: string;
  quoteId: string;
  quoteNumber?: string;
  customerName?: string;
  customerEmail?: string;
  projectType?: string;
  reservationDate: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt?: string;
}

function rowToReservation(row: any): Reservation {
  return {
    id: row.id,
    quoteId: row.quote_id,
    quoteNumber: row.quote_number || undefined,
    customerName: row.customer_name || undefined,
    customerEmail: row.customer_email || undefined,
    projectType: row.project_type || undefined,
    reservationDate: row.reservation_date?.toISOString?.().split('T')[0] || row.reservation_date,
    status: row.status as ReservationStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function listReservations(): Promise<Reservation[]> {
  const result = await pool.query(
    `SELECT r.*, q.quote_number, q.customer_name, q.customer_email, q.project_type
     FROM reservations r
     JOIN qq_quotes q ON q.id = r.quote_id
     WHERE q.deleted_at IS NULL
     ORDER BY r.reservation_date ASC, r.created_at DESC`
  );
  return result.rows.map(rowToReservation);
}

export async function listReservationsByStatus(status: ReservationStatus): Promise<Reservation[]> {
  const result = await pool.query(
    `SELECT r.*, q.quote_number, q.customer_name, q.customer_email, q.project_type
     FROM reservations r
     JOIN qq_quotes q ON q.id = r.quote_id
     WHERE q.deleted_at IS NULL AND r.status = $1
     ORDER BY r.reservation_date ASC, r.created_at DESC`,
    [status]
  );
  return result.rows.map(rowToReservation);
}

export async function listReservedDates(): Promise<string[]> {
  const result = await pool.query(
    `SELECT reservation_date
     FROM reservations
     WHERE status IN ('pending', 'approved')
     ORDER BY reservation_date ASC`
  );

  return result.rows.map((r) => r.reservation_date?.toISOString?.().split('T')[0] || r.reservation_date);
}

export async function getReservationByQuoteId(quoteId: string): Promise<Reservation | undefined> {
  const result = await pool.query(
    `SELECT * FROM reservations WHERE quote_id = $1 LIMIT 1`,
    [quoteId]
  );
  return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}

export async function createReservation(quoteId: string, reservationDate: string): Promise<Reservation> {
  const result = await pool.query(
    `INSERT INTO reservations (quote_id, reservation_date, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`,
    [quoteId, reservationDate]
  );
  return rowToReservation(result.rows[0]);
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation | undefined> {
  const result = await pool.query(
    `UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}

export async function rescheduleReservation(id: string, reservationDate: string): Promise<Reservation | undefined> {
  const result = await pool.query(
    `UPDATE reservations
     SET reservation_date = $1, status = 'pending'
     WHERE id = $2
     RETURNING *`,
    [reservationDate, id]
  );
  return result.rows.length > 0 ? rowToReservation(result.rows[0]) : undefined;
}

export function isReservationConflictError(err: any): boolean {
  const code = err?.code;
  const constraint = err?.constraint;
  return code === '23505' && (constraint === 'reservations_date_unique' || constraint === 'reservations_quote_unique');
}
