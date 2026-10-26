# Tareas — `normalizar-estados-zoho` (F1F-01, `cierra: no`)

`strict_tdd`: el ROJO se ve y se anota en `apply-progress.md` (prueba, aserción que falla y causa) antes del VERDE mínimo. D* y M* son de
`design.md`; «fila N» es la fila N de su tabla; RQ-ZS-24 de `specs/zoho-sync/spec.md`; RQ-TC-40 de `specs/tickets-core/spec.md`. Todo en el
worktree `C:\dev\Desk_2_R1.023-worktrees\normalizar-estados-zoho`. **Un intento por lote**, techo 800, válvula 720, medidos con
`git diff --shortstat --no-renames <base>` más `wc -l` de lo nuevo sin trackear (los binarios, aparte). Base de cada intento: el commit con que cierra el anterior (L1: `f5465799`).
**Colocación (mutación 4, D «Disciplina de líneas»):** toda edición es EN SU MISMA LÍNEA física; las importaciones se añaden a una importación que ya existe;
lo demás son ficheros nuevos o bloques añadidos al final (`packages/shared/src/index.ts`: una línea nueva tras la `:53`). Ninguna línea se mueve.
**Cadena de cierre (CC) de cada intento**, en primer plano y sin `&`: commit; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` = 0;
`npm test > <scratchpad>/npmtest-<hora>.log 2>&1` SOLO (si no sale 0, nombrar prueba y fichero del log y parar); `npm run typecheck` = 0; `npm run lint` = 0 errores; medida ≤ 720.

## Lote L1 · módulo, sincronización y lectores de `repo.ts` (filas 1-5; ~360 brutas)

- [x] L1.1 Línea base: correr en verde ANTES de editar `packages/zoho-sync/src/db/repo.test.ts`, `apps/desk/server/tickets.test.ts`, `apps/desk/server/transiciones.test.ts` y `apps/desk/server/superficieSaliente.test.ts`. Si no, parar.
- [x] L1.2 ROJO unitario, `packages/shared/src/normalizarEstado.test.ts` (nuevo): dos espacios, tres, extremos, `  En   Proceso  `, idempotencia, mayúsculas/tildes/tabulador/NBSP sin tocar, vacío y sólo espacios, `normalizarSiTexto(null/undefined/5)`, `conEstadoNormalizado` sin mutar, `sqlEstadoNormalizado` (texto exacto y rechazo de no identificadores, D4), puntos fijos de los 26 de `ESTADOS`, de `CATALOGO_POR_FLUJO`, `TRANSICION_REMISION_*` y `COLUMNS` (fila 28). Rojo: el módulo no existe.
- [x] L1.3 ROJO de sincronización, `packages/zoho-sync/src/db/estadoNormalizado.test.ts` (nuevo): `upsertTicket(ticketRowFromZoho(dos espacios))` y `SELECT status` crudo da un espacio (fila 1); las tres listas y `getTicketWithRefs` devuelven normalizado; `getTicketRow` devuelve el crudo (fila 5).
- [x] L1.4 ROJO de aceptación L1, `apps/desk/server/normalizarEstadosZoho.test.ts` (nuevo, `instalarArnes`): siembra con `upsertTicket` a mano (gemelo de dos espacios y gemelo limpio) con precondición de crudo; `GET /api/tickets` y `/:id` normalizados; `columnForStatus` = `notif_comercial`; `transicionesDelTicket` no vacía e igual al gemelo; `POST …/transition` `200`, `from_status` normalizado, filas previas intactas; sin `UPDATE tickets … status` en el espía de `db.query`; `zohoFetch` sin llamar. Filas 2, 3, 4.
- [x] L1.5 ROJO del catálogo, `apps/desk/server/estadosZohoCatalogo.test.ts` (nuevo): `leerRegistros` + retirada del BOM sobre `docs/analisis-tickets/Tickets.csv` (columna «Estado»); contiene `Notificación  Comercial`; cada valor normalizado ∈ `ESTADOS`; sin tabulador ni NBSP; caso permanente con una fila `Estado ajeno` que el comprobador devuelve (mutación 2).
- [x] L1.6 Anotar los rojos (L1.2-L1.5) en `apply-progress.md` con la aserción observada. Si alguno no es rojo por la causa esperada, parar.
- [x] L1.7 VERDE módulo: `packages/shared/src/normalizarEstado.ts` (nuevo, el código de `design.md` «El módulo») y UNA línea `export * from './normalizarEstado'` tras `packages/shared/src/index.ts:53`.
- [x] L1.8 VERDE en sitio: `packages/zoho-sync/src/db/mappers.ts:47` → `status: normalizarSiTexto(raw.status as string)` e importación añadida a la línea de `mappers.ts:2`; `packages/zoho-sync/src/db/repo.ts:139` y `:209` → `row: conEstadoNormalizado(row) as TicketRow`, importación añadida a la línea `repo.ts:129`. NO tocar `getTicketRow`, `rowToTicket` ni `rowToTicketDetail` (filas 5, 6; D1).
- [x] L1.9 Regla 13 / mutación 3 (L1): `git diff --stat f5465799 -- apps/desk/src apps/desk/server/services/ticketService.ts` vacío; anotar la tabla de decisiones del cliente del diseño.
- [x] L1.10 Regla de división: medir. Si L1 pasa de ~400 brutas, MUDAR L1.5 (catálogo) al principio de L2 y anotarlo en `apply-progress.md`.
- [x] L1.c Cierre: CC; `apply-progress.md` con rojos, medida y salida de L1.9.

## Lote L2 · SELECT-only del servidor y reloj (filas 8-15; ~190 brutas)

- [x] L2.1 Línea base verde de `apps/desk/server/db/informeContrato.test.ts`, `apps/desk/server/relojSla.test.ts`, `apps/desk/server/db/migracionTicketsAbiertos.test.ts`, `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` y el L1 ya cerrado.
- [x] L2.2 ROJO: bloque L2 AÑADIDO al final de `apps/desk/server/normalizarEstadosZoho.test.ts`, cada fila con su gemelo: `GET /api/accounts/:id` (8); `getAnalisisRows` (9); indicadores con ` Anulado` y `Anulado` cerrados (10); `POST /api/tickets/:id/reasignar` sin `403` (11); `migrarTicketsAbiertos` en seco con `negativa` nula (13); `Ticket  creado` con remisión `ok` → `Remisión creada`, `from_status` `Ticket creado` (14); `secuenciaDelReloj` directa en los dos sentidos (15).
- [x] L2.3 ROJO: bloque añadido al final de `apps/desk/server/db/informeContrato.test.ts` con `subOV` y `servicio` (fila 12): `Finalizado ` y gemelo, ambos ejecutados.
- [x] L2.4 Anotar los rojos en `apply-progress.md`.
- [x] L2.5 VERDE en sitio (importación en la línea indicada de cada fichero, sin líneas nuevas): `apps/desk/server/db/directory.ts:26`; `apps/desk/server/analisis.ts:20`; `apps/desk/server/indicadores.ts:66`; `apps/desk/server/db/reasignaciones.ts:18`; `apps/desk/server/db/informeContrato.ts:45`; `apps/desk/server/db/migracionTicketsAbiertos.ts:36`; `apps/desk/server/db/estadoPorRemision.ts:40`; `apps/desk/server/db/relojSla.ts:45` y `:58`. Filas 8-15 (la 17 llega normalizada de la 9).
- [x] L2.6 Filas «no le afecta» (7, 16, 22-27): confirmar por la prueba o prueba citada en el diseño que sigue verde; sin edición.
- [x] L2.c Cierre: CC; regla 13 (`git diff --stat` sobre `apps/desk/src` vacío); `apply-progress.md`.

## Lote L3 · SQL que filtra, imitación de pg-mem e integración (filas 18-21; ~280 brutas)

- [ ] L3.1 Línea base verde de `apps/desk/server/db/sla.test.ts`, `alarmasAvisadas.test.ts`, `esperasVencidas.test.ts`, `apps/desk/server/services/alarmasSla.test.ts` y `avisoSalidasEsperas.test.ts`.
- [ ] L3.2 ROJO, `apps/desk/server/testing/pgMemEstado.test.ts` (nuevo): la forma SQL evaluada en pg-mem sobre las muestras de la spec da lo de `normalizarEstado`; la imitación lanza «imitación fuera de alcance» con cualquier otro patrón.
- [ ] L3.3 ROJO, bloque L3 AÑADIDO a `apps/desk/server/normalizarEstadosZoho.test.ts`: `Notificado ` y `Notificado` con entrada, ambos vencidos y `alarmas_avisadas.estado` = `Notificado` (18); `Notificación  cliente` con entrada y marca, marcado como su gemelo (20; fija el camino que traga errores); `Solicitado ` y `Solicitado` con `deApp`, mismo estado y `desde` (21); espía sin `UPDATE tickets … status` sobre las tres consultas.
- [ ] L3.4 ROJO, `apps/desk/server/db/normalizarEstado.integration.test.ts` (nuevo, se salta sin `TEST_DATABASE_URL`): (a) `SELECT ${sqlEstadoNormalizado('v')}` sobre cada muestra; (b) `ticketsEnEspera` con el par de gemelos en base propia.
- [ ] L3.5 Anotar los rojos en `apply-progress.md`.
- [ ] L3.6 VERDE ayudante: `apps/desk/server/testing/pgMemEstado.ts` (nuevo) con `conFuncionesDeEstado`, `btrim(text)` y `regexp_replace(text, text, text, text)` limitada a `' {2,}'`, `' '`, `'g'`.
- [ ] L3.7 VERDE registro en sitio (`newDb()` → `conFuncionesDeEstado(newDb())` e importación añadida a la línea de `import { newDb }`): `apps/desk/server/testing/appHarness.ts:2`, `:36`; `apps/desk/server/db/sla.test.ts:2`, `:7`; `alarmasAvisadas.test.ts:2`, `:17`; `esperasVencidas.test.ts:2`, `:14`; `apps/desk/server/services/alarmasSla.test.ts:4`, `:27`; `avisoSalidasEsperas.test.ts:4`, `:19`.
- [ ] L3.8 VERDE SQL en sitio, `sqlEstadoNormalizado` en `SELECT` y `WHERE`: `apps/desk/server/db/sla.ts:45` y `:89` (filas 18, 19); `apps/desk/server/db/alarmasAvisadas.ts:21` (20); `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` (21). Importación a la línea `sla.ts:2`, `alarmasAvisadas.ts:2`, `esperasVencidas.ts:2`.
- [ ] L3.c Cierre: CC (en CI la integración corre contra PostgreSQL 17; en local se salta, anotarlo); regla 13; `apply-progress.md`.

## Lote L4 · mutaciones M1-M7 y barrido (sin código nuevo; ~80 brutas)

- [ ] L4.1 Para CADA mutación, una a una: editar exactamente lo del diseño → correr SÓLO la prueba que debe caer → anotar la aserción observada → restaurar byte a byte (`git diff` vacío del hunk) → ver verde. M1 `mappers.ts:47`; M2 `repo.ts:139`; M3 `repo.ts:209` (`409` en vez de `200`); M4 `esperasVencidas.ts:30` (el `WHERE` vuelve a `status IN`; M4b opcional en `sla.ts:89`); M5 sin `.replace(/^ +| +$/g, '')` (NO la caza el catálogo, desvío 5); M6 con `.toLowerCase()`; M7 sobre una COPIA del CSV con `Estado ajeno` en el directorio temporal, nunca sobre el trackeado. Registro en `openspec/changes/normalizar-estados-zoho/apply-progress.md`.
- [ ] L4.2 Barrido de la regla de mutación 4: `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre `*.md`, `*.ts` y `*.yaml` para cada fichero de «Disciplina de líneas» (`index.ts`, `mappers.ts`, `repo.ts`, `directory.ts`, `analisis.ts`, `indicadores.ts`, `reasignaciones.ts`, `informeContrato.ts`, `migracionTicketsAbiertos.ts`, `estadoPorRemision.ts`, `relojSla.ts`, `sla.ts`, `alarmasAvisadas.ts`, `esperasVencidas.ts`, `appHarness.ts`, los cinco `*.test.ts`); cada resultado leído contra lo que AFIRMA (A/B/C), más el SEGUNDO PASE de las abreviadas `:NN` en los ficheros que citan el módulo. Revisar las citas de contenido cambiado: `openspec/specs/tickets-core/spec.md:2129`, `openspec/specs/zoho-sync/spec.md:936` y `:226`.
- [ ] L4.3 Confirmar `git diff --stat f5465799 -- apps/desk/src` vacío y rellenar la lista de regla 13 / mutación 3 decisión a decisión (la fila «Botón Crear remisión» queda como hallazgo, P-4).
- [ ] L4.c Cierre: CC; `apply-progress.md` completo; medida ≤ 720.

