// ============================================================
// Notification Controller
// ============================================================
import { Request, Response } from 'express';
import * as NotificationModel from '../models/Notification';

// GET /api/notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const notifications = await NotificationModel.getNotificationsByUser(userId);
    const unreadCount = await NotificationModel.getUnreadCount(userId);

    return res.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (err: any) {
    console.error('[NOTIF CTRL] getNotifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// PUT /api/notifications/:id/read
export async function markRead(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const success = await NotificationModel.markAsRead(req.params.id, userId);
    if (!success) return res.status(404).json({ success: false, message: 'Notification not found.' });

    return res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('[NOTIF CTRL] markRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// PUT /api/notifications/read-all
export async function markAllRead(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const count = await NotificationModel.markAllAsRead(userId);
    return res.json({ success: true, data: { marked: count } });
  } catch (err: any) {
    console.error('[NOTIF CTRL] markAllRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
