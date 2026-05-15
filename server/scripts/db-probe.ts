import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[DB PROBE] Missing DATABASE_URL in environment.');
  process.exit(1);
}

const isLocalConnection = /localhost|127\.0\.0\.1/i.test(connectionString);
const sslModeMatch = connectionString.match(/[?&]sslmode=([^&]+)/i);
const sslMode = sslModeMatch?.[1]?.toLowerCase();

function stripSslMode(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return value.replace(/([?&])sslmode=[^&]*(&?)/i, (_match, sep, tail) => (tail ? sep : ''))
      .replace(/[?&]$/, '');
  }
}

const effectiveConnectionString = sslMode && sslMode !== 'disable'
  ? stripSslMode(connectionString)
  : connectionString;

const pool = new Pool({
  connectionString: effectiveConnectionString,
  ssl: isLocalConnection || sslMode === 'disable'
    ? undefined
    : {
        rejectUnauthorized: false,
      },
  connectionTimeoutMillis: 8000,
  queryMode: /pooler\.supabase\.com/i.test(connectionString) ? 'simple' : undefined,
});

pool.on('error', (err) => {
  console.error('[DB PROBE] Pool error:', {
    message: err.message,
    code: (err as any).code,
    detail: (err as any).detail,
    cause: (err as any).cause,
  });
});

async function run() {
  console.log('[DB PROBE] Connecting...');
  try {
    const result = await pool.query('SELECT NOW() AS now');
    console.log('[DB PROBE] Success:', result.rows[0]?.now);
  } catch (err: any) {
    console.error('[DB PROBE] Connection failed:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      cause: err.cause,
    });
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

run().catch((err: any) => {
  console.error('[DB PROBE] Unexpected error:', err?.message || err);
  process.exit(1);
});
