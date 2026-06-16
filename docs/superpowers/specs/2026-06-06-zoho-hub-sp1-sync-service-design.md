# Diseño — SP1: servicio `zoho-hub-sync` (sync Zoho → hub)

**Fecha:** 2026-06-06
**Estado:** Aprobado para planificación
**Contexto:** Primer sub-proyecto de la migración a la Opción D (ver memoria `zoho-hub-arquitectura`). El hub
`zoho-hub-db` (instancia Postgres aparte, ya creada; spike de logical replication = GO) debe quedar **poblado y
autoactualizado** con los datos de Zoho, mediante un **servicio de sync propio**, sin tocar la Desk app en marcha.
**Depende de:** el motor de sync existente (`server/sync.ts`, `server/books/sync.ts`, `zohoClient`, `tokenManager`).

## Decisiones (confirmadas)
- **Dónde corre:** servicio **aparte** en EasyPanel, desde **el mismo repo** (nuevo entrypoint, sin Express/SPA),
  `DATABASE_URL` → hub. Reusa el código de sync (cero duplicación); independiente de que la Desk app esté arriba.
- **Esquema del hub:** el hub-sync corre el **`schema.sql` completo** existente (crea las tablas Zoho que usa, y
  unas tablas de app vacías que quedan sin uso). La separación fina se hará en SP2. Riesgo casi nulo (no toca el
  `migrate` de la app).
- **Alcance:** Desk + Books (lo que ya se sincroniza). **CRM = futuro** (no hay código de sync de CRM aún).

## Contexto del repo (verificado)
- El server **corre con `tsx`**, no desde `dist/` (`start` = `cross-env NODE_ENV=production tsx server/index.ts`).
  → el hub-sync se ejecuta igual: `tsx server/hub-sync.ts`.
- `server/index.ts` ya contiene el patrón a reutilizar: `migrate(pool)` → `reseedTicketNumber` → backfill-si-vacío
  (`countTickets===0` → `sync.backfillTickets()` + `reseedTicketNumber`) → `sync.syncActivities()` /
  `sync.syncContacts()` iniciales → `setInterval(syncRecent→syncActivities→syncContacts, syncIntervalMs)` →
  Books: si `booksRefreshToken && booksOrgId`, backfill-si-vacío (`maxLastModified(pool,'clients')==null`) +
  `setInterval(booksSync.syncRecent, syncIntervalMs)`.
- `loadConfig` **solo exige** `ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN/ORG_ID/DEPARTMENT_ID` y `DATABASE_URL`; el resto
  tiene defaults (`PORT`, `SYNC_INTERVAL_MS=180000`, `ADMIN_*` opcionales, Books opcional). → el hub-sync reusa
  `loadConfig` sin cambios.
- Firmas: `createPool(config)` (usa `config.databaseUrl`); `createSync({zohoFetch,db,config})`;
  `createBooksClient({config})` → `{booksFetch}`; `createBooksSync({booksFetch,db,config})` con
  `backfillClients/backfillSalesOrders/syncRecent`. `interface Sync` incluye `backfillTickets`,
  `backfillArchivedTickets`, `syncRecent`, `syncActivities`, `syncContacts`, etc.

## Componentes (nuevos)

### `server/hubSync.ts` — núcleo testeable
Separa el arranque (one-shot) de la programación (loops), para poder testear el primero con pg-mem + mocks.
```ts
import { migrate, reseedTicketNumber, type Queryable } from './db/migrate'
import { countTickets } from './db/repo'
import { maxLastModified } from './books/repo'
import type { Sync } from './sync'
import type { BooksSync } from './books/sync'

/** Migra el hub y hace el backfill inicial solo si está vacío. Idempotente entre reinicios. */
export async function hubBootstrap(deps: { db: Queryable; sync: Sync; booksSync: BooksSync | null }): Promise<void> {
  const { db, sync, booksSync } = deps
  await migrate(db)
  try { await reseedTicketNumber(db) } catch (e) { console.error('reseed inicial omitido:', e) }
  if ((await countTickets(db)) === 0) {
    console.log('Hub vacío: backfill de tickets…')
    await sync.backfillTickets()
    await sync.backfillArchivedTickets()
    await reseedTicketNumber(db)
  }
  await sync.syncActivities().catch((e) => console.error('Sync actividades inicial falló:', e))
  await sync.syncContacts().catch((e) => console.error('Sync contactos inicial falló:', e))
  if (booksSync && (await maxLastModified(db, 'clients')) == null) {
    console.log('Books vacío: backfill…')
    await booksSync.backfillClients()
    await booksSync.backfillSalesOrders()
  }
}

/** Programa los ciclos incrementales. Devuelve un stop() que limpia los timers. */
export function scheduleHubSync(deps: { sync: Sync; booksSync: BooksSync | null; intervalMs: number }): () => void {
  const { sync, booksSync, intervalMs } = deps
  let syncing = false
  const deskTimer = setInterval(() => {
    if (syncing) return
    syncing = true
    sync.syncRecent().then(() => sync.syncActivities()).then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, intervalMs)
  const timers = [deskTimer]
  if (booksSync) {
    timers.push(setInterval(() => { booksSync.syncRecent().catch((e) => console.error('Books syncRecent falló:', e)) }, intervalMs))
  }
  return () => timers.forEach(clearInterval)
}
```

