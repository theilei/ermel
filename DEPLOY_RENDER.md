# Render Deployment Guide (Ermel)

This project is a full-stack TypeScript app:
- Frontend: React + Vite (`Ermel Website`)
- Backend: Node.js + Express + PostgreSQL (`server`)
- Database: PostgreSQL (`pg` driver, SQL migrations in `server/migrations`)

A starter `render.yaml` is included at repo root.

## 1) Create PostgreSQL on Render
1. In Render dashboard, create a new PostgreSQL database.
2. Name it `ermel-postgres` (or update `render.yaml` to match your name).
3. Wait until it is available.

## 2) Deploy Backend Web Service
1. Create a new Web Service from this repo.
2. Root directory: `server`
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Set environment variables:
   - `DATABASE_URL` = Render PostgreSQL Internal Connection String
   - `SESSION_SECRET` = long random secret
   - `NODE_ENV` = `production`
   - `BASE_URL` = deployed frontend URL (for verification links)
   - `FRONTEND_URL` = deployed frontend URL
   - `CORS_ORIGIN` = deployed frontend URL (or comma-separated list)
   - `GMAIL_USER` / `GMAIL_PASS` if email sending is required

## 3) Run Database Migrations
Run once after backend deploy (Shell or one-off job):

```bash
npm install
npm run migrate
```

Run this in the `server` directory with production `DATABASE_URL` set.

## 4) Deploy Frontend Static Site
1. Create a new Static Site from this repo.
2. Root directory: `Ermel Website`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Set env variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`

## 5) Link Frontend and Backend
1. Copy frontend URL.
2. Update backend env vars:
   - `BASE_URL`
   - `FRONTEND_URL`
   - `CORS_ORIGIN`
3. Redeploy backend.
4. Verify browser API calls go to the backend Render URL.

## Required Environment Variables

Backend:
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`
- `BASE_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `GMAIL_USER` (optional depending on feature usage)
- `GMAIL_PASS` (optional depending on feature usage)
- `PORT` (Render injects this automatically)

Frontend:
- `VITE_API_URL`
- `VITE_SUPABASE_URL` (if Supabase integration is used in your environment)
- `VITE_SUPABASE_ANON_KEY` (if Supabase integration is used in your environment)

## pgAdmin Connection (Optional)
Use the **External** database connection details from Render PostgreSQL:
- Host: Render Postgres external host
- Port: external port
- Database: database name
- Username: database user
- Password: database password
- SSL mode in pgAdmin: `require`

## Validation Checklist
- Backend starts successfully on Render without runtime errors.
- `/api/health` returns `status: ok` and `database: connected`.
- Migrations complete without blocking errors.
- Frontend builds successfully.
- Frontend requests hit `VITE_API_URL` and return expected responses.
- Login/session flows work with credentials and CORS in production.
- End-to-end quote flow works (submit -> admin action -> customer check status).

## Recommended Improvements
- Add a post-deploy migration job to automate `npm run migrate`.
- Rotate `SESSION_SECRET` and email credentials using Render secret management.
- Add structured request logging with log level controls.
- Add security headers (`helmet`) and stricter CORS list management.
- Add readiness checks in addition to `/api/health`.
