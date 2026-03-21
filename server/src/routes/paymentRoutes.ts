import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import * as paymentCtrl from '../controllers/paymentController';

const router = Router();

router.use(requireAuth);

router.get('/customer/quotes/:id/payment', paymentCtrl.getCustomerPayment);
router.post('/customer/quotes/:id/payment/method', paymentCtrl.setPaymentMethod);
router.post('/customer/quotes/:id/payment/proof', paymentCtrl.uploadPaymentProof, paymentCtrl.submitQrphProof);
router.delete('/customer/quotes/:id/payment/proof', paymentCtrl.deleteQrphProof);
router.get('/customer/quotes/:id/payment/receipt', paymentCtrl.downloadCashReceipt);

router.get('/admin/payments', requireAdmin, paymentCtrl.adminListPayments);
router.post('/admin/quotes/:id/payment/approve', requireAdmin, paymentCtrl.adminApprovePayment);
router.post('/admin/quotes/:id/payment/reject', requireAdmin, paymentCtrl.adminRejectPayment);

export default router;
