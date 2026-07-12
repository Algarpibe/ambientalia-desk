CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.items (
  item_id text PRIMARY KEY, name text, category_id text, category_name text, status text,
  rate numeric, purchase_rate numeric, sku text,
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

CREATE TABLE IF NOT EXISTS books.customer_payments (
  payment_id text PRIMARY KEY, payment_number text, customer_id text, customer_name text,
  date date, payment_mode text, reference_number text, currency_code text, exchange_rate numeric,
  amount numeric, bcy_amount numeric, unused_amount numeric, bcy_unused_amount numeric,
  tax_amount_withheld numeric, payment_status text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.customer_payment_invoices (
  invoice_payment_id text PRIMARY KEY, payment_id text, invoice_id text, invoice_number text,
  amount_applied numeric, tax_amount_withheld numeric, total numeric, balance numeric,
  due_date date, apply_date date, raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.purchase_orders (
  purchaseorder_id text PRIMARY KEY, purchaseorder_number text, reference_number text,
  vendor_id text, vendor_name text, date date, delivery_date date,
  status text, order_status text, received_status text, billed_status text,
  currency_code text, exchange_rate numeric, total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.purchase_order_line_items (
  line_item_id text PRIMARY KEY, purchaseorder_id text, item_id text, sku text, name text,
  quantity numeric, quantity_received numeric, quantity_cancelled numeric, quantity_billed numeric,
  rate numeric, bcy_rate numeric, item_total numeric,
  raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_soli_so ON books.salesorder_line_items (salesorder_id);
CREATE INDEX IF NOT EXISTS idx_books_ili_inv ON books.invoice_line_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_books_cpi_payment ON books.customer_payment_invoices (payment_id);
CREATE INDEX IF NOT EXISTS idx_books_cpi_invnum ON books.customer_payment_invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_books_poli_po ON books.purchase_order_line_items (purchaseorder_id);
CREATE INDEX IF NOT EXISTS idx_books_poli_item ON books.purchase_order_line_items (item_id);
