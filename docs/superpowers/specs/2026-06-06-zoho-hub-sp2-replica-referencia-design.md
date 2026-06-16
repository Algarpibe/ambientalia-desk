# Diseño — SP2 (incremental): réplica de datos de referencia hub → desk

> **CORRECCIÓN (2026-06-16, durante el cutover):** el alcance real es de **3 tablas**: `activities`, `clients`,
> `sales_orders`. **`contacts` se EXCLUYÓ** porque `syncRecent` la escribe vía `persistTicket → ensureContact →
> upsertContact` (sync.ts:51) — no era "solo lectura desde el app" como suponía este spec. Replicar `contacts`
> chocaría con esas escrituras (divergencia / PK duplicada al aparecer un contacto nuevo). `contacts` se mantiene
> en **sync local** (flag `SYNC_CONTACTS` vuelve a `true`). Para replicarla en el futuro habría que **gatear
> `ensureContact`** (no escribir `contacts` localmente cuando esté replicada) — anotado como mejora futura.

**Fecha:** 2026-06-06
**Estado:** Implementado (cutover 2026-06-16, alcance corregido a 3 tablas)
**Contexto:** Segundo sub-proyecto de la migración a la Opción D. El hub (`zoho-hub-db`) ya está poblado y
autoactualizado por `zoho-hub-sync` (SP1). Ahora la **Desk app** deja de sincronizar localmente las tablas de
**solo-lectura** que tienen sync separable y pasa a **leerlas de una réplica** del hub.
**Depende de:** SP1 (hub-sync) + spike de logical replication (GO). Memoria `zoho-hub-arquitectura`.

## Decisiones (confirmadas)
- **Alcance B (incremental):** solo `contacts`, `activities`, `clients`, `sales_orders` — la app **solo las lee**
  y cada una tiene su **método de sync separable** (`syncContacts`, `syncActivities`, Books `syncRecent`).
- **No se tocan** tickets/accounts/agents/conversations/history (siguen en el `syncRecent` local), ni las
  escrituras del app. La **Opción A** (cutover total + write-back) queda **diferida** con disparadores: hacerla
  solo si (1) otra app necesita leer tickets creados por la Desk app, o (2) la doble sincronización causa
  problemas medibles.
- **Esquema:** la replicación escribe en las **mismas tablas `public`** (mismos nombres) → la app las lee sin
  cambiar queries. **Sin** esquema `zoho` ni vistas-contrato por ahora (se difieren; no aportan valor suficiente
  en tablas read-only simples y añadirían riesgo en producción).

## Por qué estas 4 y no más
La app **escribe** `tickets`/`ticket_transitions`/`conversations` (crear/transición/respuesta) → no pueden ser
suscriptoras sin write-back (Opción A). El `syncRecent` es **monolítico** (tickets+accounts+agents+conversations+
history juntos) → no se puede apagar parcialmente. En cambio `contacts`, `activities`, `clients`, `sales_orders`
son read-only desde el app y tienen sync propio → cortables limpio.

## Cambio de código (lo único que se programa)

### `server/config.ts`
Añadir 3 flags a `AppConfig` y a `loadConfig`, **default `true`** (solo `'false'` desactiva → preserva el
comportamiento actual hasta que se pongan en prod):
```ts
  syncContacts: env.SYNC_CONTACTS !== 'false',
  syncActivities: env.SYNC_ACTIVITIES !== 'false',
  syncBooks: env.SYNC_BOOKS !== 'false',
```

### `server/index.ts` — gatear los 3 loops separables (solo en la Desk app; el hub-sync NO se toca)
- Sync inicial de actividades: `if (config.syncActivities) { sync.syncActivities()... }`.
- Sync inicial de contactos: `if (config.syncContacts) { sync.syncContacts()... }`.
- En el `setInterval` incremental, construir la cadena condicional:
```ts
  setInterval(() => {
    if (syncing) return
    syncing = true
    let p: Promise<unknown> = sync.syncRecent()
    if (config.syncActivities) p = p.then(() => sync.syncActivities())
    if (config.syncContacts) p = p.then(() => sync.syncContacts())
    p.catch((e) => console.error('Sync incremental falló:', e)).finally(() => { syncing = false })
  }, config.syncIntervalMs)
```
- Bloque de Books: añadir el flag a la condición →
  `if (config.booksRefreshToken && config.booksOrgId && config.syncBooks) { … }`.

(`syncRecent` sigue corriendo siempre — trae tickets/accounts/agents/conversations/history como hoy.)

## Cutover / runbook (infra — manual en EasyPanel, NO es código)
1. **Hub** (`zoho-hub` Postgres Client → `\c zoho-hub`):
   `CREATE PUBLICATION zoho_ref_pub FOR TABLE contacts, activities, clients, sales_orders;`
2. **Desk app:** poner env `SYNC_CONTACTS=false`, `SYNC_ACTIVITIES=false`, `SYNC_BOOKS=false` → **redeploy**
   (la app deja de escribir esas 4 tablas; `syncRecent` sigue).
3. **Desk** (`desk` Postgres Client → `\c desk`):
   `TRUNCATE contacts, activities, clients, sales_orders;`
   `CREATE SUBSCRIPTION zoho_ref_sub CONNECTION 'host=ambientalia_project_zoho-hub-db port=5432 dbname=zoho-hub user=postgres password=<hub> sslmode=disable' PUBLICATION zoho_ref_pub;`
   (copia inicial repuebla + streaming).
4. **Verificar:** counts en `desk` = counts en hub para las 4 tablas; un `INSERT` de prueba en el hub aparece en
   `desk` (y limpiarlo). La UI de Clientes/Actividades sigue funcionando.

## Rollback (fácil, sin pérdida)
`DROP SUBSCRIPTION zoho_ref_sub;` en desk + volver los flags a `true` (o quitarlos) + redeploy → la Desk app
re-backfillea esas tablas con sus syncs (backfill-si-vacío) y vuelve al estado previo.

## DDL drift (operativo)
Si el hub añade/quita columnas en esas 4 tablas: aplicar el DDL **primero en el suscriptor (desk), luego en el
hub** (regla del spike). En la práctica = correr el `migrate`/`schema.sql` en ambos en ese orden.

## Pruebas
- **`server/config.test.ts`**: los 3 flags **default `true`**; `'false'` los desactiva.
- **`server/index.ts`** es entrypoint (no unit-test): el gateo se verifica por `tsc` + arranque manual (en prod,
  con flags `false`, los logs ya no muestran sync de contactos/actividades/Books; `syncRecent` sí).
- Replicación: infra (pg-mem no la simula) → runbook + verificación manual.

## Fuera de alcance (SP2)
- tickets/accounts/agents/conversations/history, write-back, esquema `zoho`/vistas-contrato, Opción A (diferida).
- Mover el sync de las 4 tablas FUERA del código del app (el código sigue ahí, solo gateado por flag — así el
  rollback es instantáneo). Limpieza/eliminación de ese código se hará cuando el cutover esté consolidado.

## Pendiente operativo (recordatorio)
Rotar los secretos expuestos (passwords desk/hub, tokens Zoho/Books, ADMIN_*) y usar la contraseña nueva del hub
en la `CONNECTION` de la suscripción.
