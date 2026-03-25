# Ermel Glass & Aluminum System Reviewer (Beginner-Friendly)

This reviewer is written for beginners preparing for a thesis defense.
It explains the system from basic ideas to actual implementation flow.

---

## 1. INTRODUCTION

### What is the system?
This is a **web-based service reservation and order management system** for a glass and aluminum business.

It helps customers and admins handle the whole process online:
- Requesting a quote
- Approving/rejecting quotations
- Uploading payment proof
- Verifying payments
- Scheduling installation

### What problem does it solve?
Before this system, many businesses do this process manually (chat, paper, spreadsheets, follow-up messages). That causes:
- Delays in quotation updates
- Lost or unclear records
- Slow payment verification
- Conflicts in installation schedules
- Poor status visibility for customers

This system solves those problems by making the flow **digital, trackable, and organized**.

### Who are the users?
The main users are:
- **Customer**
  - Creates account and logs in
  - Requests quotation
  - Checks status
  - Selects payment method
  - Uploads payment proof (for QRPH)
- **Admin**
  - Reviews and approves/rejects quotes
  - Verifies or rejects payment proof
  - Views dashboard metrics
  - Manages reservation dates and installation queue

---

## 2. TECHNOLOGIES USED (START VERY BASIC)

### Frontend language and tools
- **TypeScript** (on top of JavaScript)
  - Used to build the website pages with safer coding rules.
- **React**
  - Used to create interactive UI components (forms, tables, status cards, dashboards).
- **Vite**
  - Fast tool for running and building the frontend project.

Simple explanation:
- Frontend = what users see and click in the browser.

### Backend language and tools
- **TypeScript + Node.js + Express**
  - Node.js runs JavaScript/TypeScript on the server.
  - Express is the framework that handles API routes.

Simple explanation:
- Backend = where business logic happens (validation, approval rules, payment checks, etc.).

### Database
- **PostgreSQL**
  - Stores all important data (quotes, payments, reservations, users, notifications).

Simple explanation:
- Database = digital storage cabinet for system records.

### Platform and services
- **Supabase**
  - Used as PostgreSQL platform and also for realtime-style updates in the frontend (via subscriptions to table changes).
- **Nodemailer (Gmail SMTP)**
  - Sends email notifications (verification, quote/payment updates).
- **Multer**
  - Handles file upload for payment proof.
- **PDFKit / PDF services**
  - Generates printable documents like receipts/quote PDFs.

---

## 3. SYSTEM OVERVIEW

### General flow from start to finish
1. Customer logs in and submits quote request.
2. Admin reviews quote and decides to approve or reject.
3. If approved, customer chooses payment method and submits proof (if QRPH).
4. Admin verifies payment.
5. Once paid, reservation is locked and installation enters queue.

### Step-by-step (simple)
1. **User requests a quote**
   - Customer fills a guided form (project type, materials, measurements, reservation date, contact info).
2. **Admin reviews and approves**
   - Admin can update quote pricing/remarks then approve or reject.
3. **User pays**
   - Customer selects QRPH or cash.
   - For QRPH, customer uploads payment proof.
4. **System schedules installation**
   - After payment is verified, reservation status becomes approved.
   - The quote appears in installation queue/calendar workflow.

---

## 4. FRONTEND (USER INTERFACE)

### What is frontend?
Frontend is the part users interact with directly in the browser (buttons, forms, pages, status cards).

### Main pages in the system
- **Homepage**
  - Public landing page for business information.
- **Request a Quote**
  - Guided multi-step form for quote creation.
- **Check My Status**
  - Customer portal to track quote, payment, updates, and notifications.
- **Admin Dashboard**
  - Admin side for monitoring inquiries, approvals, payment verification, and installation queue.

### Key frontend features (beginner explanation)
- **Form inputs with validation**
  - Prevents wrong/empty values before submission.
- **Step-by-step quote process**
  - Customer fills form in guided stages:
    - Info
    - Category
    - Materials
    - Dimensions
    - Reservation date
    - Summary/confirm
- **Payment upload UI**
  - Customer uploads QRPH proof file.
  - System checks allowed file type and size.
- **Realtime/near-realtime updates**
  - Status pages auto-refresh or subscribe to database changes, so users/admins see updates faster.

---

## 5. BACKEND (SERVER SIDE)

### What is backend?
Backend is the server part that processes requests, applies rules, and returns results.

### What backend does in this system
- Handles API requests from frontend
- Validates and sanitizes inputs
- Computes estimated values (e.g., pricing basis)
- Saves and updates records in database
- Applies status transitions and business rules
- Sends notifications/emails

### How backend connects frontend and database
- Frontend sends request (example: submit quote)
- Backend validates request
- Backend writes/reads from PostgreSQL
- Backend returns response to frontend
- Frontend shows updated status to user

Think of backend as the “manager” between UI and data.

---

## 6. DATABASE

