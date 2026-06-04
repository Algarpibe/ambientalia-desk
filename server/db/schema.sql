CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY, name text NOT NULL, nit text, email text, phone text,
  website text, city text, address text, industry text,
  source text NOT NULL DEFAULT 'zoho', managed_by_app boolean NOT NULL DEFAULT false,
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS contacts (
  id text PRIMARY KEY, first_name text, last_name text, email text, phone text, mobile text,
  account_id text, source text NOT NULL DEFAULT 'zoho', managed_by_app boolean NOT NULL DEFAULT false,
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS agents (
  id text PRIMARY KEY, name text, email text, role text,
  source text NOT NULL DEFAULT 'zoho', raw jsonb,
  synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  number integer UNIQUE NOT NULL,
  subject text, status text NOT NULL, status_type text, priority text, classification text,
  channel text, description text,
  contact_id text, account_id text, assignee_id text,
  created_time timestamptz, modified_time timestamptz, closed_time timestamptz,
  onhold_time timestamptz, due_date timestamptz,
  codigo_servicio text, tipo_servicio text, equipo text, marca text, modelo text, serial text,
  codigo_interno text, encargado text, correo_encargado text, nit text, ciudad text, direccion text,
  telefono text, orden_venta text, conformidad text, dias_entrega integer,
  cumple_condiciones_comerciales boolean,
  fecha_creacion_ticket date, fecha_remision_entrada date, fecha_revision_informe date,
  fecha_cotizacion date, fecha_orden_compra date, fecha_orden_venta date,
  fecha_recepcion_repuestos date, fecha_finalizacion_st date, fecha_factura date,
  fecha_remision_salida date, fecha_salida_servicio_externo date, fecha_entrada_servicio_externo date,
  fecha_notificacion_garantia date, fecha_solicitud_sku date, fecha_orden_compra_final date,
  fecha_orden_venta_final date,
  equipo_partes_listas boolean, archivo_trazabilidad_actualizado boolean, doc_almacenada_drive boolean,
  hv_actualizada boolean, liberacion_sin_facturar boolean, servicio_in_situ boolean,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  managed_by_app boolean NOT NULL DEFAULT false, source text NOT NULL DEFAULT 'zoho',
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY, ticket_id text NOT NULL, kind text, author_name text, author_type text,
  is_public boolean, content text, content_type text, commented_time timestamptz,
  source text NOT NULL DEFAULT 'zoho', raw jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id text PRIMARY KEY, conversation_id text, ticket_id text NOT NULL,
  name text, size bigint, content_type text, zoho_href text, storage_path text,
  raw jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_transitions (
  id bigserial PRIMARY KEY, ticket_id text NOT NULL, transition_id text, transition_name text,
  from_status text, to_status text, area text, performed_by text, values jsonb,
  comment_id text, performed_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE INDEX IF NOT EXISTS idx_tickets_status_type ON tickets (status_type);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_account ON tickets (account_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets (contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_modified ON tickets (modified_time);
CREATE INDEX IF NOT EXISTS idx_conversations_ticket ON conversations (ticket_id);
CREATE INDEX IF NOT EXISTS idx_transitions_ticket ON ticket_transitions (ticket_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts (account_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments (ticket_id);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
