# Diseño — mark-and-sweep de huérfanos en la réplica zoho-hub

**Fecha:** 2026-07-19
**Repo:** `desk-ambientalia` (worker `apps/hub-sync` + lib `packages/zoho-sync`).

## Problema

El worker `hub-sync` sincroniza Zoho → Postgres solo por **upsert incremental** (`ON CONFLICT (pk) DO UPDATE … synced_at=now()`), guiado por el high-water mark `last_modified_time`. **Nunca refleja borrados**: un registro eliminado en Zoho deja de aparecer en los listados, pero se queda para siempre en la réplica como **huérfano**. Síntomas reales: facturas/OV fantasma (FP-341, AM1377, AM1451, OV-2021-122, duplicados de FP-373) que las apps del portal muestran como pendientes.

## Objetivo

Un job **periódico (diario)** que, por entidad, obtiene el conjunto de IDs vivos en Zoho y **borra de la réplica los que ya no están**. Con salvaguardas fuertes: un sweep con datos incompletos borraría registros reales.

## Decisiones (brainstorming)

- **Alcance v1:** Books (`invoices`, `sales_orders`, `contacts`, `items`) + CRM (todos los módulos del registro `modules.ts`). Desk (tickets, con archivados) queda para una 2ª fase.
- **Borrado físico** (no soft-delete): DELETE real, sin cambiar las apps del portal. La seguridad la dan el dry-run y el tope.

## Arquitectura

### 1. Programación
- Nuevo bloque en `apps/hub-sync/src/hub-sync.ts` `main()`, junto al de sales-records:
  `if (config.sweepEnabled) scheduleDailyAt(config.sweepHour, runSweep)`.
- `runSweep` llama `booksHubSync.sweep()` y `crmSync.sweep()` (si esos syncs están activos), cada uno con su try/catch (un fallo no tumba al otro ni al worker).
- **NO** va en el timer de 3 min (el sweep pagina todo, es caro).

### 2. Núcleo puro y testeable
En un módulo nuevo `packages/zoho-sync/src/sweep/sweep.ts`:

```ts
/** IDs de la réplica que ya no están vivos en Zoho. */
export function orphanIds(vivos: Set<string>, enReplica: string[]): string[] {
  return enReplica.filter((id) => !vivos.has(id));
}

export interface SweepGuard { maxRows: number; maxPct: number; }
/** ¿Es seguro borrar? false si supera el tope absoluto o el % de la tabla. */
export function guardOk(aBorrar: number, totalReplica: number, g: SweepGuard): boolean {
  if (aBorrar > g.maxRows) return false;
  if (totalReplica > 0 && aBorrar / totalReplica > g.maxPct) return false;
  return true;
}
```

Estas dos funciones concentran la lógica de riesgo y se testean con vitest sin BD.

### 3. Recolección de IDs vivos
- **Books:** reusar `listPage(resource, key, page)` (`booksHub/sync.ts`) paginando hasta agotar; recolectar el ID de cabecera (`invoice_id`, `salesorder_id`, `contact_id`, `item_id`). **No** llamar a `fetchDetail`. Si cualquier página lanza → abortar esa entidad (no borrar).
- **CRM:** reusar el patrón de `fetchPage` con `fields=id` (mínimo) + `next_page_token`, iterando `MODULES` de `modules.ts`. Cada registro trae `id`.

### 3bis. Re-verificación por candidato (RED DE SEGURIDAD CLAVE)
"Ausente de la lista" **no** significa siempre "borrado en Zoho": un glitch de paginación o una respuesta incompleta puede omitir un registro **vivo** (lo vimos: la enumeración manual se saltó FP-373 estando viva). El tope solo caza incompletitud **masiva**; un hueco de pocos registros se cuela y borraría datos vivos.

Por eso, **antes de borrar cada huérfano candidato** se hace un **lookup puntual por id en Zoho** (`confirmDeleted(id)`):
- Zoho responde **no existe** (404 Books / 204 o 404 CRM) → **confirmado huérfano** → se borra.
- Zoho **devuelve el registro** → estaba vivo (hueco de la lista) → **NO se borra**, se cuenta como `liveGaps` y se loguea.
- Error indeterminado (red/otro status) → **NO se borra**, se cuenta como `uncertain`.

Son pocas llamadas (solo sobre los candidatos, que tras el incremental son escasos). Es exactamente la verificación uno-a-uno que en el barrido manual evitó borrar FP-373. Se ejecuta **también en dry-run** (es de solo lectura) para que el log reporte cuántos borraría de verdad.

### 4. Borrado
Helper por dominio (valida la tabla contra una lista blanca, como `byTable`):
- `booksHub/repo.ts`: `deleteMissing(db, table, pkCol, liveIds, childTable?, childFk?)` — en transacción: borra hijas por FK, luego la cabecera `WHERE pk <> ALL($liveIds)`.
- `crmHub/repo.ts`: `deleteMissing(db, table, liveIds)` (pk `id`; para `quotes` borra también `quote_line_items`).
- Schema-qualify según `config.dbSchema` (books./crm.), igual que el resto del repo.

