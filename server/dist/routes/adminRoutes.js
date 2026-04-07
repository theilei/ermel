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
// ============================================================
// Admin API Routes
// ============================================================
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const quoteCtrl = __importStar(require("../controllers/quoteControllerDB"));
const orderCtrl = __importStar(require("../controllers/orderControllerDB"));
const legacyOrderCtrl = __importStar(require("../controllers/legacyOrderController"));
const reservationCtrl = __importStar(require("../controllers/reservationController"));
const analyticsCtrl = __importStar(require("../controllers/analyticsController"));
const adminUserCtrl = __importStar(require("../controllers/adminUserController"));
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.requireAdmin);
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
router.get('/legacy-orders/summary', legacyOrderCtrl.getSummary);
router.get('/legacy-orders/:id', legacyOrderCtrl.getOrder);
router.post('/legacy-orders', legacyOrderCtrl.createOrder);
router.put('/legacy-orders/:id/status', legacyOrderCtrl.updateStatus);
router.put('/legacy-orders/:id/cost', legacyOrderCtrl.updateCost);
router.put('/legacy-orders/:id/payment', legacyOrderCtrl.markPaymentUploaded);
// ---- Activity Logs ----
router.get('/activity-logs', quoteCtrl.getActivityLogs);
// ---- Dashboard Metrics ----
router.get('/dashboard/metrics', quoteCtrl.getDashboardMetrics);
// ---- Analytics ----
router.get('/analytics/summary', analyticsCtrl.getAdminAnalytics);
// ---- User role management ----
router.patch('/users/:id/role', adminUserCtrl.updateUserRole);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map