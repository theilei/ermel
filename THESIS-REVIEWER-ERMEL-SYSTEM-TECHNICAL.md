# Ermel Glass & Aluminum System Reviewer (Technical and Detailed)

This document is a technical reviewer for thesis defense.
It is designed to be deeper than a beginner overview while still presentation-ready.

Scope note:
- This reviewer reflects the repository structure and implementation evidence in:
  - `Ermel Website/src`
  - `Ermel Website/src/styles`
  - `server/src`
  - `server/migrations`
- It does not modify any system behavior. It is documentation only.

---

## 1. System Definition and Objective

### 1.1 What the system is
The Ermel system is a full-stack web platform for managing the business workflow of a glass and aluminum service provider from customer inquiry to installation preparation.

### 1.2 Core business objective
Convert a manual, fragmented process (chat + paper + spreadsheet follow-up) into a rule-based digital pipeline with:
- Traceable status transitions
- Centralized records
- Time-bounded payment handling
- Reservation conflict prevention
- Admin decision support through metrics/logs

### 1.3 End-to-end lifecycle
The operational lifecycle is:
1. Customer authentication and verification
2. Quote request submission with reservation date
3. Admin review and quote decision
4. Payment method selection and proof handling
5. Payment verification and status finalization
6. Reservation lock/approval and installation queue eligibility
7. Ongoing status tracking and notifications

Compact formula:
**Quote -> Approve -> Pay -> Verify -> Install**

---

## 2. Technology Stack and Language Composition

## 2.1 Runtime and framework stack
Frontend:
- TypeScript + React + Vite
- UI and interaction libraries: MUI, Radix UI, React Router, FullCalendar, Recharts, React Hook Form
- Realtime client: Supabase JS client

Backend:
- TypeScript + Node.js + Express
- Session auth: `express-session` + `connect-pg-simple`
- Security middleware: `csurf`, `express-rate-limit`
- File uploads: `multer`
- Email: `nodemailer` (Gmail SMTP)
- PDFs: `pdfkit`
- Database adapter: `pg`

Data layer:
- PostgreSQL (quotes, users, sessions, payments, reservations, logs, analytics)
- SQL migrations for schema evolution

Testing:
- Vitest for unit-level validation/business rule tests
- Playwright for E2E flow tests

## 2.2 Languages involved and percentage used
Method:
- Counted within production scope only:
  - `Ermel Website/src`
  - `Ermel Website/src/styles`
  - `server/src`
  - `server/migrations`
- Excluded generated/sandbox areas:
  - `dist`, `.vite`, `node/Ermel`, and test-only folders

Language usage by lines (production scope):

| Language | Files | Lines | Percent |
|---|---:|---:|---:|
| TypeScript / TSX | 142 | 21,720 | 94.2% |
| SQL | 13 | 542 | 2.4% |
| CSS | 5 | 798 | 3.5% |
| Total | 160 | 23,060 | 100% |

Interpretation:
- The system is primarily TypeScript-driven across frontend and backend logic.
- SQL expresses structural business constraints and persistent lifecycle rules.
- CSS handles UI theming and layout layers, especially auth and dashboard surfaces.

---

## 3. Architecture Overview

## 3.1 High-level architecture style
The system follows a layered web architecture:
- Presentation layer: React pages/components
- API layer: Express route/controller modules
- Domain/business layer: service + validation + model modules
- Persistence layer: PostgreSQL + migration scripts
- Integration layer: SMTP, PDF, Supabase realtime

## 3.2 Network and trust zones
Logical zones:
1. Public user network (customer/admin browsers)
2. Application network (frontend + API + uploads storage)
3. Private data network (PostgreSQL and session tables)
4. External service network (SMTP, Supabase realtime, PDF generation)

Key transport paths:
- Browser to frontend/API over HTTPS
- API to database via SQL connections
- API to SMTP for verification and event emails
- DB change stream to frontend via realtime channel updates

## 3.3 Project structure mapping
- `Ermel Website/src/app/pages`: feature pages (customer and admin)
- `Ermel Website/src/app/components`: shared UI/layout components
- `Ermel Website/src/app/services`: API/realtime/CSRF service layer
- `Ermel Website/src/app/context`: auth/quote/app state contexts
- `server/src/routes`: API route declarations
- `server/src/controllers`: request handling and response shaping
- `server/src/models`: DB operation modules and domain records
- `server/src/services`: email, analytics, notification, PDF services
- `server/src/middleware`: auth, CSRF, and rate-limit controls
- `server/migrations`: schema and policy evolution

---

## 4. Detailed Functional Modules

## 4.1 Account and access module
Main capabilities:
- Registration and login
- Email verification token flow
- Forgot/reset password path
- Session creation and validation
- Account lock policy on repeated failures

Technical controls:
- Password hashing with bcrypt
- Session persistence in PostgreSQL
- Verification tokens hashed (SHA-256) before storage
- Login/register/resend rate limiting

