```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:39e54ca68e42668aa70dfada9caaa19e84888ddf524fd71b0949a95d42e1dc8f
verdict: pass
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 31/31
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:37a5992256d776cd4458eb729ce4e069fa588972594ae47a5ffceeb6820114e6
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: `normalizar-estados-zoho` (tanda F1F-01, `cierra: no`)
**Version**: N/A (dos deltas: ADDED RQ-ZS-24, MODIFIED RQ-TC-40)
**Mode**: Strict TDD
**Revisión verificada**: `06a6dff3` (rama `normalizar-estados-zoho`, árbol limpio; base del cambio `46c5199b`, primer commit `f5465799`)
**Verificador**: independiente, no participó en la construcción. Todo lo de abajo se contrastó contra el árbol, no contra `apply-progress.md`.

### Veredicto

**PASS CON AVISOS** — 0 CRÍTICOS, 3 AVISOS, 3 SUGERENCIAS. Los tres criterios de éxito de la propuesta (`openspec/changes/normalizar-estados-zoho/proposal.md:174-179`) se cumplen en lo medible aquí. Lo que afirma la integración contra PostgreSQL real es **hipótesis** hasta el CI (AVISO 1).

### Completeness

| Metric | Value |
|--------|-------|
| Tareas L1-L4 (incl. `.c`) | todas `[x]` |
| Tareas V.1 y V.2 | las completa este informe |
| Tareas A.1-A.4 (archive) | pendientes, fuera de alcance de verify |
| Tareas de persona P-1..P-4 | fuera del recuento (regla del ciclo 1) |

### Build & Tests Execution

**Tests**: ✅ `npm test` salió **0** — 322 ficheros pasan, 4 saltados (326); 5589 pruebas pasan, 26 saltadas (5615); 443,20 s. Log: `C:\Users\algar\AppData\Local\Temp\claude\C--dev-Desk-2-R1-023\97934bce-2b71-4a5e-96c1-499cb422a4fd\scratchpad\npmtest-nez-verify-204147.log` (sha256 `37a59922…14e6`). Corrido en primer plano y en serie, sin `| tail`.
Ficheros del cambio, todos verdes en esa pasada: `normalizarEstadosZoho.test.ts` (19), `estadoNormalizado.test.ts` (10), `pgMemEstado.test.ts` (20), `estadosZohoCatalogo.test.ts` (4), `normalizarEstado.test.ts` (14), `superficieSaliente.test.ts` (2). La integración `apps/desk/server/db/normalizarEstado.integration.test.ts` salió **15 saltadas** (sin `TEST_DATABASE_URL`).
**Build (typecheck)**: ✅ `npm run typecheck` salió **0**. Log `scratchpad\typecheck-nez-verify.log` (sha256 `f9de8b15…e547`).
**Lint**: ✅ `npm run lint` salió **0** (0 errores, **172 avisos**, los esperados). Log `scratchpad\lint-nez-verify.log`.
**Detector de citas**: ✅ `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` salió **0**; 13 abreviadas rotas, informativas, ninguna en ficheros de este cambio (`scratchpad\citas-nez-verify.log`). Sobre `HEAD` no ve este informe (sin commit): lo corre el orquestador sobre el commit del informe.
**Coverage**: ➖ no ejecutado (informativo, no bloquea).

### V.1 · Tabla de diseño 1-29, fila a fila

Contraste: `git diff f5465799 06a6dff3 -- apps packages` (33 ficheros, +841/−51). Producción tocada: todo EN SITIO (una línea por una línea) salvo `packages/shared/src/index.ts:54` (línea nueva al final) y los ficheros nuevos.

| # | Producción que la cumple (leída en el diff) | Prueba que la fija (pasó en la pasada) |
|---|---|---|
| 1 | `packages/zoho-sync/src/db/mappers.ts:47` `status: normalizarSiTexto(raw.status as string)` | `packages/zoho-sync/src/db/estadoNormalizado.test.ts:30` y `:35` · mutación M1 repetida (abajo) |
| 2 | `packages/zoho-sync/src/db/repo.ts:139` `row: conEstadoNormalizado(row) as TicketRow` | `estadoNormalizado.test.ts:49`, `:56`, `:63`; `apps/desk/server/normalizarEstadosZoho.test.ts:33` y `:55` · M2 repetida |
| 3 | `packages/zoho-sync/src/db/repo.ts:209` ídem | `estadoNormalizado.test.ts:70`; `normalizarEstadosZoho.test.ts:46` y `:84` (200, no 409) |
| 4 | Sin cambio: el diff de `apps/desk/server/services/ticketService.ts` es vacío; lee el objeto de la fila 3 | `normalizarEstadosZoho.test.ts:84` (`200`, `from_status` normalizado, filas previas intactas, `zohoFetch` sin llamar) |
| 5 | `getTicketRow` sin cambio; búsqueda de `getTicketRow(` fuera de `*.test.ts`: sólo la definición `packages/zoho-sync/src/db/repo.ts:119` (comprobado) | `estadoNormalizado.test.ts:89` (devuelve el crudo) |
| 6 | `rowToTicket` y `rowToTicketDetail` sin cambio (`mappers.ts` sólo toca la `:2` y la `:47`) | cubierta por M2 y M3 |
| 7 | `packages/zoho-sync/src/sync.ts:307` compara la columna con su propia marca (`:319`); sin cambio, comprobado | sin prueba nueva (diseño) |
| 8 | `apps/desk/server/db/directory.ts:26` `normalizarEstado(x.status ?? '')` | `normalizarEstadosZoho.test.ts:126` |
| 9 | `apps/desk/server/analisis.ts:20` `.map(conEstadoNormalizado)` | `normalizarEstadosZoho.test.ts:139` |
| 10 | `apps/desk/server/indicadores.ts:66` `rt.rows.map(conEstadoNormalizado)` | `normalizarEstadosZoho.test.ts:148`; cae con M5 |
| 11 | `apps/desk/server/db/reasignaciones.ts:18` `normalizarEstado(String(f.status))` | `normalizarEstadosZoho.test.ts:159` |
| 12 | `apps/desk/server/db/informeContrato.ts:45` `normalizarSiTexto(t.status)` | bloque añadido al final de `apps/desk/server/db/informeContrato.test.ts` (`Finalizado ` ejecutada; `En  Reparación` sigue en curso) |
| 13 | `apps/desk/server/db/migracionTicketsAbiertos.ts:36` `normalizarEstado(String(f.status))` | `normalizarEstadosZoho.test.ts:172` |
| 14 | `apps/desk/server/db/estadoPorRemision.ts:40` `normalizarSiTexto(…?.status)`; la guarda de la `:41` intacta | `normalizarEstadosZoho.test.ts:183` |
| 15 | `apps/desk/server/db/relojSla.ts:45` y `:58` (los dos lados) | `normalizarEstadosZoho.test.ts:203`, `:208`, `:213` |
| 16 | `apps/desk/server/db/relojSla.ts:44` sin cambio; `to_status` sale del catálogo (`packages/zoho-sync/src/db/repo.ts:317`, `:429`) | «no le afecta», comprobado |
| 17 | `apps/desk/server/db/relojSla.ts:72` sin cambio; recibe de la fila 9 | fila 9 |
| 18 | `apps/desk/server/db/sla.ts:45` forma SQL en `SELECT` y `WHERE` | `normalizarEstadosZoho.test.ts:238` |
| 19 | `apps/desk/server/db/sla.ts:89` forma SQL en la subconsulta | `normalizarEstadosZoho.test.ts:238` y `:257` (cae con M4b según apply-progress; no repetida aquí) |
| 20 | `apps/desk/server/db/alarmasAvisadas.ts:21` forma SQL en `SELECT` y `WHERE` | `normalizarEstadosZoho.test.ts:257` (camino que traga errores) |
| 21 | `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` | `normalizarEstadosZoho.test.ts:271` y `:287` · M4 (repetida por el orquestador) |
| 22 | `apps/desk/server/db/facturacionVencida.ts:18` sin cambio; `fecha_prevista_facturacion` fuera de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.test.ts:544` lo fija; comprobado 0 apariciones en `packages/zoho-sync/src/db/repo.ts:44-54`) | «no le afecta», probado por esa aserción |
| 23-27 | Ficheros sin cambio en el diff (`ticketService.ts`, `traspaso.ts`, `informeContrato.ts:34`, `conversacion.ts`, `historial.ts`, `equipos.ts`, `eliminarTicket.ts`) | «no le afecta» (presentación o `to_status` de catálogo) |
| 28 | Sin cambio en `packages/shared/src/` salvo el módulo nuevo | `packages/shared/src/normalizarEstado.test.ts:77`, `:82`, `:88`, `:94` |
| 29 | `git diff --stat f5465799 06a6dff3 -- apps/desk/src` **vacío** | sin cambio; ver Regla 13 |

