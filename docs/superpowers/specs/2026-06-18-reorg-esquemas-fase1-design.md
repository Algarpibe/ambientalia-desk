# Diseño — Reorganización por esquemas, Fase 1: Zoho Desk → `desk.*` (vía search_path)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** monorepo; `books.*` ya existe (Books rico). Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

Hoy todas las tablas del dominio Desk + app viven en `public.*` (en **dos** bases: `desk-db` del app y el `zoho-hub`).
`books.*` ya está separado (Zoho Books) y `crm.*` se reserva para el futuro. La meta: **cada producto Zoho en su propio
esquema**, atacándolo ahora que las apps aún no están en uso real (migración barata, sin datos críticos acumulados).

**Decisión global (confirmada):** Opción 3 (orden por producto + dedup de Books-lite) en **2 fases separadas**, cada una
con su spec→plan→deploy y rollback:
- **Fase 1 (ESTE spec):** mover las tablas Zoho Desk a `desk.*` vía `search_path`. App-native y Books-lite se quedan en
  `public` por ahora.
- **Fase 2 (spec aparte, después):** dedup de Books-lite — reemplazar `public.clients`/`public.sales_orders` por **vistas**
  sobre `books.*`, replicar `books.contacts`/`books.sales_orders` a desk-db, apagar el sync lite.

**Mecanismo confirmado:** `search_path` por conexión (no global) → como el código **no califica esquema** (verificado:
0 `public.` hardcodeado en queries, 0 uso de search_path) y usa ~230 nombres pelados, fijar `search_path=desk,public`
hace que `tickets` resuelva a `desk.tickets` **sin reescribir queries**.

**Alcance: ambas BDs** (`desk-db` del app y `zoho-hub`), porque la replicación lógica nativa **mapea por nombre
calificado** (esquema.tabla) y obliga a paridad de esquema en publisher y subscriber.

## Clasificación de tablas (Fase 1)

| Esquema | Tablas | Nota |
|---|---|---|
| **`desk.*`** | accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions, ticket_history, activities, equipos | Zoho Desk (+ equipos, dominio de servicio del app) |
| **`public.*`** (sin mover) | users, sessions, roles, ticket_reads, resolution_attachments | App-native (auth/estado/archivos) — no es Zoho |
| **`public.*`** (sin mover, transitorio) | clients, sales_orders | Books-lite — se deduplican en Fase 2 |
| **`books.*`** | (ya existe) | Sin cambios en esta fase |

## Cambios de código

### `packages/zoho-sync/src/db/pool.ts`
`createPool(config)` añade el search_path (lo usan app `apps/desk/server/index.ts` y worker `apps/hub-sync/src/hub-sync.ts`,
ambos contra desk-db/hub):
```ts
export function createPool(config: AppConfig): Pool {
  return new Pool({ connectionString: config.databaseUrl, options: '-c search_path=desk,public' })
}
```
`createPoolFromUrl` (pool de **sales-tracker**) queda **sin cambios** — esa BD tiene su propio esquema y no debe heredar el
search_path de Desk.

### `packages/zoho-sync/src/db/schema.sql`
El runner `migrate()` (split por `;`, tolerante) corre en **cada arranque** en ambas BDs; ya contiene `ALTER … ADD COLUMN
IF NOT EXISTS` de migraciones previas, así que **hornear el move ahí es el patrón establecido** y hace el cambio
automático + idempotente en desk-db y hub, sin runbook manual para las tablas.

**Orden crítico: el `ALTER … SET SCHEMA` (mover datos) va ANTES del `CREATE TABLE IF NOT EXISTS` (asegurar)**, para no
crear tablas `desk.*` vacías sobre las que el `ALTER` fallaría. Estructura:
1. `CREATE SCHEMA IF NOT EXISTS desk;`
2. **Por cada tabla Desk (10):** `ALTER TABLE IF EXISTS public.<t> SET SCHEMA desk;` → luego `CREATE TABLE IF NOT EXISTS desk.<t> (...)`.
   - En BD existente: el `ALTER` mueve la tabla **con datos** a `desk`; el `CREATE IF NOT EXISTS` queda no-op.
   - En BD nueva: el `ALTER IF EXISTS` es no-op; el `CREATE` la crea en `desk`.
   - En arranques posteriores: `public.<t>` ya no existe → `ALTER IF EXISTS` no-op. **Idempotente.**
3. Secuencia standalone: `ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk;` → `CREATE SEQUENCE IF NOT EXISTS desk.ticket_number_seq;`.
4. `bigserial` de `ticket_transitions.id`: su secuencia es **propiedad de la tabla** → se mueve sola con el `SET SCHEMA` de la tabla.
5. Índices/`ALTER ADD COLUMN` de las tablas Desk se califican `desk.<tabla>`.
- App-native (`users`, `sessions`, `roles`, `ticket_reads`, `resolution_attachments`) y lite (`clients`, `sales_orders`)
  quedan **`public.<tabla>`** explícitas (no se mueven en Fase 1).

