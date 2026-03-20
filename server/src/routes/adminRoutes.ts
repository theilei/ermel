// ============================================================
// Admin API Routes
// ============================================================
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import * as quoteCtrl from '../controllers/quoteControllerDB';
import * as orderCtrl from '../controllers/orderControllerDB';
import * as legacyOrderCtrl from '../controllers/legacyOrderController';
import * as reservationCtrl from '../controllers/reservationController';
import * as analyticsCtrl from '../controllers/analyticsController';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// ---- Quotation Management ----
router.get('/quotes', quoteCtrl.listQuotes);
router.get('/quotes/:id', quoteCtrl.getQuote);
router.put('/quotes/:id', quoteCtrl.updateQuote);
router.post('/quotes/:id/updates', quoteCtrl.createQuoteUpdate);
router.post('/quotes/:id/approve', quoteCtrl.approveQuote);
router.post('/quotes/:id/reject', quoteCtrl.rejectQuote);
router.get('/quotes/:id/pdf', quoteCtrl.generatePDF);
router.post('/quotes/:id/convert', quoteCtrl.convertToOrder);

// ---- Reservation Management ----
router.get('/reservations', reservationCtrl.listReservations);
router.post('/reservations/:id/approve', reservationCtrl.approveReservation);
router.post('/reservations/:id/reject', reservationCtrl.rejectReservation);
router.post('/reservations/:id/reschedule', reservationCtrl.rescheduleReservation);

// ---- Installation Queue ----
router.get('/orders', orderCtrl.listOrders);
router.get('/orders/:id', orderCtrl.getOrder);
router.put('/orders/:id/status', orderCtrl.updateInstallationStatus);

// ---- Legacy Orders (general project tracking) ----
router.get('/legacy-orders', legacyOrderCtrl.listOrders);
router.get('/legacy-orders/:id', legacyOrderCtrl.getOrder);
router.post('/legacy-orders', legacyOrderCtrl.createOrder);
router.put('/legacy-orders/:id/status', legacyOrderCtrl.updateStatus);
router.put('/legacy-orders/:id/cost', legacyOrderCtrl.updateCost);
router.put('/legacy-orders/:id/payment', legacyOrderCtrl.markPaymentUploaded);

// ---- Activity Logs ----
router.get('/activity-logs', quoteCtrl.getActivityLogs);

// ---- Analytics ----
router.get('/analytics/summary', analyticsCtrl.getAdminAnalytics);

export default router;
