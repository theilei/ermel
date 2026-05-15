// ============================================================
// Database configuration — shared pool instance
// ============================================================
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});

const isProduction = process.env.NODE_ENV === 'production';
const localFallback = 'postgresql://postgres:postgres@localhost:5432/ermel';
const connectionString = process.env.DATABASE_URL || (!isProduction ? localFallback : '');

if (!connectionString) {
  throw new Error('[DB] DATABASE_URL is required in production.');
}

const isLocalConnection = /localhost|127\.0\.0\.1/i.test(connectionString);

// Managed providers often require sslmode. Normalize for known hosts.
// In local dev, allow self-signed/intermediate cert chains from managed providers.
const isSupabaseConnection = /supabase\.(co|com)/i.test(connectionString);
const isRenderConnection = /render\.com/i.test(connectionString);
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

const normalizedConnectionString = (() => {
  if (!isSupabaseConnection && !isRenderConnection) return connectionString;

  if (connectionString.match(/[?&]sslmode=/i)) {
    if (isSupabaseConnection && /pooler\.supabase\.com/i.test(connectionString) && !connectionString.match(/[?&]uselibpqcompat=/i)) {
      return `${connectionString}${connectionString.includes('?') ? '&' : '?'}uselibpqcompat=true`;
    }
    return connectionString;
  }

  const desiredMode = isSupabaseConnection ? 'no-verify' : 'verify-full';
  const withSslMode = `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=${desiredMode}`;
  if (isSupabaseConnection && /pooler\.supabase\.com/i.test(connectionString) && !withSslMode.match(/[?&]uselibpqcompat=/i)) {
    return `${withSslMode}&uselibpqcompat=true`;
  }
  return withSslMode;
})();

const effectiveConnectionString = sslMode && sslMode !== 'disable'
  ? stripSslMode(normalizedConnectionString)
  : normalizedConnectionString;

const pool = new Pool({
  connectionString: effectiveConnectionString,
  ssl: isLocalConnection || sslMode === 'disable'
    ? undefined
    : {
        rejectUnauthorized: false,
      },
  connectionTimeoutMillis: 8000,
  ...(isSupabaseConnection && /pooler\.supabase\.com/i.test(connectionString)
    ? { queryMode: 'simple' as const }
    : {}),
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', {
    message: err.message,
    code: (err as any).code,
    detail: (err as any).detail,
    cause: (err as any).cause,
  });
});

export default pool;
