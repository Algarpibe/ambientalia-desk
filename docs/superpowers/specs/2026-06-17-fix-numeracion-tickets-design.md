# Diseño — Fix colisión de numeración de tickets (bug #954) + resiliencia de sync

**Fecha:** 2026-06-17
**Estado:** Aprobado para planificación
**Contexto:** En producción, `syncRecent` aborta con `duplicate key (number)=(954)` (`tickets_number_key`). Causa raíz
(systematic-debugging): los tickets **creados por la app** (`managed_by_app`) toman `number` de la **misma**
secuencia/espacio que los de Zoho (`reseedTicketNumber` la ancla al `MAX(number)` global), y Zoho **alcanza** ese
número → colisión en el `UNIQUE(number)`. Además `upsertTicket` hace `ON CONFLICT (id)` (no cubre `number`), y los
loops de sync no aíslan errores por-ticket → **un ticket malo aborta todo el ciclo**.
**Datos:** existe **1** ticket de app (`app-13ba40fd…`, #954, prueba; los reales de ese cliente son #955/#956 en
Zoho). Zoho va de 171 a 958.
**Depende de:** monorepo Etapa 1 (motor en `packages/zoho-sync`). Memoria `zoho-hub-arquitectura`.

## Decisiones (confirmadas)
- **Borrar** el ticket de prueba app #954 (libera el número para el #954 real de Zoho).
- **Capa A (resiliencia):** los loops de sync capturan error **por ticket** (log + continuar).
- **Capa B (raíz):** los tickets de la app se numeran en un **rango alto propio** (base **1.000.000**); `reseed`
  deja de arrastrarse al máximo global (solo considera tickets de la app, con piso en la base). Zoho (≤ ~1000)
  nunca colisiona.

## Cambios de código (`packages/zoho-sync/src/…`)

### Capa A — `sync.ts`: aislamiento por-ticket
Helper reutilizable + usarlo en los 3 loops (`backfillTickets` pág., `backfillArchivedTickets`, `syncRecent`):
```ts
/** Persiste cada item aislando fallos: uno malo no aborta el lote. Devuelve cuántos persistieron OK. */
async function persistEach(items: any[]): Promise<number> {
  let ok = 0
  for (const t of items) {
    try { await persistTicket(t); ok++ }
    catch (e: any) { console.error(`persistTicket(${t?.id ?? '?'}) falló:`, String(e?.detail ?? e?.message ?? e)) }
  }
  return ok
}
```
- `syncRecent`: `const pageItems = …; await persistEach(pageItems); return pageItems.length` (sigue devolviendo el nº recibido).
- `backfillTickets` (loop por página): `total += await persistEach(items)` (o mantener `total += items.length`; lo importante es no abortar).
- `backfillArchivedTickets`: igual con `persistEach`.

### Capa B — numeración alta para tickets de app (`db/migrate.ts`)
```ts
/** Base del espacio de numeración de tickets creados por la app (separado de Zoho). */
export const APP_TICKET_NUMBER_BASE = 1_000_000

/** Re-siembra la secuencia de la app: solo mira números de la app, con piso en la base (nunca arrastra a Zoho). */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  const r = await db.query('SELECT COALESCE(MAX(number),0) AS m FROM tickets WHERE managed_by_app = true')
  const next = Math.max(Number(r.rows[0].m), APP_TICKET_NUMBER_BASE - 1) // setval = "último usado"; siguiente nextval = +1
  await db.query(`SELECT setval('ticket_number_seq', $1)`, [next])
}
```
- `nextTicketNumber`/`createTicket`: **sin cambios** (siguen usando `nextval('ticket_number_seq')`).
- Efecto: con 0 tickets de app → `setval(999999)` → primer ticket de app = **1.000.000**. Con app ticket
  1.000.000 → siguiente = 1.000.001. Los números de Zoho **ya no afectan** la secuencia de la app.
- No requiere cambio de `schema.sql` (la secuencia existe; `reseedTicketNumber` la posiciona en cada arranque,
  que ya se llama en `index.ts` y `hubBootstrap`).

## Paso de datos (una vez, manual en `desk-db` — runbook)
```sql
-- \c desk
-- (opcional, limpia datos asociados del ticket de prueba, si los hubiera)
DELETE FROM ticket_reads WHERE ticket_id = 'app-13ba40fd-7968-4d1e-9e14-5f37abe25fbf';
-- borrar el ticket de prueba app #954 (libera el 954 para Zoho)
DELETE FROM tickets WHERE id = 'app-13ba40fd-7968-4d1e-9e14-5f37abe25fbf';
```
(Si `DELETE FROM tickets` falla por FK desde otra tabla, borrar primero las filas hijas correspondientes; en este
esquema las referencias son `text` sin FK, así que el borue directo basta y los huérfanos son inocuos.)

## Pruebas (TDD, pg-mem)
- **`db/migrate.test.ts` o `db/repo.test.ts`:** tras `reseedTicketNumber` con **0 tickets de app** →
  `nextTicketNumber` = **1.000.000**; con un Zoho ticket #958 presente (managed_by_app=false), `reseed` **no** lo
  considera (siguiente ≠ 959); con un app ticket 1.000.000 → siguiente = 1.000.001.
- **`sync.test.ts` (Capa A):** una página con 2 tickets de Zoho donde **uno colisiona** (pre-insertar un ticket con
  `number=N`; el page trae un Zoho id distinto con `number=N`) → `syncRecent` **no lanza**, persiste el otro, y el
  conteo refleja lo recibido. Verifica que el lote no se aborta.

## Secuencia de despliegue
1. **Código** (Capa A+B) → push a `main` → EasyPanel reconstruye; al arrancar, `reseedTicketNumber` deja la
   secuencia con piso 1.000.000 (no vuelve a colisionar).
2. **Borrado del app #954** en `desk-db` (runbook) → libera el #954 real de Zoho; el próximo `syncRecent` lo trae.
   (Ambos pasos son necesarios; el orden no es crítico.)

## Fuera de alcance
- Opción A (write-back), separación en repos, rotación de secretos.
- Cambiar el tipo/constraint de `tickets.number` (sigue `integer UNIQUE`; la base alta cabe en int4).
