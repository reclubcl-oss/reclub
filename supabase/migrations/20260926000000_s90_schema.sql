-- Sistema 90: tablas del portal de clientes

CREATE TABLE IF NOT EXISTS s90_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('unico', 'cuotas')),
  payment_link TEXT,
  calendar_link TEXT,
  drive_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS s90_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS s90_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS s90_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES s90_clients(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS s90_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  ad_spend NUMERIC(10,2) DEFAULT 0,
  conversations INT DEFAULT 0,
  cost_per_conv NUMERIC(10,2) DEFAULT 0,
  patients_booked INT DEFAULT 0,
  reels_published INT DEFAULT 0,
  UNIQUE(client_id, month)
);

CREATE TABLE IF NOT EXISTS s90_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'entregado')),
  link TEXT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS s90_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  installment INT NOT NULL,
  amount NUMERIC(10,0) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'vencido')),
  due_date DATE,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS s90_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES s90_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
