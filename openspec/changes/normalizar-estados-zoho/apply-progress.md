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

## Lote L2

Base del intento: `51e1e9a7`.

### L2.1 Línea base (antes de editar)

`npx vitest run` sobre `informeContrato.test.ts`, `relojSla.test.ts`, `migracionTicketsAbiertos.test.ts`, `migracionTicketsAbiertosRuta.test.ts` y los cuatro
ficheros de L1 → **8 ficheros, 119 pruebas, todas en verde** (12 + 19 + 18 + 36 + 14 + 10 + 6 + 4).

### L2.2-L2.4 Rojos, vistos ANTES del verde

Bloque L2 añadido al final de `apps/desk/server/normalizarEstadosZoho.test.ts` (sin tocar una línea existente) y bloque de la fila 12 al final de
`apps/desk/server/db/informeContrato.test.ts`. Los ocho ficheros de producción siguen sin editar. En todos, la causa es la esperada: el lector devuelve el crudo.

| Fila | Prueba | Aserción observada | Causa |
|---|---|---|---|
| 8 | `normalizarEstadosZoho.test.ts` · `GET /api/accounts/:id` | `dos: 'Notificación  Comercial'` recibido, `'Notificación Comercial'` esperado | `directory.ts:26` copia `x.status` |
| 9 | ídem · `getAnalisisRows` | `'Notificación  Comercial'` recibido en vez de `'Notificación Comercial'` | `analisis.ts:20` pasa la fila cruda |
| 10 | ídem · indicadores | recibido `[['a1',' Anulado'],['ok','Finalizado']]`, esperado `[['ok','Finalizado']]` | `esAnulado(' Anulado')` es falso: el ticket entra |
| 11 | ídem · reasignar | `expect(dos.status).toBe(uno.status)`: `403` recibido, `422` esperado (el gemelo, con el permiso pasado, cae en «motivo obligatorio») | `reasignaciones.ts:18` lee el crudo y `puedeReasignar` no lo encuentra en ningún `from` |
| 13 | ídem · `migrarTicketsAbiertos` en seco | `expected { …(2) } to be null` (`negativa`) | el de dos espacios no tiene equivalencia |
| 14 | ídem · `sincronizarEstadoPorRemision` | `expected 'Ticket  creado' to be 'Remisión creada'` | `estadoPorRemision.ts:40` compara el crudo con `TRANSICION_REMISION_*.from` |
| 15 | ídem · reloj, ticket sucio | `expected null to deeply equal [ … ]` | `relojSla.ts:58` compara `Notificación Comercial` con `Notificación  Comercial` |
| 15 | ídem · reloj, historial sucio | `expected null to deeply equal [ … ]` | ídem, al revés |
| 15 | ídem · reloj, origen sucio | `estado: 'Ingresado  '` recibido, `'Ingresado'` esperado | `relojSla.ts:45` no normaliza `de` |
| 12 | `informeContrato.test.ts` · `Finalizado ` | `[ 'OV-2026-170-01', 'en_curso' ]` recibido, `'ejecutada'` esperado | `informeContrato.ts:45` pasa el crudo a `estadoSubOV` |

Verdes a propósito en el rojo (fijan lo que NO debe cambiar y son el gemelo limpio): el gemelo `uno` en cada fila, la precondición de crudo, la segunda prueba de la fila 12
(`En  Reparación` sigue `en_curso`) y el caso del reloj con ambos lados limpios.

### L2.5 Verde en sitio

Ocho ficheros de producción, cada hunk una línea por una línea (`wc -l` antes y después idéntico: `directory.ts` 69, `reasignaciones.ts` 53, `informeContrato.ts` 77,
`migracionTicketsAbiertos.ts` 106, `estadoPorRemision.ts` 61, `relojSla.ts` 109, `analisis.ts` 52, `indicadores.ts` 134). Todas las funciones salen de `@ambientalia/shared`.

