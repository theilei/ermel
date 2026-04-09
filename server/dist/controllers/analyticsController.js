"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAnalyticsEvent = postAnalyticsEvent;
exports.getAdminAnalytics = getAdminAnalytics;
const analyticsService_1 = require("../services/analyticsService");
const ALLOWED_EVENTS = [
    'quote_started',
    'quote_submitted',
    'quote_approved',
    'quote_accepted',
];
async function postAnalyticsEvent(req, res) {
    const eventType = req.body?.eventType;
    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
        return res.status(400).json({ error: 'Invalid analytics event type.' });
    }
    await (0, analyticsService_1.trackEvent)(eventType, req.session?.userId, req.body?.metadata || {});
    return res.status(202).json({ success: true });
}
async function getAdminAnalytics(req, res) {
    try {
        const summary = await (0, analyticsService_1.getAdminAnalyticsSummary)();
        return res.json({ success: true, data: summary });
    }
    catch (err) {
        console.error('[ANALYTICS CTRL] getAdminAnalytics error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=analyticsController.js.map