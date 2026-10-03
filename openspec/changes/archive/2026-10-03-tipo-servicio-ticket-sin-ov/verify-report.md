```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:24b3c686a2b75425d8792cfb6ddc7262855758e6219a41ed2c69633233e3d057
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 33/33
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:03fc5c7cd75e258304f9d5d780cd9882b81024545743dea9a6fc2bc77c44a47b
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:eeb13f7b5784d3c505a5fca9a86a9d7ebb82979eba3aded0436debe8562dd8c7
```

## Verification Report

**Cambio**: `tipo-servicio-ticket-sin-ov` (F1B-03, parte L, `cierra: no`)
**Modo**: Strict TDD (`npm test`, vitest)
**Árbol verificado**: worktree `tipo-servicio-ticket-sin-ov`, HEAD `4d140d6` (partida `5f68822`; planificación `ece1dea` y `a77ec68`; lote 1 `6dbae98`; lote 2 `613669b` y `4d140d6`). `evidence_revision` es el sha256 del texto del hash del árbol de `4d140d6` (`c9a1ef0a6a6eeffd7e36c6ce56e3e7927b3f995b`). Árbol limpio al empezar y al terminar (las mutaciones se revirtieron con `git checkout -- <fichero>`).
**Veredicto**: **PASS WITH WARNINGS** — 0 CRITICAL, 3 WARNING, 4 SUGGESTION

### Completitud

| Métrica | Valor |
|---|---|
| Tareas con casilla | **65/65** marcadas `[x]` (lote 1: 1.1-1.46; lote 2: 2.1-2.19); 0 incompletas. Lote 3: bloqueado, sin casillas, fuera del recuento (2.18) |
| Requisitos firmes (`### RQ` en `transitions-st` y `remisiones`) | **2** (RQ-TS-33, RQ-RE-20) |
| Escenarios firmes (`#### Scenario`) | **33** = 27 (`transitions-st`) + 6 (`remisiones`), coincide con la matriz de `openspec/changes/tipo-servicio-ticket-sin-ov/tasks.md:168` |
| Deltas borrador del lote 3 (`specs/permissions`, `specs/tickets-core`) | **No verificados como requisitos** (bloqueados por Q1, E-157). Deben retirarse antes de archivar (W-3) |

### Build y pruebas (ejecutadas por mí; `npm test` corrido SOLO, sin nada en paralelo)

| Comando | Resultado |
|---|---|
| `npm test` | exit 0 · **178 ficheros pasan, 1 omitido (179)** · **2632 pruebas pasan, 2 omitidas (2634)**, 0 rojas · duración 116 s. Repetida una segunda vez para el hash: mismas cifras. Coincide con `openspec/changes/tipo-servicio-ticket-sin-ov/apply-progress.md:64` |
| `npm run typecheck` | exit 0, sin diagnósticos |
| `npm run lint` | exit 0 · **165 problemas (0 errores, 165 avisos)** · en la línea base, 0 nuevos |
| `npm run build` | exit 0 · `✓ built in 1.57s` |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | exit 0 · **0 bloqueantes** · comprobadas 4668 · línea base 0 · cabeceras R-1 inválidas 0 · **10 abreviadas rotas informativas, ninguna en un fichero de este cambio** (`docs/sdd/F0-00_Baseline_as-built.md`, `docs/superpowers/plans/…`, `openspec/specs/…` por citas heredadas a `packages/shared/src/transitions.ts` y `permissions.ts`) |
| Cobertura | no ejecutada: la orden de verify no la pedía |

Ficheros de prueba del cambio, esta ejecución: `packages/shared/src/remision.test.ts` 41 · `apps/desk/server/services/ticketService.test.ts` 142 (bloque RQ-TS-33 desde la línea 1280) · `apps/desk/server/db/remisionVigente.test.ts` 11 · `apps/desk/src/lib/habilitarServicio.test.ts` 14 · `apps/desk/src/lib/botonRemision.test.ts` 8 · `apps/desk/server/transiciones.test.ts` 26 · `apps/desk/server/ordenVentaUnTicket.test.ts` 10 · `apps/desk/server/routes/ovAsociaciones.test.ts` 45. Todas verdes.

