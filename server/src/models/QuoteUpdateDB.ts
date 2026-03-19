import pool from '../config/database';

export interface QuoteUpdate {
  id: string;
  quoteId: string;
  status?: string;
  estimatedPrice?: number;
  updatedPrice?: number;
  adminRemark?: string;
  adminName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteUpdateData {
  quoteId: string;
  status?: string;
  estimatedPrice?: number;
  updatedPrice?: number;
  adminRemark?: string;
  adminName?: string;
}

function rowToQuoteUpdate(row: any): QuoteUpdate {
  return {
    id: row.id,
    quoteId: row.quote_id,
    status: row.status || undefined,
    estimatedPrice: row.estimated_price !== null && row.estimated_price !== undefined
      ? parseFloat(row.estimated_price)
      : undefined,
    updatedPrice: row.updated_price !== null && row.updated_price !== undefined
      ? parseFloat(row.updated_price)
      : undefined,
    adminRemark: row.admin_remark || undefined,
    adminName: row.admin_name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createQuoteUpdate(data: CreateQuoteUpdateData): Promise<QuoteUpdate> {
  const result = await pool.query(
    `INSERT INTO quote_updates (
      quote_id, status, estimated_price, updated_price, admin_remark, admin_name
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.quoteId,
      data.status || null,
      data.estimatedPrice ?? null,
      data.updatedPrice ?? null,
      data.adminRemark || null,
      data.adminName || null,
    ]
  );

  return rowToQuoteUpdate(result.rows[0]);
}

export async function getQuoteUpdatesByQuoteId(quoteId: string): Promise<QuoteUpdate[]> {
  const result = await pool.query(
    `SELECT * FROM quote_updates WHERE quote_id = $1 ORDER BY created_at DESC`,
    [quoteId]
  );

  return result.rows.map(rowToQuoteUpdate);
}
