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
// Customer API Routes
// ============================================================
const express_1 = require("express");
const customerCtrl = __importStar(require("../controllers/customerControllerDB"));
const legacyOrderCtrl = __importStar(require("../controllers/legacyOrderController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
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
exports.default = router;
//# sourceMappingURL=customerRoutes.js.map