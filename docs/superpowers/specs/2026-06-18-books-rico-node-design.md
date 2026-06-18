# Diseño — Books rico en Node + derivación `sales_records` (retiro de n8n Books)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** monorepo Etapa 1 (`packages/zoho-sync`), motor Books actual (`packages/zoho-sync/src/books`), worker `apps/hub-sync`. Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

`zoho-hub-sync` (Node) es el motor único de ingesta Zoho→hub. Hoy solo ingesta a nivel cabecera en `public.clients` y
`public.sales_orders` (para Desk). El esquema **rico** `books.*` del hub lo poblaba **n8n** (4 workflows de ingesta, ya
**despublicados** por el usuario) y de él n8n deriva `sales_records` para la app **sales-tracker** (workflow "Transform
to sales_records", scheduled diario 5am).

**Objetivo de este sub-proyecto:** que Node (a) ingeste el modelo rico de Books al esquema `books.*` del hub con
**paridad exacta** de columnas (para no romper consumidores) y (b) reemplace la derivación n8n `sales_records`,
**eliminando n8n del pipeline Books por completo**.

**Decisiones confirmadas (brainstorming):**
- Consumidor de los datos ricos: el **hub** como sistema de registro; cualquier app futura lo toma. No se replica a
  desk-db ni hay UI ahora.
- Alcance: **paridad con las 6 tablas de n8n** (contacts, items, sales_orders + líneas, invoices + líneas). Pagos/
  estimates/otros = fase futura (sin consumidor ni paridad pendiente → YAGNI).
- Node **toma posesión** de `books.*` (mismas tablas/columnas). `books.sync_state` (control de n8n) se deja intacto;
  Node usa su propia marca de agua `MAX(zoho_last_modified)` por tabla.
- La derivación `sales_records` se incluye **en este mismo sub-proyecto** y escribe a la **BD de sales-tracker**
  (Opción 1, paridad con n8n; no se toca el código de sales-tracker). Variante "escribir al hub" diferida.
- Enfoque A: módulo dedicado `booksHub/` espejo del `books/` existente, funciones pequeñas y testeables, aislado de la
  ruta de Desk.

## Esquema objetivo `books.*` (paridad exacta, verificado en el hub)

6 tablas de datos (filas actuales entre paréntesis). Tipos: `*_id` y textos = `text`; importes = `numeric`;
fechas = `date`; `raw` = `jsonb`; `zoho_last_modified`/`synced_at` = `timestamptz`.

- **contacts** (615): `contact_id` PK, `contact_name`, `company_name`, `email`, `nit`, `raw`, `zoho_last_modified`, `synced_at`
- **items** (1.425): `item_id` PK, `name`, `category_id`, `category_name`, `status`, `rate`, `purchase_rate`, `sku`, `raw`, `zoho_last_modified`, `synced_at`
- **sales_orders** (1.110): `salesorder_id` PK, `salesorder_number`, `reference_number`, `date`, `customer_id`, `customer_name`, `status`, `currency_code`, `exchange_rate`, `sub_total`, `total`, `bcy_sub_total`, `bcy_tax_total`, `bcy_total`, `raw`, `zoho_last_modified`, `synced_at`
- **salesorder_line_items** (3.269): `line_item_id` PK, `salesorder_id`, `item_id`, `name`, `quantity`, `rate`, `bcy_rate`, `item_total`, `tax_percentage`, `raw`, `synced_at`
- **invoices** (1.217): `invoice_id` PK, `invoice_number`, `reference_number`, `date`, `due_date`, `customer_id`, `customer_name`, `status`, `currency_code`, `exchange_rate`, `sub_total`, `total`, `bcy_sub_total`, `bcy_tax_total`, `bcy_total`, `salesorder_id`, `raw`, `zoho_last_modified`, `synced_at`
- **invoice_line_items** (3.384): `line_item_id` PK, `invoice_id`, `item_id`, `name`, `quantity`, `rate`, `bcy_rate`, `item_total`, `tax_percentage`, `raw`, `synced_at`

**Columnas críticas que consume la derivación** (deben rellenarse siempre, incluido `raw` completo):
`sales_orders`(salesorder_id, date, status, bcy_sub_total, raw→invoiced_status, raw→bcy_discount_total);
`salesorder_line_items`(salesorder_id, bcy_rate, quantity, item_id); `invoices`(invoice_id, salesorder_id, status,
date, bcy_sub_total, raw→bcy_discount_total); `invoice_line_items`(invoice_id, bcy_rate, quantity, item_id);
`items`(item_id, category_name). `contacts` no lo consume la derivación (se puebla por paridad/futuro).

**PKs:** `schema-books.sql` declara los PRIMARY KEY listados (necesarios para `ON CONFLICT`). Como las tablas ya
existen (n8n), el DDL es `CREATE TABLE IF NOT EXISTS` + un bloque que **añade el PK solo si no existe** (idempotente,
no destructivo). El plan incluye verificar en el hub si n8n ya creó esos PK.

## Parte A — Ingesta rica (`packages/zoho-sync/src/booksHub/`)

Estructura (espejo de `books/`):
```
booksHub/
  schema-books.sql   ← CREATE SCHEMA/TABLE IF NOT EXISTS books.* + PKs idempotentes
  migrate.ts         ← migrateBooks(db): aplica schema-books.sql (solo lo llama el worker)
  mappers.ts         ← 6 mappers raw Zoho → fila (raw = objeto completo; zoho_last_modified = last_modified_time)
  repo.ts            ← 6 upserts ON CONFLICT(pk) + maxLastModifiedBooks(db, tabla) + replaceLineItems
  sync.ts            ← createBooksHubSync(): backfill* + syncRecent()
  salesRecords.ts    ← (Parte B, ver abajo)
```

**Endpoints Zoho Books** (vía `booksFetch`, base `/books/v3`, con `organization_id`):
- Listas: `/contacts?contact_type=customer`, `/items`, `/salesorders`, `/invoices` (paginadas, `sort_column=last_modified_time&sort_order=D`).
- Detalle (para líneas): `GET /salesorders/{id}` → `{salesorder:{…,line_items}}`; `GET /invoices/{id}` → `{invoice:{…,line_items}}`.

**Mappers** (raw completo en `raw`):
- contacts ← lista: `contact_id, contact_name(=raw.contact_name), company_name(=raw.company_name), email, nit(cf_nit||custom_field_hash.cf_nit), raw, zoho_last_modified` (paridad literal con n8n; sin fallbacks inventados)
- items ← lista: `item_id, name, category_id, category_name, status, rate, purchase_rate, sku, raw, zoho_last_modified`
- sales_orders ← **detalle**: todas las columnas de la tabla; `raw` = objeto detalle (contiene `invoiced_status`, `bcy_discount_total`)
- salesorder_line_items ← `detalle.line_items`: `line_item_id, salesorder_id(=cabecera), item_id, name, quantity, rate, bcy_rate, item_total, tax_percentage, raw`
- invoices ← **detalle**: todas las columnas; `salesorder_id` desde `raw.salesorder_id` (puede ser ''/null); `raw` = detalle
- invoice_line_items ← `detalle.line_items`: análogo a salesorder_line_items con `invoice_id`

**Sync flow:**
- `backfillContacts()` / `backfillItems()`: páginas de lista → `persistEach`(upsert). Sin detalle.
- `backfillSalesOrders()` / `backfillInvoices()`: páginas de cabeceras → por cada una `GET /{id}` → upsert cabecera (raw=detalle) + `replaceLineItems` (DELETE líneas previas + insert nuevas).
- `incremental(entity)`: lista descendente por `last_modified_time` hasta `MAX(zoho_last_modified)` de esa tabla; para cada SO/factura cambiada, `GET /{id}` → upsert cabecera + replace líneas.
- **Resiliencia (Capa A del fix #954):** helper `persistEach` por-documento (try/catch + log + continúa) en todos los loops; un documento malo no aborta el ciclo.
- `syncRecent()` devuelve `{contacts, items, salesOrders, invoices}` (conteos para logs).

**Aislamiento:** no toca `books/` (sigue poblando `public.clients`/`public.sales_orders` para Desk), ni la ruta de
Desk, ni la réplica SP2. (Duplicación de "contacts" entre `public.contacts`-vía-Desk y `books.contacts`: ambas ahora
en Node; consolidar es trabajo futuro fuera de alcance.)

## Parte B — Derivación `sales_records` (`booksHub/salesRecords.ts`)

Reemplaza el workflow n8n "Transform to sales_records". **Dos conexiones**: lee `books.*` del **hub** (pool del worker);
escribe en **sales-tracker** (pool nuevo desde `SALES_TRACKER_DATABASE_URL`).

`deriveSalesRecords({ hub, salesTracker })`:
1. **Aggregate (hub)** — query SQL **copiada literal** del workflow (probada en prod):
```sql
WITH ord AS (
  SELECT s.salesorder_id, s.date, (s.raw->>'invoiced_status') st, sum(l.bcy_rate*l.quantity) gross
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  GROUP BY 1,2,3
),
oi AS (
  SELECT i.salesorder_id, sum(li.bcy_rate*li.quantity) inv
  FROM books.invoice_line_items li JOIN books.invoices i ON i.invoice_id=li.invoice_id
  WHERE i.salesorder_id IS NOT NULL AND i.salesorder_id<>'' AND li.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  GROUP BY 1
),
frac AS (
  SELECT o.salesorder_id, o.date,
    CASE WHEN o.st='not_invoiced' THEN 1
         WHEN o.st='partially_invoiced' AND o.gross>0 THEN greatest(0,(o.gross-coalesce(oi.inv,0))/o.gross)
         ELSE 0 END f
  FROM ord o LEFT JOIN oi ON oi.salesorder_id=o.salesorder_id
),
lines AS (
  SELECT it.category_name cat,'INVOICE' rt, extract(year from i.date)::int yy, extract(month from i.date)::int mm,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((i.raw->>'bcy_discount_total')::numeric,0)/NULLIF(i.bcy_sub_total,0),1) amt
  FROM books.invoice_line_items l JOIN books.invoices i ON i.invoice_id=l.invoice_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE i.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'SALES_ORDER', extract(year from s.date)::int, extract(month from s.date)::int,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((s.raw->>'bcy_discount_total')::numeric,0)/NULLIF(s.bcy_sub_total,0),1)
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'BACKLOG', extract(year from f.date)::int, extract(month from f.date)::int,
    l.bcy_rate*l.quantity * f.f
  FROM books.salesorder_line_items l JOIN frac f ON f.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE l.bcy_rate IS NOT NULL AND f.f > 0
)
SELECT cat AS category_name, rt AS record_type, mm AS record_month, yy AS record_year, round(sum(amt),2) AS amount_usd
FROM lines WHERE cat IS NOT NULL GROUP BY cat, rt, mm, yy;
```
2. **Escritura (sales-tracker), en UNA transacción** (mejora sobre n8n, que no era transaccional):
```sql
DELETE FROM sales_records WHERE record_year >= 2020;
-- por cada fila agregada:
INSERT INTO sales_records (company_id, category_id, record_type, amount_usd, record_month, record_year)
SELECT c.company_id, c.id, $1::record_type, $2::numeric, $3::int, $4::int
FROM categories c WHERE lower(c.name)=lower($5)
ON CONFLICT (company_id, category_id, record_type, record_month, record_year)
DO UPDATE SET amount_usd=EXCLUDED.amount_usd, updated_at=now();
```
(Parámetros: `record_type, amount_usd, record_month, record_year, category_name`. Si `category_name` no existe en
`categories`, no inserta — mismo comportamiento que n8n.)

**Cadencia:** diaria a `SALES_RECORDS_HOUR` (default 5), más una corrida al arranque del worker (verificación inmediata
tras deploy). No entra en el loop de 3 min.

**`record_type` enum** (sales-tracker): `SALES_ORDER`, `INVOICE`, `BACKLOG`. Único de `sales_records`:
`(company_id, category_id, record_type, record_month, record_year)`.

## Cableado (`apps/hub-sync`) y configuración

- `hubBootstrap`: además del bootstrap actual, llama `migrateBooks(db)` y backfill-si-vacío de las 6 tablas
  `booksHub` (en hub poblado, se salta → arranca incremental).
- `scheduleHubSync`: añade `booksHubSync.syncRecent()` al ciclo de `intervalMs` (3 min) y registra el job diario de
  `deriveSalesRecords`.
- **Flags (`config.ts`):** `SYNC_BOOKS_RICH` (default true si hay credenciales Books), `DERIVE_SALES_RECORDS`
  (default true si hay `SALES_TRACKER_DATABASE_URL`). Sin la URL, la derivación se desactiva sola y loguea.
- **Solo worker:** nada corre en `apps/desk`. `books.*` y la derivación viven solo en el worker/hub.
- **Env nuevas (deploy):** `SALES_TRACKER_DATABASE_URL` (requerida para la derivación), `SALES_RECORDS_HOUR` (opcional).
- **Pool sales-tracker:** segundo pool `pg` con la URL; cerrar en `stop()`.

## Pruebas (TDD, pg-mem)

- Mappers (6): raw Zoho → fila exacta, `raw` completo, `zoho_last_modified`.
- Upserts (6): `ON CONFLICT(pk) DO UPDATE` actualiza; `replaceLineItems` borra+inserta.
- Incremental: respeta marca de agua `MAX(zoho_last_modified)`; se detiene al alcanzar lo viejo.
- Líneas: `backfill/incremental` de SO/factura hace `GET /{id}` (booksFetch mockeado) y persiste líneas.
- Resiliencia: un documento que falla no aborta el lote (`persistEach`).
- Derivación: orquestación wipe→agregar→upsert **transaccional** con el agregado **mockeado** (filas de prueba) y
  mapeo vía `categories` (incluye caso "categoría inexistente → no inserta").
- **Límite honesto:** la query gigante de agregación usa SQL no soportado del todo por pg-mem (`extract`, `greatest`,
  `raw->>`, `NULLIF`, casts) → NO se testea a nivel SQL; se trata como copia literal del workflow probado y se valida
  **post-deploy** comparando contra la última salida de n8n.

## Despliegue / cutover / verificación

1. Deploy del worker con env nuevas (`SALES_TRACKER_DATABASE_URL`, opcional `SALES_RECORDS_HOUR`).
2. `migrateBooks` asegura esquema/PKs; Books-rico arranca incremental (books.* ya poblado → se pone al día barato).
3. Correr `deriveSalesRecords` una vez (al arranque) → comparar `sales_records` resultante con el estado actual
   (mismas filas/sumas que dejó n8n). Validar también que `Transform`-equivalente ya no es necesario.
4. Confirmado: archivar/eliminar el workflow n8n "Transform to sales_records" (la ingesta Books ya está despublicada).

## Fuera de alcance

- Pagos/estimates/otras entidades de Books (fase futura).
- Variante "escribir `sales_records` al hub y que sales-tracker lea de ahí" (Opción 2, requiere tocar sales-tracker).
- Consolidar `public.contacts`/`public.clients` con `books.contacts` (duplicación actual aceptada).
- Replicar `books.*` a desk-db / UI en Desk.
- Rotación de secretos (incluida la contraseña de sales-tracker-db, ahora expuesta) — pendiente operativo aparte.
