# Tareas — `ovi-garantia-por-cargo` (F1B-03, `cierra: no`)

Tres lotes de apply, uno por intento del registro. Orden TDD estricto en cada lote: prueba en **ROJO** → código mínimo →
verde. **CARACTERIZACIÓN** = la prueba nace verde y sólo fija lo que hoy nada fija (se prueba moviendo la guarda, regla de
mutación 1). Los ids (AL, TR, RC, RE, POS, GA, EQ, M-*) son los de `design.md` §7. Los lotes son secuenciales: el 2 usa lo
del 1, el 3 usa `guardasOVI.ts` del 2. Dentro de un lote no hay paralelismo (un solo escritor, un solo árbol).

## Review Workload Forecast

Presupuesto: 800 líneas POR INTENTO, válvula 720, medidas con `git diff --shortstat --no-renames` + `wc -l` de lo nuevo.

| Lote | Estimado (ins.+borr.) | × 1,8 | Riesgo frente a 800 | En verde al cerrar |
|---|---|---|---|---|
| 1 · `packages/shared` | 215 | **387** | Bajo | regla pura y predicado sin área; el servidor no cambia |
| 2 · alta y transiciones | 305 | **549** | Medio (más cerca de 720; si la medida a mitad pasa de ~600, se parte antes de cerrar) | alta y transiciones imponen las dos guardas |
| 3 · remisión | 151 | **272** | Bajo | las cuatro entradas |

Los informes de fase (`verify-report.md`, `archive-report.md`) y la fusión del delta son sumando propio de sus fases, no de
estos lotes.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

(No hay PR: cada tanda se fusiona a `main` desde su rama tras una parada única. «Chain strategy: pending» = no aplica; los
tres lotes son la partición de intentos, ninguno supera 720. Delivery strategy: `ask-on-risk`; ningún lote cruza el techo.)

### Unidades de trabajo

| Lote | Prueba focal | Arnés de ejecución | Frontera de reversión |
|---|---|---|---|
| 1 | `npx vitest run packages/shared/src/subOV.test.ts packages/shared/src/ordenOVI.test.ts packages/shared/src/cargos.test.ts` | N/A: lógica pura, sin servidor | `revert` del lote: `subOV.ts`, `ordenOVI.ts`, `index.ts`, `cargos.ts`, `mantenimientoNovedades.ts` y sus pruebas |
| 2 | `npx vitest run apps/desk/server/oviGarantia.test.ts` | pruebas por HTTP con `appHarness` (el servidor real contra el harness) | `revert` del lote: `guardasOVI.ts`, `ticketService.ts`, `tickets.ts`, `oviGarantia.test.ts` |
| 3 | `npx vitest run apps/desk/server/oviGarantiaRemision.test.ts apps/desk/server/remisiones.test.ts` | HTTP con `appHarness` | `revert` del lote: `remision.ts`, `guardasOVI.ts` (+10), `oviGarantiaRemision.test.ts` |

## Lote 1 · `packages/shared` — estimado 215 líneas, × 1,8 = 387 (≤ 720)

