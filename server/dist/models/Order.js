"use strict";
// ============================================================
// Order Model — In-memory store for installation orders
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
let orderSeq = 2; // Start after seed data
function genOrderId(seq) {
    return `ORD-${String(seq).padStart(4, '0')}`;
}
const orders = new Map();
// Seed data — one converted order from Q-0005
const seedOrders = [
    {
        id: 'ORD-0001',
        quoteId: 'Q-0005',
        customerName: 'Carla Mendoza',
        projectType: 'Awning Window',
        dimensions: '120cm × 90cm × 3 units',
        installationStatus: 'fabrication',
        orderDate: '2026-02-16',
        installationSchedule: '2026-03-15',
    },
];
seedOrders.forEach((o) => orders.set(o.id, o));
function getAllOrders() {
    return Array.from(orders.values()).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}
function getOrderById(id) {
    return orders.get(id);
}
function createOrder(quoteId, customerName, projectType, dimensions) {
    const id = genOrderId(orderSeq++);
    const order = {
        id,
        quoteId,
        customerName,
        projectType,
        dimensions,
        installationStatus: 'materials_ordered',
        orderDate: new Date().toISOString().split('T')[0],
    };
    orders.set(id, order);
    return order;
}
function updateOrderStatus(id, status, schedule) {
    const order = orders.get(id);
    if (!order)
        return undefined;
    order.installationStatus = status;
    if (schedule)
        order.installationSchedule = schedule;
    return order;
}
//# sourceMappingURL=Order.js.map