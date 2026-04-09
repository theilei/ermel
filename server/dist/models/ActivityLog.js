"use strict";
// ============================================================
// Activity Log Model — In-memory store
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLog = addLog;
exports.getAllLogs = getAllLogs;
exports.getLogsByQuote = getLogsByQuote;
exports.getLogsByOrder = getLogsByOrder;
let logSeq = 1;
const logs = [];
function addLog(entry) {
    const log = {
        ...entry,
        id: `LOG-${String(logSeq++).padStart(5, '0')}`,
        timestamp: new Date().toISOString(),
    };
    logs.unshift(log); // newest first
    return log;
}
function getAllLogs() {
    return [...logs];
}
function getLogsByQuote(quoteId) {
    return logs.filter((l) => l.quoteId === quoteId);
}
function getLogsByOrder(orderId) {
    return logs.filter((l) => l.orderId === orderId);
}
//# sourceMappingURL=ActivityLog.js.map