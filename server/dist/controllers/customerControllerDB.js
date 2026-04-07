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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyQuotes = getMyQuotes;
exports.getMyQuote = getMyQuote;
exports.acceptQuote = acceptQuote;
exports.declineQuote = declineQuote;
exports.getMyStatusQuotes = getMyStatusQuotes;
exports.getMyQuoteUpdates = getMyQuoteUpdates;
exports.getMyQuotePdf = getMyQuotePdf;
const QuoteModel = __importStar(require("../models/QuoteDB"));
const QuoteUpdateModel = __importStar(require("../models/QuoteUpdateDB"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
const NotificationService = __importStar(require("../services/notificationService"));
const AnalyticsService = __importStar(require("../services/analyticsService"));
const pdfService_1 = require("../services/pdfService");
const database_1 = __importDefault(require("../config/database"));
const PaymentModel = __importStar(require("../models/PaymentDB"));
async function getUserRoleById(userId) {
    if (!userId)
        return null;
    try {
        const result = await database_1.default.query(`SELECT role FROM users WHERE id = $1 LIMIT 1`, [userId]);
        if (result.rows.length === 0)
            return null;
        return result.rows[0].role || null;
    }
    catch (err) {
        // Fallback for environments where role/deleted_at columns are missing.
        console.warn('[CUSTOMER CTRL] role lookup failed, defaulting to customer access:', err?.message || err);
        return null;
    }
}
function toFrontendQuote(q) {
    return {
        id: q.quoteNumber,
        customerName: q.customerName,
        customerEmail: q.customerEmail,
        customerPhone: q.customerPhone,
        customerAddress: q.customerAddress,
        projectType: q.projectType,
        glassType: q.glassType,
        frameMaterial: q.frameMaterial,
        width: q.width,
        height: q.height,
        quantity: q.quantity,
        color: q.color,
        originalEstimatedCost: q.originalEstimatedCost,
        estimatedCost: q.estimatedCost,
        updatedCost: q.updatedCost,
        status: q.status,
        submissionDate: q.submissionDate,
        rejectionReason: q.rejectionReason,
        approvedDate: q.approvedDate,
        expiryDate: q.expiryDate,
        acceptedDate: q.acceptedDate,
        declinedDate: q.declinedDate,
        convertedDate: q.convertedDate,
        notes: q.notes,
        reservationDate: q.reservationDate,
        reservationStatus: q.reservationStatus,
    };
}
async function toFrontendQuoteWithPayment(q) {
    const base = toFrontendQuote(q);
    const payment = await PaymentModel.getPaymentByQuoteId(q.id);
    base.payment = payment
        ? {
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            proofFile: payment.proofFile,
            adminRejectionReason: payment.adminRejectionReason,
            submittedAt: payment.submittedAt,
            createdAt: payment.createdAt,
        }
        : null;
    return base;
}
// GET /api/customer/quotes
async function getMyQuotes(req, res) {
    try {
        const email = req.session?.userEmail;
        if (!email) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        await QuoteModel.expireOldQuotes();
        const quotes = await QuoteModel.getQuotesByEmail(email);
        return res.json({ success: true, data: quotes.map(toFrontendQuote) });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] getMyQuotes error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/customer/quotes/:id
async function getMyQuote(req, res) {
    try {
        const email = req.session?.userEmail;
        if (!email) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        return res.json({ success: true, data: toFrontendQuote(quote) });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] getMyQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/customer/quotes/:id/accept
async function acceptQuote(req, res) {
    try {
        const email = req.session?.userEmail;
        if (!email)
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (quote.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Only approved quotes can be accepted.' });
        }
        // Check expiry
        if (quote.expiryDate && new Date() > new Date(quote.expiryDate)) {
            await QuoteModel.updateQuote(quote.id, { status: 'expired' });
            return res.status(400).json({ success: false, message: 'This quote has expired and can no longer be accepted.' });
        }
        const updated = await QuoteModel.updateQuote(quote.id, {
            status: 'customer_accepted',
            acceptedDate: new Date().toISOString().split('T')[0],
        });
        await ActivityLogService.logCustomerAccepted(quote.id, quote.customerName);
        await NotificationService.notifyAdminCustomerAction(quote.quoteNumber, quote.customerName, 'accepted');
        await AnalyticsService.trackEvent('quote_accepted', req.session?.userId, {
            quoteNumber: quote.quoteNumber,
        });
        return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] acceptQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/customer/quotes/:id/decline
async function declineQuote(req, res) {
    try {
        const email = req.session?.userEmail;
        if (!email)
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (quote.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Only approved quotes can be declined.' });
        }
        const updated = await QuoteModel.updateQuote(quote.id, {
            status: 'customer_declined',
            declinedDate: new Date().toISOString().split('T')[0],
        });
        await ActivityLogService.logCustomerDeclined(quote.id, quote.customerName);
        await NotificationService.notifyAdminCustomerAction(quote.quoteNumber, quote.customerName, 'declined');
        return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] declineQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/customer/check-status/quotes
async function getMyStatusQuotes(req, res) {
    try {
        const email = req.session?.userEmail;
        const role = await getUserRoleById(req.session?.userId);
        if (!email) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin users cannot access customer check status.' });
        }
        await QuoteModel.expireOldQuotes();
        const quotes = await QuoteModel.getQuotesByEmail(email);
        const withPayments = await Promise.all(quotes.map((q) => toFrontendQuoteWithPayment(q)));
        return res.json({ success: true, data: withPayments });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] getMyStatusQuotes error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/customer/check-status/quotes/:id/updates
async function getMyQuoteUpdates(req, res) {
    try {
        const email = req.session?.userEmail;
        const role = await getUserRoleById(req.session?.userId);
        if (!email) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin users cannot access customer check status.' });
        }
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const updates = await QuoteUpdateModel.getQuoteUpdatesByQuoteId(quote.id);
        return res.json({
            success: true,
            data: {
                quote: toFrontendQuote(quote),
                updates,
            },
        });
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] getMyQuoteUpdates error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/customer/quotes/:id/pdf
async function getMyQuotePdf(req, res) {
    try {
        const email = req.session?.userEmail;
        const role = await getUserRoleById(req.session?.userId);
        if (!email) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin users cannot access customer check status.' });
        }
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const pdfData = (0, pdfService_1.getQuotePDFData)(quote);
        const html = (0, pdfService_1.generateQuotePDFHtml)(pdfData);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="quotation-${quote.quoteNumber}.html"`);
        return res.send(html);
    }
    catch (err) {
        console.error('[CUSTOMER CTRL] getMyQuotePdf error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=customerControllerDB.js.map