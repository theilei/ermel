// ============================================================
// Legacy Order Controller — CRUD for general order tracking
// ============================================================
import { Request, Response } from 'express';
import { LegacyOrderModel } from '../models/LegacyOrder';

export async function listOrders(req: Request, res: Response) {
  try {
    const orders = await LegacyOrderModel.getAll();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    console.error('[legacyOrderController] listOrders error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const order = await LegacyOrderModel.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err: any) {
    console.error('[legacyOrderController] getOrder error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const order = await LegacyOrderModel.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    console.error('[legacyOrderController] createOrder error:', err);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { status, scheduledDate } = req.body;
    const order = await LegacyOrderModel.updateStatus(req.params.id, status, scheduledDate);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err: any) {
    console.error('[legacyOrderController] updateStatus error:', err);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
}

export async function updateCost(req: Request, res: Response) {
  try {
    const { approvedCost } = req.body;
    const order = await LegacyOrderModel.updateCost(req.params.id, approvedCost);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err: any) {
    console.error('[legacyOrderController] updateCost error:', err);
    res.status(500).json({ success: false, error: 'Failed to update cost' });
  }
}

export async function markPaymentUploaded(req: Request, res: Response) {
  try {
    const order = await LegacyOrderModel.markPaymentUploaded(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err: any) {
    console.error('[legacyOrderController] markPaymentUploaded error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark payment' });
  }
}

export async function getOrdersByEmail(req: Request, res: Response) {
  try {
    const email = req.session?.userEmail || '';
    if (!email) return res.status(401).json({ success: false, error: 'Authentication required' });
    const orders = await LegacyOrderModel.getByEmail(email);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    console.error('[legacyOrderController] getOrdersByEmail error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}
