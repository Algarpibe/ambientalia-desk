# Diseño — Reorganización por esquemas, Fase 1: Zoho Desk → `desk.*` (vía search_path, toggle de prod)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** monorepo; `books.*` ya existe. Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

Hoy todas las tablas del dominio Desk + app viven en `public.*` (en **dos** bases: `desk-db` del app y `zoho-hub`).
`books.*` ya está separado (Zoho Books) y `crm.*` se reserva para el futuro. Meta: **cada producto Zoho en su propio
esquema**, atacándolo ahora que las apps aún no están en uso real (migración barata, sin datos críticos).

**Decisión global (confirmada):** Opción 3 (orden por producto + dedup de Books-lite) en **2 fases separadas**:
- **Fase 1 (ESTE spec):** mover las tablas Zoho Desk a `desk.*`. App-native y Books-lite se quedan en `public` por ahora.
- **Fase 2 (spec aparte):** dedup de Books-lite — reemplazar `public.clients`/`public.sales_orders` por **vistas** sobre
  `books.*`, replicar `books.contacts`/`books.sales_orders` a desk-db, apagar el sync lite.

## Hallazgo decisivo: límites de pg-mem (verificado)

| Capacidad | pg-mem 3.0.14 |
|---|---|
| `CREATE SCHEMA` + tablas calificadas `desk.x` | ✅ |
| `search_path` (resolver nombre pelado → `desk`) | ❌ |
| `ALTER TABLE … SET SCHEMA` (mover) | ❌ (error de parseo) |

**Implicación:** los dos mecanismos del reorg (resolver vía search_path, mover con SET SCHEMA) **no son testeables en
pg-mem**. Por tanto el reorg es una **operación de infraestructura de producción**, validada operativamente (como la
replicación SP2 y el cutover de Books), no por la suite. **La cobertura de lógica de queries se conserva** porque los
tests siguen corriendo contra `public` sin cambios.

## Enfoque elegido: R1 — `search_path` como toggle de producción

Como el código usa ~230 nombres de tabla **pelados** (0 `public.` hardcodeado, 0 search_path) y son **agnósticos de
esquema**, funcionan igual contra `public` (tests) que contra `desk` (prod vía search_path) **sin reescribirse**. El
layout `desk.*` se activa solo en prod con una env.

> **Alternativa R2 (anotada para el futuro, NO se hace ahora):** calificar las ~230 queries a `desk.*` (`FROM desk.tickets`).
> Ventaja: 100% testeable en pg-mem (tablas calificadas sí funcionan). Costo: churn enorme (~230 ediciones, decidir
> desk/public por query) + disciplina permanente (toda query nueva debe calificar). Se reconsideraría si algún día
> queremos cobertura automática total del layout o si pg-mem deja de ser el harness. Registrado en `debt.md`.

## Clasificación de tablas (Fase 1)

| Esquema | Tablas | Nota |
|---|---|---|
| **`desk.*`** | accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions, ticket_history, activities, equipos | Zoho Desk (+ equipos, dominio de servicio) |
| **`public.*`** (no se mueven) | users, sessions, roles, ticket_reads, resolution_attachments | App-native (auth/estado/archivos) |
| **`public.*`** (transitorio, dedup en Fase 2) | clients, sales_orders | Books-lite |
| **`books.*`** | (ya existe) | Sin cambios |

## Cambios de código

### `config.ts`
```ts
// interfaz AppConfig:
dbSchema: string
// loadConfig:
dbSchema: env.DB_SCHEMA || 'public',
```
Convención: `DB_SCHEMA=desk` activa el layout por esquemas (solo en prod). Sin la env → `public` (default = tests y
comportamiento actual).

### `packages/zoho-sync/src/db/pool.ts`
`createPool` añade el search_path **solo si** `dbSchema==='desk'` (lo usan app y worker contra desk-db/hub):
```ts
export function createPool(config: AppConfig): Pool {
  const opts = config.dbSchema === 'desk' ? { options: '-c search_path=desk,public' } : {}
  return new Pool({ connectionString: config.databaseUrl, ...opts })
}
```
`createPoolFromUrl` (pool de **sales-tracker**) queda **sin cambios** — esa BD tiene su propio esquema.

### `packages/zoho-sync/src/db/migrate.ts` — nueva `reorgToDesk(db)`
Función **prod-only** (se llama solo cuando `dbSchema==='desk'`), que corre **antes** de `migrate(db)`:
```ts
const DESK_TABLES = ['accounts','contacts','agents','tickets','conversations','attachments',
  'ticket_transitions','ticket_history','activities','equipos']

/** Mueve las tablas Zoho Desk de public→desk (idempotente). Prod-only; NO se ejecuta en tests (pg-mem no soporta SET SCHEMA). */
export async function reorgToDesk(db: Queryable): Promise<void> {
  await db.query('CREATE SCHEMA IF NOT EXISTS desk')
  for (const t of DESK_TABLES) {
    try { await db.query(`ALTER TABLE IF EXISTS public.${t} SET SCHEMA desk`) }
    catch (e) { console.error(`reorgToDesk: ${t} omitida:`, String(e)) }
  }
  try { await db.query('ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk') }
  catch (e) { console.error('reorgToDesk: ticket_number_seq omitida:', String(e)) }
}
```
Idempotente: `IF EXISTS` → en arranques posteriores `public.<t>` ya no existe → no-op. En BD fresca → no-op (migrate las
crea directo en desk vía search_path).

