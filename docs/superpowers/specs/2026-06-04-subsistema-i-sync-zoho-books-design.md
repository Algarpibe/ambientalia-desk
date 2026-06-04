# Diseño — Subsistema I: Integración Zoho Books (sync de clientes + órdenes de venta)

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** programa "reemplazar Zoho Desk" / dar autonomía a la plataforma. **Prerrequisito de C**
(creación de tickets) y reutilizable por Remisiones (deuda) y reportería (G).
**Depende de:** A (Postgres tipado, `migrate` tolerante), H1 (sesiones, `requireAuth`).

## Objetivo

Traer a Postgres, **en solo lectura**, los **clientes** (con NIT, contacto) y las **órdenes de venta**
(número OV, cliente, estado, n° de ticket) desde **Zoho Books**, para que el formulario de creación de
tickets (C) pueda **elegir una OV** y autocompletar cliente + Orden de Venta. Incremental, tipo el sync de
Desk. **No se escribe en Books.**

## Hallazgos verificados (Zoho Books real, org `714421387` "Ambientalia S.A.S.")

- **Clientes** (`contacts`, `contact_type=customer`): `contact_id`, `contact_name`/`company_name`,
  `cf_nit` (NIT), persona de contacto (`first_name`/`last_name`, `email`, `phone`/`mobile`),
  `customer_sub_type`, `status`, `last_modified_time`. `get_contact` añade direcciones (no se usa en v1).
- **Órdenes de venta** (`salesorders`): `salesorder_id`, `salesorder_number` (p.ej. `OV-2026-119`),
  `customer_id`/`customer_name`, `date`, `total`, `currency_code`, `status` (open/invoiced/closed/…),
  **`cf_n_ticket`** (vincula la OV con el ticket, p.ej. `944`), `zcrm_potential_name` (a veces el Código
  Servicio: *"Corola - 0526 - MT_18A10077_EDM180D_260416"*), `salesperson_name`, `last_modified_time`.
- Ambos endpoints soportan paginación (`page`/`per_page`, `page_context.has_more_page`) y orden por
  `last_modified_time` (para incremental).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Qué se sincroniza | **Clientes** + **Órdenes de venta** (lo que C necesita) |
| Dirección | **Solo lectura** desde Books (no escribimos) |
| Dónde viven | **Tablas nuevas** `clients` y `sales_orders` (separadas de los `accounts`/`contacts` de Desk; unificar Desk↔Books = mejora futura) |
| Estrategia | Backfill + **refresco incremental** por marca de agua `last_modified_time` |
| Consumo en la app | `GET /api/clients?search=` y `GET /api/sales-orders?search=` (requieren sesión) |
| Credenciales | Propias de Books (`ZOHO_BOOKS_*`); se construye/prueba con **mocks**, sólo hacen falta al desplegar |

## Modelo de datos (Postgres)

```sql
CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY,                 -- Books contact_id
  name text NOT NULL,                  -- contact_name (razón social / nombre)
  company_name text,
  nit text,                            -- cf_nit
  email text,
  phone text,
  mobile text,
  contact_person text,                 -- first_name + last_name
  customer_sub_type text,              -- business | individual
  status text,                         -- active | inactive
  source text NOT NULL DEFAULT 'books',
  raw jsonb,
  last_modified_time timestamptz,      -- de Books (marca de agua incremental)
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id text PRIMARY KEY,                 -- salesorder_id
  number text NOT NULL,                -- salesorder_number (OV-2026-xxx)
  client_id text,                      -- customer_id → clients.id
  customer_name text,
  date date,
  total numeric,
  currency_code text,
  status text,                         -- open | invoiced | closed | draft | void | overdue
  ticket_number text,                  -- cf_n_ticket (vínculo con ticket)
  potential_name text,                 -- zcrm_potential_name (a veces el Código Servicio)
  salesperson_name text,
  source text NOT NULL DEFAULT 'books',
  raw jsonb,
  last_modified_time timestamptz,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_client ON sales_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders (number);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);
```
Se añaden a `server/db/schema.sql` (idempotente, `CREATE ... IF NOT EXISTS`). No requiere recrear nada.

## Configuración (env)

Nuevos en `server/config.ts` (todos opcionales; si falta el refresh token, **el sync de Books queda
deshabilitado** y la app arranca igual):
- `ZOHO_BOOKS_CLIENT_ID`, `ZOHO_BOOKS_CLIENT_SECRET`, `ZOHO_BOOKS_REFRESH_TOKEN` (pueden reusar el mismo
  client app de Desk, pero el **refresh token debe tener scope de Books**: `ZohoBooks.contacts.READ` +
  `ZohoBooks.salesorders.READ`).
- `ZOHO_BOOKS_ORG_ID` (= `714421387`).
- `ZOHO_BOOKS_API_DOMAIN` (default `www.zohoapis.com`), `ZOHO_BOOKS_ACCOUNTS_DOMAIN` (default `accounts.zoho.com`).

## Backend