### `server/hub-sync.ts` — entrypoint (sin Express/SPA)
```ts
import 'dotenv/config'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createPool } from './db/pool'
import { createSync } from './sync'
import { createBooksClient } from './books/booksClient'
import { createBooksSync } from './books/sync'
import { hubBootstrap, scheduleHubSync } from './hubSync'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

let booksSync: ReturnType<typeof createBooksSync> | null = null
if (config.booksRefreshToken && config.booksOrgId) {
  const { booksFetch } = createBooksClient({ config })
  booksSync = createBooksSync({ booksFetch, db: pool, config })
  console.log('Sync Zoho Books habilitado (hub)')
} else {
  console.log('Sync Zoho Books deshabilitado (hub)')
}

async function main() {
  await hubBootstrap({ db: pool, sync, booksSync })
  scheduleHubSync({ sync, booksSync, intervalMs: config.syncIntervalMs })
  console.log(`zoho-hub-sync en marcha (intervalo ${config.syncIntervalMs} ms)`)
}
main().catch((e) => { console.error('Fallo al arrancar zoho-hub-sync:', e); process.exit(1) })
```

### `package.json`
Añadir script: `"start:hub-sync": "cross-env NODE_ENV=production tsx server/hub-sync.ts"`.

## Despliegue (EasyPanel)
Nuevo servicio (tipo App) en el mismo proyecto, desde el mismo repo:
- **Start command:** `npm run start:hub-sync`.
- **Env:** `DATABASE_URL` = URL interna del **hub** (`…@ambientalia_project_zoho-hub-db:5432/zoho-hub?sslmode=disable`),
  `ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN/ORG_ID/DEPARTMENT_ID`, y (si se quiere Books) `ZOHO_BOOKS_REFRESH_TOKEN`/
  `ZOHO_BOOKS_ORG_ID` (+ opcionales). `SYNC_INTERVAL_MS` opcional. **No** requiere `PORT`/`ADMIN_*`/SPA.
- No expone puerto (no es web). Reinicio automático ante fallo fatal.

## Flujo de datos / robustez
Zoho (Desk+Books) → `hub-sync` → upserts en el **hub**. Backfill solo si vacío (reinicios no re-backfillean).
Errores por ciclo se loguean sin tumbar el proceso; fallo de arranque → exit≠0 (EasyPanel reinicia).

## Pruebas
- **`server/hubSync.test.ts`** (pg-mem + mocks):
  - Con `Sync`/`BooksSync` mockeados (vi.fn) y db pg-mem vacía: `hubBootstrap` corre `migrate` (las tablas
    existen luego), llama `backfillTickets` + `backfillArchivedTickets` (db vacía), y `syncActivities`/`syncContacts`.
  - Con un ticket ya insertado: **no** llama `backfillTickets`.
  - Con `booksSync=null`: no falla y no intenta Books.
  - `scheduleHubSync`: devuelve un `stop()` que limpia timers (se puede testear con `vi.useFakeTimers()` que tras
    un tick llama `sync.syncRecent`, y que `stop()` evita más llamadas).
- El motor de sync (Desk/Books) ya tiene cobertura propia.

## Fuera de alcance (SP1)
- Replicación hub→desk, cambios en la Desk app, separar `schema.sql`, write-back CQRS, matviews, CRM.
- Transitorio aceptado: durante SP1 la app y el hub-sync sincronizan ambos contra Zoho (doble carga incremental,
  ligera); se resuelve en el cutover de SP2. Cada proceso refresca su token de acceso de forma independiente.
