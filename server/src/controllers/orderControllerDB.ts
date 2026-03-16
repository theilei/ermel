// ============================================================
// Order Controller — Installation queue management (PostgreSQL-backed)
// ============================================================
import { Request, Response } from 'express';
import * as OrderModel from '../models/OrderDB';
import * as QuoteModel from '../models/QuoteDB';
import * as ActivityLogService from '../services/activityLogService';
import * as NotificationService from '../services/notificationService';

function toFrontendOrder(o: OrderModel.InstallationOrder) {
  return {
    id: o.orderNumber,
    _dbId: o.id,
    quoteId: o.quoteId,
    customerName: o.customerName,
    projectType: o.projectType,
    dimensions: o.dimensions,
    installationStatus: o.installationStatus,
    orderDate: o.orderDate,
    installationSchedule: o.installationSchedule,
  };
}

// GET /api/admin/orders
export async function listOrders(req: Request, res: Response) {
  try {
    let orders = await OrderModel.getAllOrders();

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
      success: true,
      data: {
        orders: paginatedOrders.map(toFrontendOrder),
        pagination: { page, limit, totalItems, totalPages },
      },
    });
  } catch (err: any) {
    console.error('[ORDER CTRL] listOrders error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// GET /api/admin/orders/:id
export async function getOrder(req: Request, res: Response) {
  try {
    const order = await OrderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, data: toFrontendOrder(order) });
  } catch (err: any) {
    console.error('[ORDER CTRL] getOrder error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// PUT /api/admin/orders/:id/status
export async function updateInstallationStatus(req: Request, res: Response) {
  try {
    const order = await OrderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const { status, installationSchedule } = req.body;
    const validStatuses: OrderModel.InstallationStatus[] = ['materials_ordered', 'fabrication', 'installation', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await OrderModel.updateOrderStatus(order.id, status, installationSchedule);

    const adminName = (req.session as any)?.admin?.username || req.headers['x-admin-user'] as string || 'Admin';
    await ActivityLogService.logInstallationStatusUpdated(order.id, adminName, status);

    // Notify customer about installation status change
    if (order.customerId) {
      // Look up customer email from the associated quote
      const quote = await QuoteModel.getQuoteById(order.quoteId);
      if (quote) {
        await NotificationService.notifyInstallationStatusUpdate(quote.customerEmail, order.orderNumber, status);
      }
    }

    return res.json({ success: true, data: updated ? toFrontendOrder(updated) : null });
  } catch (err: any) {
    console.error('[ORDER CTRL] updateStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
