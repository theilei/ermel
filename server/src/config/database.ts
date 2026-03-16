// ============================================================
// Database configuration — shared pool instance
// ============================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ermel';

// Supabase pooler URLs include sslmode=require which newer pg versions treat as
// verify-full, causing cert errors. Strip sslmode from the URL and rely on the
// explicit ssl option below (rejectUnauthorized: false) instead.
const isSupabaseConnection = /supabase\.(co|com)/i.test(connectionString);
const normalizedConnectionString = isSupabaseConnection
  ? connectionString
      .replace(/([?&])sslmode=[^&]*/gi, '$1') // remove sslmode param
      .replace(/[?&]$/, '')                    // clean trailing ? or &
  : connectionString;

const pool = new Pool({
  connectionString: normalizedConnectionString,
  ssl: isSupabaseConnection ? { rejectUnauthorized: false } : undefined,
});

export default pool;
