# Ermel System Data Flow Diagram (DFD)

This document is written in simple language for capstone presentation.

## 1) Context Level Diagram (Level 0)

```mermaid
flowchart LR
    C[Customer]
    A[Admin]
    E[Email Service]

    S((Ermel Service Reservation and Quotation System))

    C -->|register and login details\nquote request\nreservation date\npayment proof\nstatus request| S
    S -->|account result\nquote number\nquote updates\nstatus and receipts\nnotifications| C

    A -->|approve or reject quote\napprove or reject reservation\nupdate order status\napprove payment\nmanage user role| S
    S -->|dashboard data\npending tasks\nreports and logs| A

    S -->|verification email\nquote submission email\nother notices| E
    E -->|delivery status| S
```

## 2) Logical Level Diagram (Level 1)

```mermaid
flowchart TB
    C[Customer]
    A[Admin]
    E[Email Service]

    P1((1.0 Account and Access))
    P2((2.0 Quote and Reservation))
    P3((3.0 Quote Review and Order Setup))
    P4((4.0 Payment Processing))
    P5((5.0 Notifications and Analytics))
    P6((6.0 Status Tracking and Documents))

    D1[(D1 Users and Sessions)]
    D2[(D2 Verification and Reset Tokens)]
    D3[(D3 Quotes)]
    D4[(D4 Reservations)]
    D5[(D5 Orders)]
    D6[(D6 Payments and Proof Files)]
    D7[(D7 Notifications and Activity Logs)]
    D8[(D8 Analytics and System Logs)]

    C -->|register login reset password| P1
    P1 -->|account state and access result| C
    P1 <--> D1
    P1 <--> D2
    P1 -->|verification message| E

    C -->|quote form and preferred date| P2
    P2 -->|quote number or validation errors| C
    P2 <--> D3
    P2 <--> D4
    P2 --> P5

    A -->|approve reject update convert| P3
    P3 -->|admin action results| A
    P3 <--> D3
    P3 <--> D5
    P3 --> P5

    C -->|payment method and proof| P4
    A -->|approve or reject payment| P4
    P4 -->|receipt and payment status| C
    P4 -->|payment queue and status| A
    P4 <--> D6
    P4 --> P5

    C -->|check status request| P6
    P6 -->|quote status updates and PDF| C
    P6 <--> D3
    P6 <--> D5
    P6 <--> D6

    P5 <--> D7
    P5 <--> D8
    P5 -->|admin alerts| A
    P5 -->|customer alerts| C
    P5 -->|email notifications| E
```

## 3) Logical Child Diagrams (Level 2)

This section expands all major Level 1 processes.

### 3.1 Child Diagram for 1.0 Account and Access

```mermaid
flowchart TB
    C[Customer]
    E[Email Service]

    P11((1.1 Register Account))
    P12((1.2 Login and Session Start))
    P13((1.3 Verify Email Token))
    P14((1.4 Forgot and Reset Password))
    P15((1.5 Return Access Result))

    D1[(D1 Users and Sessions)]
    D2[(D2 Verification and Reset Tokens)]
    D7[(D7 Activity Logs)]

    C -->|registration details| P11
    P11 <--> D1
    P11 <--> D2
    P11 -->|verification email| E

    C -->|login details| P12
    P12 <--> D1
    P12 <--> D7
    P12 --> P15

    C -->|email verification token| P13
    P13 <--> D2
    P13 <--> D1
    P13 --> P15

    C -->|forgot or reset request| P14
    P14 <--> D2
    P14 <--> D1
    P14 --> P15

    P15 -->|login status and access state| C
```

### 3.2 Child Diagram for 2.0 Quote and Reservation

```mermaid
flowchart TB
    C[Customer]
    A[Admin]

    P21((2.1 Check Access and Verification))
    P22((2.2 Validate Form Inputs))
    P23((2.3 Compute Area and Estimated Cost))
    P24((2.4 Save Quote Record))
    P25((2.5 Check Reservation Date Availability))
    P26((2.6 Save Reservation))
    P27((2.7 Send Notifications and Tracking Events))
    P28((2.8 Return Final Result))

    D1[(D1 Users and Sessions)]
    D3[(D3 Quotes)]
    D4[(D4 Reservations)]
    D7[(D7 Notifications and Activity Logs)]
    D8[(D8 Analytics and System Logs)]

    C -->|quote details and selected date| P21
    P21 <--> D1
    P21 --> P22

    P22 -->|invalid data| P28
    P22 -->|valid data| P23

    P23 --> P24
    P24 <--> D3
    P24 --> P25

    P25 <--> D4
    P25 -->|date conflict| P28
    P25 -->|date available| P26

    P26 <--> D4
    P26 --> P27

    P27 <--> D7
    P27 <--> D8
    P27 -->|new quote alert| A
    P27 --> P28

    P28 -->|quote number or error message| C
```

