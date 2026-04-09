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
exports.getMyQuotes = getMyQuotes;
exports.getMyQuote = getMyQuote;
exports.acceptQuote = acceptQuote;
exports.declineQuote = declineQuote;
const QuoteModel = __importStar(require("../models/Quote"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
// GET /api/customer/quotes — Get quotes for a customer by email
function getMyQuotes(req, res) {
    const email = req.query.email || req.headers['x-customer-email'];
    if (!email)
        return res.status(400).json({ error: 'Customer email is required.' });
    QuoteModel.expireOldQuotes();
    const quotes = QuoteModel.getQuotesByEmail(email);
    return res.json(quotes);
}
// GET /api/customer/quotes/:id — Get single quote (if owned by customer)
function getMyQuote(req, res) {
    const email = req.query.email || req.headers['x-customer-email'];
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    if (email && quote.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied.' });
    }
    return res.json(quote);
}
// POST /api/customer/quotes/:id/accept — Customer accepts an approved quote
function acceptQuote(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    if (quote.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved quotes can be accepted.' });
    }
    // Check expiry
    if (quote.expiryDate && new Date() > new Date(quote.expiryDate)) {
        QuoteModel.updateQuote(req.params.id, { status: 'expired' });
        return res.status(400).json({ error: 'This quote has expired and can no longer be accepted.' });
    }
    const updated = QuoteModel.updateQuote(req.params.id, {
        status: 'customer_accepted',
        acceptedDate: new Date().toISOString().split('T')[0],
    });
    ActivityLogService.logCustomerAccepted(req.params.id, quote.customerName);
    return res.json(updated);
}
// POST /api/customer/quotes/:id/decline — Customer declines an approved quote
function declineQuote(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    if (quote.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved quotes can be declined.' });
    }
    const updated = QuoteModel.updateQuote(req.params.id, {
        status: 'customer_declined',
        declinedDate: new Date().toISOString().split('T')[0],
    });
    ActivityLogService.logCustomerDeclined(req.params.id, quote.customerName);
    return res.json(updated);
}
//# sourceMappingURL=customerController.js.map