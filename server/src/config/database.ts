// ============================================================
// Database configuration — shared pool instance
// ============================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ermel';

// Supabase connection strings often use pooler hosts under supabase.com.
// In local dev, allow self-signed/intermediate cert chains from managed providers.
const isSupabaseConnection = /supabase\.(co|com)/i.test(connectionString);
const normalizedConnectionString = isSupabaseConnection
  ? connectionString.match(/[?&]sslmode=/i)
    ? connectionString.replace(/([?&]sslmode=)[^&]*/i, '$1no-verify')
    : `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=no-verify`
  : connectionString;

const pool = new Pool({
  connectionString: normalizedConnectionString,
  ssl: isSupabaseConnection
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

export default pool;