Líneas de las funciones nuevas, fijadas hoy (`design.md` §7 pedía fijarlas aquí): `exigirRemisionVigente` `apps/desk/server/services/ticketService.ts:273-277` (llamada en `:131`, tras `exigirAltaValidada`, `:258-264`); `vigenciaDeRemisiones` `apps/desk/server/db/remisiones.ts:237`; `RemisionParaVigencia` `packages/shared/src/remision.ts:115`, `esRemisionEntradaVigente` `:126`, `motivoSinRemisionVigente` `:131`, `esRemisionConfirmada` `:144`; `motivoNoHabilitar` `apps/desk/src/lib/habilitarServicio.ts:14`, `avisoRemisionSinConfirmar` `:29`.

### Cumplimiento de escenarios (prueba que lo cubre, pasada en esta ejecución)

Abreviaturas, todas con la línea del `it(` abierta y leída: **TS** = `apps/desk/server/services/ticketService.test.ts` · **RV** = `apps/desk/server/db/remisionVigente.test.ts` · **RM** = `packages/shared/src/remision.test.ts` · **HS** = `apps/desk/src/lib/habilitarServicio.test.ts` · **BR** = `apps/desk/src/lib/botonRemision.test.ts`.

| # | Escenario | Prueba (fichero y línea) | Qué afirma (leído) | Estado |
|---|---|---|---|---|
| **RQ-TS-33** | | | | |
| 1 | Sin remisión desde `OV asignada` | TS 1289 (`it.each` ORIGENES) | `422`, `error` = texto único, estado sin cambio, **0 filas** en `ticket_transitions` | ✅ |
| 2 | Sin remisión desde `Ticket creado` | TS 1289 | ídem; el ticket sigue en `Ticket creado` | ✅ |
| 3 | Sin remisión vigente desde `Remisión creada` | TS 1289 (sin ninguna) y TS 1298 (única ANULADA) | `422`, texto único, estado sin cambio | ✅ |
| 4 | Con remisión vigente pasa desde los tres orígenes | TS 1306 | tres orígenes con `conRemisionVigente` → estado final `Ingresado` | ✅ |
| 5 | `pendiente` habilita, y desde `Ticket creado` | TS 1337 (fila `pendiente`) y TS 1344 | `Ingresado`; **una sola fila** de traza `Ticket creado → Ingresado`, sin pasar por `Remisión creada` | ✅ |
| 6 | `error` habilita | TS 1337 (fila `error`) | `Ingresado` | ✅ |
| 7 | Anulada no habilita | TS 1328 (filas: una `ok` anulada, una `pendiente` anulada, dos anuladas mezcladas) | `422`, texto único, estado sin cambio | ✅ |
| 8 | Segunda vigente tras una anulada | TS 1337 (`[{ anulada }, {}]`) | `Ingresado` | ✅ |
| 9 | `ok_con_avisos` cuenta | TS 1337 | `Ingresado` | ✅ |
| 10 | Histórica `ok` cuenta | TS 1337 (`origen: 'historico'`) | `Ingresado` | ✅ |
| 11 | Tipo distinto de `entrada` no cuenta | TS 1328 (`tipo: 'salida'`) y RM 101 | `422` con texto único; el predicado da `false` en los 6 estados | ✅ |
| 12 | Equipo nuevo sin remisión bloqueado | TS 1352 | clasificación «Equipo nuevo» en `Ticket creado`: `422` con el texto único | ✅ (S-3, Q5 de publicación) |
| 13 | Equipo nuevo con remisión pasa | TS 1352 (misma prueba, tras `conRemisionVigente`) | `Ingresado` | ✅ |
| 14 | P1 · el área gana | TS 1417 | usuario de Servicio Técnico sin remisión: `403` que contiene «permiso», no `422` | ✅ |
| 15 | P2 · la alta validada gana | TS 1424 | provisional + equipo pendiente + sin remisión: `422` con «provisional» y **sin** «remisión de entrada» | ✅ |
| 16 | P3 · la remisión gana a los obligatorios | TS 1432 | `values` vacío: `error` = texto único y `errors` indefinido | ✅ |
| 17 | P4 · la remisión gana a la cuarentena | TS 1440 | OV en cuarentena sin remisión: `error` = texto único, `errors` indefinido | ✅ (no añade discriminación sobre P3: declarado) |
| 18 | P5 · la remisión gana a la OV ya asociada | TS 1448 | orden ya en otro ticket: `422` con texto único, no `409` | ✅ |
| 19 | P6 · el estado gana | TS 1456 | ticket en `Ingresado` sin remisión: `409` «no aplica desde el estado» | ✅ |
| 20 | P7 · el flujo gana | TS 1463 | «Soporte remoto» sin remisión: `409` que nombra los dos flujos | ✅ |
| 21 | Posiciones sin escenario posible | TS 1404 | sin excepción de cargo (`EXCEPCIONES_POR_CARGO.transiciones`) ni campo de prioridad (`t.fields`); lo de verificación va declarado en el comentario de TS 1267 | ✅ (ver W-1 por su redacción) |
| 22 | Sin consultas extra en otras transiciones | TS 1380 (control), 1387, 1395 | `habilitar_servicio` ejecuta la lectura nueva **una** vez; `ingreso_a_servicio` (que sí lee remisiones) y «Soporte remoto» **cero** | ✅ |
| 23 | El predicado discrimina sobre datos sucios | RM 93, 97, 101 (6 estados × 3 filas) + TS 1328/1337 | cuenta toda entrada no anulada sea cual sea el estado; rojo por m1, m2 y m3 (abajo) | ✅ |
| 24 | El motivo es accionable y en español | TS 1362 (×3 orígenes) + RM (`motivoSinRemisionVigente`) | texto exacto, contiene «Crea la remisión de entrada», sin `cliente`, `equipo` ni `provisional`, sin `snake_case` ni códigos; mismo texto con sólo anuladas | ✅ |
| 25 | El cliente desactiva el botón | HS 19, 23, 36 (decisión) | `motivoNoHabilitar` devuelve el texto único sin vigente; la pantalla (`TransitionPanel.tsx`) es de persona | ⚠️ lógica `.ts` probada; pantalla sin red (F0-00) |
| 26 | Si la carga falla, decide el servidor | HS 27, 32 | `null` o `undefined` → `null` (botón activo); el alta sigue mandando | ✅ |
| 27 | Aviso no bloqueante de «sin confirmar» | HS 41, 49, 54, 58, 62, 68, 72 + RM 138 | `pendiente` o `error` únicas → aviso; con una confirmada, `ok_con_avisos`, anulada, otro tipo o sin cargar → `null`; `motivoNoHabilitar` con vigente en cualquier estado → `null` | ⚠️ ídem: la aparición en pantalla es de persona |
| **RQ-RE-20** | | | | |
| 28 | Guarda y recuento coinciden donde deben | RV 59 (5 filas) | `ok`, `ok_con_avisos`, histórica, anulada (no), anulada + `ok` posterior (sí): **mismo veredicto** en guarda y en recuento (efecto: el ticket pasa o no a `Remisión creada`) | ✅ |
| 29 | Divergencia por `estado` afirmada | RV 67 (`pendiente`, `error`) | guarda `true`, recuento `false`, ticket sigue en `Ticket creado`; título y comentario la nombran | ✅ |
| 30 | Divergencia por `tipo` afirmada | RV 76 | `tipo` «salida», `ok`: guarda `false`, recuento `true` | ✅ |
| 31 | Una pendiente sigue bloqueando otra | RV 84 (+ RV 90) | `remisionPendienteDe` devuelve el id; la guarda dice que sí hay vigente | ✅ |
| 32 | El listado del panel no cambia | RV 96 | `ok`, `pendiente`, `error` no anuladas, y la anulada fuera | ✅ |
| 33 | El cliente no redefine «vigente» | HS 83 (×2 ficheros) | `habilitarServicio.ts` y `botonRemision.ts` importan los predicados y no contienen `anuladaAt` ni `'ok_con_avisos'`; más BR 62 (línea 39) | ✅ |