## 4.2 Quote and reservation module
Main capabilities:
- Authenticated quote submission through protected endpoint
- Server-side validation of all required fields
- Measurement conversion and estimated cost computation
- Reservation date validation and conflict handling

Important validation/logic examples:
- Enumerated allowed options for materials/tints on backend
- Reservation date rules enforced server-side (not frontend-only)
- Address/phone/measurement constraints and sanitization

## 4.3 Admin review and quotation decision module
Main capabilities:
- Admin listing and filtering of quote queue
- Quote updates, remarks, and status transitions
- Approve/reject decisioning with reason handling
- Conversion of approved quotes toward order/installation flow

## 4.4 Payment module
Main capabilities:
- Payment method selection (`qrph` or `cash`)
- Proof upload flow for QRPH
- Admin verification or rejection with reason
- Receipt/PDF workflows
- Payment deadline and expiration handling

Payment statuses:
- `waiting_approval`
- `paid`
- `expired`

## 4.5 Status tracking and notification module
Main capabilities:
- Customer check-status view (quote + payment + updates)
- Notification listing and read/unread transitions
- Event-based notifications for major lifecycle changes
- Analytics event tracking for operational visibility

## 4.6 Installation scheduling and queue module
Main capabilities:
- Reservation date selection during quote process
- Admin reservation management (approve/reject/reschedule)
- Conflict avoidance through one-reservation-per-day constraint
- Queue eligibility based on quote approval + paid status + valid reservation

---

## 5. API Surface (Technical Summary)

Representative endpoint groups:

