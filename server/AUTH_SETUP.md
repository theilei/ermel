# Authentication & Email Verification System

## Overview

This document covers the authentication and email verification system for the Ermel Glass & Aluminum quote platform.

**Stack:** React (TypeScript) + Node.js/Express + PostgreSQL  
**Auth method:** Session-based (express-session + connect-pg-simple)  
**Password hashing:** bcrypt (salt rounds: 10)  
**Email:** Gmail SMTP via Nodemailer

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Gmail account with an App Password enabled

### 2. Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE ermel;
```

Run the auth migration:

```bash
cd server
psql -U postgres -d ermel -f migrations/003_auth_system.sql
```

Or run all migrations in order:

```bash
psql -U postgres -d ermel -f migrations/001_enhanced_quotes.sql
psql -U postgres -d ermel -f migrations/002_quotation_system.sql
psql -U postgres -d ermel -f migrations/003_auth_system.sql
```

### 3. Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random secret for session signing (use 64+ chars) |
| `GMAIL_USER` | Gmail address for sending verification emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (NOT your regular password) |
| `GMAIL_PASS` | Backward-compatible Gmail App Password (optional) |
| `BASE_URL` | Frontend URL for email links (e.g., `http://localhost:5173`) |

#### Getting a Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Select "Mail" and your device
4. Click "Generate"
5. Copy the 16-character password into `GMAIL_APP_PASSWORD` (remove spaces or wrap in quotes)

### 4. Install Dependencies

```bash
# Server
cd server
npm install

# Frontend
cd "Ermel Website"
npm install
```

### 5. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd "Ermel Website"
npm run dev
```

---

## How to Test Verification

1. **Register** at `/register` with a real email address
2. Check your inbox for the verification email
3. Click the "Verify Email" button in the email
4. You'll be redirected to `/verify-email?token=...`
5. On success, you can now access `/quote`

**Without email configured:**
- Registration still works
- User is created with `is_verified = false`
- Verification email fails silently (logged to console)
- You can manually verify in the database:

```sql
UPDATE users SET is_verified = true WHERE email = 'test@example.com';
```

---

## Security Explanation

### Password Security
- Passwords are hashed with **bcrypt** (10 salt rounds) before storage
- Only the hash is stored — plaintext passwords are never persisted
- Bcrypt is intentionally slow, making brute-force attacks impractical

### Session Security
- Sessions are stored in PostgreSQL (not in memory)
- Cookies are `HttpOnly` (no JavaScript access) and `SameSite: strict` (CSRF protection)
- `Secure` flag is enabled in production (HTTPS only)
- Sessions expire after 24 hours

### CSRF Security
- CSRF tokens are generated server-side using `csurf`
- Frontend fetches a token from `GET /api/auth/csrf-token`
- All state-changing auth endpoints and quote submission require `x-csrf-token`
- Invalid tokens return `403 Invalid CSRF token`

### Account Lock System
- After **5 failed login attempts**, the account is locked for **15 minutes**
- Failed attempt counter resets on successful login
- Lock status is checked before password comparison

### Email Verification
- Verification tokens are **hashed (SHA-256)** before storage
- Raw tokens are sent via email; only hashes exist in the database
- Tokens are **single-use** (marked with `used_at` timestamp)
- Tokens **expire after 24 hours**
- Resend is limited to **3 per hour** per user
- Verification events are logged in `qq_activity_logs` (sent, failed, resent, verified)

### Rate Limiting
- Login: 10 attempts per 15 minutes per IP
- Registration: 5 per hour per IP
- Resend verification: 3 per hour per IP
- Quote submission: 5 per hour per IP

### Input Validation
- All inputs are sanitized (HTML tags stripped)
- Email format validated on both client and server
- Parameterized SQL queries prevent SQL injection
- Content-type validation on all endpoints

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/csrf-token` | Get CSRF token for mutating requests |
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/user/me` | Alias to current authenticated user profile |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Protected

| Method | Endpoint | Middleware |
|---|---|---|
| GET | `/api/quote-access` | requireAuth + requireVerified |
| POST | `/api/quotes` | requireAuth + requireVerified + CSRF + rate-limit |

---

## Route Protection Flow

```
User visits /quote
    │
    ├── Not logged in?
    │   └── Redirect to /login?redirect=/quote
    │       └── After login → redirect back to /quote
    │
    ├── Logged in but NOT verified?
    │   └── Redirect to /verification-required
    │       └── User can resend verification email
    │
    └── Logged in AND verified?
        └── Access granted ✓
```

---

## Database Schema

### users

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| full_name | VARCHAR(200) | User's display name |
| email | VARCHAR(254) | Unique email (login identifier) |
| password_hash | VARCHAR(200) | bcrypt hash |
| is_verified | BOOLEAN | Email verification status |
| failed_login_attempts | INTEGER | Counter for lockout |
| lock_until | TIMESTAMPTZ | Lockout expiry time |
| accepted_terms | BOOLEAN | Terms acceptance |
| accepted_privacy | BOOLEAN | Privacy acceptance |
| created_at | TIMESTAMPTZ | Registration timestamp |
| updated_at | TIMESTAMPTZ | Last update |

### email_verification_tokens

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| token_hash | VARCHAR(128) | SHA-256 of raw token |
| expires_at | TIMESTAMPTZ | 24h from creation |
| used_at | TIMESTAMPTZ | When verified (null if unused) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### session

| Column | Type | Description |
|---|---|---|
| sid | VARCHAR | Session ID (primary key) |
| sess | JSON | Session data |
| expire | TIMESTAMP | Expiry time |

---

## File Structure

```
server/
  src/
    config/
      database.ts          # PostgreSQL pool
      session.ts           # Session + PG store config
    controllers/
      authController.ts    # Register, login, logout, verify, resend
    middleware/
      authMiddleware.ts    # requireAuth, requireVerified
      rateLimiter.ts       # Rate limit presets
    routes/
      authRoutes.ts        # /api/auth/* routes
    services/
      verificationEmailService.ts  # Gmail SMTP email sender
  migrations/
    003_auth_system.sql    # Users + tokens + session tables

Ermel Website/
  src/
    app/
      context/
        AuthContext.tsx     # Auth state provider
      pages/
        Login.tsx           # /login
        Register.tsx        # /register
        VerifyEmailResult.tsx     # /verify-email
        VerificationRequired.tsx  # /verification-required
      components/
        ProtectedRoute.tsx  # Route guard wrapper
    styles/
      auth.css             # Auth page styles
```