| Fila | Línea | Edición |
|---|---|---|
| 8 | `apps/desk/server/db/directory.ts:2`, `:26` | importa `normalizarEstado`; `status: normalizarEstado(x.status ?? '')` |
| 9 (y 17) | `apps/desk/server/analisis.ts:2`, `:20` | importa `conEstadoNormalizado`; `const filas = (r.rows as any[]).map(conEstadoNormalizado)` |
| 10 | `apps/desk/server/indicadores.ts:2`, `:66` | importa `conEstadoNormalizado`; `for (const r of rt.rows.map(conEstadoNormalizado)) {` |
| 11 | `apps/desk/server/db/reasignaciones.ts:2`, `:18` | segunda sentencia de importación en la misma línea física (el fichero no importaba de `shared`); `status: normalizarEstado(String(f.status))` |
| 12 | `apps/desk/server/db/informeContrato.ts:4`, `:45` | importa `normalizarSiTexto`; `estadoSubOV(t ? normalizarSiTexto(t.status) : null)` |
| 13 | `apps/desk/server/db/migracionTicketsAbiertos.ts:5`, `:36` | importa `normalizarEstado`; `status: normalizarEstado(String(f.status))` |
| 14 | `apps/desk/server/db/estadoPorRemision.ts:11`, `:40` | importa `normalizarSiTexto`; `const actual = normalizarSiTexto(… ?.status)` (el `undefined` sigue pasando a `:41`) |
| 15 | `apps/desk/server/db/relojSla.ts:3`, `:45`, `:58` | importa `normalizarSiTexto`; `de`/`hacia` normalizados y `=== normalizarSiTexto(ticket.status)` |

Verde: `normalizarEstadosZoho.test.ts` 15/15 y `informeContrato.test.ts` 14/14; con los demás ficheros del lote y sus pruebas vecinas (`directory`, `analisis`,
`indicadores`, `reasignaciones`, `estadoPorRemision`, `relojSla`, `migracionTicketsAbiertos`, `migracionTicketsAbiertosRuta`): **10 ficheros, 185 pruebas en verde**.
Ninguna prueba existente se tocó ni cambió de resultado.

### L2.6 Filas «no le afecta» (7, 16, 22-27)

Sin edición. `packages/zoho-sync/src/sync.test.ts` (fila 7), `packages/zoho-sync/src/db/repo.test.ts` (filas 16 y 22; fija `TICKET_COLS` en `:544`),
`apps/desk/server/services/avisoFacturacionVencida.test.ts` (22), `apps/desk/server/services/ticketService.test.ts` (16 y 23), `apps/desk/server/db/traspaso.test.ts` (24),
`apps/desk/server/db/conversacion.test.ts` y `apps/desk/server/db/historial.test.ts` (25), `apps/desk/server/db/equipos.test.ts` (26),
`apps/desk/server/db/eliminarTicket.test.ts` (27), `apps/desk/server/superficieSaliente.test.ts`, `packages/shared/src/migracionTickets.test.ts` y
`apps/desk/server/ordenVentaUnTicket.test.ts`: **12 ficheros, 368 pruebas en verde**.

### TDD Cycle Evidence (L2)

| Tarea | Fichero de prueba | Capa | Línea base | ROJO | VERDE | Triangulación | Refactor |
|---|---|---|---|---|---|---|---|
| L2.2 filas 8-11, 13-15 | `apps/desk/server/normalizarEstadosZoho.test.ts` | HTTP (supertest + pg-mem) y unitaria directa | 6/6 del bloque L1 | 9 de 9 rojas del bloque nuevo, por el crudo | 15/15 | gemelo limpio en cada fila; reloj en los dos sentidos más el origen | nada |
| L2.3 fila 12 | `apps/desk/server/db/informeContrato.test.ts` | Integración pg-mem | 12/12 | 1 de 2 roja | 14/14 | `Finalizado ` y `Finalizado`; `En  Reparación` sigue en curso | nada |

### Medida del intento (L2.c la cierra el orquestador)

- `git diff --shortstat --no-renames 51e1e9a7` → 12 ficheros, **230 inserciones, 23 borrados** (253). De ellas, código y pruebas: 155 inserciones y 17 borrados (172); el resto son `apply-progress.md` (+69) y `tasks.md` (6/6). Sin ficheros nuevos sin trackear (todo es edición de ficheros ya versionados). Ningún binario.

### Apoyo fuera del contenido de F1F-01: cherry-pick de `51e92f29` (main)

