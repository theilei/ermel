// ============================================================
// Legacy Order Model — DB-backed general order tracking
// ============================================================
import pool from '../config/database';

export interface LegacyOrder {
  id: string;
  orderNumber: string;
  customer: string;
  project: string;
  material: string;
  glassType: string;
  dimensions: string;
  width: number;
  height: number;
  estimatedCost: number;
  approvedCost: number | null;
  status: string;
  phone: string;
  email: string;
  address: string | null;
  notes: string | null;
  paid: boolean;
  paymentUploaded: boolean;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyOrderSummary {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
}

function rowToOrder(row: any): LegacyOrder {
  return {
    id: row.order_number,
    orderNumber: row.order_number,
    customer: row.customer,
    project: row.project,
    material: row.material,
    glassType: row.glass_type,
    dimensions: row.dimensions,
    width: parseFloat(row.width),
    height: parseFloat(row.height),
    estimatedCost: parseFloat(row.estimated_cost),
    approvedCost: row.approved_cost ? parseFloat(row.approved_cost) : null,
    status: row.status,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    paid: row.paid,
    paymentUploaded: row.payment_uploaded,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date).toISOString().split('T')[0] : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const LegacyOrderModel = {
  async getAll(): Promise<LegacyOrder[]> {
    const { rows } = await pool.query(
      'SELECT * FROM legacy_orders ORDER BY created_at DESC'
    );
    return rows.map(rowToOrder);
  },

  async getById(id: string): Promise<LegacyOrder | null> {
    const { rows } = await pool.query(
      'SELECT * FROM legacy_orders WHERE order_number = $1 OR id::text = $1',
      [id]
    );
    return rows[0] ? rowToOrder(rows[0]) : null;
  },

  async getByEmail(email: string): Promise<LegacyOrder[]> {
    const { rows } = await pool.query(
      'SELECT * FROM legacy_orders WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC',
      [email]
    );
    return rows.map(rowToOrder);
  },

  async getSummary(): Promise<LegacyOrderSummary> {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE paid = TRUE) AS total_orders,
         COALESCE(SUM(COALESCE(approved_cost, estimated_cost)) FILTER (WHERE paid = TRUE), 0) AS total_revenue,
         COUNT(*) FILTER (WHERE paid = TRUE AND scheduled_date IS NOT NULL AND scheduled_date >= CURRENT_DATE) AS active_orders
       FROM legacy_orders`
    );

    const row = rows[0] || {};
    return {
      totalOrders: Number(row.total_orders || 0),
      totalRevenue: Number(row.total_revenue || 0),
      activeOrders: Number(row.active_orders || 0),
    };
  },

  async create(data: {
    customer: string;
    project: string;
    material: string;
    glassType: string;
    dimensions: string;
    width: number;
    height: number;
    estimatedCost: number;
    phone: string;
    email: string;
    address?: string;
    notes?: string;
  }): Promise<LegacyOrder> {
    const year = new Date().getFullYear();
    const seqResult = await pool.query("SELECT nextval('legacy_order_seq') AS seq");
    const seq = String(seqResult.rows[0].seq).padStart(3, '0');
    const orderNumber = `EGA-${year}-${seq}`;

    const { rows } = await pool.query(
      `INSERT INTO legacy_orders (order_number, customer, project, material, glass_type, dimensions, width, height, estimated_cost, phone, email, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [orderNumber, data.customer, data.project, data.material, data.glassType, data.dimensions,
       data.width, data.height, data.estimatedCost, data.phone, data.email, data.address || null, data.notes || null]
    );
    return rowToOrder(rows[0]);
  },

  async updateStatus(id: string, status: string, scheduledDate?: string): Promise<LegacyOrder | null> {
    const { rows } = await pool.query(
      `UPDATE legacy_orders
       SET status = $1, scheduled_date = $2
       WHERE order_number = $3 OR id::text = $3
       RETURNING *`,
      [status, scheduledDate || null, id]
    );
    return rows[0] ? rowToOrder(rows[0]) : null;
  },

  async updateCost(id: string, approvedCost: number): Promise<LegacyOrder | null> {
    const { rows } = await pool.query(
      `UPDATE legacy_orders
       SET approved_cost = $1, paid = FALSE
       WHERE order_number = $2 OR id::text = $2
       RETURNING *`,
      [approvedCost, id]
    );
    return rows[0] ? rowToOrder(rows[0]) : null;
  },

  async markPaymentUploaded(id: string): Promise<LegacyOrder | null> {
    const { rows } = await pool.query(
      `UPDATE legacy_orders
       SET payment_uploaded = TRUE
       WHERE order_number = $1 OR id::text = $1
       RETURNING *`,
      [id]
    );
    return rows[0] ? rowToOrder(rows[0]) : null;
  },
};
