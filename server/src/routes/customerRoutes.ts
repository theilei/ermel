// ============================================================
// Customer API Routes
// ============================================================
import { Router } from 'express';
import * as customerCtrl from '../controllers/customerControllerDB';
import * as legacyOrderCtrl from '../controllers/legacyOrderController';

const router = Router();

// Customer quote routes
router.get('/quotes', customerCtrl.getMyQuotes);
router.get('/quotes/:id', customerCtrl.getMyQuote);
router.post('/quotes/:id/accept', customerCtrl.acceptQuote);
router.post('/quotes/:id/decline', customerCtrl.declineQuote);

// Customer legacy order routes
router.get('/legacy-orders', legacyOrderCtrl.getOrdersByEmail);
router.put('/legacy-orders/:id/payment', legacyOrderCtrl.markPaymentUploaded);

export default router;
