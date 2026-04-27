// ============================================================
// Session configuration (express-session + connect-pg-simple)
// ============================================================
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './database';

const PgStore = connectPgSimple(session);
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

// Render commonly hosts frontend and backend on different origins.
// CSRF/session-backed auth requires cross-site cookies in that setup.
const sameSite = (process.env.SESSION_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
const normalizedSameSite: true | false | 'lax' | 'strict' | 'none' =
  sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none'
    ? sameSite
    : (isProduction ? 'none' : 'lax');

export const sessionConfig: session.SessionOptions = {
  store: new PgStore({
    pool,
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