> **Excepción `activities` (replicada):** ver "Cutover de replicación". El `SET SCHEMA` de `activities` también se hornea
> en `schema.sql`, pero como migrate corre **independientemente** en desk-db (app) y hub (worker), su movimiento queda
> coordinado por el cutover de replicación (refresh) tras desplegar ambos servicios.

### Referencias a secuencias
`reseedTicketNumber`/`nextTicketNumber` usan `setval('ticket_number_seq')`/`nextval('ticket_number_seq')` **sin calificar**
→ resuelven por `search_path` a `desk.ticket_number_seq`. No requieren cambio. (Verificado: no hay `public.` hardcodeado.)

## Migración de datos (horneada en `migrate()`, ambas BDs)

Los `ALTER … SET SCHEMA` viven en `schema.sql` (ver arriba), así que el **deploy del código los aplica automáticamente** en
`desk-db` (al arrancar el app) y en `zoho-hub` (al arrancar el worker). `ALTER … SET SCHEMA` es una operación de catálogo
(no copia filas): mueve la tabla con datos, índices, constraints y secuencias propias. Las FKs son `text` sin constraint
cruzada → ningún `SET SCHEMA` rompe referencias. No hace falta runbook manual para las tablas (sí para la replicación de
`activities`, ver abajo).

## Cutover de replicación (Fase 1: solo `activities`)

De las tablas replicadas por SP2 (`activities` + `clients` + `sales_orders`), solo **`activities`** cambia de esquema
(las lite se quedan en `public`). Orden (regla DDL-drift: suscriptor primero):
1. **desk-db (suscriptor):** `ALTER TABLE public.activities SET SCHEMA desk;`
2. **hub (publisher):** `ALTER TABLE public.activities SET SCHEMA desk;`
3. Republicar: en hub `ALTER PUBLICATION zoho_ref_pub DROP TABLE activities; ALTER PUBLICATION zoho_ref_pub ADD TABLE desk.activities;` (o recrear). En desk-db `ALTER SUBSCRIPTION zoho_ref_sub REFRESH PUBLICATION;`. `clients`/`sales_orders` **no se tocan**.
4. **Rollback:** `SET SCHEMA public` en ambos + republicar `activities`.

(Si `ALTER PUBLICATION … SET SCHEMA`-aware no aplica limpio, fallback: `DROP/CREATE PUBLICATION zoho_ref_pub FOR TABLE
desk.activities, clients, sales_orders;` + `ALTER SUBSCRIPTION … REFRESH PUBLICATION;`.)

## Pruebas (TDD, pg-mem)

- `migrate` crea las tablas Desk en `desk.*` y las demás en `public.*` (verificable con `information_schema` filtrando, o
  consultando `desk.tickets`/`public.users` directo — pg-mem soporta esquemas, ya comprobado con `books`).
- Los repos siguen con nombres pelados → requieren que **pg-mem honre `search_path`**.
- **RIESGO A VERIFICAR EN LA PRIMERA TAREA (como hicimos con `CREATE SCHEMA`):** que pg-mem aplique `search_path` (vía
  `options` del pool o `SET search_path`). Si **no** lo soporta:
  - Fallback A: el helper de test ejecuta `await db.query('SET search_path=desk,public')` tras `migrate`.
  - Fallback B: si pg-mem ignora search_path por completo → es BLOCKER; replantear (p. ej. calificar en tests o un shim).
- Verificación estándar: `npm test`, `tsc -b`, `tsc -p apps/desk/tsconfig.server.json --noEmit`, `eslint .`, `vite build`.

## Secuencia de despliegue (Fase 1)

1. **Deploy del código** (schema.sql con los `ALTER SET SCHEMA` horneados + pool con `search_path=desk,public`). Al
   arrancar, `migrate()` mueve las tablas a `desk.*` en cada BD (app→desk-db, worker→hub) y las queries (nombres pelados)
   resuelven correctamente vía search_path: en `public` mientras no se han movido, en `desk` después — **sin ventana rota
   de datos** porque el move es atómico dentro del arranque y search_path cubre ambos esquemas.
2. **Cutover de replicación de `activities`** (manual, tras desplegar ambos servicios): confirmar que `desk.activities`
   existe en hub y desk-db, luego republicar (ver sección) + `REFRESH PUBLICATION`. Hasta este paso, la replicación de
   `activities` puede pausar/errar y **se recupera con el refresh** (apps aún no en uso real → impacto nulo).
3. **Validar:** app levanta y lee `desk.*` vía search_path; worker sincroniza; `activities` replica; `clients`/
   `sales_orders` (en `public`) siguen replicando sin cambios.

**Rollback:** revertir el deploy (schema.sql sin los SET SCHEMA) NO devuelve las tablas a `public` por sí solo; el rollback
de datos es manual: `ALTER TABLE desk.<t> SET SCHEMA public;` (+ `ALTER SEQUENCE`), y revertir la replicación de
`activities`. Documentado en el plan.

## Fuera de alcance (Fase 1)

- **Fase 2** (dedup Books-lite vía vistas, replicar `books.*` a desk-db) — spec propio.
- Esquema `app.*` para app-native (se quedan en `public`).
- CRM → `crm.*` (subproyecto futuro de ingesta CRM).
- Rotación de secretos (tarea operativa aparte).
