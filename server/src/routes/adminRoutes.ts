// ============================================================
// Admin API Routes
// ============================================================
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import * as quoteCtrl from '../controllers/quoteControllerDB';
import * as orderCtrl from '../controllers/orderControllerDB';
import * as legacyOrderCtrl from '../controllers/legacyOrderController';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// ---- Quotation Management ----
router.get('/quotes', quoteCtrl.listQuotes);
router.get('/quotes/:id', quoteCtrl.getQuote);
router.put('/quotes/:id', quoteCtrl.updateQuote);
router.post('/quotes/:id/approve', quoteCtrl.approveQuote);
router.post('/quotes/:id/reject', quoteCtrl.rejectQuote);
router.get('/quotes/:id/pdf', quoteCtrl.generatePDF);
router.post('/quotes/:id/convert', quoteCtrl.convertToOrder);

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

export default router;
