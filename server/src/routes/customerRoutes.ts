// ============================================================
// Customer API Routes
// ============================================================
import { Router } from 'express';
import * as customerCtrl from '../controllers/customerController';

const router = Router();

// Customer routes — auth via x-customer-email header for dev
router.get('/quotes', customerCtrl.getMyQuotes);
router.get('/quotes/:id', customerCtrl.getMyQuote);
router.post('/quotes/:id/accept', customerCtrl.acceptQuote);
router.post('/quotes/:id/decline', customerCtrl.declineQuote);

export default router;
