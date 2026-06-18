CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.contacts (
  contact_id text PRIMARY KEY, contact_name text, company_name text, email text, nit text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.items (
  item_id text PRIMARY KEY, name text, category_id text, category_name text, status text,
  rate numeric, purchase_rate numeric, sku text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.sales_orders (
  salesorder_id text PRIMARY KEY, salesorder_number text, reference_number text, date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.salesorder_line_items (
  line_item_id text PRIMARY KEY, salesorder_id text, item_id text, name text, quantity numeric,
  rate numeric, bcy_rate numeric, item_total numeric, tax_percentage numeric,
  raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.invoices (
  invoice_id text PRIMARY KEY, invoice_number text, reference_number text, date date, due_date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  salesorder_id text, raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.invoice_line_items (
  line_item_id text PRIMARY KEY, invoice_id text, item_id text, name text, quantity numeric,
  rate numeric, bcy_rate numeric, item_total numeric, tax_percentage numeric,
  raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_soli_so ON books.salesorder_line_items (salesorder_id);
CREATE INDEX IF NOT EXISTS idx_books_ili_inv ON books.invoice_line_items (invoice_id);
