# apply-progress — `normalizar-estados-zoho` (F1F-01, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\normalizar-estados-zoho`, base `f61b0b60`. `strict_tdd`: rojo visto y anotado antes del verde.

## Lote L1

### L1.1 Línea base (antes de editar)

`npx vitest run packages/zoho-sync/src/db/repo.test.ts apps/desk/server/tickets.test.ts apps/desk/server/transiciones.test.ts apps/desk/server/superficieSaliente.test.ts`
→ 4 ficheros, **113 pruebas, todas en verde** (45 + 38 + 28 + 2).

### L1.2-L1.6 Rojos, vistos ANTES del verde

| Tarea | Prueba | Aserción observada | Causa |
|---|---|---|---|
| L1.2 | `packages/shared/src/normalizarEstado.test.ts` (todo el fichero) | `Error: Cannot find module './normalizarEstado'` | El módulo no existe: es la causa esperada |
| L1.3 | `estadoNormalizado.test.ts` · «dos espacios de Zoho se guardan con uno» | `expected 'Notificación  Comercial' to be 'Notificación Comercial'` | `mappers.ts:47` copia `raw.status` tal cual: la sincronización guarda dos espacios (fila 1) |
| L1.3 | ídem · «espacios en los extremos y repetidos…» | `expected '  En   Proceso ' to be 'En Proceso'` | Ídem |
| L1.3 | ídem · `getActiveTickets`, `getAllTickets`, `getTicketWithRefs` | `expected 'Notificación  Comercial' to be 'Notificación Comercial'` | Los lectores devuelven la fila cruda (filas 2 y 3) |
| L1.3 | ídem · `getClosedTickets` | `expected ' Anulado' to be 'Anulado'` | Ídem |
| L1.4 | `normalizarEstadosZoho.test.ts` · `GET /api/tickets` | `expected 'Notificación  Comercial' to be 'Notificación Comercial'` | Lector crudo (fila 2) |
| L1.4 | ídem · `GET /api/tickets/:id` | `expected 'Notificación  Comercial' to be 'Notificación Comercial'` | Lector crudo (fila 3) |
| L1.4 | ídem · botones del de dos espacios | `expected 0 to be greater than 0` | `transicionesDelTicket` recibe el crudo, que no está en ningún `from` |
| L1.4 | ídem · transición | `expected 409 to be 200` | La guarda `t.from.includes(current.row.status)` lee el crudo (fila 4, sale del lector de la fila 3) |
| L1.5 | `estadosZohoCatalogo.test.ts` · «cada valor distinto, normalizado…» y «mutación 2» | `TypeError: undefined is not a function` | `normalizarEstado` aún no se exporta de `@ambientalia/shared` |

Pruebas que ya salen verdes en el rojo, a propósito (fijan lo que NO debe cambiar): la precondición de crudo de la siembra, `getTicketRow` crudo (fila 5), «las lecturas no escriben» y el gemelo limpio.

### L1.7-L1.8 Verde

- `packages/shared/src/normalizarEstado.ts` (nuevo, 18 líneas, el código de `design.md` «El módulo») y una línea nueva en `packages/shared/src/index.ts:54` (`export * from './normalizarEstado'`, tras la `:53`).
- En sitio, misma línea física: `packages/zoho-sync/src/db/mappers.ts:2` (importación) y `:47` (`status: normalizarSiTexto(raw.status as string)`); `packages/zoho-sync/src/db/repo.ts:129` (la importación de `@ambientalia/shared` que ya existía pasa a `import { conEstadoNormalizado, type BusquedaTickets } from '@ambientalia/shared'`, sin segunda sentencia del mismo módulo), `:139` y `:209` (`row: conEstadoNormalizado(row) as TicketRow`).
- No se tocan `getTicketRow` (`repo.ts:119-122`), `rowToTicket` (`mappers.ts:200`), `rowToTicketDetail` (`mappers.ts:236`), `apps/desk/src` ni `ticketService.ts`.
- Los ficheros del árbol de trabajo son CRLF (`core.autocrlf=true`); las ediciones en sitio conservaron CRLF.

Verde: los 4 ficheros nuevos + los 4 de la línea base: **8 ficheros, 147 pruebas en verde** (14 + 10 + 6 + 4 de las nuevas = 34; 113 de la línea base).

### TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Línea base | ROJO | VERDE | Triangulación | Refactor |
|---|---|---|---|---|---|---|---|
| L1.2 | `packages/shared/src/normalizarEstado.test.ts` | Unitaria | N/A (nuevo) | módulo inexistente | 14/14 | 2-3 casos por comportamiento | nada que limpiar |
| L1.3 | `packages/zoho-sync/src/db/estadoNormalizado.test.ts` | Integración pg-mem | 45/45 `repo.test.ts` | 6 de 10 rojas | 10/10 | cinco lectores + gemelo limpio + crudo de `getTicketRow` | nada |
| L1.4 | `apps/desk/server/normalizarEstadosZoho.test.ts` | HTTP (supertest + pg-mem) | 38/38 + 28/28 + 2/2 | 4 de 6 rojas | 6/6 | par de gemelos en cada caso | nada |
| L1.5 | `apps/desk/server/estadosZohoCatalogo.test.ts` | Unitaria sobre fichero | N/A (nuevo) | 2 de 4 rojas | 4/4 | caso permanente de la mutación 2 | nada |

