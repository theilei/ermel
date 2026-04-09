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
exports.notifyQuoteApproved = notifyQuoteApproved;
exports.notifyQuoteRejected = notifyQuoteRejected;
exports.notifyQuoteStatusUpdated = notifyQuoteStatusUpdated;
exports.notifyQuoteConverted = notifyQuoteConverted;
exports.notifyInstallationStatusUpdate = notifyInstallationStatusUpdate;
exports.notifyAdminsNewQuote = notifyAdminsNewQuote;
exports.notifyAdminCustomerAction = notifyAdminCustomerAction;
exports.notifyPaymentSubmitted = notifyPaymentSubmitted;
exports.notifyPaymentVerified = notifyPaymentVerified;
exports.notifyPaymentRejected = notifyPaymentRejected;
exports.notifyPaymentExpired = notifyPaymentExpired;
exports.notifyAdminsPaymentSubmitted = notifyAdminsPaymentSubmitted;
// ============================================================
// Notification Service — creates notifications for users
// ============================================================
const NotificationModel = __importStar(require("../models/Notification"));
const database_1 = __importDefault(require("../config/database"));
// Find user ID by email
async function findUserIdByEmail(email) {
    const result = await database_1.default.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1`, [email]);
    return result.rows.length > 0 ? result.rows[0].id : null;
}
async function notifyQuoteApproved(customerEmail, quoteNumber) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Quote Approved', `Your quotation ${quoteNumber} has been approved. Please review and accept or decline within 30 days.`, { type: 'quote_status', relatedQuoteNumber: quoteNumber });
}
async function notifyQuoteRejected(customerEmail, quoteNumber, reason) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Quote Update', `Your quotation ${quoteNumber} has been declined. Reason: ${reason}`, { type: 'quote_status', relatedQuoteNumber: quoteNumber });
}
async function notifyQuoteStatusUpdated(customerEmail, quoteNumber, payload) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    const parts = [];
    if (payload.status)
        parts.push(`Status: ${payload.status}`);
    if (payload.updatedPrice !== undefined)
        parts.push(`Updated price: Php ${payload.updatedPrice.toLocaleString()}`);
    if (payload.adminRemark)
        parts.push(`Admin remark: ${payload.adminRemark}`);
    const message = parts.length > 0
        ? `Quotation ${quoteNumber} was updated. ${parts.join(' | ')}`
        : `Quotation ${quoteNumber} was updated by the admin.`;
    await NotificationModel.createNotification(userId, 'Quote Updated', message, { type: 'quote_status', relatedQuoteNumber: quoteNumber });
}
async function notifyQuoteConverted(customerEmail, quoteNumber, orderNumber) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Order Created', `Your quotation ${quoteNumber} has been converted to order ${orderNumber}. Installation will begin soon.`, { type: 'quote_status', relatedQuoteNumber: quoteNumber });
}
async function notifyInstallationStatusUpdate(customerEmail, orderNumber, status) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    const statusLabels = {
        materials_ordered: 'Materials Ordered',
        fabrication: 'Fabrication',
        installation: 'Installation',
        completed: 'Completed',
    };
    await NotificationModel.createNotification(userId, 'Installation Update', `Order ${orderNumber}: status updated to "${statusLabels[status] || status}".`, { type: 'installation' });
}
async function notifyAdminsNewQuote(quoteNumber, customerName) {
    // Notify all admins about a new quote submission
    const admins = await database_1.default.query(`SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`);
    for (const admin of admins.rows) {
        await NotificationModel.createNotification(admin.id, 'New Quote Request', `${customerName} submitted a new quote request (${quoteNumber}).`, { type: 'admin_quote', relatedQuoteNumber: quoteNumber });
    }
}
async function notifyAdminCustomerAction(quoteNumber, customerName, action) {
    const admins = await database_1.default.query(`SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`);
    for (const admin of admins.rows) {
        await NotificationModel.createNotification(admin.id, `Customer ${action === 'accepted' ? 'Accepted' : 'Declined'} Quote`, `${customerName} ${action} quotation ${quoteNumber}.`, { type: 'admin_quote', relatedQuoteNumber: quoteNumber });
    }
}
async function notifyPaymentSubmitted(customerEmail, quoteNumber) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Payment Submitted', `Your payment for quotation ${quoteNumber} was submitted and is pending verification.`, { type: 'payment', relatedQuoteNumber: quoteNumber });
}
async function notifyPaymentVerified(customerEmail, quoteNumber) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Payment Verified', `Your payment for quotation ${quoteNumber} has been verified.`, { type: 'payment', relatedQuoteNumber: quoteNumber });
}
async function notifyPaymentRejected(customerEmail, quoteNumber, reason) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Payment Rejected', `Your payment proof for quotation ${quoteNumber} was rejected. Reason: ${reason}`, { type: 'payment', relatedQuoteNumber: quoteNumber });
}
async function notifyPaymentExpired(customerEmail, quoteNumber) {
    const userId = await findUserIdByEmail(customerEmail);
    if (!userId)
        return;
    await NotificationModel.createNotification(userId, 'Payment Expired', `Payment window for quotation ${quoteNumber} expired. Please submit a new quote request.`, { type: 'payment', relatedQuoteNumber: quoteNumber });
}
async function notifyAdminsPaymentSubmitted(quoteNumber, customerName) {
    const admins = await database_1.default.query(`SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`);
    for (const admin of admins.rows) {
        await NotificationModel.createNotification(admin.id, 'Payment Submitted', `${customerName} submitted payment proof for quotation ${quoteNumber}.`, { type: 'admin_payment', relatedQuoteNumber: quoteNumber });
    }
}
//# sourceMappingURL=notificationService.js.map