### Cliente HTTP de Books (`server/books/booksClient.ts`)
Análogo al de Desk (`tokenManager` + `zohoClient`) pero **separado**: refresca el access token (Books) y
hace `GET` contra `https://{apiDomain}/books/v3/...`. Reusa el patrón de reintento 401→refresh. Expone
`booksFetch(path, init?)`. Si no hay credenciales, no se crea (el sync se omite).

### Mappers (`server/books/mappers.ts`, puros, TDD)
- `clientFromBooks(raw)` → fila `clients` (nombre, nit desde `cf_nit`, email/phone/mobile, contacto =
  `first_name`+`last_name`, status, last_modified_time, raw).
- `salesOrderFromBooks(raw)` → fila `sales_orders` (number, client_id, customer_name, date, total,
  currency, status, ticket_number desde `cf_n_ticket`, potential_name, salesperson_name, last_modified_time, raw).

### Repo (`server/books/repo.ts`, pg-mem)
- `upsertClient(db, row)`, `upsertSalesOrder(db, row)` (ON CONFLICT id → update).
- `searchClients(db, q, limit=20)`: por `name`/`company_name`/`nit`, **case-insensitive** (`LOWER(col) LIKE LOWER($1)`; en el plan se decide ILIKE vs LOWER según soporte de pg-mem), activos primero.
- `searchSalesOrders(db, q, limit=20)`: por `number`/`customer_name`, **case-insensitive**, recientes primero.
- `getClient(db, id)`, `getSalesOrder(db, id)`.
- `maxLastModified(db, 'clients'|'sales_orders')`: marca de agua para el incremental.

### Sync (`server/books/sync.ts`)
`createBooksSync({ booksFetch, db, config })`:
- `backfillClients()` / `backfillSalesOrders()`: pagina (per_page 200, orden `last_modified_time` desc)
  y hace upsert de todo.
- `syncRecent()`: pagina **desc por `last_modified_time`** y **se detiene** al alcanzar registros con
  `last_modified_time <=` la marca de agua almacenada (incremental sin depender de un filtro específico).
- Tolerante a errores (un fallo de Books no tumba la app; se loguea).

### Arranque (`server/index.ts`)
Si hay credenciales de Books: crear `booksFetch` + `booksSync`; si las tablas están vacías, lanzar
backfill en segundo plano; `setInterval` para `booksSync.syncRecent()` (mismo intervalo que Desk o uno
propio). Si **no** hay credenciales, omitir todo (log informativo) — la app funciona igual.

### Endpoints de lectura (`server/app.ts`, requieren sesión)
- `GET /api/clients?search=texto` → `UserSearchClient[]` (id, name, nit, email). Límite 20.
- `GET /api/sales-orders?search=texto` → `SalesOrderLite[]` (id, number, clientId, customerName, date,
  total, status, ticketNumber, potentialName). Límite 20.
Ambas bajo `requireAuth` (son datos internos del negocio).

## Tipos compartidos (`shared/types.ts`)
- `ClientLite` (`{ id, name, nit?, email?, companyName? }`) y `SalesOrderLite`
  (`{ id, number, clientId?, customerName?, date?, total?, status?, ticketNumber?, potentialName? }`),
  para que el frontend de C los consuma en los selectores.

## Manejo de errores y seguridad
- Credenciales Books en env (como Desk). Endpoints de búsqueda bajo `requireAuth`.
- Sync tolerante (try/catch por página/entidad); un 429/500 de Books no rompe el arranque ni la app.
- Token de Books con refresh 401→retry; si el refresh falla, el sync se salta hasta el próximo ciclo.

## Pruebas
- **mappers** (puros): `clientFromBooks` (nit desde cf_nit, contacto compuesto), `salesOrderFromBooks`
  (ticket_number desde cf_n_ticket, número/cliente/estado).
- **repo** (pg-mem): upsert (insert+update), `searchClients`/`searchSalesOrders` (por nombre/nit/número),
  `maxLastModified`.
- **sync** (mock `booksFetch`): `backfillClients`/`backfillSalesOrders` paginan y hacen upsert;
  `syncRecent` se detiene en la marca de agua (no re-trae lo viejo).
- **endpoints** (supertest + pg-mem + sesión): `/api/clients?search=` y `/api/sales-orders?search=`
  devuelven coincidencias; **sin sesión → 401**.
- **config**: lee `ZOHO_BOOKS_*` (vacío por defecto → sync deshabilitado, sin romper).

## Fuera de alcance (futuro)
- **Escribir en Books** (es solo lectura).
- **Direcciones / personas de contacto completas** (`get_contact` por cliente) — enriquecer en una fase
  posterior o bajo demanda; C no lo necesita para crear.
- **Reconciliar `accounts` (Desk) ↔ `clients` (Books)** — unificar la fuente de clientes a futuro.
- **Facturas, ítems y otras entidades de Books.**
- **El formulario de creación (C)** y el amarre ticket↔OV — es el siguiente subsistema.
