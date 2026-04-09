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
exports.createQuoteUpdate = createQuoteUpdate;
exports.getDashboardMetrics = getDashboardMetrics;
const QuoteModel = __importStar(require("../models/QuoteDB"));
const QuoteUpdateModel = __importStar(require("../models/QuoteUpdateDB"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
const NotificationService = __importStar(require("../services/notificationService"));
const AnalyticsService = __importStar(require("../services/analyticsService"));
const pdfService_1 = require("../services/pdfService");
const emailService_1 = require("../services/emailService");
// Helper to map DB quote to frontend-compatible shape
function toFrontendQuote(q) {
    return {
        id: q.quoteNumber, // Frontend uses Q-0001 as id
        _dbId: q.id, // Keep real UUID for internal use
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
        payment: q.payment,
    };
}
// GET /api/admin/quotes
async function listQuotes(req, res) {
    try {
        await QuoteModel.expireOldQuotes();
        let quotes = await QuoteModel.getAllQuotes();
        // Filter by search
        const search = (req.query.search || '').trim().toLowerCase();
        if (search) {
            quotes = quotes.filter((q) => q.customerName.toLowerCase().includes(search) ||
                q.quoteNumber.toLowerCase().includes(search));
        }
        // Filter by status
        const status = req.query.status;
        if (status && status !== 'all') {
            if (status === 'installation_queue') {
                const today = new Date().toISOString().slice(0, 10);
                quotes = quotes.filter((q) => {
                    if (q.status !== 'approved')
                        return false;
                    if (q.payment?.status !== 'paid')
                        return false;
                    if (!q.reservationDate)
                        return false;
                    return q.reservationDate >= today;
                });
            }
            else {
                quotes = quotes.filter((q) => q.status === status);
            }
        }
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const totalItems = quotes.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIdx = (page - 1) * limit;
        const paginatedQuotes = quotes.slice(startIdx, startIdx + limit);
        return res.json({
            success: true,
            data: {
                quotes: paginatedQuotes.map(toFrontendQuote),
                pagination: { page, limit, totalItems, totalPages },
            },
        });
    }
    catch (err) {
        console.error('[QUOTE CTRL] listQuotes error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/quotes/:id
async function getQuote(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        return res.json({ success: true, data: toFrontendQuote(quote) });
    }
    catch (err) {
        console.error('[QUOTE CTRL] getQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// PUT /api/admin/quotes/:id
async function updateQuote(req, res) {
    try {
        const existing = await QuoteModel.getQuoteById(req.params.id);
        if (!existing)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        const { estimatedCost, customerName, customerEmail, customerPhone, customerAddress, projectType, width, height, quantity, color, notes, glassType, frameMaterial, adminRemark, } = req.body;
        const updates = {};
        if (estimatedCost !== undefined) {
            if (existing.status === 'approved') {
                return res.status(400).json({ success: false, message: 'Approved quote price cannot be changed.' });
            }
            updates.updatedCost = Number(estimatedCost);
        }
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
        // Auto-move to draft when admin edits a pending quote
        if (existing.status === 'pending' && updates.estimatedCost !== undefined) {
            updates.status = 'draft';
        }
        const updated = await QuoteModel.updateQuote(existing.id, updates);
        const adminName = req.session?.userName || 'Admin';
        if (updates.updatedCost !== undefined) {
            await ActivityLogService.logQuotePriceEdited(existing.id, adminName, updates.updatedCost);
            await QuoteUpdateModel.createQuoteUpdate({
                quoteId: existing.id,
                status: updated?.status || existing.status,
                estimatedPrice: existing.originalEstimatedCost,
                updatedPrice: updates.updatedCost,
                adminRemark: typeof adminRemark === 'string' && adminRemark.trim().length > 0 ? adminRemark.trim() : undefined,
                adminName,
            });
            await NotificationService.notifyQuoteStatusUpdated(existing.customerEmail, existing.quoteNumber, {
                status: updated?.status || existing.status,
                updatedPrice: updates.updatedCost,
                adminRemark: typeof adminRemark === 'string' ? adminRemark.trim() : undefined,
            });
            (0, emailService_1.sendQuoteStatusUpdateEmail)(existing, {
                status: updated?.status || existing.status,
                estimatedPrice: existing.originalEstimatedCost,
                updatedPrice: updates.updatedCost,
                adminRemark: typeof adminRemark === 'string' ? adminRemark.trim() : undefined,
            }).catch((e) => console.error('[EMAIL]', e.message));
        }
        else if (typeof adminRemark === 'string' && adminRemark.trim().length > 0) {
            await QuoteUpdateModel.createQuoteUpdate({
                quoteId: existing.id,
                status: updated?.status || existing.status,
                estimatedPrice: existing.originalEstimatedCost,
                updatedPrice: updated?.updatedCost,
                adminRemark: adminRemark.trim(),
                adminName,
            });
            await NotificationService.notifyQuoteStatusUpdated(existing.customerEmail, existing.quoteNumber, {
                status: updated?.status || existing.status,
                updatedPrice: updated?.updatedCost,
                adminRemark: adminRemark.trim(),
            });
            (0, emailService_1.sendQuoteStatusUpdateEmail)(existing, {
                status: updated?.status || existing.status,
                estimatedPrice: existing.originalEstimatedCost,
                updatedPrice: updated?.updatedCost,
                adminRemark: adminRemark.trim(),
            }).catch((e) => console.error('[EMAIL]', e.message));
        }
        return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
    }
    catch (err) {
        console.error('[QUOTE CTRL] updateQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/quotes/:id/approve
async function approveQuote(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.status !== 'pending' && quote.status !== 'draft') {
            return res.status(400).json({ success: false, message: `Cannot approve a quote with status "${quote.status}".` });
        }
        const approvedDate = new Date().toISOString().split('T')[0];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const updated = await QuoteModel.updateQuote(quote.id, {
            status: 'approved',
            approvedDate,
            expiryDate: expiryDate.toISOString().split('T')[0],
        });
        const adminName = req.session?.userName || 'Admin';
        await ActivityLogService.logQuoteApproved(quote.id, adminName);
        await AnalyticsService.trackEvent('quote_approved', req.session?.userId, {
            quoteNumber: quote.quoteNumber,
        });
        // Send notifications
        if (updated) {
            await QuoteUpdateModel.createQuoteUpdate({
                quoteId: quote.id,
                status: 'approved',
                estimatedPrice: updated.originalEstimatedCost,
                updatedPrice: updated.updatedCost,
                adminName,
            });
            await NotificationService.notifyQuoteApproved(updated.customerEmail, updated.quoteNumber);
            (0, emailService_1.sendQuoteStatusUpdateEmail)(updated, {
                status: 'approved',
                estimatedPrice: updated.originalEstimatedCost,
                updatedPrice: updated.updatedCost,
            }).catch((e) => console.error('[EMAIL]', e.message));
            const pdfData = (0, pdfService_1.getQuotePDFData)(updated);
            const pdfHtml = (0, pdfService_1.generateQuotePDFHtml)(pdfData);
            (0, emailService_1.sendQuoteApprovalEmail)(updated, pdfHtml).catch((e) => console.error('[EMAIL]', e.message));
        }
        return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
    }
    catch (err) {
        console.error('[QUOTE CTRL] approveQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/quotes/:id/reject
async function rejectQuote(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
        }
        if (quote.status !== 'pending' && quote.status !== 'draft' && quote.status !== 'approved') {
            return res.status(400).json({ success: false, message: `Cannot reject a quote with status "${quote.status}".` });
        }
        const updated = await QuoteModel.updateQuote(quote.id, {
            status: 'rejected',
            rejectionReason: reason.trim(),
        });
        const adminName = req.session?.userName || 'Admin';
        await ActivityLogService.logQuoteRejected(quote.id, adminName, reason.trim());
        if (updated) {
            await QuoteUpdateModel.createQuoteUpdate({
                quoteId: quote.id,
                status: 'rejected',
                estimatedPrice: updated.originalEstimatedCost,
                updatedPrice: updated.updatedCost,
                adminRemark: reason.trim(),
                adminName,
            });
            await NotificationService.notifyQuoteRejected(updated.customerEmail, updated.quoteNumber, reason.trim());
            (0, emailService_1.sendQuoteStatusUpdateEmail)(updated, {
                status: 'rejected',
                estimatedPrice: updated.originalEstimatedCost,
                updatedPrice: updated.updatedCost,
                adminRemark: reason.trim(),
            }).catch((e) => console.error('[EMAIL]', e.message));
        }
        return res.json({ success: true, data: updated ? toFrontendQuote(updated) : null });
    }
    catch (err) {
        console.error('[QUOTE CTRL] rejectQuote error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/quotes/:id/pdf
async function generatePDF(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        const pdfData = (0, pdfService_1.getQuotePDFData)(quote);
        const html = (0, pdfService_1.generateQuotePDFHtml)(pdfData);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="quotation-${quote.quoteNumber}.html"`);
        return res.send(html);
    }
    catch (err) {
        console.error('[QUOTE CTRL] generatePDF error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/quotes/:id/convert
async function convertToOrder(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        if (quote.status !== 'customer_accepted') {
            return res.status(400).json({ success: false, message: 'Only customer-accepted quotes can be converted to orders.' });
        }
        const OrderModel = await Promise.resolve().then(() => __importStar(require('../models/OrderDB')));
        const dimensions = `${quote.width}cm × ${quote.height}cm × ${quote.quantity} unit(s)`;
        const order = await OrderModel.createOrder(quote.id, quote.customerId || null, quote.customerName, quote.projectType, dimensions);
        await QuoteModel.updateQuote(quote.id, {
            status: 'converted_to_order',
            convertedDate: new Date().toISOString().split('T')[0],
        });
        const adminName = req.session?.userName || 'Admin';
        await ActivityLogService.logConvertedToOrder(quote.id, order.id, adminName);
        await NotificationService.notifyQuoteConverted(quote.customerEmail, quote.quoteNumber, order.orderNumber);
        const updatedQuote = await QuoteModel.getQuoteById(quote.id);
        return res.json({
            success: true,
            data: {
                quote: updatedQuote ? toFrontendQuote(updatedQuote) : null,
                order: {
                    id: order.orderNumber,
                    _dbId: order.id,
                    quoteId: quote.quoteNumber,
                    customerName: order.customerName,
                    projectType: order.projectType,
                    dimensions: order.dimensions,
                    installationStatus: order.installationStatus,
                    orderDate: order.orderDate,
                    installationSchedule: order.installationSchedule,
                },
            },
        });
    }
    catch (err) {
        console.error('[QUOTE CTRL] convertToOrder error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/activity-logs
async function getActivityLogs(req, res) {
    try {
        const quoteId = req.query.quoteId;
        const orderId = req.query.orderId;
        let logs;
        if (quoteId) {
            // Resolve quote number to UUID if needed
            const quote = await QuoteModel.getQuoteById(quoteId);
            logs = quote
                ? await ActivityLogService.getLogsByQuote(quote.id)
                : await ActivityLogService.getLogsByQuote(quoteId);
        }
        else if (orderId) {
            const OrderModel = await Promise.resolve().then(() => __importStar(require('../models/OrderDB')));
            const order = await OrderModel.getOrderById(orderId);
            logs = order
                ? await ActivityLogService.getLogsByOrder(order.id)
                : await ActivityLogService.getLogsByOrder(orderId);
        }
        else {
            logs = await ActivityLogService.getAllLogs();
        }
        // Map to frontend format
        const frontendLogs = logs.map((l) => ({
            id: l.id,
            event: l.action,
            quoteId: l.quoteId,
            orderId: l.orderId,
            userRole: l.userRole,
            userName: l.userName,
            timestamp: l.createdAt,
            details: l.details,
        }));
        return res.json({ success: true, data: frontendLogs });
    }
    catch (err) {
        console.error('[QUOTE CTRL] getActivityLogs error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// POST /api/admin/quotes/:id/updates
async function createQuoteUpdate(req, res) {
    try {
        const quote = await QuoteModel.getQuoteById(req.params.id);
        if (!quote)
            return res.status(404).json({ success: false, message: 'Quote not found.' });
        const status = typeof req.body.status === 'string' ? req.body.status.trim() : undefined;
        const updatedPrice = req.body.updatedPrice !== undefined ? Number(req.body.updatedPrice) : undefined;
        const adminRemark = typeof req.body.adminRemark === 'string' ? req.body.adminRemark.trim() : undefined;
        if (!status && updatedPrice === undefined && !adminRemark) {
            return res.status(400).json({ success: false, message: 'At least one update field is required.' });
        }
        const adminName = req.session?.userName || 'Admin';
        const quotePatch = {};
        if (status)
            quotePatch.status = status;
        if (updatedPrice !== undefined)
            quotePatch.updatedCost = updatedPrice;
        const updatedQuote = Object.keys(quotePatch).length > 0
            ? await QuoteModel.updateQuote(quote.id, quotePatch)
            : quote;
        const created = await QuoteUpdateModel.createQuoteUpdate({
            quoteId: quote.id,
            status: status || updatedQuote?.status || quote.status,
            estimatedPrice: quote.originalEstimatedCost,
            updatedPrice: updatedPrice ?? updatedQuote?.updatedCost,
            adminRemark,
            adminName,
        });
        await NotificationService.notifyQuoteStatusUpdated(quote.customerEmail, quote.quoteNumber, {
            status: status || updatedQuote?.status,
            updatedPrice: updatedPrice ?? updatedQuote?.updatedCost,
            adminRemark,
        });
        (0, emailService_1.sendQuoteStatusUpdateEmail)(quote, {
            status: status || updatedQuote?.status,
            estimatedPrice: quote.originalEstimatedCost,
            updatedPrice: updatedPrice ?? updatedQuote?.updatedCost,
            adminRemark,
        }).catch((e) => console.error('[EMAIL]', e.message));
        return res.json({ success: true, data: { update: created, quote: updatedQuote ? toFrontendQuote(updatedQuote) : null } });
    }
    catch (err) {
        console.error('[QUOTE CTRL] createQuoteUpdate error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/dashboard/metrics
async function getDashboardMetrics(req, res) {
    try {
        const metrics = await QuoteModel.getDashboardMetrics();
        return res.json({ success: true, data: metrics });
    }
    catch (err) {
        console.error('[QUOTE CTRL] getDashboardMetrics error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=quoteControllerDB.js.map