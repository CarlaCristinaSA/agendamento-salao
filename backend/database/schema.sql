-- =============================================
-- SISTEMA DE AGENDAMENTO DE SALÃO DE BELEZA
-- UFC Quixadá - Engenharia de Software 2026
-- Schema do Banco de Dados PostgreSQL
-- =============================================

-- Extensão para UUID (opcional, mas útil)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------
-- TABELA: admins
-- -------------------------
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255)  NOT NULL,
  email      VARCHAR(255)  NOT NULL UNIQUE,
  phone      VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- -------------------------
-- TABELA: services (EP-001)
-- -------------------------
CREATE TABLE IF NOT EXISTS services (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255)   NOT NULL UNIQUE,
  duration_minutes  INTEGER        NOT NULL CHECK (duration_minutes > 0),
  price             NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  status            VARCHAR(10)    NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive')),
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- -------------------------
-- TABELA: business_hours (EP-002)
-- Suporta dia da semana (recorrente) ou data específica.
-- Specific_date tem prioridade sobre day_of_week na consulta de disponibilidade.
-- -------------------------
CREATE TABLE IF NOT EXISTS business_hours (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(20)  NOT NULL CHECK (type IN ('day_of_week', 'specific_date')),
  day_of_week   SMALLINT     CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  specific_date DATE,
  start_time    TIME         NOT NULL,
  end_time      TIME         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_type_fields CHECK (
    (type = 'day_of_week'   AND day_of_week   IS NOT NULL AND specific_date IS NULL) OR
    (type = 'specific_date' AND specific_date IS NOT NULL AND day_of_week   IS NULL)
  ),
  CONSTRAINT chk_time_order CHECK (end_time > start_time)
);

-- Índice para busca eficiente de horários por dia da semana
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week)
  WHERE type = 'day_of_week';

-- Índice para busca por data específica
CREATE INDEX IF NOT EXISTS idx_business_hours_date ON business_hours(specific_date)
  WHERE type = 'specific_date';

-- -------------------------
-- TABELA: appointments (EP-003, EP-005)
-- -------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id                 SERIAL PRIMARY KEY,
  client_name        VARCHAR(255)   NOT NULL,
  client_email       VARCHAR(255),
  client_phone       VARCHAR(30)    NOT NULL,
  service_id         INTEGER        NOT NULL REFERENCES services(id),
  appointment_date   DATE           NOT NULL,
  appointment_time   TIME           NOT NULL,
  status             VARCHAR(20)    NOT NULL DEFAULT 'confirmed'
                       CHECK (status IN ('confirmed', 'cancelled')),
  created_by_admin   BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_appointments_date        ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status      ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id  ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- -------------------------
-- TABELA: token_blacklist
-- Lista negra de tokens JWT (logout)
-- -------------------------
CREATE TABLE IF NOT EXISTS token_blacklist (
  id         SERIAL PRIMARY KEY,
  token_jti  VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);

-- Limpeza automática de tokens expirados (executar via cron se necessário)
-- DELETE FROM token_blacklist WHERE expires_at < NOW();

-- -------------------------
-- FUNÇÃO: atualizar updated_at automaticamente
-- -------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_admins      ON admins;
DROP TRIGGER IF EXISTS set_updated_at_services    ON services;
DROP TRIGGER IF EXISTS set_updated_at_business    ON business_hours;
DROP TRIGGER IF EXISTS set_updated_at_appointments ON appointments;

CREATE TRIGGER set_updated_at_admins
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_business
  BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