Corrección tras el verde: dos cadenas de prueba traían un NBSP literal (no ` `); `eslint` (`no-irregular-whitespace`) lo marcó y se reescribieron con la secuencia de escape. Sin cambio de comportamiento.

### L1.9 Regla 13 / mutación 3

`git diff --stat f5465799 -- apps/desk/src apps/desk/server/services/ticketService.ts` → **vacío** (ningún fichero de `apps/desk/src` ni `ticketService.ts` cambia).

Decisiones del cliente sobre el estado (tabla de `design.md` «Regla 13 / mutación 3»), cada una con la línea del servidor/dato que la impone, todas leídas ya normalizadas desde este lote:

| Decisión | Cliente | Servidor o dato |
|---|---|---|
| Columna del tablero | `apps/desk/src/board.ts:9` | vista; consume `packages/zoho-sync/src/db/repo.ts:139` |
| Botones de transición | `apps/desk/src/components/TransitionPanel.tsx:56` | `apps/desk/server/services/ticketService.ts:126` sobre el mismo valor (`repo.ts:209`) |
| Ejecutor de la salida de espera | `apps/desk/src/components/TransitionPanel.tsx:57` | `apps/desk/server/services/ticketService.ts:131` |
| Orden de motivos de anulación | `apps/desk/src/components/TransitionPanel.tsx:163` | sólo orden; el motivo lo valida `ticketService.ts:134` |
| «En espera» en la vista | `apps/desk/src/lib/boardView.ts:39` | vista; consume `repo.ts:139` |
| Panel de reasignar | `apps/desk/src/components/PanelReasignar.tsx:30` | `apps/desk/server/routes/reasignacion.ts:29` (llega en L2) |
| Botón «Crear remisión» | `apps/desk/src/lib/botonRemision.ts:31` | ninguna línea por estado: hallazgo previo (P-4), no lo introduce este cambio |
| Hermanos | `apps/desk/src/components/TicketDetailView.tsx:45` | vista; ambos lados de `repo.ts:139` y `:209` |
| Espera en la ficha de cliente | `apps/desk/src/components/ClienteDetalle.tsx:36` | vista; `apps/desk/server/db/directory.ts:26` (llega en L2) |
| Colores | `ClienteDetalle.tsx:41`, `TicketCard.tsx:26` | color (IV-9); sin decisión |

### L1.10 Medida

- `git diff --shortstat --no-renames f61b0b60` → 3 ficheros, **6 inserciones, 5 borrados** (11).
- Sin trackear (`wc -l`): `normalizarEstado.ts` 18, `normalizarEstado.test.ts` 99, `estadoNormalizado.test.ts` 93, `normalizarEstadosZoho.test.ts` 106, `estadosZohoCatalogo.test.ts` 51 = **367**.
- Bruto de código y pruebas: **378** (< ~400). Con este `apply-progress.md` (artefacto) sube a ~430. **No se muda L1.5**: el catálogo se queda en L1.
- Ningún binario.

### L1.c Cierre del intento 3 (orquestador)

- Commit `e4fe78d7` sobre `f61b0b60`: detector 0 (13 abreviadas, informativas), typecheck 0, lint 0 errores (171 avisos).
- `npm test` SOLO con log: dos pasadas en 1, sólo por plazo y sólo en el hook de citas. `npmtest-nez-i3-165826.log`: una roja,
  «nombre no ASCII» de `apps/desk/server/citas/hook.bordes.test.ts` (30.979 ms). `npmtest-nez-i3b-173210.log`: cuatro rojas, «nombre no
  ASCII» (32.533 ms) y M20 (43.249 ms) de `apps/desk/server/citas/hook.bordes.test.ts`, M1 (33.571 ms) y «rama nueva» (41.012 ms) de
  `apps/desk/server/citas/hook.test.ts`, todas «Test timed out in 30000ms». Ninguna de este cambio, que no toca `apps/desk/server/citas/`.

### Apoyo fuera del contenido de F1F-01: cherry-pick de `029e46b5` (main)

- **Qué:** `git cherry-pick 029e46b5` (commit de `main`, fuera-del-plan, `decision/excepcion-plazos-hook-citas` en
  `openspec/config.yaml` → `decisiones_de_gerencia_adenda`, por clave; su registro es `88f653c9`, que NO se trae). En esta rama es `793ca755`.
- **Contenido:** sólo ficheros de prueba, en sitio, sin mover líneas: `LENTO` de 30_000 a 60_000 en
  `apps/desk/server/citas/hook.test.ts:12` y `apps/desk/server/citas/hook.bordes.test.ts:17`, y `{ timeout: 60_000 }` en
  `apps/desk/server/citas/cli.test.ts:18` y `:35`. +4/−4.
- **No es contenido de F1F-01:** no realiza nada de RQ-ZS-24 ni de RQ-TC-40. Se trae para que el `npm test` de esta rama no caiga por
  plazo en esta máquina. **La medida del intento 3 incluye sus 8 líneas** (4 insertadas y 4 borradas).
