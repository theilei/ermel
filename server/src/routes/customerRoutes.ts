// ============================================================
// Customer API Routes
// ============================================================
import { Router } from 'express';
import * as customerCtrl from '../controllers/customerControllerDB';
import * as legacyOrderCtrl from '../controllers/legacyOrderController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

// Customer quote routes
router.get('/quotes', customerCtrl.getMyQuotes);
router.get('/quotes/:id', customerCtrl.getMyQuote);
router.get('/quotes/:id/pdf', customerCtrl.getMyQuotePdf);
router.post('/quotes/:id/accept', customerCtrl.acceptQuote);
router.post('/quotes/:id/decline', customerCtrl.declineQuote);

// Customer check-status routes
router.get('/check-status/quotes', customerCtrl.getMyStatusQuotes);
router.get('/check-status/quotes/:id/updates', customerCtrl.getMyQuoteUpdates);

// Customer legacy order routes
router.get('/legacy-orders', legacyOrderCtrl.getOrdersByEmail);
router.put('/legacy-orders/:id/payment', legacyOrderCtrl.markPaymentUploaded);

export default router;