**Módulo**: `packages/shared/src/normalizarEstado.ts` (nuevo) con las tres funciones TS y `sqlEstadoNormalizado`; exportado por `packages/shared/src/index.ts:54`. La forma SQL es `regexp_replace(btrim(col), ' {2,}', ' ', 'g')` (texto fijado por `packages/shared/src/normalizarEstado.test.ts:64`).

**Ningún `UPDATE tickets … status` normaliza**: el grep sobre `apps` y `packages` fuera de `*.test.ts` sólo encuentra `apps/desk/server/db/migracionTicketsAbiertos.ts:85` (escritura planificada de la migración con el nombre del catálogo, S-5 del diseño) y `packages/zoho-sync/src/sync.ts:319` (marca `history_synced_status`). El diff no añade ningún `UPDATE` en producción; los únicos añadidos están en pruebas, como espía que exige cero (`normalizarEstadosZoho.test.ts:65`, `:287`).
**`apps/desk/server/superficieSaliente.test.ts:44-67`**: `git diff f5465799 06a6dff3 -- apps/desk/server/superficieSaliente.test.ts` vacío; 2 pruebas verdes en la pasada.
**Cherry-picks** `793ca755` y `db3fe0a6` (plazos y `afterEach(cederAlBucle)` del hook de citas): tocan sólo `apps/desk/server/citas/*.test.ts`; no son contenido de F1F-01 y no se juzgan contra la spec.

