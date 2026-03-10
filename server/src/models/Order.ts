// ============================================================
// Order Model — In-memory store for installation orders
// ============================================================

export type InstallationStatus =
  | 'materials_ordered'
  | 'fabrication'
  | 'installation'
  | 'completed';

export interface InstallationOrder {
  id: string;
  quoteId: string;
  customerName: string;
  projectType: string;
  dimensions: string;
  installationStatus: InstallationStatus;
  orderDate: string;
  installationSchedule?: string;
}

let orderSeq = 2; // Start after seed data

function genOrderId(seq: number): string {
  return `ORD-${String(seq).padStart(4, '0')}`;
}

const orders: Map<string, InstallationOrder> = new Map();

// Seed data — one converted order from Q-0005
const seedOrders: InstallationOrder[] = [
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

export function getAllOrders(): InstallationOrder[] {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}

export function getOrderById(id: string): InstallationOrder | undefined {
  return orders.get(id);
}

export function createOrder(
  quoteId: string,
  customerName: string,
  projectType: string,
  dimensions: string
): InstallationOrder {
  const id = genOrderId(orderSeq++);
  const order: InstallationOrder = {
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

export function updateOrderStatus(
  id: string,
  status: InstallationStatus,
  schedule?: string
): InstallationOrder | undefined {
  const order = orders.get(id);
  if (!order) return undefined;
  order.installationStatus = status;
  if (schedule) order.installationSchedule = schedule;
  return order;
}