### `schema.sql`
- **Tablas Desk (10): se dejan PELADAS** (`CREATE TABLE IF NOT EXISTS tickets …`). En prod (search_path=desk) → se crean
  en `desk`; en tests (sin search_path, default public) → en `public`. Idem sus índices/`ALTER ADD COLUMN` (pelados).
- **App-native + Books-lite (7): se califican `public.<t>`** explícitas (`CREATE TABLE IF NOT EXISTS public.users …`),
  para que en prod (search_path=desk) **no** caigan en `desk`. En tests quedan en public igual.
- `ticket_number_seq`: pelada (→ desk en prod, public en tests).
- `ticket_transitions.id` (bigserial): su secuencia es propiedad de la tabla → se mueve con el `SET SCHEMA` de la tabla.

### Entrypoints (`apps/desk/server/index.ts`, `apps/hub-sync/src/hub-sync.ts`)
Antes de `migrate(pool)`:
```ts
if (config.dbSchema === 'desk') await reorgToDesk(pool)
await migrate(pool)
```
Orden crítico: `reorgToDesk` (mueve datos existentes) **antes** de `migrate` (que con search_path=desk crearía `desk.*`
vacías si las tablas aún estuvieran en public). Así en prod: mueve → migrate ve `desk.*` con datos → `CREATE IF NOT
EXISTS` no-op.

## Cutover de replicación (Fase 1: solo `activities`)

De las replicadas por SP2 (`activities`, `clients`, `sales_orders`), solo **`activities`** cambia de esquema (las lite se
quedan en `public`). `reorgToDesk` la mueve en ambas BDs (al arrancar app→desk-db y worker→hub, independientemente), así
que la replicación de `activities` puede pausar/errar hasta el refresh manual. Pasos (subscriptor primero):
1. Tras desplegar ambos servicios con `DB_SCHEMA=desk` (ya movieron `activities` a `desk` en cada BD).
2. Hub: `ALTER PUBLICATION zoho_ref_pub DROP TABLE activities; ALTER PUBLICATION zoho_ref_pub ADD TABLE desk.activities;`
   (o `DROP/CREATE PUBLICATION zoho_ref_pub FOR TABLE desk.activities, clients, sales_orders;`).
3. desk-db: `ALTER SUBSCRIPTION zoho_ref_sub REFRESH PUBLICATION;`.
4. `clients`/`sales_orders` **no se tocan** (siguen en public).
**Rollback:** `ALTER TABLE desk.activities SET SCHEMA public` en ambas + republicar; quitar `DB_SCHEMA` y redeploy.

## Pruebas (TDD, pg-mem)

- **Tests sin cambios funcionales:** `dbSchema` default `public` → `createPool` sin search_path, `reorgToDesk` **no se
  llama**, `schema.sql` crea todo en `public` (Desk peladas → public; app-native `public.` → public). Los repos con
  nombres pelados resuelven a `public`. **Toda la suite actual sigue verde.**
- **Tests nuevos (lógica testeable):**
  - `config`: `DB_SCHEMA=desk` → `dbSchema==='desk'`; ausente → `'public'`.
  - `createPool`: con `dbSchema==='desk'` el Pool recibe `options: '-c search_path=desk,public'`; sin él, no.
  - Guarda en entrypoint: `reorgToDesk` solo se invoca con `dbSchema==='desk'` (test de la condición, no del SQL).
- **NO testeable en pg-mem (validado en prod):** el SQL de `reorgToDesk` (SET SCHEMA) y la resolución search_path. Se
  validan con queries de verificación post-deploy + rollback (igual que SP2/Books).
- Verificación estándar: `npm test`, `tsc -b`, `tsc -p apps/desk/tsconfig.server.json --noEmit`, `eslint .`, `vite build`.

## Secuencia de despliegue (Fase 1)

1. **Deploy del código** (config `dbSchema`, `createPool` condicional, `reorgToDesk`, schema.sql, entrypoints) — **sin**
   `DB_SCHEMA` aún → comportamiento idéntico al actual (todo en public). Verifica que nada se rompe.
2. **Activar el toggle:** setear `DB_SCHEMA=desk` en `ambientalia-desk` (app) y `zoho-hub-sync` (worker) → **Redeploy**.
   Al arrancar, `reorgToDesk` mueve las 10 tablas a `desk.*` en cada BD y el search_path resuelve las queries.
3. **Cutover de replicación de `activities`** (manual, tras ambos deploys) + `REFRESH PUBLICATION`.
4. **Validar:** app lee `desk.*` (p. ej. `SELECT count(*) FROM desk.tickets`), worker sincroniza, `activities` replica,
   `clients`/`sales_orders` (public) replican sin cambios.

Separar el deploy del código (paso 1) del toggle (paso 2) permite confirmar que el código nuevo no rompe nada **antes**
de mover datos, y hace el rollback trivial (quitar la env).

## Fuera de alcance (Fase 1)

- **Fase 2** (dedup Books-lite vía vistas). **R2** (calificar queries) — anotada como deuda futura.
- Esquema `app.*` para app-native (se quedan en `public`). CRM → `crm.*` (subproyecto futuro).
- Rotación de secretos.
