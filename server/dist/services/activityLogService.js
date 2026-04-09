"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogsByOrder = exports.getLogsByQuote = exports.getAllLogs = void 0;
exports.logQuoteApproved = logQuoteApproved;
exports.logQuoteRejected = logQuoteRejected;
exports.logQuotePriceEdited = logQuotePriceEdited;
exports.logCustomerAccepted = logCustomerAccepted;
exports.logCustomerDeclined = logCustomerDeclined;
exports.logConvertedToOrder = logConvertedToOrder;
exports.logInstallationStatusUpdated = logInstallationStatusUpdated;
exports.logCustomerPaymentProofSubmitted = logCustomerPaymentProofSubmitted;
exports.logAdminPaymentVerified = logAdminPaymentVerified;
// ============================================================
// Activity Log Service — PostgreSQL-backed
// ============================================================
const ActivityLogDB_1 = require("../models/ActivityLogDB");
Object.defineProperty(exports, "getAllLogs", { enumerable: true, get: function () { return ActivityLogDB_1.getAllLogs; } });
Object.defineProperty(exports, "getLogsByQuote", { enumerable: true, get: function () { return ActivityLogDB_1.getLogsByQuote; } });
Object.defineProperty(exports, "getLogsByOrder", { enumerable: true, get: function () { return ActivityLogDB_1.getLogsByOrder; } });
function logQuoteApproved(quoteId, adminName) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Admin approved quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName });
}
function logQuoteRejected(quoteId, adminName, reason) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Admin rejected quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName, details: reason });
}
function logQuotePriceEdited(quoteId, adminName, newPrice) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Admin edited quote price', entity: 'quote', entityId: quoteId, quoteId, userRole: 'admin', userName: adminName, details: `New price: ₱${newPrice.toLocaleString()}` });
}
function logCustomerAccepted(quoteId, customerName) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Customer accepted quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'customer', userName: customerName });
}
function logCustomerDeclined(quoteId, customerName) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Customer declined quote', entity: 'quote', entityId: quoteId, quoteId, userRole: 'customer', userName: customerName });
}
function logConvertedToOrder(quoteId, orderId, adminName) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Quote converted to order', entity: 'order', entityId: orderId, quoteId, orderId, userRole: 'admin', userName: adminName });
}
function logInstallationStatusUpdated(orderId, adminName, newStatus) {
    return (0, ActivityLogDB_1.addLog)({ action: 'Installation status updated', entity: 'order', entityId: orderId, orderId, userRole: 'admin', userName: adminName, details: `Status: ${newStatus}` });
}
function logCustomerPaymentProofSubmitted(quoteId, quoteNumber, customerName) {
    return (0, ActivityLogDB_1.addLog)({
        action: 'Customer submitted payment proof',
        entity: 'payment',
        entityId: quoteId,
        quoteId,
        userRole: 'customer',
        userName: customerName,
        details: `Quote ${quoteNumber}`,
    });
}
function logAdminPaymentVerified(quoteId, quoteNumber, adminName) {
    return (0, ActivityLogDB_1.addLog)({
        action: 'Admin verified payment',
        entity: 'payment',
        entityId: quoteId,
        quoteId,
        userRole: 'admin',
        userName: adminName,
        details: `Quote ${quoteNumber}`,
    });
}
//# sourceMappingURL=activityLogService.js.map