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

CREATE TABLE IF NOT EXISTS public.ticket_reads (
  user_id text NOT NULL,
  ticket_id text NOT NULL,
  read_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, ticket_id)
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

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  role_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.sessions (
  token text PRIMARY KEY,
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id text;

CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.contacts (
  contact_id text PRIMARY KEY, contact_name text, company_name text, email text, nit text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.sales_orders (
  salesorder_id text PRIMARY KEY, salesorder_number text, reference_number text, date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

-- (El DROP de las TABLAS lite public.clients/sales_orders es one-time en el runbook de cutover, no aquí.)
CREATE OR REPLACE VIEW public.clients AS
  SELECT contact_id AS id, contact_name AS name, company_name, nit, email
  FROM books.contacts;

-- order_status va AL FINAL: CREATE OR REPLACE VIEW solo admite añadir columnas al final de la lista.
CREATE OR REPLACE VIEW public.sales_orders AS
  SELECT salesorder_id AS id, salesorder_number AS number, customer_id AS client_id,
         customer_name, date, total, status,
         COALESCE(raw->>'cf_n_ticket', raw->'custom_field_hash'->>'cf_n_ticket') AS ticket_number,
         raw->>'zcrm_potential_name' AS potential_name,
         raw->>'order_status' AS order_status
  FROM books.sales_orders;

-- → clients.id (Books), tickets creados en la app
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id text;
-- → sales_orders.id (Books)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS salesorder_id text;

CREATE TABLE IF NOT EXISTS equipos (
  id text PRIMARY KEY,
  serial text NOT NULL,
  marca text,
  modelo text,
  tipo text,
  cliente_nombre text,
  source text NOT NULL DEFAULT 'seed',
  active boolean NOT NULL DEFAULT true,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos (serial);
CREATE INDEX IF NOT EXISTS idx_equipos_cliente ON equipos (cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos (tipo);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS equipo_id text;

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS client_id text;

CREATE TABLE IF NOT EXISTS activities (
  id text PRIMARY KEY,
  ticket_id text,
  subject text,
  status text,
  status_type text,
  priority text,
  due_date timestamptz,
  created_time timestamptz,
  modified_time timestamptz,
  completed_time timestamptz,
  owner_id text,
  owner_name text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities (ticket_id);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_html text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_by text;

CREATE TABLE IF NOT EXISTS public.resolution_attachments (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  filename text,
  content_type text,
  content_b64 text NOT NULL,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_resolution_att_ticket ON resolution_attachments (ticket_id);

CREATE TABLE IF NOT EXISTS ticket_history (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  event_name text,
  event_time timestamptz,
  actor_name text,
  actor_type text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history (ticket_id);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS modified_time timestamptz;