- **Por qué:** la primera pasada de `npm test` del intento 4 (`npmtest-nez-i4-185437.log`, 484,7 s) salió 1 con 321 ficheros y 5565 pruebas en
  verde y un único error no controlado, «[vitest-worker]: Timeout calling "onTaskUpdate"», sin fichero. En ese log,
  `apps/desk/server/citas/instalador.test.ts` (61,9 s) es el único fichero por encima de 60 s que no cede el bucle; `hook.bordes.test.ts` (141 s) y
  `hook.test.ts` (165 s) sí lo ceden.
- **Qué:** `git cherry-pick 51e92f29` (commit de `main`, fuera-del-plan, `decision/excepcion-ceder-bucle-instalador-cli` en `openspec/config.yaml` →
  `decisiones_de_gerencia_adenda`, por clave; su registro es `4b86482a`, que NO se trae). En esta rama es `db3fe0a6`.
- **Contenido:** sólo ficheros de prueba, molde de `df883868`: `afterEach(cederAlBucle)` al final de `apps/desk/server/citas/instalador.test.ts` y
  `apps/desk/server/citas/cli.test.ts`, con el import editado en su misma línea, sin desplazar ninguna. +10/−4.
- **No es contenido de F1F-01:** no realiza nada de RQ-ZS-24 ni de RQ-TC-40. **La medida del intento 4 incluye sus 14 líneas** (10 insertadas y 4
  borradas).

### L2.c Cierre del intento 4 (orquestador)

- Commit del apply `6b3b5fcc` sobre `51e1e9a7`; cherry-pick `db3fe0a6` (apartado anterior).
- `npm test` SOLO con log: primera pasada en 1 por el único error no controlado del apartado anterior (`npmtest-nez-i4-185437.log`); tras el
  cherry-pick, **0** (`npmtest-nez-i4b-192651.log`: 321 ficheros y 5565 pruebas en verde, 3 ficheros y 11 pruebas saltados, 333,6 s;
  `instalador.test.ts` 42,2 s, `cli.test.ts` 29,9 s, `hook.bordes.test.ts` 91,2 s, `hook.test.ts` 103,3 s), sin errores no controlados.
- typecheck 0; lint 0 errores (172 avisos, los mismos que en la primera pasada del intento: el cherry-pick no añade ninguno); detector sobre el
  commit de este cierre.
- Regla 13 / mutación 3: `git diff --stat f5465799 -- apps/desk/src` vacío.

## Lote L3

Base del intento: `e15a9d6a`. L3.1-L3.8 hechas; L3.c la cierra el orquestador.

### L3.1 Línea base (antes de editar)

`npx vitest run` sobre `apps/desk/server/db/sla.test.ts`, `alarmasAvisadas.test.ts`, `esperasVencidas.test.ts`, `apps/desk/server/services/alarmasSla.test.ts` y `avisoSalidasEsperas.test.ts`
→ 5 ficheros, **67 pruebas, todas en verde** (16 + 7 + 6 + 18 + 20). Las líneas citadas por L3.7 y L3.8 se comprobaron contra el árbol antes de editar y dicen lo que el diseño afirma
(`sla.ts:45` y `:89`, `alarmasAvisadas.ts:21`, `esperasVencidas.ts:30`, `:37`, `:42`; los `newDb()` de los seis ficheros de pg-mem; las importaciones de `:2` y `:4`).

### L3.2-L3.5 Rojos, vistos ANTES del verde

| Tarea | Prueba | Aserción observada | Causa |
|---|---|---|---|
| L3.2 | `apps/desk/server/testing/pgMemEstado.test.ts` (todo el fichero) | `Error: Cannot find module './pgMemEstado'` | La imitación no existe: es la causa esperada |
| L3.3 fila 18 | `normalizarEstadosZoho.test.ts` · «`Notificado ` y `Notificado` con entrada vencen los dos…» | `expected [ [ 'uno', 'Notificado' ] ] to deeply equal [ [ 'dos', 'Notificado' ], …(1) ]` | `sla.ts:45` filtra `status IN ('Notificado', …)` con el crudo: el de un espacio de más ni se selecciona |
| L3.3 fila 20 | ídem · «`Notificación  cliente` con entrada y marca queda marcado…» | `expected [ 'uno' ] to deeply equal [ 'dos', 'uno' ]` | `alarmasAvisadas.ts:21` filtra el crudo; el gemelo de dos espacios no sale en la marca |
| L3.3 fila 21 | ídem · «`Solicitado ` y `Solicitado` con historial de la app…» | `expected [ { id: 'uno', number: 1005, …(3) } ] to deeply equal [ …(2) ]` | `esperasVencidas.ts:30` filtra el crudo; sólo el gemelo limpio es una espera |
| L3.3 espía | ídem · «ninguna de las tres emite un UPDATE…» | `expected [ +0, +0, +0 ] to deeply equal [ 1, 1, 1 ]` | Las tres consultas devuelven vacío para el ticket de espacios de más; el espía sí ve consultas (`calls.length > 0`) y ningún `UPDATE` |
| L3.4 | `apps/desk/server/db/normalizarEstado.integration.test.ts` | **no puede ponerse rojo aquí**: 15 pruebas saltadas, `TEST_DATABASE_URL` sin definir | Se salta sin la variable (molde de `migracionConcurrente.integration.test.ts`). Su rojo (el caso b, `ticketsEnEspera` con el par de gemelos) sólo existiría en CI. **No se ha ejecutado contra PostgreSQL real en esta máquina: hipótesis hasta que corra el CI de PostgreSQL 17.** |