Auth/API security:
- `GET /api/auth/csrf-token`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`

Quote and reservation:
- `GET /api/quote-access`
- `POST /api/quotes`
- `GET /api/reservations/dates`
- Admin reservation endpoints for approve/reject/reschedule

Payments:
- Customer payment retrieval and method selection endpoints
- Proof upload/delete endpoints
- Admin payment listing + approve/reject endpoints

Status and documents:
- Customer check-status quote listing
- Quote updates retrieval
- PDF URL endpoints for quote and receipts

Notifications and analytics:
- Notifications list and mark-read endpoints
- Analytics event and summary endpoints

Operational endpoints:
- `GET /api/health`
- Development-only user listing endpoint (guarded for non-production)

---

## 6. Data Model and Persistence

## 6.1 Core entities
Primary business entities:
- Users and sessions
- Quotes
- Reservations
- Payments
- Orders / installation records
- Notifications
- Activity logs
- Analytics/system logs
- Verification and password reset tokens

## 6.2 Database design intent
The schema enforces policy boundaries, not only storage:
- Reservation uniqueness to prevent overbooking
- Stateful records for quote/payment lifecycle tracking
- Audit-style tables for activity visibility
- Session table to support server-side auth state

## 6.3 Migration-based evolution
Schema evolution is tracked through sequential SQL migrations (`001` to `012`) including:
- Quotation system foundation
- Authentication and role structures
- Reservation logic
- Security/testing/analytics additions
- Payment workflow refinements (including waiting approval)

---

## 7. Validation and Business Rule Engine

## 7.1 Input validation model
Validation is layered:
1. Frontend form checks for immediate UX feedback
2. Backend re-validation and sanitization as authority
3. Database constraints as final enforcement boundary

## 7.2 Critical business rules
Operational rules embedded in system flow:
- Quote approval is required before payment progression
- Payment deadline is 3 days for approved quotes
- Late/unpaid records transition toward expiration/cancellation
- One reservation slot per day (conflict prevention)
- Reservation date must be within allowed schedule window

## 7.3 State transition behavior
Quote:
- `pending -> approved|rejected -> cancelled|expired` (if unpaid/overdue)

Payment:
- `waiting_approval -> paid|expired`

Reservation:
- `pending -> approved|rejected|expired`

State transitions are guarded by route/controller checks to block illegal jumps.

---

## 8. Security Design (Defense-Critical)

## 8.1 Authentication and session security
- Session-based auth with PostgreSQL session persistence
- Cookie hardening: `HttpOnly`, same-site restrictions, production secure cookie
- Explicit protected middleware (`requireAuth`, `requireVerified`)

## 8.2 CSRF and abuse controls
- CSRF tokens required on mutating protected flows
- Endpoint-level rate limits for login/register/resend/quote submission
- Account lock after repeated failed attempts

## 8.3 Input and file upload security
- Input sanitization and format validation on backend
- Parameterized SQL usage to reduce injection risk
- Upload constraints:
  - MIME + extension checks
  - Double-extension blocking
  - size limit (5MB)
  - allowed types: JPG/JPEG/PNG/PDF

## 8.4 Token and credential handling
- Verification tokens are hash-stored, single-use, and time-expiring
- Passwords never persisted in plaintext
- Sensitive operations recorded through activity logs where applicable

---

## 9. Realtime, Notifications, and Observability

## 9.1 Realtime/near-realtime model
Hybrid update strategy:
- Supabase subscriptions for table-change awareness
- Refresh-based polling in selected views

## 9.2 Notification semantics
Event sources include:
- Quote submission/decision updates
- Payment submission/verification/rejection/expiration
- Reservation and status-impacting transitions

## 9.3 Monitoring and logs
- Request timing and status metrics are written to system logs
- Activity logs support operation traceability
- Dashboard metrics provide admin-level workload visibility

---

## 10. Frontend Engineering Details

## 10.1 UI architecture
- Route-oriented page modules with role-aware access
- Context providers for authentication and quote session state
- Componentized UI primitives for consistency and reuse

## 10.2 Data access strategy
- Centralized API service module handling fetch and response envelope unwrapping
- Credentialed requests (`credentials: include`) for session continuity
- Typed contracts with shared domain interfaces

## 10.3 UX-critical flows
- Guided multi-step quote form with summary confirmation
- Reservation calendar integration with blocked-date checks
- Payment proof upload UX and status feedback
- Check-status dashboard for customer transparency

---

## 11. Backend Engineering Details

## 11.1 API composition
- Express app with modular route mounts (`/api/auth`, `/api/admin`, `/api/customer`, `/api/notifications`, payment routes)
- Cross-cutting middleware for CORS, JSON size limits, sessions, CSRF handling

## 11.2 Service composition
- Email services for verification and business notifications
- Analytics/event service for dashboard and tracking
- PDF services for printable quote/receipt artifacts

## 11.3 Reliability patterns
- Health-check endpoint with database connectivity checks
- Best-effort behavior in non-critical side effects (e.g., notification/email send failure handling)
- Conflict-aware reservation insert with rollback-safe behavior patterns

---

## 12. Testing and Quality Assurance

Test toolchain:
- Unit tests: Vitest (`validation`, auth middleware, password flows, reservation rules)
- E2E tests: Playwright (auth flow, quote flow, check-status flow, top-nav interaction)

Quality focus areas:
- Security middleware correctness
- Rule validation and state transitions
- End-to-end customer/admin behavior

Defense point:
The presence of both unit and E2E tests indicates verification at logic and user journey levels.

---

## 13. Deployment and Runtime Notes

Typical local runtime:
- Frontend dev server (Vite)
- Backend dev server (`tsx watch`)
- PostgreSQL with migrated schema

Operational dependencies:
- SMTP credentials for live email verification
- Environment variables for DB URL, session secret, base URL, and mail account

Production hardening expectations:
- HTTPS and secure cookies enabled
- Firewall/WAF and internal DB network restrictions
- Backup/retention strategy for uploads and database tables

---

## 14. End-to-End Sequence (Technical)

1. Customer authenticates and gains verified access.
2. Customer submits quote payload (materials, dimensions, reservation, contact).
3. Backend validates, sanitizes, computes estimates, persists quote.
4. Backend checks reservation availability and creates reservation record.
5. Admin reviews quote and decides approve/reject.
6. If approved, customer selects payment method.
7. If QRPH, customer uploads proof; payment enters `waiting_approval`.
8. Admin verifies payment -> payment becomes `paid` (or `expired/rejected`).
9. Reservation and queue eligibility are updated based on final state.
10. Customer views status updates, notifications, and document outputs.

---

## 15. Possible Thesis Defense Questions (Technical Answer Key)

Q1: Why use session auth instead of stateless JWT for this project?
- The workflow is browser-centric with cookie-based protected routes, CSRF controls, and server-managed session invalidation, which aligns naturally with admin/customer portal behavior.

Q2: Where is business rule enforcement strongest?
- Backend controllers/services and DB constraints. Frontend validation improves UX but is not trusted as final authority.

Q3: How do you prevent reservation conflicts?
- Through reservation validation logic plus database-level uniqueness constraints on reservation dates.

Q4: What guarantees that payment proof upload does not mean paid?
- State machine logic. Upload sets `waiting_approval`; only admin verification transitions to `paid`.

Q5: How is security handled across layers?
- Session/cookie hardening, CSRF middleware, rate limiting, input sanitization, parameterized DB queries, and strict upload filtering.

Q6: How is the system observable for operations?
- Activity logging, request/system logs, admin metrics dashboards, and analytics event tracking.

Q7: How is schema change managed safely?
- Ordered SQL migrations with explicit files for incremental changes (auth, reservations, payments, analytics/security).

Q8: What are technical limitations and next improvements?
- Potential improvements: richer analytics, queue optimization logic, SMS notifications, and installer auto-assignment heuristics.

---

## 16. Technical Conclusion

The Ermel platform is a TypeScript-first full-stack system with PostgreSQL-backed lifecycle controls for quote, payment, and reservation management.

Its technical value is in combining:
- Strong backend validation and state governance
- Security controls suitable for transactional workflows
- Trackable status progression with notification support
- Admin decision visibility through logs and metrics

One-line technical defense summary:

**The system operationalizes quote-to-installation workflow as a validated, stateful, and secure web transaction pipeline with measurable admin oversight.**
