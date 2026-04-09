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
exports.getNotifications = getNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const NotificationModel = __importStar(require("../models/Notification"));
// GET /api/notifications
async function getNotifications(req, res) {
    try {
        const userId = req.session?.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        const notifications = await NotificationModel.getNotificationsByUser(userId);
        const unreadCount = await NotificationModel.getUnreadCount(userId);
        return res.json({
            success: true,
            data: { notifications, unreadCount },
        });
    }
    catch (err) {
        console.error('[NOTIF CTRL] getNotifications error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// PUT /api/notifications/:id/read
async function markRead(req, res) {
    try {
        const userId = req.session?.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        const success = await NotificationModel.markAsRead(req.params.id, userId);
        if (!success)
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        return res.json({ success: true, data: null });
    }
    catch (err) {
        console.error('[NOTIF CTRL] markRead error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// PUT /api/notifications/read-all
async function markAllRead(req, res) {
    try {
        const userId = req.session?.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        const count = await NotificationModel.markAllAsRead(userId);
        return res.json({ success: true, data: { marked: count } });
    }
    catch (err) {
        console.error('[NOTIF CTRL] markAllRead error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=notificationController.js.map