### Spec Compliance Matrix

RQ-ZS-24 (19 escenarios, contados con `#### Scenario`):

| # | Escenario | Prueba | Resultado |
|---|-----------|--------|-----------|
| 1 | Espacios repetidos se colapsan | `packages/shared/src/normalizarEstado.test.ts:10` | ✅ COMPLIANT |
| 2 | Extremos se recortan | `normalizarEstado.test.ts:15` | ✅ COMPLIANT |
| 3 | Nombre limpio no cambia | `normalizarEstado.test.ts:21` | ✅ COMPLIANT |
| 4 | Mayúsculas, tildes y otros blancos | `normalizarEstado.test.ts:28` | ✅ COMPLIANT |
| 5 | Cadena sin contenido útil | `normalizarEstado.test.ts:34` | ✅ COMPLIANT |
| 6 | Los 26 son puntos fijos | `normalizarEstado.test.ts:77` | ✅ COMPLIANT |
| 7 | Estado conocido de Zoho → nombre del registro (y una copia con ajeno falla) | `apps/desk/server/estadosZohoCatalogo.test.ts:37` y `:45` (+ `:32`) | ✅ COMPLIANT |
| 8 | Forma SQL = forma TS | `apps/desk/server/testing/pgMemEstado.test.ts:26` (pg-mem con imitación, verde); la prueba contra PostgreSQL real `apps/desk/server/db/normalizarEstado.integration.test.ts:63` **se salta** | ⚠️ PARTIAL (AVISO 1) |
| 9 | La sincronización guarda normalizado | `estadoNormalizado.test.ts:30` | ✅ COMPLIANT |
| 10 | Lista y detalle normalizados; columna `notif_comercial` | `normalizarEstadosZoho.test.ts:33`, `:46` | ✅ COMPLIANT |
| 11 | Mismos botones que el gemelo | `normalizarEstadosZoho.test.ts:55` | ✅ COMPLIANT |
| 12 | Transición `200` e historia normalizada | `normalizarEstadosZoho.test.ts:84` | ✅ COMPLIANT |
| 13 | Las lecturas no escriben | `normalizarEstadosZoho.test.ts:65`, `:287`; `estadoNormalizado.test.ts:81` | ✅ COMPLIANT (SUGERENCIA 2) |
| 14 | Esperas como el gemelo | `normalizarEstadosZoho.test.ts:271` | ✅ COMPLIANT |
| 15 | Alarmas como el gemelo (clave normalizada) | `normalizarEstadosZoho.test.ts:238`, `:257` | ✅ COMPLIANT |
| 16 | Indicadores como el gemelo | `normalizarEstadosZoho.test.ts:148` | ✅ COMPLIANT |
| 17 | Ficha de cliente normalizada | `normalizarEstadosZoho.test.ts:126` | ✅ COMPLIANT |
| 18 | Reloj del SLA, dos sentidos | `normalizarEstadosZoho.test.ts:203`, `:208` | ✅ COMPLIANT |
| 19 | Nada saliente manda un estado | `normalizarEstadosZoho.test.ts:84` (`zohoFetch` sin llamar) y `apps/desk/server/superficieSaliente.test.ts` sin cambio | ✅ COMPLIANT |