**Resultado: 33/33 con prueba que pasó hoy; 2 (25 y 27) lo hacen en el límite `.ts` y dejan la pantalla a una persona, declarado por F0-00.** Ninguna del servidor se apoya sólo en un código HTTP: afirman el texto y/o el estado final y la traza.

### Definición de «vigente», a la letra

- **Fuente de la letra, leída:** «La guarda exigirá remisión de entrada vigente (no anulada) para los tres» (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`) y «remisión de entrada vigente (creada y no anulada)» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). Ninguna dice nada del estado de envío.
- **Predicado:** `packages/shared/src/remision.ts:126` = `r.tipo === 'entrada' && !r.anuladaAt`. `RemisionParaVigencia` (`:115`) **no tiene `estado`**: el tipo mismo impide mirarlo.
- **Lectura del servidor:** `apps/desk/server/db/remisiones.ts:237` ejecuta `SELECT tipo, anulada_at FROM remisiones WHERE ticket_id = $1`: sin filtros y sin `estado`. La guarda `apps/desk/server/services/ticketService.ts:273-277` sale con `if (t.id !== 'habilitar_servicio') return` y usa `motivoSinRemisionVigente`.
- **`pendiente` y `error` habilitan:** TS 1337 y TS 1344 en el servidor; HS 41 en el cliente. m3 (abajo) lo vigila.
- **Un solo texto de `422`:** `packages/shared/src/remision.ts:131`; la guarda no ramifica por estado.
- **Divergencia DECLARADA con el recuento:** `apps/desk/server/db/estadoPorRemision.ts:43-47` (condición de `estado` en `:45`) sigue contando sólo `ok` u `ok_con_avisos` y no filtra `tipo`; `git diff 5f68822 -- apps/desk/server/db/estadoPorRemision.ts` **vacío**. RV 67 y RV 76 la afirman; d1 y d2 la defienden. **S-1 no ha vuelto.**
- **Consecuencia declarada:** un ticket en `Ticket creado` con una `pendiente` llega a `Ingresado` con una sola fila de traza (TS 1344). Es lo que pide la letra; no es defecto (propuesta §4.1; `design.md` D5).

### Mutaciones reproducidas por mí (reglas de mutación 1 y 2); cada una revertida con `git checkout -- <fichero>` y árbol limpio

Suite de referencia: `ticketService.test.ts` (142), salvo donde se indica.

| Mutación | Movimiento | Rojas (esta ejecución) | ¿Coincide con `apply-progress.md`? |
|---|---|---|---|
| **P1** | llamada a la guarda antes del `if` de área (`:129`) | **7**: P1, P2 de F1B-03 y 5 de F1B-15 (RQ-TS-32) | sí |
| **P2** | intercambiar las dos llamadas de la `:131` | **5**: P2 y 4 de F1B-15 | sí |
| **P3 (= P4)** | llamada detrás del `throw` de la `:134` | **2**: P3 y P4; P5 **verde** | sí |
| **P6** | llamada al final de la `:125`, tras `exigirMismoFlujo` | **8**: P6, P1, P2 y 5 de F1B-15; **P7 verde** | sí |
| **P7** | llamada entre el `404` y `exigirMismoFlujo` | **9**: P7, P6, P1, P2 y 5 de F1B-15 | sí |
| **m1** | quitar `r.tipo === 'entrada' &&` (`remision.ts`) | **9** (en los 3 ficheros): «tipo distinto» ×6, `motivoSinRemisionVigente` «sólo de tipo distinto», TS 1328 y RV 76 | sí (7 sólo en `remision.test.ts`) |
| **m2** | quitar `!r.anuladaAt` | **15**: «anulada» ×6, TS 1298, TS 1362 y TS 1328, entre otras | sí |
| **m3** (reintroducir el filtro de estado) | exigir `ok` u `ok_con_avisos` en el predicado | **40** en los 3 ficheros: 6 en `remision.test.ts` (entre ellas «cuenta con estado pendiente», «cuenta con estado error» y «con una vigente pendiente o en error»); 8 en `remisionVigente.test.ts`; el resto del servidor, porque la lectura no trae `estado` | sí (40) |
| **d1** | quitar la condición de `estado` del recuento (`estadoPorRemision.ts:45`) | **2**: filas `pendiente` y `error` de RV 67 | sí |
| **d2** | `AND tipo = 'entrada'` en el recuento | **1**: RV 76 | sí |
| **m5** | quitar la salida temprana por `t.id` | **16** en `ticketService.test.ts` (espías TS 1387 y 1395 y las transiciones que reciben el `422`) | sí |
| 1.21 | `AND estado <> 'error'` en `listRemisionesByTicket` (`remisiones.ts:77`) | **1**: RV 96 | sí |
| Equivalente | mover **EL PAR** `exigirAltaValidada` + `exigirRemisionVigente` delante de cargo | **0 rojas** en los 8 ficheros de servidor (**298/298 verdes**; `apply-progress.md` midió 251/251 en seis suites: otro denominador, mismo resultado) | sí |

**Mutante equivalente declarado:** confirmado. Mover **sólo** la guarda delante de cargo, prioridad o verificación la deja delante de `exigirAltaValidada` y **P2 se pone roja** (P2 y P1 arriba lo muestran). La descripción es hoy **correcta** en `openspec/changes/tipo-servicio-ticket-sin-ov/design.md:264-268` y en la tarea 1.12 (`openspec/changes/tipo-servicio-ticket-sin-ov/tasks.md:46`), pero **sigue falsa en el comentario de la prueba** (W-1).

**Controles de las dos pruebas endurecidas, reproducidos:** (1.33) con la remisión quitada del ayudante de `apps/desk/server/transiciones.test.ts:16`, **6 de 26** se ponen rojas, entre ellas «rechaza derivar a alguien que no existe o que está dado de baja» (que ahora exige el texto de la persona y no sólo el `422`); (1.34) con la remisión quitada de `apps/desk/server/services/ticketService.test.ts:927`, se pone roja la «POSICIÓN habilitar_servicio: la OV en cuarentena YA está en otro ticket». **Hipótesis (a) y (b):** (a) la suite de `apps/desk/server/routes/ovAsociaciones.test.ts` (45) pasa hoy con la `ok` de `ovLiberada` (línea 170); (b) no la re-ejecuté, la tomo de `apply-progress.md:42`.

### Regla 13, línea a línea (cliente contra servidor)

| Decisión del cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|
| Desactivar «Habilitar Servicio» sin remisión de entrada vigente (`apps/desk/src/components/TransitionPanel.tsx:70` calcula `motivoBloqueo`; `:130` pone `disabled` y `title` **sólo** con él) | `apps/desk/server/services/ticketService.ts:131` → `:273-277`, `422` con el mismo texto; probada por TS 1289-1463 | Espejo legítimo, imposición **probada** (punto 3) |
| Qué es «vigente» (`apps/desk/src/lib/habilitarServicio.ts:14`, `apps/desk/src/lib/botonRemision.ts:33`) | No decide: consume `esRemisionEntradaVigente` y `motivoSinRemisionVigente` (`packages/shared/src/remision.ts:126`, `:131`); el servidor llama a las mismas (`ticketService.ts:275`) | Punto 1; la vigila HS 83 |
| **Aviso «sin confirmar»** (`TransitionPanel.tsx:70`, `:137`, sólo con botón activo: `habilita && !motivoBloqueo && avisoSinConfirmar`) | **Ninguna, y no la necesita:** el servidor habilita igual con `pendiente` o `error` (`ticketService.ts:273-277` no lee `estado`; `remisiones.ts:237` tampoco). Probado por TS 1337 y 1344 | **Presentación sin imposición**; un aviso de más o de menos no cambia lo que el servidor permite |
| Qué es «confirmada» (aviso y `botonRemision.ts:39`) | No decide: `esRemisionConfirmada` (`packages/shared/src/remision.ts:144`); es la misma noción que el recuento SQL de `estadoPorRemision.ts:43-47`, dos implementaciones **declaradas y enfrentadas** por RV 59-76 | Sin guarda que la use |
| **`botonRemision.ts:39`**: no ofrecer «Crear remisión» con una confirmada | **Ninguna**, y ya era así: el servidor sólo rechaza con una `pendiente` (`apps/desk/server/routes/remision.ts:174-183`, el `409` en `:177`), no con una confirmada | Presentación mientras la pantalla refresca; la sustitución por `esRemisionConfirmada` no cambia comportamiento (BR 62 lo ata) |
| Reetiquetar con una `pendiente` (`botonRemision.ts:34`, sin tocar) | `apps/desk/server/routes/remision.ts:174-183` | Imposición vecina existente |
| Orden alta → remisión (`habilitarServicio.ts:14`) | Orden de las dos llamadas de `ticketService.ts:131`, fijado por P2 (TS 1424) | Probado |
| Remisiones sin cargar → botón activo, sin aviso | No es decisión: se abstiene; contesta el servidor (`ticketService.ts:131`). `apps/desk/src/components/TicketDetailView.tsx:339` pasa `remisiones`, que es `null` mientras carga | — |

**¿La tabla de `apply-progress.md:95-108` es exacta?** Sí en lo sustantivo: las líneas del servidor (`:273-277`, `:258-264`, `:129-131`, `:237`, la ruta `remision.ts:174-183`) y la distinción «presentación sin imposición» para el aviso y la línea 39 coinciden con lo que leí. Una imprecisión menor: dice que `TicketDetailView.tsx:53` «pasa `null`», pero la línea 53 sólo obtiene `remisiones` con `useAsync`; la que la pasa al panel es `apps/desk/src/components/TicketDetailView.tsx:339` (S-2). Los usos de `anuladaAt` en `apps/desk/src/components/RemisionesPage.tsx:34` y `:275` son de presentación del listado y no deciden si se puede pulsar «Habilitar Servicio»: no queda copia de «vigente» ni de «confirmada» en `apps/desk/src` para esa decisión.

### Regla de mutación 4

- **Desplazamientos:** `git diff -U0 5f68822 HEAD -- <fichero>` en los **22 ficheros existentes tocados** (los de pruebas, `ticketService.ts`, `remisiones.ts`, `remision.ts` y `remision.test.ts` de shared, `botonRemision.ts`, `botonRemision.test.ts`, `TransitionPanel.tsx`, `registro.test.ts`, `RECONCILIACION.md` y `F0-01_Correcciones_para_el_maestro.md`): **todos** los hunks son `-N +N` (misma línea) o añadidos tras la última línea (`ticketService.ts` `-264,0 +265,13`; `remisiones.ts` `-230,0 +231,10`; `remision.ts` `-112,0 +113,34`; `ticketService.test.ts` `-1264,0 +1265,205`; `remision.test.ts` `-84,0 +85,65`; `botonRemision.test.ts` `-61,0 +62,7`; `F0-01` `-1118,0 +1119,71`). **Cero desplazamientos.**
- **Muestreo de 15 citas vivas** (incluye `openspec/changes/archive/`), cada una leída contra el fichero:

| # | Cita | Qué afirma | ¿Sigue diciéndolo? |
|---|---|---|---|
| 1 | `openspec/specs/permissions/spec.md:486` → `ticketService.ts:131` | `liberacion_sin_factura` exige Director Comercial | ✅ el cargo sigue en la `:131` |
| 2 | `openspec/specs/transitions-equipo-nuevo/spec.md:53` → `:125-131` | mismo catálogo compartido (flujo, estado, área, cargo) | ✅ |
| 3 | `openspec/specs/transitions-equipo-nuevo/spec.md:201` → `:114-223` | alcance de `executeTransition` | ✅ |
| 4 | `openspec/specs/transitions-st/spec.md:206` → `:114-223` | orden de las guardas de RQ-TS-06 | ✅ (la tabla no lista la guarda 10: ya declarado en el delta, S-4) |
| 5 | `openspec/changes/archive/2026-09-27-salidas-verificacion/specs/transitions-equipo-nuevo/spec.md:38` → `:125-131` | ídem | ✅ |
| 6 | `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/proposal.md:71` → `:131` | `exigirVerificacion` tras área y cargo | ✅ |
| 7 | `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/specs/transitions-equipo-nuevo/spec.md:304` → `:125-131` | ídem | ✅ |
| 8 | `openspec/changes/archive/2026-09-30-permisos-por-cargo/proposal.md:43` → `:129-131` | cargo impuesto en esas líneas | ✅ |
| 9 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:47` → `:131` | la guarda de prioridad del técnico | ✅ |
| 10 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:743` → `:131` | `403` de cargo tras el de área | ✅; «antes de todo 422 (`:134`)» es registro fechado (caso B natural): hoy dos `422` más van en la misma `:131` tras el cargo |
| 11-15 | cinco citas a la línea 220 de `registro.test.ts` en `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/tasks.md:57`, `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/verify-report.md:282`, `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/archive-report.md:128`, `openspec/changes/archive/2026-10-02-rechazo-solo-comercial/verify-report.md:127` y `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/apply-progress.md:45` | «la lista de `en curso`» en esa línea | ✅ la línea 220 sigue siendo esa lista (hoy con `F1B-03`, siete); los «seis» que mencionan son registro fechado (caso B natural, ya anotado en `apply-progress.md:118`) |

El detector (`--sha HEAD`, 0 bloqueantes) cubre las completas; las abreviadas (`:131`, `:129-131`, `:33`, `:39`, `:70`, `:130`, `:137`) en `CLAUDE.md`, `openspec/config.yaml` y las specs vivas son, según `apply-progress.md:118`, de otros ficheros o repiten lo cierto; no encontré contraejemplo en el muestreo.

### Alcance

- `git diff --stat 5f68822 HEAD` sobre `packages/shared/src/transitions.ts`, `apps/desk/server/routes/remision.ts`, `openspec/specs` y `apps/desk/server/db/estadoPorRemision.ts` → **vacío**: no se tocaron la transición, la ruta de remisión, ninguna spec viva ni el recuento.
- Nada de OVI en código: ni `packages/shared/src/cargos.ts`, ni `subOV.ts`, ni rutas de orden de venta cambiaron; lo único con OVI es el delta borrador `openspec/changes/tipo-servicio-ticket-sin-ov/specs/permissions/spec.md` (carpeta del cambio).
- `apps/desk/server/reconciliacion/registro.test.ts:220` y `docs/sdd/RECONCILIACION.md:21` reflejan F1B-03 **«en curso» (7)**: `F0-04, F1B-03, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05`. **Seguirá «en curso» tras archivar:** `apps/desk/server/reconciliacion/comprobaciones.ts:222` sólo saca de «en curso» las tandas `archivada && cierra`, y este cambio es `cierra: no`. No tocar esa línea al archivar.
- Q5 sigue como **supuesto S-3 declarado y condición de publicación** (E-158; la entrada vive en `main`, no en este worktree, que parte de `5f68822`: la comprobé en el árbol de `main`, sin escribir nada allí).

### Contenido de la fila (para sostener `cierra: no`)

`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`: este cambio cubre **sólo la guarda de remisión vigente** (servidor, espejo de comodidad y aviso del cliente, lotes 1 y 2) y da por ya construido el tipo de servicio y el ticket sin OV; deja fuera la **OVI de garantía** (lote 3 bloqueado por E-157) y la **supresión de los prefijos** (segundo cambio, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177`, E-094).

