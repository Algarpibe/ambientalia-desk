CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.leads (
  id text PRIMARY KEY, company text, first_name text, last_name text, full_name text, email text, phone text, mobile text,
  lead_source text, lead_status text, industry text, city text, pais text, departamento text, cargo text,
  is_converted boolean, converted_deal_id text, converted_deal_name text, owner_id text, owner_name text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.deals (
  id text PRIMARY KEY, deal_name text, amount numeric, stage text, type text, probability numeric, closing_date date,
  expected_revenue numeric, next_step text, account_id text, account_name text, contact_id text, contact_name text,
  owner_id text, owner_name text, numero_ticket numeric, stage_modified_time timestamptz, created_time timestamptz,
  raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.tasks (
  id text PRIMARY KEY, subject text, status text, priority text, due_date date, closed_time timestamptz,
  who_id text, who_name text, what_id text, what_name text, owner_id text, owner_name text, description text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.events (
  id text PRIMARY KEY, event_title text, venue text, start_datetime timestamptz, end_datetime timestamptz, all_day boolean,
  who_id text, who_name text, what_id text, what_name text, owner_id text, owner_name text, meeting_venue text,
  meeting_provider text, description text, created_time timestamptz, raw jsonb, modified_time timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.calls (
  id text PRIMARY KEY, subject text, call_type text, call_purpose text, call_result text, call_start_time timestamptz,
  call_duration_seconds numeric, outgoing_call_status text, dialled_number text, who_id text, who_name text,
  what_id text, what_name text, owner_id text, owner_name text, created_time timestamptz, raw jsonb,
  modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.products (
  id text PRIMARY KEY, product_name text, product_code text, unit_price numeric, product_active boolean, manufacturer text,
  categoria text, posicion numeric, vendor_id text, vendor_name text, owner_id text, owner_name text, description text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.quotes (
  id text PRIMARY KEY, quote_number text, no_cotizacion text, subject text, quote_stage text, valid_till date,
  fecha_cotizacion date, sub_total numeric, tax numeric, discount numeric, grand_total numeric, deal_id text, deal_name text,
  account_id text, account_name text, contact_id text, contact_name text, owner_id text, owner_name text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.campaigns (
  id text PRIMARY KEY, campaign_name text, type text, status text, start_date date, end_date date, expected_revenue numeric,
  budgeted_cost numeric, actual_cost numeric, expected_response numeric, num_sent numeric, parent_campaign_id text,
  parent_campaign_name text, owner_id text, owner_name text, description text, created_time timestamptz, raw jsonb,
  modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
