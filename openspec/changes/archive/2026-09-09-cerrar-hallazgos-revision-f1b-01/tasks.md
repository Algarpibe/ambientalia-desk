# Tasks: Cerrar los hallazgos de la revisión adversaria de F1B-01

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~250 autoras (design §4) |
| 400-line budget risk | — (presupuesto de esta sesión: 800) |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR única, 5 commits internos + 1 commit final |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Baseline a batir (`56ff441`): 112 archivos + 1 omitido (113) · 988 pruebas + 2 omitidas (990) · exit 0.
Ninguna tarea puede bajar de esa cifra ni tocar las 2 omitidas.

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · P1 | Guarda equipo↔cliente | única | `npx vitest run apps/desk/server/services/ticketService.test.ts` | N/A — unidad con pg-mem, sin servidor real | quitar sólo la rama (ii), conservar (i) |
| 2 · P4 | Precedencia 422/409 | única | `npx vitest run apps/desk/server/remisiones.test.ts` | N/A — sólo prueba, sin cambio de producción | revertir la prueba |
| 3 · P3 | Guardián de `ALTER` | única | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` | N/A — clasificador puro sin llamador en runtime | revertir export + pruebas |
| 4 · P2 | `GET /api/clients/:id` | única | `npx vitest run apps/desk/server/admin.test.ts` | N/A — sin E2E manual en esta tanda | revertir endpoint y consumidor juntos |
| 5 · P5 | Aviso `CrearRemision.tsx` | única | N/A — `.tsx` excluido (F0-00) | N/A | revertir una línea |

## Fase 0 · Preparación

- [x] 0.1 En `apps/desk/server/services/ticketService.test.ts`, junto a `equipo()` (L233-235), añadir `equipoConCliente(id, clientId, clienteNombre?)`: mismo `INSERT` más columnas `client_id, cliente_nombre` (hoy `equipo()` nunca las fija — bloqueante para 1.1/1.2).

## Fase 1 · P1 — guarda equipo↔cliente (`ticketService.ts`, spec `tickets-core`)

- [x] 1.1 RED — 3 pruebas nuevas (describe `la guarda equipo↔cliente`): (a) discrepancia `equipoConCliente('eq-1','cli-A')` + body `clientId:'cli-B'`+`cliente('cli-B')` → esperar `422` y mensaje con `'cli-A'`; (b) OV manda cuando el cuerpo calla: `equipoConCliente('eq-1','cli-A')` + `sales_orders(customer_id='cli-B')` + `salesOrderId` sin `clientId` → esperar `422`; (c) M5 — equipo manda cuando el cuerpo calla: `equipoConCliente('eq-1','cli-A')`, sin `clientId` ni OV → esperar `201` y `SELECT client_id FROM tickets` = `'cli-A'`. Comando: `npx vitest run apps/desk/server/services/ticketService.test.ts`. Hoy fallan: (a) y (b) dan `201`, (c) da `422 Faltan campos obligatorios: cliente`.
- [x] 1.2 Prueba de regresión (ya verde, no RED): `equipo()` sin `client_id` + body `clientId:'cli-1'` → `201`, fila con `'cli-1'` (escenario «3,4 % no se bloquea»); y equipo con `client_id` igual al del cuerpo → `201` (escenario «alta sin discrepancia no cambia»). Ambas ya pasan hoy.
- [x] 1.3 GREEN — en `ticketService.ts`, entre el fin del `409` (`:49`) y los obligatorios (`:50`), implementar reglas (i)/(ii)/(iii) del design §1 sobre el `clientId` final (post-OV, `:39`); mensaje con `equipo.clienteNombre ?? equipo.clientId`; `logger.warn({equipoId, 'equipo.clientId', clientId})` antes del `422`. Comando anterior → verde completo del fichero.
- [x] 1.4 Mutación fila 1 (design §3): quitar la rama (ii) → 1.1(a) se pone ROJA → revertir.
- [x] 1.5 Mutación M5 (fila 2): en `:67` volver a escribir `clientId!` en vez del valor resuelto por la guarda → misma `201`, 1.1(c) se pone ROJA (afirma sobre la fila) → revertir.
- [x] 1.6 Mutación fila 3: comparar sin comprobar `equipo.clientId === null` → 1.2 se pone ROJA → revertir.

## Fase 2 · P4 — precedencia 422/409 (`remisiones.test.ts`, spec `remisiones`)

- [x] 2.1 Escribir la prueba «serial vacío y remisión pendiente a la vez» en el describe `F1B-01 · POST /api/remisiones exige el serial` (L882): `ticketDeZohoSinSerial()` + `INSERT INTO remisiones (...) VALUES (...,'tz',...,'pendiente',...)` (patrón L694) → `POST /api/remisiones` sin `permitirSegunda` → esperar `422` y `error` con `/serial/i`, no `409`; y ninguna remisión nueva.
- [x] 2.2 RED (mutación fila 7) — mover temporalmente el bloque `remision.ts:152-157` después del `409` (`:174-183`) → `npx vitest run apps/desk/server/remisiones.test.ts` → 2.1 falla con `409` → revertir el movimiento.
- [x] 2.3 Confirmar verde con el código real (sin mover nada; no hay cambio de producción en P4). Añadir/confirmar la prueba «sólo aplica una guarda» (serial presente + pendiente → `409` con `remisionId`, igual que hoy).

## Fase 3 · P3 — guardián de esquema (`migrate.ts`, spec `zoho-sync`)

- [x] 3.1 RED — en `migrate.test.ts`, fixture sintético `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw jsonb` (columna sólo de `books.contacts`) → `altersAmbiguas([fixture])` debe incluirla. `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` → falla: `altersAmbiguas` no existe.
- [x] 3.2 RED — censo real: `altersAmbiguas(schemaStatements())` es exactamente la de `schema.sql:256` (`modified_time`), ni más ni menos. Falla igual (no existe).
- [x] 3.3 GREEN — en `migrate.ts`, junto a `DESK_TABLES`/`BOOKS_TABLES` (L63-80), exportar `nombresAmbiguos(): string[]` (nombres en más de una lista → `['contacts']`) y `altersAmbiguas(statements: string[]): string[]` (ALTER sin calificar sobre nombre ambiguo, normalizadas). Verde 3.1+3.2. Confirmar sin tocarlas que las 3 pruebas existentes de `altersDelEsquema()` (`:324-368`) siguen verdes (escenario «de Desk sigue pasando»).
- [x] 3.4 Mutación fila 5: `altersAmbiguas` devuelve `[]` siempre → 3.1 se pone ROJA → revertir.

## Fase 4 · P2 — `GET /api/clients/:id` (spec `tickets-core`)

- [x] 4.1 RED — en `admin.test.ts`, describe `GET /api/clients y /api/sales-orders (Books)` (L135), 3 pruebas: `200` con cliente existente, `404` sin fila, `401` sin sesión. `npx vitest run apps/desk/server/admin.test.ts` → fallan (ruta inexistente).
- [x] 4.2 GREEN — en `routes/directory.ts` (junto a `:15`): `app.get('/api/clients/:id', requireAuth(db), asyncHandler(...))` con `getClient(db, String(req.params.id))`, `404 { error: 'No encontrado' }` si no hay fila. Verde 4.1.
- [x] 4.3 Mutación fila 4: devolver `200` con cuerpo vacío en vez de `404` → 4.1 se pone ROJA → revertir.
- [x] 4.4 Mismo commit que 4.2: `apps/desk/src/api/client.ts` gana `getClient(id)` (junto a `searchClients`, L185-187); `CreateTicket.tsx:148-157` sustituye la búsqueda por `getClient(e.clientId)`. Sin prueba propia (endpoint ya cubierto; `.tsx` fuera de red).

## Fase 5 · P5 — `CrearRemision.tsx:195`

- [x] 5.1 `{!data.equipo.serial && (` → `{!(data.equipo.serial ?? '').trim() && (`. Sin prueba: `.tsx` excluido por decisión de Gerencia (F0-00); no se propone `jsdom`/`@testing-library` ni ampliar `vitest.config.ts`.

## Fase 6 · Cierre

- [x] 6.1 Anotar el desvío `ticketService.ts:39` (cuerpo↔`ov.clientId`, sin destino, criterio nº 8) en `CLAUDE.md` (tabla de incumplimientos vivos) y en `openspec/config.yaml` (`incumplimientos_vivos`), sin inventar destino.
- [x] 6.2 `npm test` completo → verde, ≥ 990 pruebas + 2 omitidas (las mismas), 0 roto del baseline.
- [x] 6.3 `npm run typecheck` limpio.
- [x] 6.4 `npm run lint` sin avisos nuevos.
- [x] 6.5 Un solo commit en `main`: conventional commit, español, sin líneas de atribución de IA.