### What is a database?
A database is organized storage for records that need to be saved long-term and queried quickly.

### Core tables (general explanation)
- **Quotes table (`qq_quotes`)**
  - Stores customer quote requests and quote lifecycle status.
  - Example data: customer info, project type, dimensions, quote number, quote status.
- **Payments table (`payments`)**
  - Stores payment method, proof file, payment status, verification/rejection details.
- **Reservations table (`reservations`)**
  - Stores selected installation date and reservation status.

### Other helpful tables
- **Users**
  - Account credentials, roles, verification state.
- **Notifications**
  - User/admin messages about events.
- **Activity logs**
  - Audit trail for actions (approvals, rejections, payment events).

---

## 7. SYSTEM FEATURES (IMPORTANT – INCLUDE ALL)

### Request a Quote system
- Authenticated customer submits quote request through protected route.
- Server validates all required fields.

### Step-by-step form (category, materials, etc.)
- Customer selects:
  - Project category
  - Glass type
  - Frame material
  - Color/tint
  - Measurements
  - Reservation date
- Form includes clear progression and summary confirmation.

### Admin approval system
- Admin can review quote details.
- Admin can approve or reject.
- Rejection requires a reason.
- Approved quote gets approval/expiry metadata.

### Payment system (QR upload, verification)
- Customer picks payment method: `qrph` or `cash`.
- For QRPH:
  - Upload proof file
  - Admin verifies or rejects with reason
- For cash:
  - Receipt workflow is available.

### Payment statuses
- `waiting_approval` = payment submitted or awaiting admin verification
- `paid` = admin verified successfully
- `expired` = payment window exceeded / invalid after deadline

### Countdown / payment deadline
- Payment window is computed from quote creation time.
- System uses a countdown and marks overdue records.

### Check My Status page
- Customer can monitor:
  - Quote status
  - Latest admin updates
  - Payment status and deadline
  - Notifications

### Installation scheduling
- Reservation date is selected during quote flow.
- Final reservation lock depends on payment verification.

### Installation calendar (admin side)
- Admin sees reservations and can approve/reject/reschedule.
- Date conflicts are prevented.

### Installation queue
- Queue includes records that are:
  - Approved quote
  - Paid payment
  - With valid reservation date

### Real-time updates (or near real-time)
- Frontend subscribes to quote/payment/reservation changes (Supabase channels).
- Also uses periodic refresh in some views.

### Notifications (applicable)
- System creates notifications for key events:
  - Quote submitted/approved/rejected
  - Payment submitted/verified/rejected/expired
  - Other status changes

---

## 8. SYSTEM FLOW (VERY IMPORTANT)

### Complete flow in simple, memorizable steps
1. Customer logs in and verifies email.
2. Customer opens quote form and enters project details.
3. Customer chooses reservation date (within allowed range, not already reserved).
4. System validates inputs and creates quote as `pending`.
5. Admin checks pending quote.
6. Admin approves or rejects quote.
7. If approved, customer can proceed to payment.
8. Customer selects payment method.
9. If QRPH, customer uploads proof and status becomes `waiting_approval`.
10. Admin verifies payment.
11. If payment is valid, status becomes `paid`.
12. Reservation status becomes approved/locked and quote proceeds to installation queue.

### Conditions (what-if cases)
- **If quote is not approved**
  - Customer cannot proceed with payment flow for that quote.
- **If payment is not completed on time**
  - Quote is cancelled by expiry process.
  - Payment becomes expired.
  - Reservation can be released.
- **If payment is paid/verified**
  - Reservation is locked/approved.
  - Entry appears in active installation workflow.

Quick memory formula:
- **Quote -> Approve -> Pay -> Verify -> Install**

---

## 9. SECURITY

### File upload restrictions
- Allowed payment proof file types: JPG/JPEG/PNG/PDF
- Max file size: 5MB
- Double extension is blocked (example: `file.jpg.exe`)
- MIME type and extension are both checked

### Validation and input safety
- Backend re-validates everything (never trusts frontend only)
- HTML tags are stripped on text fields
- Phone/address/measurement formats are validated
- Reservation date format and date window are validated

### Protection against invalid files/data
- Multer upload limits are enforced
- Invalid file types are rejected with clear error message
- Rejection/approval rules prevent illegal state transitions

### Basic data protection ideas used
- Session-based authentication with secure cookie settings
- CSRF protection for important actions
- Rate limiting for sensitive endpoints (login/register/quote)
- Password hashing with bcrypt
- Account lock on repeated failed login attempts

---

## 10. BUSINESS RULES

These are important defense points because they explain real policy logic:

- **Payment must be completed within 3 days**
  - Overdue approved quotes are cancelled by backend expiry process.
- **Only paid users can proceed to installation flow**
  - Queue/listing logic requires paid payment status.
- **Only 1 reservation per day**
  - Database has unique date constraint for reservation dates.
