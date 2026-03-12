// ============================================================
// Database migration runner for Ermel system (PostgreSQL)
// Run: npm run migrate
// ============================================================
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ermel',
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined,
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