## Verify (un intento)

- [ ] V.1 `sdd-verify`: contrastar el diff contra los 19 escenarios de RQ-ZS-24 y el delta de RQ-TC-40, y la tabla 1-29 fila a fila. Escribir `verify-report.md` (el informe generado cuenta como sumando del intento).
- [ ] V.2 Repetir `npm test` (log), typecheck, lint, detector de citas y el barrido de L4.2. Confirmar que ningún `UPDATE tickets … status` normaliza (grep) y que `superficieSaliente.test.ts:44-67` sigue verde sin cambios.

## Archive (un intento; techo 2 × carpeta + 800)

- [ ] A.1 Medir ANTES de aplicar la parte revisable (fusión de los dos deltas + `archive-report.md`): debe ser ≤ 800; si no, parar y consultar.
- [ ] A.2 Fusionar POR SCRIPT, comparando bloque a bloque: RQ-ZS-24 ADDED al final de `openspec/specs/zoho-sync/spec.md` (tras RQ-ZS-23); RQ-TC-40 MODIFIED en sitio, a igual longitud, en `openspec/specs/tickets-core/spec.md` (sólo cambia el párrafo de igualdad exacta). Mirar los códigos de salida antes de asentar.
- [ ] A.3 Anclar en revisión las citas históricas de `proposal.md` que describan el estado anterior (caso B), antes de la mudanza.
- [ ] A.4 `archive-report.md` escrito por el orquestador con cifras medidas y UNA línea de qué cubrió de F1F-01 y qué dejó fuera (`cierra: no`). Mudar la carpeta a `openspec/changes/archive/<fecha>-normalizar-estados-zoho/`; el commit contiene SÓLO el cambio archivado (`git show --numstat`).