Verdes a propósito dentro del rojo: las precondiciones de crudo (`expect(await crudo('dos')).toBe(…)`) y el gemelo limpio de cada prueba. Se descartó una prueba «sin entrada no hay alarma» que salía
verde por vacío y no distinguía nada (colección vacía sin contraste); la subconsulta de `sla.ts:89` la ejerce la prueba de la fila 18 (si se quedara cruda, `dos` no tendría entrada y no vencería).

**Qué dice pg-mem sin la imitación** (medido con una consulta suelta): `ERROR: function btrim(text) does not exist`, con la pista de que pg-mem implementa muy pocas funciones nativas. No hizo falta reordenar pasos:
el rojo de L3.3 viene de comparar el crudo (la consulta aún no usa la función), no de «función desconocida», porque L3.8 se hace después de L3.6 y L3.7.

### L3.6-L3.8 Verde

- **L3.6** `apps/desk/server/testing/pgMemEstado.ts` (nuevo, 38 líneas): `conFuncionesDeEstado(mem)` registra en `mem.public` `btrim(text)` (recorta sólo U+0020) y `regexp_replace(text, text, text, text)`, que sólo
  acepta `' {2,}'`, `' '` y `'g'` y lanza «imitación fuera de alcance» con cualquier otra cosa. Los `NULL` no llegan a la función (pg-mem devuelve `NULL` si no se pide `allowNullArguments`; lo fija la prueba de NULL).
  `pgMemEstado.test.ts`: **20/20** a la primera (14 muestras de la spec contra `normalizarEstado`, `btrim` sólo U+0020, `NULL`, `WHERE … IN`, tres patrones/reemplazos/banderas ajenos).
- **L3.7** registro en sitio, una línea por una línea (la importación va en la misma línea que `import { newDb } from 'pg-mem'`, separada por `;`): `apps/desk/server/testing/appHarness.ts:2`, `:36`;
  `apps/desk/server/db/sla.test.ts:2`, `:7`; `alarmasAvisadas.test.ts:2`, `:17`; `esperasVencidas.test.ts:2`, `:14`; `apps/desk/server/services/alarmasSla.test.ts:4`, `:27`; `avisoSalidasEsperas.test.ts:4`, `:19`.
- **L3.8** `sqlEstadoNormalizado('status')` en sitio, en `SELECT` (`… AS status`) y `WHERE`: `apps/desk/server/db/sla.ts:45` y `:89` (importación en `:2`); `apps/desk/server/db/alarmasAvisadas.ts:21` (importación
  en `:2`); `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` (importación en `:2`). pg-mem aceptó el alias `AS status` con la misma columna en el `WHERE`; que PostgreSQL real también lo acepte lo cierra la
  integración (caso b) en CI.

`wc -l` antes y después, **idéntico** en los nueve ficheros editados en sitio: `appHarness.ts` 141, `sla.test.ts` 273, `alarmasAvisadas.test.ts` 82, `esperasVencidas.test.ts` 87, `alarmasSla.test.ts` 264,
`avisoSalidasEsperas.test.ts` 224, `sla.ts` 125, `alarmasAvisadas.ts` 35, `esperasVencidas.ts` 60. Sólo `normalizarEstadosZoho.test.ts` crece (bloque L3 al final: 219 → 307 líneas, sin tocar una existente).

