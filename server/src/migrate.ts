// ============================================================
// Database migration runner for Ermel system (PostgreSQL)
// Run: npm run migrate
// ============================================================
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const localFallback = 'postgresql://postgres:postgres@localhost:5432/ermel';
const connectionString = process.env.DATABASE_URL || (!isProduction ? localFallback : '');

if (!connectionString) {
  throw new Error('[MIGRATE] DATABASE_URL is required in production.');
}

const isLocalConnection = /localhost|127\.0\.0\.1/i.test(connectionString);
const isSupabaseConnection = /supabase\.(co|com)/i.test(connectionString);
const normalizedConnectionString = isSupabaseConnection
  ? connectionString
      .replace(/([?&])sslmode=[^&]*/gi, '$1')
      .replace(/[?&]$/, '')
  : connectionString;

const pool = new Pool({
  connectionString: normalizedConnectionString,
  ssl: isLocalConnection ? undefined : { rejectUnauthorized: false },
});

async function migrate() {
  console.log('[MIGRATE] Running database migrations...');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`[MIGRATE] Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`[MIGRATE] ✓ ${file} completed.`);
    } catch (err: any) {
      console.error(`[MIGRATE] ✗ ${file} failed:`, err.message);
      // Continue with other migrations — most use IF NOT EXISTS
    }
  }

  console.log('[MIGRATE] All migrations processed.');
  await pool.end();
}

migrate();
