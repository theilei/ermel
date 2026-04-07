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
exports.listQuotes = listQuotes;
exports.getQuote = getQuote;
exports.updateQuote = updateQuote;
exports.approveQuote = approveQuote;
exports.rejectQuote = rejectQuote;
exports.generatePDF = generatePDF;
exports.convertToOrder = convertToOrder;
exports.getActivityLogs = getActivityLogs;
const QuoteModel = __importStar(require("../models/Quote"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
const pdfService_1 = require("../services/pdfService");
const emailService_1 = require("../services/emailService");
// GET /api/admin/quotes — List all quotes with optional filters
function listQuotes(req, res) {
    QuoteModel.expireOldQuotes();
    let quotes = QuoteModel.getAllQuotes();
    // Filter by search query
    const search = (req.query.search || '').trim().toLowerCase();
    if (search) {
        quotes = quotes.filter((q) => q.customerName.toLowerCase().includes(search) ||
            q.id.toLowerCase().includes(search));
    }
    // Filter by status
    const status = req.query.status;
    if (status && status !== 'all') {
        quotes = quotes.filter((q) => q.status === status);
    }
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const totalItems = quotes.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIdx = (page - 1) * limit;
    const paginatedQuotes = quotes.slice(startIdx, startIdx + limit);
    return res.json({
        quotes: paginatedQuotes,
        pagination: { page, limit, totalItems, totalPages },
    });
}
// GET /api/admin/quotes/:id — Get single quote
function getQuote(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    return res.json(quote);
}
// PUT /api/admin/quotes/:id — Update quote details (edit pricing, customer info, etc.)
function updateQuote(req, res) {
    const existing = QuoteModel.getQuoteById(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'Quote not found.' });
    const { estimatedCost, customerName, customerEmail, customerPhone, customerAddress, projectType, width, height, quantity, color, notes, glassType, frameMaterial } = req.body;
    const updates = {};
    if (estimatedCost !== undefined)
        updates.estimatedCost = Number(estimatedCost);
    if (customerName)
        updates.customerName = String(customerName);
    if (customerEmail)
        updates.customerEmail = String(customerEmail);
    if (customerPhone)
        updates.customerPhone = String(customerPhone);
    if (customerAddress)
        updates.customerAddress = String(customerAddress);
    if (projectType)
        updates.projectType = String(projectType);
    if (glassType)
        updates.glassType = String(glassType);
    if (frameMaterial)
        updates.frameMaterial = String(frameMaterial);
    if (width !== undefined)
        updates.width = Number(width);
    if (height !== undefined)
        updates.height = Number(height);
    if (quantity !== undefined)
        updates.quantity = Number(quantity);
    if (color)
        updates.color = String(color);
    if (notes !== undefined)
        updates.notes = String(notes);
    // If status is pending, move to draft when admin edits
    if (existing.status === 'pending' && updates.estimatedCost !== undefined) {
        updates.status = 'draft';
    }
    const updated = QuoteModel.updateQuote(req.params.id, updates);
    // Log price edit
    if (updates.estimatedCost !== undefined) {
        const adminName = req.headers['x-admin-user'] || 'Admin';
        ActivityLogService.logQuotePriceEdited(req.params.id, adminName, updates.estimatedCost);
    }
    return res.json(updated);
}
// POST /api/admin/quotes/:id/approve — Approve a quote
async function approveQuote(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    if (quote.status !== 'pending' && quote.status !== 'draft') {
        return res.status(400).json({ error: `Cannot approve a quote with status "${quote.status}".` });
    }
    const approvedDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const updated = QuoteModel.updateQuote(req.params.id, {
        status: 'approved',
        approvedDate,
        expiryDate: expiryDate.toISOString().split('T')[0],
    });
    const adminName = req.headers['x-admin-user'] || 'Admin';
    ActivityLogService.logQuoteApproved(req.params.id, adminName);
    // Generate PDF and send email
    if (updated) {
        const pdfData = (0, pdfService_1.getQuotePDFData)(updated);
        const pdfHtml = (0, pdfService_1.generateQuotePDFHtml)(pdfData);
        await (0, emailService_1.sendQuoteApprovalEmail)(updated, pdfHtml);
    }
    return res.json(updated);
}
// POST /api/admin/quotes/:id/reject — Reject a quote
function rejectQuote(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    if (quote.status !== 'pending' && quote.status !== 'draft' && quote.status !== 'approved') {
        return res.status(400).json({ error: `Cannot reject a quote with status "${quote.status}".` });
    }
    const updated = QuoteModel.updateQuote(req.params.id, {
        status: 'customer_declined', // Rejected by admin goes to declined
        rejectionReason: reason.trim(),
    });
    const adminName = req.headers['x-admin-user'] || 'Admin';
    ActivityLogService.logQuoteRejected(req.params.id, adminName, reason.trim());
    return res.json(updated);
}
// GET /api/admin/quotes/:id/pdf — Generate quote PDF
function generatePDF(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    const pdfData = (0, pdfService_1.getQuotePDFData)(quote);
    const html = (0, pdfService_1.generateQuotePDFHtml)(pdfData);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="quotation-${quote.id}.html"`);
    return res.send(html);
}
// POST /api/admin/quotes/:id/convert — Convert accepted quote to order
function convertToOrder(req, res) {
    const quote = QuoteModel.getQuoteById(req.params.id);
    if (!quote)
        return res.status(404).json({ error: 'Quote not found.' });
    if (quote.status !== 'customer_accepted') {
        return res.status(400).json({ error: 'Only customer-accepted quotes can be converted to orders.' });
    }
    // Import order model inline to avoid circular deps
    const OrderModel = require('../models/Order');
    const dimensions = `${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)`;
    const order = OrderModel.createOrder(quote.id, quote.customerName, quote.projectType, dimensions);
    QuoteModel.updateQuote(req.params.id, {
        status: 'converted_to_order',
        convertedDate: new Date().toISOString().split('T')[0],
    });
    const adminName = req.headers['x-admin-user'] || 'Admin';
    ActivityLogService.logConvertedToOrder(req.params.id, order.id, adminName);
    return res.json({ quote: QuoteModel.getQuoteById(req.params.id), order });
}
// GET /api/admin/activity-logs — Get activity logs
function getActivityLogs(req, res) {
    const quoteId = req.query.quoteId;
    const orderId = req.query.orderId;
    if (quoteId)
        return res.json(ActivityLogService.getLogsByQuote(quoteId));
    if (orderId)
        return res.json(ActivityLogService.getLogsByOrder(orderId));
    return res.json(ActivityLogService.getAllLogs());
}
//# sourceMappingURL=quoteController.js.map