Para pasar el set de IDs a `NOT IN`/`<> ALL` sin exceder límites de parámetros: usar `WHERE pk <> ALL($1::text[])` con un solo array parámetro.

### 5. Salvaguardas (por entidad), de más fuerte a más débil
1. **Re-verificación por candidato (§3bis):** solo se borra lo que Zoho confirma ausente por id. Cierra el agujero de los huecos de lista (el caso FP-373). Es la salvaguarda principal.
2. **`SWEEP_DRY_RUN` (default ON):** hace todo (incluida la re-verificación de solo lectura) y **loguea** cuántos borraría, pero **no borra**. Se apaga tras validar varias corridas.
3. **Completo-o-abortar:** si cualquier página del list falla, se aborta el sweep de ESA entidad (nunca borrar con lista parcial).
4. **Tope (`guardOk`):** `SWEEP_MAX_ROWS` (p.ej. 200) y `SWEEP_MAX_PCT` (p.ej. 0.10). Si el nº de candidatos supera el tope → NO borra la entidad, log de alerta. Protege contra una respuesta de Zoho truncada (incompletitud masiva).
5. **Sin transacción sobre el Pool** (conexiones distintas): borrar hijas y luego cabecera como dos queries (patrón de `replaceInvoiceLines`).
6. **Log auditable:** por entidad → `{tabla, vivosZoho, enReplica, orphans, confirmed, liveGaps, uncertain, deleted|DRY_RUN}` por `console.*`.

### 6. Config (`config.ts` + `.env.example`)
Nuevas variables (convención `env.X !== 'false'` para booleanos):
- `SWEEP_ENABLED` (default `false`).
- `SWEEP_DRY_RUN` (default `true`).
- `SWEEP_HOUR` (default `4`) — hora local del job diario.
- `SWEEP_MAX_ROWS` (default `200`), `SWEEP_MAX_PCT` (default `0.10`).

### 7. Contrato de las interfaces de sync
Añadir `sweep(opts): Promise<SweepReport[]>` a `BooksHubSync` y `CrmSync`. `SweepReport = { table, live, replica, orphans, confirmed, liveGaps, uncertain, deleted, dryRun, skipped? }`. Cada `SweepEntity` aporta `collectLive()` y `confirmDeleted(id)`. `runSweep` en el worker agrega y loguea.

## Entidades → tabla → PK (alcance v1)

| Dominio | Tabla | PK | Hijas |
|---|---|---|---|
| Books | books.invoices | invoice_id | invoice_line_items (FK invoice_id) |
| Books | books.sales_orders | salesorder_id | salesorder_line_items (FK salesorder_id) |
| Books | books.contacts | contact_id | — |
| Books | books.items | item_id | — |
| CRM | crm.<módulo> (deals, leads, tasks, events, calls, products, quotes, campaigns, visits) | id | quote_line_items (FK quote_id) para quotes |

## Fuera de alcance (v1)
- Desk (tickets + archivados) — 2ª fase.
- Soft-delete / archivo histórico de borrados.
- Purga de tablas hijas sin cabecera (se cubren al borrar la cabecera).

## Criterios de éxito
- Con `SWEEP_DRY_RUN=true`: el log reporta los huérfanos correctos (los que verificamos a mano) sin borrar nada, y la re-verificación distingue `confirmed` vs `liveGaps`.
- Con dry-run off: borra **solo los candidatos confirmados ausentes por id**; un candidato que resulte vivo (hueco de lista) se salta y se cuenta en `liveGaps`; el tope aborta la entidad si el set es anormalmente grande.
- `orphanIds`/`guardOk`/`sweepEntity` (incl. la rama `confirmDeleted`: confirmado→borra, vivo→no) con tests unitarios; el sweep de Books y CRM con pg-mem (seed rows, mock del list y del lookup por id).

## Riesgos
- **Lista incompleta de Zoho** (paginación con hueco, como FP-373) → mitigado por la **re-verificación por candidato** (salvaguarda principal) + tope + completo-o-abortar + dry-run inicial. Un hueco ya no borra datos vivos: el lookup por id lo detecta.
- **`confirmDeleted` mal interpretado**: hay que confirmar el status exacto de "no existe" por API (Books 404; CRM 204/404). Ante cualquier ambigüedad, `confirmDeleted` NO confirma (no borra). Verificar en la implementación con un id real borrado y uno vivo.
- **Archivados/estados filtrados**: para Books los list no filtran por estado (ok). Para Desk sí (por eso queda fuera de v1).
- pg-mem no soporta `information_schema.schemata`/`SET SCHEMA` (ya conocido) — los tests del sweep evitan esas rutas.
