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
exports.listOrders = listOrders;
exports.getOrder = getOrder;
exports.updateInstallationStatus = updateInstallationStatus;
const OrderModel = __importStar(require("../models/Order"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
// GET /api/admin/orders — List all installation orders
function listOrders(req, res) {
    let orders = OrderModel.getAllOrders();
    // Filter by status
    const status = req.query.status;
    if (status && status !== 'all') {
        orders = orders.filter((o) => o.installationStatus === status);
    }
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
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
function getOrder(req, res) {
    const order = OrderModel.getOrderById(req.params.id);
    if (!order)
        return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
}
// PUT /api/admin/orders/:id/status — Update installation status
function updateInstallationStatus(req, res) {
    const order = OrderModel.getOrderById(req.params.id);
    if (!order)
        return res.status(404).json({ error: 'Order not found.' });
    const { status, installationSchedule } = req.body;
    const validStatuses = ['materials_ordered', 'fabrication', 'installation', 'completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const updated = OrderModel.updateOrderStatus(req.params.id, status, installationSchedule);
    const adminName = req.headers['x-admin-user'] || 'Admin';
    ActivityLogService.logInstallationStatusUpdated(req.params.id, adminName, status);
    return res.json(updated);
}
//# sourceMappingURL=orderController.js.map