### 3.3 Child Diagram for 3.0 Quote Review and Order Setup

```mermaid
flowchart TB
    A[Admin]
    C[Customer]

    P31((3.1 View Submitted Quotes))
    P32((3.2 Update Quote and Add Notes))
    P33((3.3 Approve or Reject Quote))
    P34((3.4 Convert Approved Quote to Order))
    P35((3.5 Update Reservation Decision))

    D3[(D3 Quotes)]
    D4[(D4 Reservations)]
    D5[(D5 Orders)]
    D7[(D7 Notifications and Activity Logs)]

    A -->|review request| P31
    P31 <--> D3
    P31 --> P32

    A -->|quote updates| P32
    P32 <--> D3
    P32 <--> D7
    P32 --> P33

    A -->|approve or reject decision| P33
    P33 <--> D3
    P33 <--> D7
    P33 -->|decision update| C
    P33 --> P34
    P33 --> P35

    P34 <--> D5
    P34 <--> D7

    P35 <--> D4
    P35 <--> D7
```

### 3.4 Child Diagram for 4.0 Payment Processing

```mermaid
flowchart TB
    C[Customer]
    A[Admin]

    P41((4.1 Select Payment Method))
    P42((4.2 Upload Payment Proof))
    P43((4.3 Validate and Store Payment Record))
    P44((4.4 Admin Approve or Reject Payment))
    P45((4.5 Generate Receipt and Status Update))

    D3[(D3 Quotes)]
    D6[(D6 Payments and Proof Files)]
    D7[(D7 Notifications and Activity Logs)]

    C -->|selected method| P41
    P41 <--> D3
    P41 <--> D6
    P41 --> P42

    C -->|proof file| P42
    P42 <--> D6
    P42 --> P43

    P43 <--> D6
    P43 <--> D7
    P43 -->|waiting for review| A
    P43 --> P44

    A -->|approve or reject| P44
    P44 <--> D6
    P44 <--> D7
    P44 --> P45

    P45 -->|receipt or rejection message| C
```

### 3.5 Child Diagram for 5.0 Notifications and Analytics

```mermaid
flowchart TB
    C[Customer]
    A[Admin]
    E[Email Service]

    P51((5.1 Capture Trigger Event))
    P52((5.2 Build Notification Content))
    P53((5.3 Send In-App Notification))
    P54((5.4 Send Email Notification))
    P55((5.5 Store Analytics and Logs))

    D7[(D7 Notifications and Activity Logs)]
    D8[(D8 Analytics and System Logs)]

    P51 --> P52
    P52 --> P53
    P52 --> P54
    P52 --> P55

    P53 <--> D7
    P53 --> C
    P53 --> A

    P54 --> E
    E -->|delivery status| P55

    P55 <--> D8
    P55 <--> D7
```

### 3.6 Child Diagram for 6.0 Status Tracking and Documents

```mermaid
flowchart TB
    C[Customer]

    P61((6.1 Receive Status Request))
    P62((6.2 Read Quote Updates))
    P63((6.3 Read Order and Payment Status))
    P64((6.4 Build Timeline View))
    P65((6.5 Provide PDF and Receipt Download))

    D3[(D3 Quotes)]
    D5[(D5 Orders)]
    D6[(D6 Payments and Proof Files)]
    D7[(D7 Notifications and Activity Logs)]

    C -->|check status request| P61
    P61 --> P62
    P61 --> P63

    P62 <--> D3
    P62 <--> D7

    P63 <--> D5
    P63 <--> D6

    P62 --> P64
    P63 --> P64
    P64 --> P65

    P65 -->|status view, quote PDF, and receipt| C
```

## 4) Quick Presentation Checklist

- External entities: Customer, Admin, Email Service
- Core processes: Account, Quote and Reservation, Admin Review, Payment, Notifications and Analytics, Status Tracking
- Main data stores: users, tokens, quotes, reservations, orders, payments, notifications and logs, analytics logs
- Major outputs: quote number, reservation result, payment status, PDF, dashboard metrics
- Security controls shown in flows: session check, verified-email check, CSRF check, rate limit, input validation

## 5) Notes and Scope Decisions Used

- The child diagrams cover all major Level 1 processes so your panel can trace each part clearly.
- Payment is shown as customer proof upload and admin approval or rejection.
- Notifications and analytics are grouped in one process to keep the Level 1 view readable.