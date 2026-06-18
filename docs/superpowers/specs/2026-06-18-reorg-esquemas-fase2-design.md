# Diseño — Reorg por esquemas, Fase 2: dedup Books-lite (vistas sobre `books.*`)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** Fase 1 (desk.* desplegado), Books rico (`books.*` poblado). Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

Tras la Fase 1, `public.clients` y `public.sales_orders` (modelo **lite** de Books, que consume Desk) son la última
duplicación: los mismos datos de Zoho Books ya viven, ricos, en `books.contacts`/`books.sales_orders`. La Fase 2 elimina
las tablas lite, reemplazándolas por **vistas read-only** sobre `books.*` → **fuente única** de Books, y apaga el sync
lite (`createBooksSync`), cerrando la doble sincronización de Books.

**Verificado:**
- El app **solo lee** `clients`/`sales_orders` (las únicas escrituras eran `upsertClient`/`upsertSalesOrder` del sync
  lite, que se elimina) → vistas read-only bastan.
- Columnas leídas (YAGNI, solo esas): `clients` = id, name, company_name, nit, email; `sales_orders` = id, number,
  client_id, customer_name, date, total, status, ticket_number, potential_name. Todas derivables de `books.*`.
- pg-mem **soporta** `CREATE VIEW` + `raw->>'...'` + `DROP TABLE IF EXISTS` (probado) → la Fase 2 es **testeable**.

## Las vistas

En `public` (drop-in donde estaban las tablas; resuelven a nombre pelado en tests y en prod vía search_path):
```sql
CREATE OR REPLACE VIEW public.clients AS
  SELECT contact_id AS id, contact_name AS name, company_name, nit, email
  FROM books.contacts;

CREATE OR REPLACE VIEW public.sales_orders AS
  SELECT salesorder_id AS id, salesorder_number AS number, customer_id AS client_id,
         customer_name, date, total, status,
         COALESCE(raw->>'cf_n_ticket', raw->'custom_field_hash'->>'cf_n_ticket') AS ticket_number,
         raw->>'zcrm_potential_name' AS potential_name
  FROM books.sales_orders;
```
`ticket_number` y `potential_name` desde `raw` (igual que hacía el mapper lite). `searchClients/getClient/searchSalesOrders/
getSalesOrder` (en `books/repo.ts`) y los joins (`LEFT JOIN clients cl ON t.client_id=cl.id` en `repo.ts`/`analisis.ts`)
quedan **sin cambios** — leen las vistas.

## `books.contacts`/`books.sales_orders` en desk-db (dónde se definen)

Las vistas necesitan esas 2 tablas en desk-db. Decisión: **mover su DDL al `schema.sql` base** (que corre en desk-db, hub
y tests); `schema-books.sql` (migrateBooks, worker) se queda con las otras 4 (items, invoices, salesorder_line_items,
invoice_line_items, sync_state). Cada tabla definida **una sola vez** (sin duplicación/drift):
- desk-db: base crea `CREATE SCHEMA books` + `books.contacts` + `books.sales_orders` (estructura) → destino de replicación
  + base de las vistas.
- hub: base crea esas 2; migrateBooks crea las otras 4 (corre tras `migrate` en `hubBootstrap`).
- tests: base las crea → vistas creables y consultables (vacías).

(El `schema.sql` base también incluye los `CREATE OR REPLACE VIEW` de arriba, tras las tablas `books.*`.)

## Eliminar el sync lite

- **Borrar** `createBooksSync` (`packages/zoho-sync/src/books/sync.ts`) + `upsertClient`/`upsertSalesOrder` (`books/repo.ts`).
  Conservar `searchClients/getClient/searchSalesOrders/getSalesOrder` + `maxLastModified` (siguen usados).
- **Quitar el cableado** de `createBooksSync` en `apps/desk/server/index.ts` y `apps/hub-sync/src/hub-sync.ts` (y el tipo
  `BooksSync` de `hubSync.ts`/su backfill-si-vacío de clients/sales_orders).
- Resultado: nada vuelve a escribir `public.clients`/`sales_orders`; `books.*` (poblado por `booksHub`) es la única fuente.

## Pruebas (TDD, pg-mem)

- `schema.sql` base crea `books.contacts`/`books.sales_orders` + las vistas → en tests existen (vacías).
- **Reescribir `books/repo.test.ts`:** insertar en `books.contacts`/`books.sales_orders` (con `raw` incluyendo
  `cf_n_ticket`) y verificar que `searchClients`/`getClient`/`searchSalesOrders`/`getSalesOrder` (que ahora leen las
  vistas) devuelven lo esperado, incl. `ticket_number` derivado de `raw`.
- Ajustar/eliminar tests de `books/sync.test.ts` (createBooksSync ya no existe) y de `hubSync.test.ts` (sin `booksSync`).
- Verificación estándar: `npm test`, `tsc -b`, `tsc server`, `eslint`, `vite build`.

## Cutover (runbook prod — lo delicado)

Secuencia (mirando Fase 1 como referencia; apps aún sin uso real → ventana de re-sync inocua):

1. **Deploy del código Fase 2.** `migrate` intentará `CREATE OR REPLACE VIEW public.clients` pero **fallará mientras
   exista la TABLA lite** (`clients is not a view`) → el runner tolerante lo loguea y sigue; el app **sigue leyendo las
   tablas lite** (createBooksSync ya no corre → quedan estáticas, inocuo). Base `schema.sql` crea la estructura
   `books.contacts`/`books.sales_orders` en desk-db (destino de replicación).
2. **Cutover de replicación** (en hub + desk-db):
   - Hub: `ALTER PUBLICATION zoho_ref_pub DROP TABLE clients, sales_orders;` + `ADD TABLE books.contacts, books.sales_orders;`
   - desk-db: `ALTER SUBSCRIPTION zoho_ref_sub REFRESH PUBLICATION;` → desk-db recibe `books.contacts`/`books.sales_orders`.
   - (`desk.activities` sigue replicando sin cambios.)
3. **Tabla→vista** (hub + desk-db): `DROP TABLE IF EXISTS public.clients; DROP TABLE IF EXISTS public.sales_orders;` luego
   crear las vistas (correr los `CREATE OR REPLACE VIEW` a mano, o reiniciar los servicios → `migrate` ya las crea sin la
   tabla en medio).
4. **Validar:** `SELECT * FROM clients LIMIT 1;` devuelve datos de `books.contacts`; el tablero, la búsqueda de
   clientes/OV y la creación de tickets funcionan; `searchSalesOrders` muestra `ticket_number`.

**Rollback:** revertir el commit (recrea las tablas lite + `createBooksSync`), recrear las tablas lite en prod
(`schema.sql` viejo), re-añadirlas a la publicación, quitar `books.contacts`/`sales_orders` de la suscripción. Detalle en
el plan.

## Fuera de alcance

- Replicar `books.*` completo a desk-db (solo las 2 que Desk consume).
- CRM → `crm.*`; rotación de secretos.