- [ ] 1.1 ROJO `packages/shared/src/subOV.test.ts`: `esOVI` cierto para `OVI-2026-001`, ` ovi-2026-001 `, `OVI-2026-001-01`, `OVI-2026-00123`, `OVI-26-1` (A1); falso para `OV-2026-001`, `OV-2026-001-01`, `OVIEDO-1`, `SO-00123`, `''` y no-texto. CARACTERIZACIÓN en el mismo fichero: `clasificarOV` no cambia.
- [ ] 1.2 Código `packages/shared/src/subOV.ts` (tras `:55`): `PREFIJO_OVI = /^OVI-/i` y `esOVI(numero: unknown)`, con el comentario «prefijo de OVI, no sintaxis de subOV» y su motivo. Verde 1.1.
- [ ] 1.3 ROJO `packages/shared/src/ordenOVI.test.ts` (nuevo): tablas de `ordenesQueEntran` (número igual, otra caja entra, mismo `salesorderId` con número distinto, vacíos, repetidos); `motivoCargoOVI` (los ocho cargos, administrador, sujeto ausente, cargo raro); `erroresGarantiaSinOVI`/`motivoGarantiaSinOVI` (literal exacto, `garantía` en minúsculas no activa); `TIPO_SERVICIO_GARANTIA` ∈ `TIPOS_SERVICIO`; `ordenesDeTransicion` sobre `habilitar_servicio`, `aprobacion`, `aprobacion_y_repuestos` y una transición sin campo de orden.
- [ ] 1.4 Código `packages/shared/src/ordenOVI.ts` (nuevo) con las cinco funciones y los tipos de `design.md` §3, y exportación en `packages/shared/src/index.ts` (añadida a la línea de `:23` con `;`). Verde 1.3.
- [ ] 1.5 ROJO `packages/shared/src/cargos.test.ts`, en sitio (mismo nº de líneas): `:117-123` sin área (Director Técnico con `[]`, `['Comercial']`, `['Servicio Técnico']` pasa; sin cargo `false`; administrador `true`); `:185` sustituida por comentario; `:204-205` 5×11×(31+2) = **1.815**; `:226-229` «único llamador fuera de `cargos.ts` es `ordenOVI.ts`» (lectura del código, una sola implementación). Rojo: `:118-123`.
- [ ] 1.6 Código `packages/shared/src/cargos.ts:67-74`, en sitio (ocho líneas siguen siendo ocho): `puedeCrearOVIGarantia` sin área y comentario nuevo. Verde 1.5.
- [ ] 1.7 Comentario en sitio `packages/shared/src/mantenimientoNovedades.ts:10` (texto de `design.md` §10).
- [ ] 1.8 Comprobar que `git diff --numstat` de `cargos.ts` y `cargos.test.ts` da inserciones = borrados (en sitio).
- [ ] 1.9 Mutaciones del lote, cada una anotada en `apply-progress.md` con «qué se movió → qué prueba se puso roja → restaurado»: **M-SH-1** (parte `shared`: quitar la `i` de `PREFIJO_OVI` → roja la fila ` ovi-2026-001 ` de 1.1; hacer que `esOVI` exija la sintaxis completa → roja `OVI-26-1` de 1.1 y 1.3; devolver el área a `puedeCrearOVIGarantia` → roja `cargos.test.ts:118-123`); **M-RC-1 parcial**: `ordenesQueEntran` devuelve todo lo recibido → rojas las filas «número igual» e «id igual» de 1.3. Restaurado cada una.
- [ ] 1.10 Los cuatro códigos, los cuatro con salida 0: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] 1.11 Medida real: `git diff --shortstat --no-renames` contra el commit de partida del lote (HEAD al abrir el intento) + `wc -l` de `ordenOVI.ts` y `ordenOVI.test.ts` nuevos; se registra frente a 387 (y a 720).

## Lote 2 · alta y transiciones — estimado 305 líneas, × 1,8 = 549 (≤ 720)

Hipótesis a confirmar aquí: que `getTicketWithRefs` entregue `salesorder_id` en `row` (la fija RC-3 y, en el lote 3, RE-5).

