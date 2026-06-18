# Diseño — CRM rico en Node, Fase 2: Visitas + líneas de Quotes

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** CRM Fase 1 (`crm.*` + motor genérico `crmHub`). Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

Extiende la ingesta de CRM (Fase 1: 8 módulos en `crm.*`) con dos piezas que el usuario confirmó como valiosas y no
duplicadas: el módulo **Visitas** (`crm.visits`) y el **detalle de líneas de Quotes** (`crm.quote_line_items`).

**Alcance (confirmado):** solo Visits + líneas de Quotes. NO Accounts/Contacts (solapan Desk/Books), NO custom
Facturas/Presupuestos/Órdenes (duplican Books/Quotes).

**Hallazgo verificado (define el diseño de líneas):** en Zoho CRM v8 el subform `Quoted_Items` **NO viene en el listado
bulk** (`getRecords?fields=Quoted_Items` devuelve solo `id`); **sí viene en el detalle** `GET /Quotes/{id}`. Por tanto las
líneas requieren **fetch de detalle por quote** (patrón N+1, espejo de booksHub salesorders/invoices), no se sacan del raw
del bulk.

## Pieza A — Visitas (`crm.visits`): un módulo más

Es un módulo estándar normal → **un descriptor nuevo en `MODULES`** + tabla `crm.visits`. El motor genérico
(`backfillAll`/`syncRecent` que iteran `MODULES`) lo ingesta sin cambios al engine. Columnas clave (de `getFields(Visits)`;
módulo sin custom fields):
- `visited_by_id`/`visited_by_name`/`visited_by_module` (Visited_By, multi_module_lookup → id/name + módulo apuntado),
  `visited_time`(ts), `visited_page`, `visited_page_url`, `referrer`, `visit_source`, `visitor_type`, `time_spent`(num),
  `no_of_pages`(num), `revenue`(num), `search_keyword`, `search_engine`, `attended_by`(text plano), `last_activity_time`(ts),
  `created_time`(ts), `raw`, `modified_time`, `synced_at`. PK `id`.
- `fields` (CSV) = esos api_names + `Modified_Time`.

## Pieza B — Líneas de Quotes (`crm.quote_line_items`) vía detalle

**Tabla `crm.quote_line_items`:** `id text PRIMARY KEY` (id de la línea), `quote_id text` (Parent_Id → Quotes),
`product_id`/`product_name` (Product_Name lookup), `description`, `quantity`(num), `list_price`(num), `total`(num),
`discount`(num), `total_after_discount`(num), `tax`(num), `net_total`(num), `sequence_number`(num),
`price_book_id`/`price_book_name` (Price_Book_Name lookup), `line_tax jsonb` (Line_Tax), `raw jsonb`,
`synced_at timestamptz DEFAULT now()`. (Ojo naming Zoho: `Net_Total` tiene label "Total"; `Total` label "Importe" — mapear
por api_name.)

**Extensión mínima del engine:** el descriptor `CrmModule` gana un hook opcional
`childrenDetail?: (crmFetch, db, record) => Promise<void>`. En `forEachSafe`, tras `upsertRow(db, m.table, m.toRow(r))`,
si `m.childrenDetail` existe se llama (dentro del mismo try → un fallo de detalle de un registro queda aislado).

**Quotes descriptor** gana `childrenDetail = quoteLinesDetail`, que: `GET /crm/v8/Quotes/{record.id}` → lee
`d.Quoted_Items ?? []` → `replaceQuoteLines(db, record.id, lines.map(quoteLineRow(quoteId, ·)))`.
- `repo.replaceQuoteLines(db, quoteId, lines)`: `DELETE FROM crm.quote_line_items WHERE quote_id=$1` + insert de cada línea
  (vía un `upsertChildRow` genérico o INSERT directo; reutiliza el patrón de `upsertRow`).
- `quoteLineRow(quoteId, raw)` en `modules.ts`: extrae las columnas de arriba; `quote_id`=quoteId; lookups id/name;
  `line_tax`=J(raw.Line_Tax); `raw`=J(raw).
- El `fields` del bulk de Quotes **no cambia** (el bulk no trae el subform); el detalle `GET /{id}` trae el registro completo.

**Costo:** backfill one-time ≈ 2.872 detalles (secuencial, resiliente; Books hizo ~2.327 sin problema). Incremental: solo
los quotes que cambian disparan su detalle (barato).

## Bootstrap: backfill de lo nuevo

El gate actual ("backfill si `crm.deals` vacío") ya no dispara. Cambio a **backfill por-módulo-si-vacío**: en `hubBootstrap`,
iterar `MODULES` y backfillear cada uno cuya tabla esté vacía (`maxModifiedTime(db, m.table) == null`). Así:
- `crm.visits` (nueva, vacía) se backfillea sola; los demás módulos (poblados) se saltan. Futuro-proof.
- **Líneas de quotes (one-time):** como `crm.quotes` ya está poblado, no se re-backfillea solo. Runbook: `TRUNCATE crm.quotes;
  TRUNCATE crm.quote_line_items;` antes del redeploy → el gate ve `crm.quotes` vacío → re-backfillea Quotes, y ahora el
  `childrenDetail` escribe las líneas. En adelante el incremental mantiene líneas frescas.

(El `backfillModule` de Quotes ya invoca `childrenDetail` por registro, así que el re-backfill puebla las líneas.)

## Cableado

Ningún cableado nuevo en el worker: Visits y las líneas viajan en el `crmSync` existente (Visits como módulo más; líneas
vía el hook de Quotes). Solo cambia el `hubBootstrap` (gate per-módulo). `migrateCrm` crea las 2 tablas nuevas.

## Pruebas (TDD, pg-mem)

- `migrateCrm` crea `crm.visits` y `crm.quote_line_items` (consultando cada una).
- `modules`: `visits.toRow` (lookup multi-módulo, campos clave); `quoteLineRow` (lookups id/name, line_tax jsonb, quote_id).
- `repo.replaceQuoteLines`: borra previas + inserta nuevas (idempotente).
- `sync`: el `childrenDetail` de Quotes hace `GET /Quotes/{id}` (crmFetch mockeado) y persiste líneas; un fallo de detalle
  no aborta el lote; `backfillModule` de Visits persiste por bulk; bootstrap per-módulo-si-vacío backfillea solo los vacíos.
- Verificación estándar: `npm test`, `tsc -b`, `tsc server`, `eslint`, `vite build`.

## Despliegue

1. Push → redeploy del worker. Al arrancar, `migrateCrm` crea `crm.visits`/`crm.quote_line_items`; el bootstrap per-módulo
   backfillea `crm.visits` (nueva). (Quotes no se re-backfillea aún → sus líneas vienen en el paso 2.)
2. **One-time líneas de Quotes:** en `zoho-hub` `TRUNCATE crm.quotes; TRUNCATE crm.quote_line_items;` → reiniciar el worker
   → re-backfill de Quotes con `childrenDetail` (≈2.872 detalles). 
3. Validar: `SELECT count(*) FROM crm.visits;`, `SELECT count(*) FROM crm.quote_line_items;`, y un join
   `crm.quotes`↔`crm.quote_line_items` por `quote_id`.

## Fuera de alcance

- Accounts/Contacts, módulos custom (Facturas/Presupuestos/Órdenes), réplica a desk-db, rotación de secretos.
