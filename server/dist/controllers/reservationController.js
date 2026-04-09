"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReservationDate = validateReservationDate;
exports.listReservedDates = listReservedDates;
exports.listReservations = listReservations;
exports.approveReservation = approveReservation;
exports.rejectReservation = rejectReservation;
exports.rescheduleReservation = rescheduleReservation;
const ReservationModel = __importStar(require("../models/ReservationDB"));
const DAY_MS = 24 * 60 * 60 * 1000;
function asDateOnly(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return null;
    const d = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
}
function normalizeUtcDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function validateReservationDate(dateStr) {
    const selected = asDateOnly(dateStr);
    if (!selected)
        return { ok: false, message: 'Reservation date must be in YYYY-MM-DD format.' };
    const today = normalizeUtcDay(new Date());
    const minDate = new Date(today.getTime() + 7 * DAY_MS);
    const maxDate = new Date(today.getTime() + 60 * DAY_MS);
    if (selected.getTime() < minDate.getTime()) {
        return { ok: false, message: 'Reservation date must be at least 7 days from today.' };
    }
    if (selected.getTime() > maxDate.getTime()) {
        return { ok: false, message: 'Reservation date must be within 60 days from today.' };
    }
    return { ok: true };
}
// GET /api/reservations/dates
async function listReservedDates(_req, res) {
    try {
        const dates = await ReservationModel.listReservedDates();
        return res.json({ success: true, data: dates });
    }
    catch (err) {
        console.error('[RESERVATION CTRL] listReservedDates error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/reservations
async function listReservations(req, res) {
    try {
        const status = req.query.status;
        const rows = status && status !== 'all'
            ? await ReservationModel.listReservationsByStatus(status)
            : await ReservationModel.listReservations();
        return res.json({ success: true, data: rows });
    }
    catch (err) {
        console.error('[RESERVATION CTRL] listReservations error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/reservations/:id/approve
async function approveReservation(req, res) {
    try {
        const updated = await ReservationModel.updateReservationStatus(req.params.id, 'approved');
        if (!updated)
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('[RESERVATION CTRL] approveReservation error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/reservations/:id/reject
async function rejectReservation(req, res) {
    try {
        const updated = await ReservationModel.updateReservationStatus(req.params.id, 'rejected');
        if (!updated)
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('[RESERVATION CTRL] rejectReservation error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/reservations/:id/reschedule
async function rescheduleReservation(req, res) {
    try {
        const reservationDate = String(req.body?.reservationDate || '');
        const dateValidation = validateReservationDate(reservationDate);
        if (!dateValidation.ok) {
            return res.status(400).json({ success: false, message: dateValidation.message });
        }
        try {
            const updated = await ReservationModel.rescheduleReservation(req.params.id, reservationDate);
            if (!updated)
                return res.status(404).json({ success: false, message: 'Reservation not found.' });
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            if (ReservationModel.isReservationConflictError(err)) {
                return res.status(409).json({ success: false, message: 'The selected date is already reserved.' });
            }
            throw err;
        }
    }
    catch (err) {
        console.error('[RESERVATION CTRL] rescheduleReservation error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=reservationController.js.map