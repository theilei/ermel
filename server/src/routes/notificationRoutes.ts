// ============================================================
// Notification Routes — /api/notifications/*
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as notifCtrl from '../controllers/notificationController';

const router = Router();

router.use(requireAuth);

router.get('/', notifCtrl.getNotifications);
router.put('/:id/read', notifCtrl.markRead);
router.put('/read-all', notifCtrl.markAllRead);

export default router;