## Cobertura

- **Filas 1-29:** 1 → L1.3/L1.8; 2, 3 → L1.3/L1.4/L1.8; 4 → L1.4; 5 → L1.3; 6 → «no se toca», cubierta por M2/M3 (L4.1); 7, 16, 22-27 → «no le afecta» con la prueba del diseño (L2.6); 8-11, 13-15 → L2.2/L2.5; 12 → L2.3/L2.5; 17 → fila 9; 18, 20, 21 → L3.3/L3.8; 19 → L3.8 (M4b); 28 → L1.2; 29 → L1.9/L4.3 (sin cambio en cliente).
- **RQ-ZS-24:** espacios repetidos, extremos, ya limpio, mayúsculas/otros blancos, vacío, 26 puntos fijos → L1.2; estados de Zoho conocidos → L1.5; SQL = TS → L3.2 y L3.4; sincronización guarda normalizado → L1.3; lectura y columna → L1.4; mismos botones → L1.4; transición e historia → L1.4; lecturas no escriben → L1.4, L3.3; esperas → L3.3; alarmas → L3.3; indicadores → L2.2; ficha de cliente → L2.2; reloj → L2.2; nada saliente → L1.4 y `superficieSaliente.test.ts`.
- **RQ-TC-40:** delta ya escrito; cubierto por `apps/desk/server/db/migracionTicketsAbiertos.test.ts` y el caso de identidad de L2.2 (fila 13); fusión en A.2.

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar NO las da por hechas.**

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar (el usuario despliega a mano; sin migración ni DDL) | Usuario | Parte de corte; vuelta atrás: revertir el commit de fusión |
| P-2 | Comprobar el #1004 en la app, en su columna «Notificación Comercial» y con botones | Usuario | Lista acumulada de pruebas en la app (decisión de Gerencia del 18/10) |
| P-3 | Comparar la lista COMPLETA de estados de Zoho Desk con el registro (sólo la configuración de Zoho la tiene; S-6) | Gerencia | Lista semanal de supuestos (regla E-237) |
| P-4 | Registrar en `docs/sdd/ENTRADA.md` el hallazgo «botón Crear remisión decide por estado sólo en el cliente» (`apps/desk/src/lib/botonRemision.ts:31`) | Supervisión (la rama no toca ese fichero) | `docs/sdd/ENTRADA.md`, bandeja, sin destino |

## Previsión de revisión

| Intento | Bruto | ×1,8 (con informes) | Tareas |
|---|---|---|---|
| Apply L1 | ~360 | ~650 | 10 + cierre |
| Apply L2 | ~190 | ~340 | 6 + cierre |
| Apply L3 | ~280 | ~500 | 8 + cierre |
| Apply L4 | ~80 | ~145 | 3 + cierre |
| Verify | — | `verify-report` ~110-360 | 2 |
| Archive | fusión ≪ 800 | mudanza 2 × carpeta + `archive-report` ~120 | 4 |

Cada intento cabe en 720; L1 es el más justo y tiene su regla de división (L1.10). Se fusiona la rama a `main` con `git merge --no-ff` cuando el analista verifique.

Decision needed before apply: No — un intento por lote, todos bajo 720; sin PR encadenados
Chained PRs recommended: No (una rama; se fusiona a `main` al cerrar)
Chain strategy: n/a
400-line budget risk: Medium (L1 ~360 brutas; si pasa de ~400, el catálogo se muda a L2)
