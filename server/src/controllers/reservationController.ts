import { Request, Response } from 'express';
import * as ReservationModel from '../models/ReservationDB';

const DAY_MS = 24 * 60 * 60 * 1000;

function asDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function validateReservationDate(dateStr: string): { ok: boolean; message?: string } {
  const selected = asDateOnly(dateStr);
  if (!selected) return { ok: false, message: 'Reservation date must be in YYYY-MM-DD format.' };

  const today = normalizeUtcDay(new Date());
  const minDate = new Date(today.getTime() + 3 * DAY_MS);
  const maxDate = new Date(today.getTime() + 60 * DAY_MS);

  if (selected.getTime() < minDate.getTime()) {
    return { ok: false, message: 'Reservation date must be at least 3 days from today.' };
  }
  if (selected.getTime() > maxDate.getTime()) {
    return { ok: false, message: 'Reservation date must be within 60 days from today.' };
  }

  return { ok: true };
}

// GET /api/reservations/dates
export async function listReservedDates(_req: Request, res: Response) {
  try {
    const dates = await ReservationModel.listReservedDates();
    return res.json({ success: true, data: dates });
  } catch (err: any) {
    console.error('[RESERVATION CTRL] listReservedDates error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/admin/reservations
export async function listReservations(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const rows = status && status !== 'all'
      ? await ReservationModel.listReservationsByStatus(status as ReservationModel.ReservationStatus)
      : await ReservationModel.listReservations();

    return res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[RESERVATION CTRL] listReservations error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/admin/reservations/:id/approve
export async function approveReservation(req: Request, res: Response) {
  try {
    const updated = await ReservationModel.updateReservationStatus(req.params.id, 'approved');
    if (!updated) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[RESERVATION CTRL] approveReservation error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/admin/reservations/:id/reject
export async function rejectReservation(req: Request, res: Response) {
  try {
    const updated = await ReservationModel.updateReservationStatus(req.params.id, 'rejected');
    if (!updated) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[RESERVATION CTRL] rejectReservation error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /api/admin/reservations/:id/reschedule
export async function rescheduleReservation(req: Request, res: Response) {
  try {
    const reservationDate = String(req.body?.reservationDate || '');
    const dateValidation = validateReservationDate(reservationDate);
    if (!dateValidation.ok) {
      return res.status(400).json({ success: false, message: dateValidation.message });
    }

    try {
      const updated = await ReservationModel.rescheduleReservation(req.params.id, reservationDate);
      if (!updated) return res.status(404).json({ success: false, message: 'Reservation not found.' });
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      if (ReservationModel.isReservationConflictError(err)) {
        return res.status(409).json({ success: false, message: 'The selected date is already reserved.' });
      }
      throw err;
    }
  } catch (err: any) {
    console.error('[RESERVATION CTRL] rescheduleReservation error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
