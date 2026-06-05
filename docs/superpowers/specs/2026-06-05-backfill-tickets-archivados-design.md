# Diseño — Backfill de tickets archivados

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** Zoho Desk **archiva** los tickets cerrados antiguos, y el endpoint `GET /tickets` que usa nuestro
backfill/sync **no devuelve los archivados**. Por eso la BD tiene solo los no-archivados (~191 de ~822) →
el tablero, Análisis, hojas de vida y Clientes **subcontan**. Confirmado en vivo: el contacto Ricardo Buitrago
tiene 44 tickets en Zoho (35 archivados); la app muestra exactamente los 9 no-archivados.
**Depende de:** A (sync + `persistTicket` + `zohoFetch`), H1 (admin).

## Hallazgo de la API (confirmado por docs)
Zoho Desk tiene un **listado dedicado de archivados**: `GET /tickets/archivedTickets?departmentId=…` con
`from`/`limit`/`include` (mismos params que `/tickets`). No existe un flag "includeArchived" en `/tickets`;
los archivados se leen por este endpoint o por entidad (contacto/cuenta). Usamos el listado global por
departamento (una paginación, como el backfill normal).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Origen | `GET /tickets/archivedTickets?departmentId=…` (paginación global) |
| Disparador | **Endpoint admin en segundo plano** (`POST /api/admin/backfill-archived`), una vez |
| Rate limit (429) | **Sin throttle**; si corta, **re-ejecutar** (idempotente) |
| Frecuencia | **Una sola vez** (los archivados son estáticos; el sync actual cubre los nuevos) |

## Backend

### `backfillArchivedTickets()` (`server/sync.ts`)
Espejo de `backfillTickets`, cambiando solo el endpoint:
```ts
async backfillArchivedTickets(): Promise<number> {
  let from = 1, total = 0
  for (;;) {
    const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'contacts,assignee' })
    const res = await zohoFetch(`/tickets/archivedTickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets/archivedTickets ${res.status}`)
    const items = ((await readData(res)).data ?? []) as any[]
    if (items.length === 0) break
    for (const t of items) await persistTicket(t)
    total += items.length
    if (items.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return total
}
```
- `persistTicket` ya resuelve cuenta/contacto y hace `upsertTicket` (protege `managed_by_app`). Idempotente.
- Añadir `backfillArchivedTickets(): Promise<number>` a la interfaz `Sync`.

### Endpoint (`server/app.ts`)
`POST /api/admin/backfill-archived` (`requireAuth(db)` + `requireSuperAdmin`): **arranca en segundo plano** y
responde de inmediato:
```ts
app.post('/api/admin/backfill-archived', requireAuth(db), requireSuperAdmin, (_req, res) => {
  sync.backfillArchivedTickets()
    .then((n) => console.log(`Backfill archivados: ${n} tickets`))
    .catch((e) => console.error('Backfill archivados falló:', e))
  res.json({ started: true })
})
```
(No se `await` — fire-and-forget; el usuario verifica con `SELECT count(*) FROM tickets`.)

## Despliegue / uso
1. **Implementar** (sin env nuevas; sin cambios de schema).
2. Como admin, dispararlo una vez:
   `fetch('/api/admin/backfill-archived', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)` → `{ started: true }`.
3. Esperar 1–3 min; en el log: `Backfill archivados: N`. Verificar: `SELECT count(*) FROM tickets;` sube de
   ~191 a ~800. Si se cortó por 429, repetir el `fetch`.

## Pruebas
- **`backfillArchivedTickets`** (`zohoFetch` mock): pagina `/tickets/archivedTickets`, persiste, corta por
  página corta; devuelve el total; la primera llamada apunta a `/tickets/archivedTickets`.
- **Endpoint** (supertest+sesión): admin → `{ started: true }` (y se invoca `sync.backfillArchivedTickets`);
  **403** no-admin; **401** sin sesión.

## Fuera de alcance
- Throttle/reintentos automáticos de 429 (se re-ejecuta manualmente).
- Job en segundo plano con estado/polling (es fire-and-forget + verificación por count).
- Backfill periódico (una sola vez basta).