RQ-TC-40 (12 escenarios): un `diff` línea a línea entre el bloque vivo `openspec/specs/tickets-core/spec.md:2096-2202` y el del delta (107 líneas ambos) muestra que difieren sólo la cabecera (prefijo «Requirement:», AVISO 2) y las tres líneas del párrafo de igualdad exacta. Los 12 escenarios son idénticos a los vivos y los cubre la suite existente (`packages/shared/src/migracionTickets.test.ts`, `apps/desk/server/db/migracionTicketsAbiertos.test.ts`, verdes en la pasada). El párrafo modificado lo fijan `packages/shared/src/migracionTickets.test.ts:70` (`Entregado ` es «sin equivalencia» en el núcleo puro) y `normalizarEstadosZoho.test.ts:172` (el lector normaliza antes de llamar al núcleo). ✅ 12/12.

**Compliance summary**: 31/31 escenarios con prueba verde; el nº 8 es PARCIAL porque la mitad de PostgreSQL real no corrió.

### Párrafo «verbatim» (RQ-TC-40)

`openspec/specs/tickets-core/spec.md:2129` (cita viva) dice hoy que Zoho copia el estado verbatim, y eso es falso desde este cambio. El delta lo corrige: `grep -n verbatim openspec/changes/normalizar-estados-zoho/specs/tickets-core/spec.md` da **0**; el párrafo nuevo (`openspec/changes/normalizar-estados-zoho/specs/tickets-core/spec.md:49-51`) habla de «el valor que el lector ya normalizó con la regla única de `zoho-sync` RQ-ZS-24». La fusión (A.2) la deja a igual longitud (107 = 107).

### Mutaciones repetidas por este verificador (M1, M2, M5; M3 y M4 las repitió el orquestador)

Cada una: edición exacta con `sed`, sólo las pruebas que deben caer, `git checkout -- <fichero>`, `git diff --quiet -- <fichero>` = **0**, y la misma prueba otra vez en verde.

| # | Edición | Cae | Aserción literal observada | Restaurado → verde |
|---|---|---|---|---|
| M1 | `packages/zoho-sync/src/db/mappers.ts:47` vuelve a `status: raw.status as string` | `estadoNormalizado.test.ts`, 2 de 10 («dos espacios de Zoho se guardan con uno» y «espacios en los extremos y repetidos…») | `AssertionError: expected 'Notificación  Comercial' to be 'Notificación Comercial'` y `expected '  En   Proceso ' to be 'En Proceso'` | restore=0 → 10/10 |
| M2 | `packages/zoho-sync/src/db/repo.ts:139` vuelve a `row: row as TicketRow` | 5 de 29: `getActiveTickets`, `getAllTickets`, `getClosedTickets`, `GET /api/tickets…` y «los botones del de dos espacios…» | `expected 'Notificación  Comercial' to be 'Notificación Comercial'`, `expected ' Anulado' to be 'Anulado'`, `expected 0 to be greater than 0` | restore=0 → 29/29 |
| M5 | `packages/shared/src/normalizarEstado.ts:3` sin el `.replace` de los extremos | 11 de 67 en cuatro ficheros (`normalizarEstado.test.ts`, `pgMemEstado.test.ts`, `estadoNormalizado.test.ts`, `normalizarEstadosZoho.test.ts`) | `expected ' En Proceso' to be 'En Proceso'`, `expected ' ' to be ''`, `expected [ [ 'a1', ' Anulado' ], …(1) ] to deeply equal [ [ 'ok', 'Finalizado' ] ]` | restore=0 → 67/67 |

