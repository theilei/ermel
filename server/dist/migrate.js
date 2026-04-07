"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================
// Database migration runner for Ermel system (PostgreSQL)
// Run: npm run migrate
// ============================================================
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const pool = new pg_1.Pool({
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
        }
        catch (err) {
            console.error(`[MIGRATE] ✗ ${file} failed:`, err.message);
            // Continue with other migrations — most use IF NOT EXISTS
        }
    }
    console.log('[MIGRATE] All migrations processed.');
    await pool.end();
}
migrate();
//# sourceMappingURL=migrate.js.map