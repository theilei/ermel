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
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentCtrl = __importStar(require("../controllers/paymentController"));
const router = (0, express_1.Router)();
// Only payment endpoints require authentication.
// Keep unrelated /api routes (e.g. /api/health) publicly reachable.
router.use(['/customer', '/admin'], authMiddleware_1.requireAuth);
router.get('/customer/quotes/:id/payment', paymentCtrl.getCustomerPayment);
router.post('/customer/quotes/:id/payment/method', paymentCtrl.setPaymentMethod);
router.post('/customer/quotes/:id/payment/proof', paymentCtrl.uploadPaymentProof, paymentCtrl.submitQrphProof);
router.delete('/customer/quotes/:id/payment/proof', paymentCtrl.deleteQrphProof);
router.get('/customer/quotes/:id/payment/receipt', paymentCtrl.downloadCashReceipt);
router.get('/admin/payments', authMiddleware_1.requireAdmin, paymentCtrl.adminListPayments);
router.post('/admin/quotes/:id/payment/approve', authMiddleware_1.requireAdmin, paymentCtrl.adminApprovePayment);
router.post('/admin/quotes/:id/payment/reject', authMiddleware_1.requireAdmin, paymentCtrl.adminRejectPayment);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map