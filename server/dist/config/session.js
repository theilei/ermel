"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionConfig = void 0;
// ============================================================
// Session configuration (express-session + connect-pg-simple)
// ============================================================
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const database_1 = __importDefault(require("./database"));
const PgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';
// Render commonly hosts frontend and backend on different origins.
// CSRF/session-backed auth requires cross-site cookies in that setup.
const sameSite = (process.env.SESSION_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
const normalizedSameSite = sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none'
    ? sameSite
    : (isProduction ? 'none' : 'lax');
exports.sessionConfig = {
    store: new PgStore({
        pool: database_1.default,
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'ermel-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'ermel.sid',
    cookie: {
        secure: isProduction || normalizedSameSite === 'none',
        httpOnly: true,
        sameSite: normalizedSameSite,
        maxAge: IDLE_TIMEOUT_MS,
    },
};
//# sourceMappingURL=session.js.map