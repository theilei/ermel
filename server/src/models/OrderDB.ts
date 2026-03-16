// ============================================================
// Order Model — PostgreSQL-backed
// ============================================================
import pool from '../config/database';

export type InstallationStatus =
  | 'materials_ordered'
  | 'fabrication'
  | 'installation'
  | 'completed';

export interface InstallationOrder {
  id: string;
  orderNumber: string;
  quoteId: string;
  customerId?: string;
  customerName: string;
  projectType: string;
  dimensions: string;
  installationStatus: InstallationStatus;
  orderDate: string;
  installationSchedule?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToOrder(row: any): InstallationOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    quoteId: row.quote_id,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    projectType: row.project_type,
    dimensions: row.dimensions,
    installationStatus: row.installation_status as InstallationStatus,
    orderDate: row.order_date?.toISOString?.().split('T')[0] || row.order_date,
    installationSchedule: row.installation_schedule?.toISOString?.().split('T')[0] || row.installation_schedule || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function nextOrderNumber(): Promise<string> {
  const result = await pool.query("SELECT nextval('order_number_seq') AS seq");
  return `ORD-${String(result.rows[0].seq).padStart(4, '0')}`;
}

export async function getAllOrders(): Promise<InstallationOrder[]> {
  const result = await pool.query(
    `SELECT * FROM qq_orders WHERE deleted_at IS NULL ORDER BY order_date DESC, created_at DESC`
  );
  return result.rows.map(rowToOrder);
}

export async function getOrderById(id: string): Promise<InstallationOrder | undefined> {
  const result = await pool.query(
    `SELECT * FROM qq_orders WHERE deleted_at IS NULL AND (id::text = $1 OR order_number = $1)`,
    [id]
  );
  return result.rows.length > 0 ? rowToOrder(result.rows[0]) : undefined;
}

export async function getOrdersByCustomerId(customerId: string): Promise<InstallationOrder[]> {
  const result = await pool.query(
    `SELECT * FROM qq_orders WHERE deleted_at IS NULL AND customer_id = $1
     ORDER BY order_date DESC, created_at DESC`,
    [customerId]
  );
  return result.rows.map(rowToOrder);
}

export async function createOrder(
  quoteId: string,
  customerId: string | null,
  customerName: string,
  projectType: string,
  dimensions: string
): Promise<InstallationOrder> {
  const orderNumber = await nextOrderNumber();
  const result = await pool.query(
    `INSERT INTO qq_orders (order_number, quote_id, customer_id, customer_name, project_type, dimensions)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [orderNumber, quoteId, customerId, customerName, projectType, dimensions]
  );
  return rowToOrder(result.rows[0]);
}

export async function updateOrderStatus(
  id: string,
  status: InstallationStatus,
  schedule?: string
): Promise<InstallationOrder | undefined> {
  const setClauses = ['installation_status = $1'];
  const values: any[] = [status];
  
  if (schedule) {
    setClauses.push('installation_schedule = $2');
    values.push(schedule);
  }

  values.push(id);
  const idIdx = values.length;

  const result = await pool.query(
    `UPDATE qq_orders SET ${setClauses.join(', ')} WHERE (id::text = $${idIdx} OR order_number = $${idIdx}) AND deleted_at IS NULL RETURNING *`,
    values
  );
  return result.rows.length > 0 ? rowToOrder(result.rows[0]) : undefined;
}
