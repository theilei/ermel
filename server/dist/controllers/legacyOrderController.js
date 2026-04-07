"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrders = listOrders;
exports.getSummary = getSummary;
exports.getOrder = getOrder;
exports.createOrder = createOrder;
exports.updateStatus = updateStatus;
exports.updateCost = updateCost;
exports.markPaymentUploaded = markPaymentUploaded;
exports.getOrdersByEmail = getOrdersByEmail;
const LegacyOrder_1 = require("../models/LegacyOrder");
async function listOrders(req, res) {
    try {
        const orders = await LegacyOrder_1.LegacyOrderModel.getAll();
        res.json({ success: true, data: orders });
    }
    catch (err) {
        console.error('[legacyOrderController] listOrders error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
}
async function getSummary(req, res) {
    try {
        const summary = await LegacyOrder_1.LegacyOrderModel.getSummary();
        res.json({ success: true, data: summary });
    }
    catch (err) {
        console.error('[legacyOrderController] getSummary error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch order summary' });
    }
}
async function getOrder(req, res) {
    try {
        const order = await LegacyOrder_1.LegacyOrderModel.getById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, error: 'Order not found' });
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error('[legacyOrderController] getOrder error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
}
async function createOrder(req, res) {
    try {
        const order = await LegacyOrder_1.LegacyOrderModel.create(req.body);
        res.status(201).json({ success: true, data: order });
    }
    catch (err) {
        console.error('[legacyOrderController] createOrder error:', err);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
}
async function updateStatus(req, res) {
    try {
        const { status, scheduledDate } = req.body;
        const order = await LegacyOrder_1.LegacyOrderModel.updateStatus(req.params.id, status, scheduledDate);
        if (!order)
            return res.status(404).json({ success: false, error: 'Order not found' });
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error('[legacyOrderController] updateStatus error:', err);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
}
async function updateCost(req, res) {
    try {
        const { approvedCost } = req.body;
        const order = await LegacyOrder_1.LegacyOrderModel.updateCost(req.params.id, approvedCost);
        if (!order)
            return res.status(404).json({ success: false, error: 'Order not found' });
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error('[legacyOrderController] updateCost error:', err);
        res.status(500).json({ success: false, error: 'Failed to update cost' });
    }
}
async function markPaymentUploaded(req, res) {
    try {
        const order = await LegacyOrder_1.LegacyOrderModel.markPaymentUploaded(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, error: 'Order not found' });
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error('[legacyOrderController] markPaymentUploaded error:', err);
        res.status(500).json({ success: false, error: 'Failed to mark payment' });
    }
}
async function getOrdersByEmail(req, res) {
    try {
        const email = req.session?.userEmail || '';
        if (!email)
            return res.status(401).json({ success: false, error: 'Authentication required' });
        const orders = await LegacyOrder_1.LegacyOrderModel.getByEmail(email);
        res.json({ success: true, data: orders });
    }
    catch (err) {
        console.error('[legacyOrderController] getOrdersByEmail error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
}
//# sourceMappingURL=legacyOrderController.js.map