// ============================================================
// Database configuration — shared pool instance
// ============================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const localFallback = 'postgresql://postgres:postgres@localhost:5432/ermel';
const connectionString = process.env.DATABASE_URL || (!isProduction ? localFallback : '');

if (!connectionString) {
  throw new Error('[DB] DATABASE_URL is required in production.');
}

const isLocalConnection = /localhost|127\.0\.0\.1/i.test(connectionString);

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
  ssl: isLocalConnection
    ? undefined
    : {
        rejectUnauthorized: false,
      },
});

export default pool;
