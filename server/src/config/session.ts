// ============================================================
// Session configuration (express-session + connect-pg-simple)
// ============================================================
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './database';

const PgStore = connectPgSimple(session);

export const sessionConfig: session.SessionOptions = {
  store: new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'ermel-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'ermel.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};