Verde: fichero de aceptación **19/19**; los cinco ficheros de la línea base **67/67**.

### TDD Cycle Evidence (L3)

| Tarea | Fichero de prueba | Capa | Línea base | ROJO | VERDE | Triangulación | Refactor |
|---|---|---|---|---|---|---|---|
| L3.2 | `apps/desk/server/testing/pgMemEstado.test.ts` | Unitaria sobre pg-mem | N/A (nuevo) | módulo inexistente | 20/20 | 14 muestras, NULL, `IN`, tres entradas ajenas | un escape inútil (`\s`, lint) corregido en la prueba |
| L3.3 | `apps/desk/server/normalizarEstadosZoho.test.ts` (bloque L3) | Integración pg-mem | 15/15 (L1+L2) y 67/67 | 4 de 4 rojas, por el crudo | 19/19 | gemelo limpio en cada fila; espía de escrituras | se quitó una prueba trivial (vacío sin contraste) |
| L3.4 | `apps/desk/server/db/normalizarEstado.integration.test.ts` | Integración PostgreSQL real | N/A (nuevo) | no ejecutable en local (se salta) | 15 saltadas | 14 muestras + par de gemelos | — |

### Regla 13 / mutación 3 (L3)

`git diff --stat e15a9d6a -- apps/desk/src apps/desk/server/services/ticketService.ts` → **vacío**. L3 no toca ninguna decisión del cliente: las filas 18-21 son consultas del servidor.

### Vecinos y comprobaciones

- 77 ficheros de prueba (todos los que usan `instalarArnes`, los cinco de pg-mem del lote, `pgMemEstado.test.ts`, la integración, y `migracionMarcadorLectores`, `listaRemisionCreada`, `prioridadTop5`, `propagarTop5`,
  `routes/reasignacion`, `db/migracionTicketsAbiertos` por llegar a `entradasActuales`, `ticketsEnEspera` o `colaTaller`): **76 en verde, 1 saltado (la integración); 1792 pruebas pasan, 15 saltadas, 0 fallan**.
- `npm run typecheck` → 0. `npm run lint` → 0 errores, **172 avisos** (los mismos que antes del lote; la primera pasada traía 174 por dos `as any` del bloque L3 y un escape inútil, ya corregidos).

### Medida del intento (L3.c la cierra el orquestador)

- `git diff --shortstat --no-renames e15a9d6a` (antes de añadir este apartado): 10 ficheros, **109 inserciones, 21 borrados** (130). De ellas, 88 son el bloque L3 de `normalizarEstadosZoho.test.ts`, 8 líneas de producción
  y 12 de prueba editadas una por una, y 8 de `tasks.md`.
- Sin trackear (`git ls-files --others --exclude-standard`, `wc -l`): `normalizarEstado.integration.test.ts` 82, `pgMemEstado.test.ts` 70, `pgMemEstado.ts` 38 = **190**.
- **Suma de código y pruebas: 320** (130 + 190), más este apartado de `apply-progress.md` (artefacto): por debajo de la válvula de 720. Ningún binario.

### L3.c Cierre del intento 5 (orquestador)

- Commit del apply `8c81a6d6` sobre `e15a9d6a`. Informe del ejecutor contrastado contra el árbol: `git diff --numstat` (10 ficheros de código y
  pruebas, 8 de producción y 12 de prueba editadas una por una, bloque de 88 al final de la aceptación), los tres nuevos (82 + 70 + 38) y la
  forma SQL en `SELECT` y `WHERE` de las seis líneas de L3.8 coinciden con lo que dice.
- `npm test` SOLO con log: **0** (`npmtest-nez-i5-200005.log`: 322 ficheros y 5589 pruebas en verde, 4 ficheros y 26 pruebas saltados —entre
  ellos la integración nueva, sin `TEST_DATABASE_URL`—, 321,2 s), sin errores no controlados.
- typecheck 0; lint 0 errores (172 avisos, los mismos que antes del lote); detector 0 (13 abreviadas, informativas).
- **En CI la integración corre contra PostgreSQL 17 (`.github/workflows/ci.yml`); en local se salta.** Que PostgreSQL real acepte la forma de las
  consultas sigue siendo hipótesis hasta esa pasada.
- Regla 13 / mutación 3: `git diff --stat f5465799 -- apps/desk/src` vacío.