Un primer intento de M5 con un `sed` mal escrito dejó `return replace(...)`; se restauró (`git diff --quiet` = 0) antes de rehacerlo bien, y no llegó a ninguna prueba. Tras las tres, `git status --short` queda vacío.
Los detectores discriminan: M1 cae sólo en sincronización; M2 cae en lista, columna y botones **sin** que caigan el detalle ni la transición (D1: cada punto tiene su detector); M5 no la caza el catálogo (desvío 5 del diseño).

### Regla 13 / mutación 3

`git diff --stat f5465799 06a6dff3 -- apps/desk/src` → **vacío**; `git diff --stat f5465799 06a6dff3 -- apps/desk/server/services/ticketService.ts` → **vacío**. La tabla «Regla 13» del diseño y la medida de `apply-progress.md` coinciden: cada decisión del cliente (`apps/desk/src/board.ts:9`, `apps/desk/src/components/TransitionPanel.tsx:56`, `apps/desk/src/components/PanelReasignar.tsx:30`, `apps/desk/src/components/ClienteDetalle.tsx:36`, `apps/desk/src/lib/boardView.ts:39`) consume un valor que ya sale normalizado del servidor (`packages/zoho-sync/src/db/repo.ts:139` y `:209`; `apps/desk/server/db/directory.ts:26`). La única sin línea de servidor, el botón «Crear remisión» (`apps/desk/src/lib/botonRemision.ts:31`), es hallazgo previo declarado (P-4), no introducido por el cambio.

### V.2 · Barrido de L4.2 (muestreo)

- `openspec/specs/tickets-core/spec.md:2129`: ver arriba; el delta la corrige.
- `openspec/specs/zoho-sync/spec.md:936` (nombra `entradasActuales`, rango `apps/desk/server/db/sla.ts:88-95`): sigue cierta, la consulta está en esas líneas.
- `openspec/specs/zoho-sync/spec.md:226` (cita `apps/desk/server/db/estadoPorRemision.ts:41`): la `:41` es la guarda `if (actual === undefined || …)`; lo que cambió es la `:40`. Cierta.
- `openspec/config.yaml:5357` cita `packages/zoho-sync/src/db/mappers.ts:47` para «la sincronización usa la función»: cierta desde este cambio.
- Barrido propio de las citas al mapeador y a los lectores de `repo.ts` fuera de `openspec/changes/archive` y de este cambio: sólo aparecen tres citas vivas (`openspec/config.yaml:5357`, `openspec/specs/tickets-core/spec.md:2129`, `openspec/specs/zoho-sync/spec.md:1374`), exactamente las que analiza apply-progress. «Ninguna línea se movió» se confirma: el diff de producción es una línea por una línea salvo `packages/shared/src/index.ts:54`.
- `openspec/changes/normalizar-estados-zoho/proposal.md:17` quedó anclada en `f5465799` (caso B).

### Coherence (Design)

| Decisión | ¿Seguida? | Notas |
|----------|-----------|-------|
| D1 un punto por camino | ✅ Yes | `rowToTicket` y `getTicketRow` sin tocar |
| D2 forma SQL en `SELECT` y `WHERE` | ✅ Yes | `apps/desk/server/db/sla.ts:45`, `apps/desk/server/db/alarmasAvisadas.ts:21`, `apps/desk/server/db/esperasVencidas.ts:30` |
| D3 TS en el punto de mapeo en SELECT-only | ✅ Yes | filas 8-15 |
| D4 `sqlEstadoNormalizado` rechaza no identificadores | ✅ Yes | `packages/shared/src/normalizarEstado.test.ts:69` |
| D5 imitación pg-mem central | ✅ Yes | `apps/desk/server/testing/pgMemEstado.ts`, registrada en el arnés y en 5 ficheros |
| D6 reloj normaliza en `secuenciaDelReloj` | ✅ Yes | `apps/desk/server/db/relojSla.ts:45` y `:58` |
| D7 aceptación que crece por lote | ✅ Yes | bloques L1-L3, sin `it.fails` |
| Sin DDL | ✅ Yes | ningún `CREATE` ni `ALTER` en el diff |

### TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | tablas «TDD Cycle Evidence» en L1, L2 y L3 de `apply-progress.md`; L4 no tiene código nuevo |
| All tasks have tests | ✅ | cada fila de código tiene prueba (tabla V.1) |
| RED confirmed (tests exist) | ✅ | los 7 ficheros de prueba existen en el árbol; rojos con aserción anotados |
| GREEN confirmed | ✅ | todos pasan hoy en la suite entera |
| Triangulation | ✅ | gemelo limpio en cada fila; varios casos por regla |
| Safety net | ✅ | `informeContrato.test.ts` y los 5 de pg-mem editados se corrieron antes (L2.1, L3.1) |

**Assertion quality**: ✅ 0 CRITICAL, 0 WARNING. Bucles `for` con aserciones: los de `packages/shared/src/normalizarEstado.test.ts:79-97` van precedidos de `toHaveLength` o `toBeGreaterThan` sobre la colección; los de `normalizarEstadosZoho.test.ts:187` y `:262` recorren literales no vacíos. Vacíos (`toEqual([])`) en `normalizarEstadosZoho.test.ts:75`, `:302` y `apps/desk/server/estadosZohoCatalogo.test.ts:38`, `:42`: cada uno con compañero no vacío (`espia.mock.calls.length > 0`, `crudos.length > 50`, caso permanente de la mutación 2). Sin tautologías ni aserciones sin código de producción.

### Issues Found

**CRITICAL**: ninguno.

**WARNING**
1. **Integración PostgreSQL real sin ejecutar.** `apps/desk/server/db/normalizarEstado.integration.test.ts` salió 15 saltadas (sin `TEST_DATABASE_URL`). Todo lo que afirma de PostgreSQL real (que acepta el alias `AS status` con la misma expresión en el `WHERE`, la función dentro de `IN`, y que la forma SQL da lo de TS en las 14 muestras) es **hipótesis** hasta que corra el CI de PostgreSQL 17. Sólo se ejecutó pg-mem con imitación a medida.
2. **Cabecera del delta de RQ-TC-40.** El delta dice «### Requirement: RQ-TC-40 · …» y el bloque vivo en `openspec/specs/tickets-core/spec.md:2096` es «### RQ-TC-40 · …» (la spec viva mezcla ambos estilos). La fusión por script de A.2 debe casar el bloque por el identificador `RQ-TC-40`, no por la línea de cabecera exacta, y conservar la cabecera viva para mantener «a igual longitud».
3. **Primer aviso de espera tras desplegar.** El diseño ya lo anota: un ticket con nombre crudo puede recibir su primer aviso de espera tras desplegar, como su gemelo. Es consecuencia deseada, pero conviene que Supervisión lo sepa antes de P-1.

**SUGGESTION**
1. «Sin entrada no hay alarma» se descartó por vacuidad (apply-progress L3); aceptable, la subconsulta `apps/desk/server/db/sla.ts:89` se ejerce igualmente por la prueba de la fila 18.
2. El escenario «las lecturas no escriben» enumera indicadores y tablero; el espía de escrituras cubre lista, detalle y las tres consultas SQL, no `apps/desk/server/indicadores.ts:66` (que sólo SELECCIONA). Suficiente por construcción; se podría añadir el espía.
3. `docs/analisis-tickets/Tickets.csv` es la única fuente de estados conocidos (S-6): la comparación con la lista COMPLETA de Zoho sigue siendo tarea de persona (P-3).

### Verdict

**PASS CON AVISOS** — 0 críticos: suite entera en 0 (5589 pruebas), typecheck 0, lint 0 errores, detector 0, tres mutaciones repetidas rojas por la prueba esperada y restauradas, `apps/desk/src` y `ticketService.ts` sin cambios, y la superficie saliente intacta. Siguiente paso: `sdd-archive`, con A.2 por script casando RQ-TC-40 por identificador, y confirmar la integración en el CI antes de dar por cerrado lo de PostgreSQL real.