- **Late payments are rejected/expired**
  - Overdue or invalid payment windows become expired.
- **Unpaid quotes are cancelled**
  - Expiry process updates quote status to cancelled when deadline is missed.

Additional practical rule:
- Reservation date must be at least 7 days from today and within 60 days.

---

## 11. ADMIN PANEL

### What admin can do
- Approve/reject quotes
- Edit quote details (with restrictions)
- Verify/reject payment proofs
- View dashboard metrics and activity logs
- Manage reservation schedule (approve/reject/reschedule)
- Monitor installation queue

### Dashboard meaning (sample metrics)
- **Pending inquiries**
  - Number of incoming quotes not yet finalized.
- **Approved quotes**
  - Quotes approved by admin.
- **Active installations**
  - Approved + paid quotes with valid reservation dates.

Why this is useful:
- Helps admin prioritize work and avoid missed tasks.

---

## 12. POSSIBLE DEFENSE QUESTIONS (IMPORTANT)

### Q1: What is your system about?
**Simple answer:**
Our system is a web platform for a glass and aluminum business that manages the full process from quote request to payment verification and installation scheduling.

### Q2: Why did you choose your technologies?
**Simple answer:**
We used React + TypeScript for a clear and interactive frontend, Node/Express for fast API development, and PostgreSQL for reliable relational data storage. Supabase helps with managed database services and realtime updates.

### Q3: How does your payment system work?
**Simple answer:**
After quote approval, customer selects payment method. For QRPH, customer uploads proof. Admin reviews proof and either approves (status becomes paid) or rejects with reason. Payment also has a deadline to avoid stale requests.

### Q4: How do you ensure data security?
**Simple answer:**
We use backend validation, input sanitization, secure sessions, CSRF tokens, rate limits, password hashing, and strict file upload rules (type, size, and extension checks).

### Q5: What happens if a user does not pay?
**Simple answer:**
If payment is not completed within the allowed period, the system marks payment as expired and cancels the quote. Reserved schedule can be released.

### Q6: Why is there a reservation limit of one per day?
**Simple answer:**
To avoid installation conflicts and overbooking. The database enforces unique reservation dates.

### Q7: Can users skip admin approval and go directly to installation?
**Simple answer:**
No. The flow requires admin approval first, then payment verification, then reservation approval/locking before entering installation queue.

### Q8: How do users know their current status?
**Simple answer:**
Through the Check My Status page, which shows quote progress, payment state, countdown/deadline, admin updates, and notifications.

### Q9: What makes your system better than manual processing?
**Simple answer:**
It centralizes records, automates status transitions, reduces errors, gives transparency to customers, and improves admin decision-making with dashboard metrics.

### Q10: What are limitations and future improvements?
**Simple answer:**
Possible improvements include richer analytics, SMS notifications, automatic installer assignment, and deeper forecasting/reporting.

---

## 13. CONCLUSION

This system digitizes the full customer journey for a glass and aluminum business:
- Quote request
- Admin review and approval
- Payment handling
- Reservation and installation scheduling

It is useful because it improves:
- Speed
- Accuracy
- Transparency
- Coordination between customers and admins

For defense, remember this one-line summary:

**“Our system transforms manual quotation and scheduling into a secure, trackable, and rule-based online workflow from request to installation.”**

---

## Additional Reviewer Notes (Information You May Have Forgotten)

### A. Quick glossary (easy terms)
- **Quote**: estimated project cost request
- **Approval**: admin decision that allows payment stage
- **Payment proof**: uploaded evidence for QRPH payment
- **Reservation**: preferred installation date record
- **Queue**: list of approved paid jobs waiting/ready for installation
- **Realtime update**: screen updates when database data changes

### B. One-minute memorization script
Use this script if asked to explain your system quickly:

1. Customer logs in and submits a quote with project details and preferred date.
2. Admin reviews then approves or rejects.
3. If approved, customer pays (QRPH/cash).
4. Admin verifies payment.
5. Paid quotes move to installation queue with locked reservation.
6. Deadlines and validation rules protect data quality and schedule integrity.

### C. Typical status progression to memorize
- Quote: `pending` -> `approved` (or `rejected`) -> `cancelled/expired` (if unpaid) -> operational flow
- Payment: `waiting_approval` -> `paid` or `expired`
- Reservation: `pending` -> `approved`/`rejected`/`expired`

### D. Common defense mistakes to avoid
- Do not say frontend validation is enough. Backend validation is the real enforcement.
- Do not say payment upload means paid. Only admin verification sets paid.
- Do not forget the 3-day rule and one-reservation-per-day rule.
- Do not forget that quote approval is required before payment stage.

### E. Suggested live demo sequence for defense
1. Register/login as customer
2. Submit quote
3. Login as admin, approve quote
4. Return as customer, upload payment proof
5. Admin verifies payment
6. Show installation queue entry and status updates

This gives panel members a complete end-to-end understanding.
