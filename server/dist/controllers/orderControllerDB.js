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
const OrderModel = __importStar(require("../models/OrderDB"));
const QuoteModel = __importStar(require("../models/QuoteDB"));
const ActivityLogService = __importStar(require("../services/activityLogService"));
const NotificationService = __importStar(require("../services/notificationService"));
function toFrontendOrder(o) {
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
async function listOrders(req, res) {
    try {
        let orders = await OrderModel.getAllOrders();
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
            success: true,
            data: {
                orders: paginatedOrders.map(toFrontendOrder),
                pagination: { page, limit, totalItems, totalPages },
            },
        });
    }
    catch (err) {
        console.error('[ORDER CTRL] listOrders error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// GET /api/admin/orders/:id
async function getOrder(req, res) {
    try {
        const order = await OrderModel.getOrderById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found.' });
        return res.json({ success: true, data: toFrontendOrder(order) });
    }
    catch (err) {
        console.error('[ORDER CTRL] getOrder error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
// PUT /api/admin/orders/:id/status
async function updateInstallationStatus(req, res) {
    try {
        const order = await OrderModel.getOrderById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found.' });
        const { status, installationSchedule } = req.body;
        const validStatuses = ['materials_ordered', 'fabrication', 'installation', 'completed'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const updated = await OrderModel.updateOrderStatus(order.id, status, installationSchedule);
        const adminName = req.session?.admin?.username || req.headers['x-admin-user'] || 'Admin';
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
    }
    catch (err) {
        console.error('[ORDER CTRL] updateStatus error:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
//# sourceMappingURL=orderControllerDB.js.map