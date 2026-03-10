-- ============================================================
-- Migration 002: Quotation system with status workflow
-- ============================================================

-- New quotes table for the quotation approval workflow
CREATE TABLE IF NOT EXISTS quotation_quotes (
    id              VARCHAR(10) PRIMARY KEY,
    customer_name   VARCHAR(200) NOT NULL,
    customer_email  VARCHAR(200) NOT NULL,
    customer_phone  VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    project_type    VARCHAR(100) NOT NULL,
    glass_type      VARCHAR(100) NOT NULL,
    frame_material  VARCHAR(100) NOT NULL,
    width           NUMERIC(10,2) NOT NULL,
    height          NUMERIC(10,2) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    color           VARCHAR(50) NOT NULL,
    estimated_cost  NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rejection_reason TEXT,
    approved_date   DATE,
    expiry_date     DATE,
    accepted_date   DATE,
    declined_date   DATE,
    converted_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qq_status ON quotation_quotes(status);
CREATE INDEX IF NOT EXISTS idx_qq_customer_email ON quotation_quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_qq_submission_date ON quotation_quotes(submission_date);

-- Installation orders table
CREATE TABLE IF NOT EXISTS installation_orders (
    id                    VARCHAR(10) PRIMARY KEY,
    quote_id              VARCHAR(10) NOT NULL REFERENCES quotation_quotes(id),
    customer_name         VARCHAR(200) NOT NULL,
    project_type          VARCHAR(100) NOT NULL,
    dimensions            VARCHAR(100) NOT NULL,
    installation_status   VARCHAR(30) NOT NULL DEFAULT 'materials_ordered',
    order_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    installation_schedule DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_io_status ON installation_orders(installation_status);
CREATE INDEX IF NOT EXISTS idx_io_quote ON installation_orders(quote_id);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id          SERIAL PRIMARY KEY,
    event       VARCHAR(200) NOT NULL,
    quote_id    VARCHAR(10),
    order_id    VARCHAR(10),
    user_role   VARCHAR(20) NOT NULL,
    user_name   VARCHAR(100) NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_al_quote ON activity_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_al_order ON activity_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_al_created ON activity_logs(created_at);