- [ ] 2.1 `apps/desk/server/oviGarantia.test.ts` (nuevo): armazón con `appHarness`, fábricas de usuario (sin cargo / Director Técnico con sólo Comercial / administrador sin cargo / Servicio Técnico sin cargo), de orden Books (`OVI-2026-001`, `OV-2026-001`, con sufijo `-X9`) y de ticket (Zoho con id sin `PREFIJO_TICKET_APP`, de la app, `tipo_servicio` Garantía). Sin casos aún.
- [ ] 2.2 ROJO alta, cargo: AL-1 (`403`), AL-2/AL-3 (`201`), AL-4/AL-5 (OVI tecleada, minúsculas, sin cargo → `403`), AL-6 (`ordenVenta` `OV-…` y `salesOrderId` de una OVI → `403`), AL-7 (`createManagedTicket` con cuatro argumentos y OVI → `403`, S-10), AL-8 (`OV-` sin cargo → `201`, CARACTERIZACIÓN). Añadir el caso `OVI-26-1` tecleado sin cargo → `403`.
- [ ] 2.3 ROJO/CARACTERIZACIÓN posición del cargo en el alta: POS-AL-1 (equipo inexistente + OVI sin cargo → `422` «Equipo no registrado», CARACTERIZACIÓN), POS-AL-2 (`salesOrderId` inexistente + `ordenVenta` OVI → `422` «Orden de venta no encontrada», CARACTERIZACIÓN), POS-AL-3 (cliente distinto del equipo → `403`, ROJO), POS-AL-4 (faltan obligatorios → `403`, ROJO).
- [ ] 2.4 Código `apps/desk/server/services/guardasOVI.ts` (nuevo): `exigirCargoOVI`, `entrantesDeAlta` (y el reexport del tipo `SujetoOVI`); `ticketService.ts` en sitio `:6`, `:18`, `:21`, `:36`, `:43`, `:44` (el `403` va al final de `:44`); `routes/tickets.ts:125` pasa `req.user`. Verde 2.2-2.3.
- [ ] 2.5 ROJO garantía en el alta: GA-AL-1 (Garantía+`OV-` → `422`), GA-AL-2 (Garantía+OVI con cargo → `201`), GA-AL-3 (Garantía sin orden → `201`, CARACTERIZACIÓN, S-2), GA-AL-4 (OVI tecleada + id de una `OV-` → `422`), GA-AL-5 (Mantenimiento+OVI con cargo → `201`, CARACTERIZACIÓN), POS-AL-5 (Garantía + `OV-` ya asociada a otro ticket → `422` de garantía, no `409`), POS-AL-6 (Garantía + `OV-…-X9` → cuarentena, CARACTERIZACIÓN, S-9).
- [ ] 2.6 Código `guardasOVI.ts`: `exigirGarantiaOVI`; `ticketService.ts:96` en sitio (llamada tras el vencido y comentario de escalón). Verde 2.5.
- [ ] 2.7 ROJO transiciones, cargo y reconfirmación: TR-1..6 (OVI nueva sin cargo en `habilitar_servicio`, `aprobacion`, `aprobacion_y_repuestos` → `403`; con cargo o administrador → `200`), RC-1 (ticket de Zoho que reconfirma su OVI, Comercial sin cargo → `200`; la prueba central), RC-2 (ticket de la app), RC-3 (OVI vigente sólo en `ov_asociaciones`), RC-4/RC-5/RC-6 (cambiar por otra OVI, reasociar una liberada, la misma en otra caja → `403`), POS-TR-1 (`409` de estado, CARACTERIZACIÓN), POS-TR-2 (Servicio Técnico sin cargo → `403` con el texto del ÁREA, CARACTERIZACIÓN), POS-TR-3/3b (sin remisión vigente / cliente provisional → `403` de cargo), POS-TR-4 (`aprobacion_y_repuestos` con falta de fecha → `403`), POS-TR-5 (OVI de otro ticket → `403`, no `409`), EQ-1 (`ordenesDeTransicion` frente a `[plan.columns.orden_venta, plan.ovAdicional]` en las tres transiciones).
- [ ] 2.8 Código `guardasOVI.ts`: `entrantesDeTransicion` (devuelve `[]` sin consultar si la transición no trae orden; lee `row.orden_venta`, `row.salesorder_id` y `listarAsociaciones`); `ticketService.ts:131` en sitio (`entran` + `exigirCargoOVI(entran, user)` tras el `403` de prioridad). Verde 2.7.
- [ ] 2.9 ROJO garantía en transiciones: GA-TR-1 (Garantía+`OV-` nueva → `422`), GA-TR-2 («OV adicional» `OV-` → `422`, S-5), GA-TR-3 (Garantía que reconfirma su `OV-` → `200`, S-1, CARACTERIZACIÓN), GA-TR-4 (Garantía+OVI con cargo → `200`), POS-TR-6 (Garantía + `OV-` usada por otro ticket → `422` de garantía, no `409`), POS-TR-7 (Garantía + `OV-` + falta obligatorio → `422` con los DOS textos en `errors`).
- [ ] 2.10 Código `ticketService.ts:134` en sitio: `errGarantia = erroresGarantiaSinOVI(current.row.tipo_servicio, entran)`, en la condición y en la lista tras `...errCuarentena` (posición: dentro del agregado, antes del vencido de `:147`; coincide con `specs/transitions-st/spec.md` RQ-TS-37). Verde 2.9.
- [ ] 2.11 Comprobar con `git diff --numstat` que `ticketService.ts` tiene inserciones = borrados (9 líneas tocadas, 0 netas) y que `tickets.ts` también; si no, es una desviación del diseño y se anota.
- [ ] 2.12 Mutaciones del lote, cada una en `apply-progress.md` con «qué se movió → prueba roja → restaurado»: **M-AL-1** cargo del alta antes del `if` de `:37` → POS-AL-2; **M-AL-2a** detrás de equipo↔cliente (`:79`) → POS-AL-3 y **M-AL-2b** detrás de `:88` → POS-AL-4; **M-AL-3a** garantía del alta detrás del `409` (`:100`) → POS-AL-5 y **M-AL-3b** delante de la cuarentena → POS-AL-6; **M-TR-1a** cargo de transiciones antes del área (`:129`) → POS-TR-2 y **M-TR-1b** antes de `:126` → POS-TR-1; **M-TR-2a** al final de `:131` → POS-TR-3 y 3b, **M-TR-2b** detrás de `:134` → POS-TR-4, **M-TR-2c** detrás de `:152` → POS-TR-5; **M-TR-3** garantía fuera del agregado, detrás de `:152` → POS-TR-6 y POS-TR-7; **M-RC-1** `ordenesQueEntran` devuelve TODO → RC-1, RC-2, RC-3; **M-SH-1** (parte servidor) quitar la `i` / devolver el área → AL-5 y AL-2. Restaurado cada una.
- [ ] 2.13 Los cuatro códigos, los cuatro con salida 0: `npm test` (incluye las 56 llamadas de prueba de `createManagedTicket` sin cambios), `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] 2.14 Medida real: `git diff --shortstat --no-renames` contra el commit de partida del lote + `wc -l` de `guardasOVI.ts` y `oviGarantia.test.ts` nuevos; registrar frente a 549 (y 720). Si pasa de 720, se para y se parte.

## Lote 3 · remisión — estimado 151 líneas, × 1,8 = 272 (≤ 720)

- [ ] 3.1 `apps/desk/server/oviGarantiaRemision.test.ts` (nuevo): armazón análogo al 2.1 (ticket con remisión previa pendiente, ítems del checklist, orden Books por `salesOrderId`).
- [ ] 3.2 ROJO cargo: RE-1 (OVI sin cargo → `403`), RE-2/RE-3 (Director Técnico sin Servicio Técnico / administrador → `201`), RE-6 (el ticket ya tiene OTRA orden y llega una OVI sin cargo → `403`, S-8). CARACTERIZACIÓN: RE-4 (reenviar la OVI de `orden_venta`, sin cargo → `201`) y RE-5 (`orden_venta` vacía y `salesorder_id` vivo, IV-11, se reenvía ESA orden → `201`; confirma la hipótesis de `getTicketWithRefs`).
- [ ] 3.3 ROJO/CARACTERIZACIÓN posición: POS-RE-1 (OVI con sufijo sin cargo → `403`, no cuarentena; con cargo → cuarentena), POS-RE-2 (OVI de otro ticket sin cargo → `403`, no `409`), POS-RE-3 (remisión pendiente + OVI sin cargo → `409`, CARACTERIZACIÓN, punto 4 de IV-12), POS-RE-4 (ítem fuera del checklist + OVI sin cargo → `422` del checklist, CARACTERIZACIÓN).
- [ ] 3.4 ROJO garantía: GA-RE-1 (Garantía+`OV-` → `422`), GA-RE-2 (Garantía+OVI con cargo → `201`), GA-RE-3 (Garantía sin orden → `201`, CARACTERIZACIÓN), POS-RE-5 (Garantía + `OV-` de otro ticket → `422` de garantía, no `409`), POS-RE-6 (Garantía + `OV-…-X9` → cuarentena, CARACTERIZACIÓN), y el escenario S-1 de RQ-RE-31 (Garantía que reenvía su `OV-` → sin `422`, CARACTERIZACIÓN).
- [ ] 3.5 Código `guardasOVI.ts` (+10): `entrantesDeRemision(db, ov, ticketId, row)`; `remision.ts` en sitio `:4`, `:7` y la línea `:220` completa de `design.md` §5 (orden A → cargo → cuarentena → vencido → garantía; el orden relativo de las guardas existentes no cambia). Verde 3.2-3.4.
- [ ] 3.6 Comprobar con `git diff --numstat` que `remision.ts` tiene 3 líneas tocadas y 0 netas; que `remisiones.test.ts:988` y `:1246` y `recepcion.test.ts:245-273` siguen verdes sin tocarlos (IV-12: ninguna guarda existente se reordena).
- [ ] 3.7 Mutaciones del lote, cada una en `apply-progress.md` con «qué se movió → prueba roja → restaurado»: **M-RE-1a** cargo de la remisión detrás de la cuarentena → POS-RE-1 y **M-RE-1b** detrás del `409` (`:234`) → POS-RE-2; **M-RE-2a** garantía de la remisión detrás del `409` → POS-RE-5 y **M-RE-2b** delante de la cuarentena → POS-RE-6; **M-RC-1** (parte remisión) `ordenesQueEntran` devuelve TODO → RE-4 y RE-5. Restaurado cada una.
- [ ] 3.8 Los cuatro códigos, los cuatro con salida 0: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] 3.9 Medida real: `git diff --shortstat --no-renames` contra el commit de partida del lote + `wc -l` de `oviGarantiaRemision.test.ts` nuevo; registrar frente a 272 (y 720).

## Tareas de persona — FUERA DEL RECUENTO

Sin casillas (regla del ciclo 1 de `CLAUDE.md`). **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Asignar los cargos de permiso ANTES de publicar: sin ellos sólo el administrador asocia una OVI | Gerencia | paquete de despliegue | `decision/e157-ovi-garantia-por-cargo`, consecuencia (5); se repite en el `archive-report.md` |
| P-2 | Confirmar si una OVI sólo puede ir en tickets de garantía | Director Técnico | bandeja (`docs/sdd/ENTRADA.md`), punto abierto con dueño | `decision/e157-ovi-garantia-por-cargo`, consecuencia (7) |
| P-3 | Recoger en el expediente del maestro que el acto es asociar y que basta el cargo | Gerencia | expediente R08.x | `maestro_revision: "pendiente"` de la decisión |

## Cierre (lo hace el orquestador)

Sin casillas; no son tareas de apply.

- Barrido de citas de la regla de mutación 4 sobre `ticketService.ts` y `remision.ts`: se comprueba el CONTENIDO de lo que afirma cada cita a `ticketService.ts` `:21`, `:36`, `:43`, `:44`, `:96`, `:131`, `:134` y a `remision.ts` `:220` (y rangos que las contienen, p. ej. `:218-244`), no sólo que la línea exista; más el segundo pase de las abreviadas.
- Punto nuevo de IV-12 (el cuarto: B después de C y D en la remisión, `remision.ts:127`, `:158`, `:177`, `:197`) en `CLAUDE.md` y `openspec/config.yaml`; corregir la nota que dice que la cuarentena «comparte el `if`» de «Orden de venta no encontrada».
- Corrección para el maestro (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`): el acto es asociar, no crear la OVI, y basta el cargo (`:2661`).
- Nota del paquete de despliegue: P-1 (cargos asignados antes de publicar).