### Tareas de persona y condiciones de publicación (no son defectos; archivar no las da por hechas)

| Tarea | Dueño | Condición de |
|---|---|---|
| Ejecutar contra producción `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` y `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` (esta última **no ejecutada** aquí: sin `psql` ni `DATABASE_URL`) y entregar las cifras | Gerencia | Publicación |
| Q5/E-158: ¿la guarda alcanza a «Equipo nuevo»? (S-3 mantiene «sí») | Gerencia | Publicación |
| Q1/E-157: qué es «crear la OVI» (más cinco preguntas); bloquea el lote 3, que no entra | Gerencia con el Director Técnico | Un cambio propio |
| E-159: registrar `habilitar-servicio-sin-remision` en `openspec/config.yaml` | Supervisión | Bandeja |
| Asignar `cargo_permiso` «Director Técnico» en producción | Gerencia o administrador | Sólo si llega a construirse el lote 3 |
| Verificación en la app tras desplegar: botón desactivado con el texto único sin remisión de entrada; **activo** con aviso con la remisión sin confirmar; sin aviso con la confirmada | Persona de Comercial | Tras publicar el lote 2 |

### Hallazgos

| ID | Sev. | Hallazgo y evidencia | A quién |
|---|---|---|---|
| W-1 | WARNING | El comentario de la prueba `apps/desk/server/services/ticketService.test.ts:1277-1278` **sigue afirmando lo falso**: «Mover la guarda nueva delante de cargo, prioridad o verificación DENTRO de la línea 131 es un mutante equivalente: no lo caza nada». Medido (P2, P1): mover sólo la guarda **sí** pone roja P2; el equivalente es mover **el par**. `design.md:264-268` y la tarea 1.12 sí se corrigieron (`apply-progress.md:127` lo da por corregido «en los dos sitios»: el tercero es este comentario). Es un comentario, no un defecto de comportamiento | Quien prepare el archive: edición **en sitio** de las líneas 1277-1278 (sin añadir líneas) para decir «mover el PAR» |
| W-2 | WARNING | `openspec/changes/tipo-servicio-ticket-sin-ov/apply-progress.md:140` presenta como hecha una «comprobación de persona en la app: botón desactivado… activo con aviso… sin aviso con la confirmada», pero `tasks.md:138` la deja para tras publicar, y `apply-progress.md:132` admite que no hubo `psql` ni base local. Afirmación sin evidencia que viajaría al archivo como cierta (regla de método: es hipótesis) | Quien archive: reformular como «pendiente de persona tras publicar» (en sitio) |
| W-3 | WARNING | Los deltas borrador `openspec/changes/tipo-servicio-ticket-sin-ov/specs/permissions/spec.md` (121 líneas) y `openspec/changes/tipo-servicio-ticket-sin-ov/specs/tickets-core/spec.md` (47) siguen en la carpeta, y la cabecera de `openspec/changes/tipo-servicio-ticket-sin-ov/proposal.md` declara `capacidad: [transitions-st, remisiones, permissions, tickets-core]`. Si se archivara así, `permissions` y `tickets-core` se fusionarían sin que su lote exista. Lo cubren las instrucciones de archive (`openspec/changes/tipo-servicio-ticket-sin-ov/tasks.md:121`); aquí sólo se registra | Archive, **antes de nada** |
| S-1 | SUGGESTION | `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:28` promete una fila final con estado «— total —», pero la consulta usa `GROUP BY ROLLUP` y devuelve `estado` NULL en el total (sin `COALESCE`). La consulta es de sólo lectura y sintácticamente válida; la persona verá la fila NULL al final. Sin ejecutar aquí | Quien la corra, o una edición en sitio del comentario |
| S-2 | SUGGESTION | `openspec/changes/tipo-servicio-ticket-sin-ov/apply-progress.md:105` cita `TicketDetailView.tsx:53` como el sitio que «pasa `null`»; lo que pasa `remisiones` al panel es `apps/desk/src/components/TicketDetailView.tsx:339` | Archive (en sitio) |
| S-3 | SUGGESTION | Escenarios 25 y 27: el `.tsx` (`TransitionPanel.tsx:130`, `:137`) no tiene red (F0-00) y la decisión está probada sólo en `.ts`. Un cambio que dejara de pasar `motivoBloqueo` a `disabled` no se pondría rojo. Es decisión de Gerencia, no un defecto; la cubre la verificación en la app | Persona de Comercial |
| S-4 | SUGGESTION | La tabla de `openspec/specs/transitions-st/spec.md` (RQ-TS-06) sigue sin listar cargo, prioridad, verificación, alta validada ni la guarda 10; el delta lo declara y no lo corrige. Las pruebas P1-P7 son hoy la única fijación del orden completo | Cambio futuro de documentación de RQ-TS-06 |

