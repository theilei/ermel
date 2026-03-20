-- ============================================================
-- Migration 009: Enforce users.role as ENUM ('admin','customer')
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'customer');
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    UPDATE users
    SET role = 'customer'
    WHERE role IS NULL OR role NOT IN ('admin', 'customer');

    ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
        AND udt_name <> 'user_role'
    ) THEN
      ALTER TABLE users
      ALTER COLUMN role TYPE user_role
      USING CASE
        WHEN role = 'admin' THEN 'admin'::user_role
        ELSE 'customer'::user_role
      END;
    END IF;

    ALTER TABLE users
      ALTER COLUMN role SET DEFAULT 'customer'::user_role,
      ALTER COLUMN role SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  END IF;
END
$$;
