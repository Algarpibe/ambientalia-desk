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

-- Cargo y empresa del tecnico. Los pide el documento de remision, que hoy los saca de una hoja de Google
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS empresa text;

CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.contacts (
  contact_id text PRIMARY KEY, contact_name text, company_name text, email text, nit text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
-- Direccion y telefono salen de billing_address, que solo viene en el DETALLE del contacto. Los imprime el documento de remision
ALTER TABLE books.contacts ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE books.contacts ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE books.contacts ADD COLUMN IF NOT EXISTS departamento text;
ALTER TABLE books.contacts ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE books.contacts ADD COLUMN IF NOT EXISTS persona_contacto text;

CREATE TABLE IF NOT EXISTS books.sales_orders (
  salesorder_id text PRIMARY KEY, salesorder_number text, reference_number text, date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

-- (El DROP de las TABLAS lite public.clients/sales_orders es one-time en el runbook de cutover, no aquí.)
-- contact_type va AL FINAL: CREATE OR REPLACE VIEW solo admite añadir columnas al final de la lista.
CREATE OR REPLACE VIEW public.clients AS
  SELECT contact_id AS id, contact_name AS name, company_name, nit, email,
         raw->>'contact_type' AS contact_type,
         direccion, ciudad, departamento, telefono, persona_contacto
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

-- Checklist Incluye de las remisiones de entrada. El perfil sale de perfilChecklist(marca, modelo). Se siembra UNA vez desde el endpoint admin y nada la reescribe al arrancar. OJO, sin punto y coma en este comentario, que migrate parte el fichero por ese caracter
CREATE TABLE IF NOT EXISTS public.remision_checklist (
  id bigserial PRIMARY KEY,
  perfil text NOT NULL,
  item text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_remision_checklist_perfil ON remision_checklist (perfil);

-- Remisiones de servicio tecnico. `estado` refleja el resultado del flujo n8n, que llega por callback
-- pendiente al crearse, luego ok, ok_con_avisos (se genero pero fallo un aviso) o error
CREATE TABLE IF NOT EXISTS public.remisiones (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  tipo text NOT NULL DEFAULT 'entrada',
  fecha date NOT NULL,
  tipo_servicio text,
  perfil text,
  equipo_id text,
  serial text,
  incluye jsonb NOT NULL DEFAULT '[]'::jsonb,
  observaciones text,
  creado_por text,
  estado text NOT NULL DEFAULT 'pendiente',
  resultado jsonb,
  resuelto_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_remisiones_ticket ON remisiones (ticket_id);

-- Marca la reclamacion del envio (ver reclamarEnvio en db/remisiones.ts) para que un reintento tras perder cobertura no dispare un segundo documento
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS enviado_at timestamptz;

-- Fotos de la remision, en base64 sobre text igual que resolution_attachments
CREATE TABLE IF NOT EXISTS public.remision_fotos (
  id text PRIMARY KEY,
  remision_id text NOT NULL,
  filename text,
  content_type text,
  content_b64 text NOT NULL,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_remision_fotos_remision ON remision_fotos (remision_id);

-- El historico importado de la hoja de Google trae remisiones que no calzan con ningun ticket de Zoho: NULL es un estado legitimo, no un dato que falta
ALTER TABLE remisiones ALTER COLUMN ticket_id DROP NOT NULL;

-- Empresa y persona de contacto como texto libre: las trae el historico importado, las remisiones de la app aun no las piden
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS persona_contacto text;

-- Distingue lo que crea la app de lo importado de la hoja de Google (historico): una remision historica no tiene fotos ni carpeta de Drive, y la pantalla debe poder tratarla distinto
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'app';

-- Anular en vez de borrar: el documento y el PDF pueden ya existir en Drive y haberse mandado a un cliente, asi que borrar la fila dejaria ese documento sin nada que lo explique, y anular es lo unico que se puede deshacer de un clic equivocado. NULL en anulada_at es una remision vigente
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS anulada_at timestamptz;
ALTER TABLE remisiones ADD COLUMN IF NOT EXISTS anulada_por text;

-- Backfill de las historicas ya importadas: entraron sin created_at, asi que se quedaron con el now() del dia de la importacion. Los dos paneles del ticket (historia y conversaciones) ordenan por esa columna, y como las transiciones si llevan su fecha buena, una remision de 2025 aterrizaba arriba del todo: un ticket cerrado hace meses abria diciendo "El equipo ingresa para Calibracion" como si fuera lo ultimo que paso. La fecha de servicio es la buena, que es lo que ya hacia listRemisionesListado ordenando por fecha antes que por created_at. Se ancla a las 12:00 y no a medianoche porque la columna es timestamptz y el panel formatea en America/Bogota: un date convertido a pelo se pinta como el dia ANTERIOR a las 19:00. Solo toca origen='historico' - en las de la app created_at lleva hora y es el registro fiel - y la condicion del WHERE lo deja en no-op a partir de la segunda pasada, en vez de reescribir 149 filas en cada arranque
UPDATE remisiones SET created_at = fecha::timestamp + interval '12 hours' WHERE origen = 'historico' AND created_at <> (fecha::timestamp + interval '12 hours')::timestamptz;

-- Catalogo maestro de equipos. Antes las listas de marca/modelo/tipo se derivaban de la propia tabla equipos con un SELECT DISTINCT, de modo que un equipo mal registrado se convertia en una opcion oficial para todos los siguientes y la suciedad se realimentaba
CREATE TABLE IF NOT EXISTS public.catalogo_tipos (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalogo_marcas (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- tipo_id admite NULL a proposito: un modelo cuyos equipos no declaran tipo entra sin el y marcado para revisar, que es un dato honesto en vez de una invencion
-- El UNIQUE (marca_id, nombre) es la red de seguridad de la base: el repo comprueba duplicados antes de insertar para dar un 409 entendible, pero esta tabla es la que existe para acabar con los duplicados y no puede depender solo de esa comprobacion previa
CREATE TABLE IF NOT EXISTS public.catalogo_modelos (
  id text PRIMARY KEY,
  marca_id text NOT NULL,
  nombre text NOT NULL,
  tipo_id text,
  revisar boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marca_id, nombre)
);
CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_marca ON catalogo_modelos (marca_id);
-- Borrar un tipo exige contar cuantos modelos lo usan, igual que marca_id
CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_tipo ON catalogo_modelos (tipo_id);

-- El equipo apunta a su modelo del catalogo. Las columnas de texto marca/modelo/tipo se conservan porque las leen la busqueda, la creacion de tickets, la hoja de vida y perfilChecklist: lo que cambia es que ahora las escribe el catalogo y nadie mas
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS modelo_id text;
-- Es la clave de union del catalogo: comprobar si un modelo esta en uso, contar conflictos
CREATE INDEX IF NOT EXISTS idx_equipos_modelo ON equipos (modelo_id);

-- Documentos de un modelo del catalogo: su foto de referencia, manuales, instructivos y guias. Cada fila es O un enlace -url- O un fichero subido -content_b64-, nunca las dos cosas ni ninguna: lo comprueba el repo y no el esquema, porque pg-mem trata los CHECK de forma desigual y una restriccion que solo existe en produccion da falsa seguridad en los tests
CREATE TABLE IF NOT EXISTS public.catalogo_documentos (
  id text PRIMARY KEY,
  modelo_id text NOT NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  url text,
  content_b64 text,
  content_type text,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_catalogo_documentos_modelo ON catalogo_documentos (modelo_id);

-- El SKU es del MODELO y no del equipo. Es una cadena que alguien teclea: con books.items ya en desk-db se puede reconciliar contra los articulos reales, pendiente de hacer
ALTER TABLE catalogo_modelos ADD COLUMN IF NOT EXISTS sku text;

-- books.items llega REPLICADA desde el hub por zoho_ref_pub, igual que books.contacts y books.sales_orders. La replicacion logica NO crea la tabla en el suscriptor: solo copia filas a una que ya exista, emparejando por nombre de columna
-- Por eso esta definicion debe ser IDENTICA a la de booksHub/schema-books.sql. Una columna que falte aqui es una columna que dejara de llegar en silencio
-- Y el orden de despliegue importa: este DDL va primero en los suscriptores y despues en el hub. Al reves, el apply del suscriptor se atasca (comprobado en el spike de replicacion)
-- Nadie en apps/desk escribe esta tabla: la puebla solo el worker contra el hub. Por eso es replicable sin el choque que dejo a books.contacts fuera en su momento
CREATE TABLE IF NOT EXISTS books.items (
  item_id text PRIMARY KEY, name text, category_id text, category_name text, status text,
  rate numeric, purchase_rate numeric, sku text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
