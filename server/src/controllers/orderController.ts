// ============================================================
// Order Controller — Installation queue management
// ============================================================
import { Request, Response } from 'express';
import * as OrderModel from '../models/Order';
import * as ActivityLogService from '../services/activityLogService';

// GET /api/admin/orders — List all installation orders
export function listOrders(req: Request, res: Response) {
  let orders = OrderModel.getAllOrders();

  // Filter by status
  const status = req.query.status as string;
  if (status && status !== 'all') {
    orders = orders.filter((o) => o.installationStatus === status);
  }

  // Pagination
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIdx = (page - 1) * limit;
  const paginatedOrders = orders.slice(startIdx, startIdx + limit);

  return res.json({
    orders: paginatedOrders,
    pagination: { page, limit, totalItems, totalPages },
  });
}

// GET /api/admin/orders/:id — Get single order
export function getOrder(req: Request, res: Response) {
  const order = OrderModel.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  return res.json(order);
}

// PUT /api/admin/orders/:id/status — Update installation status
export function updateInstallationStatus(req: Request, res: Response) {
  const order = OrderModel.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const { status, installationSchedule } = req.body;
  const validStatuses: OrderModel.InstallationStatus[] = ['materials_ordered', 'fabrication', 'installation', 'completed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = OrderModel.updateOrderStatus(req.params.id, status, installationSchedule);

  const adminName = req.headers['x-admin-user'] as string || 'Admin';
  ActivityLogService.logInstallationStatusUpdated(req.params.id, adminName, status);

  return res.json(updated);
}
