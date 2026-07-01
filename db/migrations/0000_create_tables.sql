-- 0000_create_tables.sql
-- Vehicle Service Management System - schema
-- All tables use IF NOT EXISTS so migrations are safe to re-run.

CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(30),
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id              SERIAL PRIMARY KEY,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  make            VARCHAR(100) NOT NULL,
  model           VARCHAR(100) NOT NULL,
  year            INTEGER NOT NULL,
  license_plate   VARCHAR(30) UNIQUE NOT NULL,
  vin             VARCHAR(50) UNIQUE,
  color           VARCHAR(50),
  mileage         INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mechanics (
  id              SERIAL PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(30),
  specialization  VARCHAR(200),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_appointments (
  id               SERIAL PRIMARY KEY,
  vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  mechanic_id      INTEGER REFERENCES mechanics(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status           VARCHAR(30) NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  service_type     VARCHAR(200) NOT NULL,
  description      TEXT,
  estimated_hours  NUMERIC(5,2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_records (
  id             SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES service_appointments(id) ON DELETE CASCADE,
  mechanic_id    INTEGER REFERENCES mechanics(id) ON DELETE SET NULL,
  work_performed TEXT NOT NULL,
  parts_used     TEXT,
  labor_hours    NUMERIC(5,2) NOT NULL DEFAULT 0,
  parts_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost     NUMERIC(10,2) GENERATED ALWAYS AS (parts_cost + labor_cost) STORED,
  status         VARCHAR(30) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','in_progress','completed')),
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing (
  id             SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES service_appointments(id) ON DELETE CASCADE,
  customer_id    INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate       NUMERIC(5,4) NOT NULL DEFAULT 0.08,
  tax_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','partial','overdue')),
  payment_method VARCHAR(50),
  invoice_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on raw columns only (immutable - safe for CI pipeline)
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles (customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_id ON service_appointments (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON service_appointments (customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_mechanic_id ON service_appointments (mechanic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON service_appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON service_appointments (status);
CREATE INDEX IF NOT EXISTS idx_repair_records_appointment_id ON repair_records (appointment_id);
CREATE INDEX IF NOT EXISTS idx_billing_appointment_id ON billing (appointment_id);
CREATE INDEX IF NOT EXISTS idx_billing_customer_id ON billing (customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing (payment_status);
