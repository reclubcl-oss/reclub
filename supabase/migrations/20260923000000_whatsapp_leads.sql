-- Leads del Sistema de Clientes por WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  negocio     TEXT NOT NULL,
  rubro       TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  email       TEXT NOT NULL,
  presupuesto TEXT NOT NULL,
  mensaje     TEXT,
  status      TEXT NOT NULL DEFAULT 'nuevo',
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_leads_status_idx ON whatsapp_leads(status);
CREATE INDEX IF NOT EXISTS whatsapp_leads_created_at_idx ON whatsapp_leads(created_at DESC);