No hay CRITICAL: ninguna prueba falla, ninguno de los 33 escenarios queda sin prueba pasada, y las mutaciones de posición, de predicado y de divergencia se ponen rojas donde deben.

### Instrucciones para `archive`

1. **Antes de nada**, retirar `specs/permissions/spec.md` y `specs/tickets-core/spec.md` (168 líneas borradas; cuentan en la medida y se anotan como retirada, sin carga de revisión) y poner la cabecera de `openspec/changes/tipo-servicio-ticket-sin-ov/proposal.md` en `capacidad: [transitions-st, remisiones]`. No se fusionan ni viajan al archivo.
2. Ediciones **en sitio**, sin añadir líneas, de W-1 (`ticketService.test.ts:1277-1278`) y W-2 (`apply-progress.md:140`); S-2 opcional.
3. **Medir antes de aplicar** la parte revisable (fusión de los deltas de `transitions-st` y `remisiones` en las specs vivas más `archive-report.md`) con `git diff --shortstat --no-renames`: ≤ 800; si pasa, parar y consultar (regla del archivo). La mudanza de carpetas no pide techo.
4. Segundo barrido de citas tras la fusión (inserta líneas en dos specs vivas): las dos de RQ-TS-33 a RQ-TS-03 (`openspec/specs/transitions-st/spec.md:98` y `:101-103`) no deben moverse; separar casos A, B y C.
5. `archive-report.md`, en una línea: cubre la guarda de remisión vigente (parte L, lotes 1 y 2); deja fuera los prefijos (segundo cambio), la OVI de garantía y la calibración directa; tipo de servicio y ticket sin OV ya construidos por tandas anteriores.
6. El commit de archivo contiene **sólo** este cambio (`git show --numstat`): no meter los ficheros sin trackear del repositorio. **No tocar `registro.test.ts:220`:** F1B-03 sigue «en curso» (`cierra: no`); comprobar que la prueba sigue verde.
