"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================================
// Database configuration — shared pool instance
// ============================================================
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const pool = new pg_1.Pool({
    connectionString: normalizedConnectionString,
    ssl: isLocalConnection
        ? undefined
        : {
            rejectUnauthorized: false,
        },
});
exports.default = pool;
//# sourceMappingURL=database.js.map