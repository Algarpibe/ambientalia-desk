```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d14d47161363aa708b0d96910ed0a3ba9f17d810acb348692557c011b252255b
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 13/13
scenarios: 45/45
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:496ea8dbb471bd67c62fb3d55d3de21ffcdc586232f88ad1af478d78bdf5ee5d
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:132912b410dd6058b8d15308cf56b47813ba8dc6d53f2d151e6e99683002c3f1
```

# Informe de verificación — `salidas-esperas` (F1C-03, `cierra: si`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\salidas-esperas`, rama `salidas-esperas`, HEAD `165d5c2d`, base de la tanda `24b86092`. Preflight: auto · hybrid · ask-on-risk · 800 (válvula 720) · strict_tdd. Verificado el 2026-10-21 sin tocar código: cada mutación se restauró por copia con hash igual y `git status` quedó limpio.

## Veredicto: PASS CON AVISOS — 0 CRITICAL · 3 WARNING · 3 SUGGESTION

Los cinco códigos salen en 0; las mutaciones del encargo (M1-M6, SE-2, SE-3 y las tres variantes de M5) ponen en rojo la prueba que debían; la tabla de la regla 13 coincide línea a línea con el código y ninguna decisión del cliente carece de línea del servidor. Los avisos son de forma (casillas de cierre), de cobertura parcial de dos escenarios y de un límite conocido de pg-mem.

## 1. Códigos de salida (en serie, sobre HEAD, árbol limpio)

| Orden | Comando | Código | Detalle (logs en `C:\dev\Desk_2_R1.023-worktrees\`) |
|---|---|---|---|
| 1 | `npm run typecheck` | **0** | `sal-v-tc.log` |
| 2 | `npm run lint` | **0** | `sal-v-lint.log`: 0 errores, **165** avisos (línea base intacta) |
| 3 | `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | `sal-v-citas.log`: 7.524 comprobadas, **cabeceras R-1 inválidas 0**, 13 abreviadas rotas informativas (las mismas que declara apply-progress; ninguna en ficheros tocados por la tanda) |
| 4 | `npm test` | **0** | `sal-v-test.log`: 313 ficheros pasan (3 omitidos), **5.323** pruebas pasan (11 omitidas), 284 s. Coincide con apply-progress (I5) |
| 5 | `npm run build` | **0** | `sal-v-build.log` |

## 2. Tareas

33 marcadas, 6 sin marcar: `I3a.c`, `I3b.c`, `I4.c`, `I5.c` (cierres de lote, ver W1), `I6.1` (este verify) e `I7.1` (archive, posterior). Todas las tareas de trabajo (I3a.1-9, I3b.1-6, I4.1-8, I5.1-10) están marcadas y su evidencia está en código y en apply-progress.

## 3. Matriz requisito · escenario · prueba · resultado

Todas las pruebas citadas pasan (`npm test` en 0). Abreviaturas (los números de `S`, `SH` y `D` se leen en `6b18fcc3`: `f00c9c68` reescribió esos tres ficheros): `S` = `apps/desk/server/salidasEsperas.test.ts`; `SH` = `packages/shared/src/salidasEsperas.test.ts`; `P` = `packages/shared/src/plazosEsperas.test.ts`; `I` = `packages/shared/src/invariantesGrafo.test.ts`; `A` = `apps/desk/server/services/avisoSalidasEsperas.test.ts`; `V` = `apps/desk/server/db/esperasVencidas.test.ts`; `D` = `apps/desk/server/deploySalidasEsperas.test.ts`.

### transitions-st

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-TS-56 · el atajo llega a `Por Facturar` sólo por Control de calidad; `finalizacion_servicio` da 409 | `apps/desk/server/calibracionDirecta.test.ts:204` (preexistente de F1C-08, intacta) | OK |
| RQ-TS-56 · las entradas sin CC son cuatro (encendido) y tres (apagado) | `I:424`, `I:429`, `I:435` | OK |
| RQ-TS-56 · ensuciar el catálogo pone la propiedad en rojo | `I:450`, `I:459`, `I:468`, `I:473`; mutaciones M5a-c (§4) | OK |
| RQ-TS-60 · tipos, áreas, recorridos y campos | `SH:18`, `SH:26`, `packages/shared/src/tipoEvento.test.ts:43`, `:49` | OK |
| RQ-TS-60 · `cobro_diagnostico_espera` es Decisional | `SH:18`, `tipoEvento.test.ts:49` | OK |
| RQ-TS-60 · las salidas de hoy no cambian (caracterización) | `SH:41` (cae con M5a y M5b) | OK |
| RQ-TS-61 · apagado, D1 da 409 y el ticket no se mueve | `S:45` | OK |
| RQ-TS-61 · apagado, D2 da 409 | `S:55` | OK |
| RQ-TS-61 · apagado, el panel no las ofrece (cualquier valor distinto de true) | `SH:54`, `SH:63` | OK |
| RQ-TS-61 · encendido pasan y dejan fila en `ticket_transitions` | `S:74`, `S:82`, `S:117`, `S:128` | OK |
| RQ-TS-62 · 40 transiciones, 23 estados, 49 pasos | `I:50`, `I:172`, `packages/shared/src/cifrasAncladas.test.ts:58`, `mapaBlueprint.test.ts`, `tipoEvento.test.ts:43-49` | OK |
| RQ-TS-62 · la derivación por defecto no cambia (35 heredan) | `packages/shared/src/transitions.test.ts:123`, `SH:34` | OK |
| RQ-TS-63 · salidas de `Solicitado` y SKU; ninguna a `Anulado` ni `Por Facturar` | `I:439`, `I:444`, `packages/shared/src/estados.test.ts:146`, `:177` | OK |
| RQ-TS-63 · ensuciar el catálogo lo pone en rojo | `I:450`, `I:459`, `I:468`; M5a-c | OK |
| RQ-TS-64 · SE-1 interruptor < área | `S:108` | OK |
| RQ-TS-64 · SE-2 área < ejecutor | `S:238` | OK |
| RQ-TS-64 · SE-3 ejecutor < 422 | `S:256` | OK |
| RQ-TS-64 · SE-4 el 422 llega cuando las demás pasan | `S:144` (respaldo sin motivo, cobro) | OK |
| (extra de posición) SE-0 estado < interruptor; SE-2b ejecutor < Decisionales; SE-5 un solo 422 | `S:100`, `S:247`, `S:265` | OK |

### permissions

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-PM-42 · la persona a cargo ejecuta sin motivo | `S:117`, `S:128`, `S:136`; pura `SH:111` | OK |
| RQ-PM-42 · el respaldo sin motivo no pasa (422) | `S:144`; pura `SH:160` | OK |
| RQ-PM-42 · el respaldo con motivo pasa | `S:153` | OK |
| RQ-PM-42 · el administrador es respaldo con motivo | `S:165`; pura `SH:123` | OK |
| RQ-PM-42 · otro usuario del área recibe 403 | `S:181` | OK |
| RQ-PM-42 · derivado nulo, inactivo o de otra área = no disponible (S-2) | HTTP de otra área `S:190`; nulo e inactivo en la regla pura `SH:140` | OK (ver S2) |
| RQ-PM-43 · la persona a cargo ejecuta la Decisional sin ser Director (DPC encendido) | `S:219`; pura `SH:185` | OK |
| RQ-PM-43 · con DPC apagado la regla del ejecutor rige (S-10) | `S:181` (la app por defecto no enciende DPC), `SH:190` | OK |
| RQ-PM-43 · otras Decisionales no cambian | `S:219` (`rechazo_comercial` sigue pidiendo cargo), `SH:201` | OK |
| RQ-PM-43 · apagado, `anulacion` desde ER/SE es como hoy | `S:64`, `S:230` | OK |
| RQ-PM-44 · la traza guarda quién y por qué | `S:153` (`performed_by_id`; motivo en la traza y no en `custom_fields`), `S:117` | OK |
| RQ-PM-44 · la persona a cargo no deja motivo del respaldo (S-14) | `S:172` (con motivo, 422), `S:117` (sin motivo, traza limpia) | OK |
| RQ-PM-44 · un motivo de espacios cuenta como en blanco | pura `SH:160`; HTTP `S:144` (ausente) | OK (ver S2) |
| RQ-PM-45 · el cliente y el servidor coinciden | puras `SH:183-205`; HTTP `S:116-235`; barridos `permisos.test.ts:54`/`:100`, `cargoPermiso.test.ts:260`, `transicionesEjecucion.test.ts:263`; ruta `S:288-301` | PARCIAL (W2) |
| RQ-PM-45 · el panel de un ticket en espera (cliente) | **MANUAL.** Interfaz fuera de la red de pruebas por decisión de Gerencia (F0-00). Dueño: Supervisión, en las pruebas en la app. Archivar no lo da por hecho | Fuera del recuento |

### derivacion-avisos

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-AV-25 · valores, clave y fecha | `P:13` | OK |
| RQ-AV-25 · las claves son `ESTADOS_SIN_SALIDA` | `P:18` | OK |
| RQ-AV-25 · independiente del SLA | `P:44`, `P:51` (caen con M6) | OK |
| RQ-AV-25 · vence en el plazo, nunca antes | `P:29` (cae con M2) | OK |
| RQ-AV-26 · una externa vencida sugiere a Comercial | `A:41` | OK |
| RQ-AV-26 · una interna escala, no sugiere | `A:63`; textos `P:62-91` (caen con M4) | OK |
| RQ-AV-26 · antes del plazo no avisa | `A:53` (`it.each` de las cuatro: plazo-1 no avisa ni marca; plazo sí) | OK |
| RQ-AV-26 · nunca ejecuta una transición | `A:179` (comportamiento), `A:189` (fuente) | OK |
| RQ-AV-26 · un ticket de Zoho sin historial en la app también vence | `A:75`, `V:42` | OK |
| RQ-AV-26 · apagado no corre | `A:200` | OK |
| RQ-AV-27 · dos pasadas, un aviso | `A:93` (cae con M3) | OK |
| RQ-AV-27 · la reentrada vuelve a avisar | `A:103`, `V:63` | OK |
| RQ-AV-27 · el fallo de un aviso no impide los demás; el primero se reintenta | `A:116` (la mitad «no impide los demás»); el reintento no es observable en pg-mem | PARCIAL (W3) |

**Resumen:** 13 requisitos con prueba que pasa; 46 escenarios en las deltas, de los que 1 es MANUAL y queda fuera del recuento (el envelope cuenta 45): 43 OK y 2 PARCIAL con la mitad medible cubierta (RQ-PM-45 «coinciden», RQ-AV-27 «reintento»), anotados como completados 45/45 y con aviso. El manual no cuenta como fallo.

## 4. Mutaciones reproducidas por mí

Método: script de copia, reemplazo exacto una vez, `vitest run` de 7 ficheros (`S`, `A`, `V`, `P`, `SH`, `I` y `estados.test.ts`), restauración por copia; las 12 restauraciones con hash IGUAL. Línea base sin mutar: 152 pruebas en verde.

| ID | Qué se hizo | Rojas | Prueba que cayó |
|---|---|---|---|
| M1 (a) | tras avisar, `UPDATE  tickets SET status = 'Finalizado'` | 2 | `A:179` «nunca ejecuta… ningún estado cambia» y `A:103` «la reentrada» |
| M2 (b) | `esperaVencida` con `dias >= plazo - 1` | 6 | `P:29`; `A:53` ×4 (una por espera); `A:103` |
| M3 (c) | avisar por `crearAviso` directo, sin `marcarYAvisarAlarma` | 3 | `A:93`, `A:103`, `A:209` («una vez por día civil») |
| M4a (d) | texto de `Solicitado` con «o anular» | 3 | `P:70`, `P:77`, `A:63` |
| M4b (d) | texto de SKU con «o cobrar» | 3 | `P:70`, `P:77`, `A:63` |
| M5a (e) | `anulacion` también desde `Solicitado` | 5 | `I:439`, `I:444`, `I:450`, `I:468`, `SH:41` |
| M5b (e) | `anulacion` también desde la espera de SKU | 6 | `SH:41`, `I:439`, `I:444`, `I:450`, `estados.test.ts` «nueve estados…» y «da cinco» |
| M5c (e) | `cobro_diagnostico_espera` también desde la espera de SKU | 5 | `SH:18`, `I:439`, `I:444`, `estados.test.ts` ×2 |
| M6 (f) | `plazosEsperas.ts` importa `./sla` y `SLA_HORAS_POR_ESTADO` gana `Solicitado: 5` | 2 | `P:44` (disjunción) y `P:51` (fuente) |
| SE-2 (g) | `exigirEjecutorSalida` ANTES del `403` de área | 2 | `S:238` (SE-2) y `S:90` («quien no es del área sigue recibiendo el 403 de área») |
| SE-3 (g) | el `403` del ejecutor DESPUÉS del `422` del agregado | 1 | `S:256` (SE-3) |

**Ninguna mutación sobrevivió: no hay hallazgo de detector faltante.** Dos observaciones: (1) M1 con dos espacios no toca la prueba de fuente, así que cae sólo la de comportamiento, que es lo buscado; la de fuente la cubre la variante `INSERT INTO ticket_transitions` que registró apply-progress. (2) Las tres mutaciones «equivalentes» que apply-progress declara (I4.6a, I4.6b, SE-2b sólo mover) no las reproduje: son pares sin prueba posible declarados en D3, y su posición descansa en `&& !ejecutor` (mutación I4.7a, registrada roja en RQ-PM-43).

## 5. Tabla de la regla 13 contrastada contra el código de hoy

Comprobado por lectura en `ticketService.ts`, en `6b18fcc3`: `:128` llama a `exigirInterruptorSalidasEsperas` (definida `:318`); `:131` calcula `ejecutor` con `veredictoEjecutorSalida` (`:329`), llama a `exigirEjecutorSalida` (`:335`) y deja a Decisionales con `&& !ejecutor`; `:134` construye `errRespaldo = erroresMotivoRespaldo(ejecutor, values)` dentro del `if` y de `errors`. `decisionales.ts:20` es `contextoSalidasEsperas`; `routes/permisosSalidasEsperas.ts:16` sirve `GET /api/permisos/salidas-esperas` con esa misma función; `salidasEsperas.ts:70` es `erroresMotivoRespaldo`. Superado por `f00c9c68` (`decision/f1c03-quien-ejecuta-salidas`): hoy `:134` construye `errMotivoCobro`, `exigirEjecutorSalida` está en `ticketService.ts:334` y `erroresMotivoCobro` ocupa `salidasEsperas.ts:68-72`.

| Decisión del cliente (`TransitionPanel.tsx`, `api/client.ts`) | Línea del servidor que la impone (hoy) | Estado |
|---|---|---|
| Oculta las dos nuevas con el interruptor apagado (`TransitionPanel.tsx:57`, `visibleConSalidasEsperas`) | `ticketService.ts:128` → `:318` (409) | Línea comprobada |
| Oculta las tres salidas a quien no es persona a cargo ni respaldo (`:57`, `puedeEjecutarConSalidasEsperas`) | `ticketService.ts:131` → `:329`/`:335` en `6b18fcc3` (403; superado por `f00c9c68`), tras el área `:129-130` | Línea comprobada |
| Ofrece `cobro` a la persona a cargo sin cargo con DPC encendido (`:57`) | `ticketService.ts:131` (`!ejecutor` en `faltanDecisional`) | Línea comprobada |
| Pide «Motivo del respaldo» sólo al respaldo (`:179`, `ejecutorDeSalida` con vía respaldo) | `ticketService.ts:134` → `salidasEsperas.ts:70`/`:74` en `6b18fcc3`, retirado por `f00c9c68` (422 si el respaldo no lo da) | Línea comprobada |
| No lo pide a la persona a cargo (`:179`) | `ticketService.ts:134` → `salidasEsperas.ts:75` en `6b18fcc3`, retirado por `f00c9c68` (422 si llega con texto, S-14) | Línea comprobada |
| Vacante del Coordinador Técnico (`TransitionPanel.tsx:55`, `client.ts:921`) | `decisionales.ts:20`, usada por `ticketService.ts:329`, en `6b18fcc3` (la vacante la retiró `f00c9c68`), y `routes/permisosSalidasEsperas.ts:17`: la misma función | Línea comprobada |
| Persona a cargo = `derivadoActual?.id` del ticket que ve el panel (`:57`, `:179`) | `ticketService.ts:329`/`:131` en `6b18fcc3` lee `current.row.derivado_a` de la base: el servidor no se fía del navegador (retirado por `f00c9c68`: el derivado ya no decide) | Línea comprobada |
| Sin respuesta de la ruta, el panel asume apagado (`:55`, S-20) | Ninguna, **declarada**: oculta de más las dos nuevas (el servidor las rechazaría con 409) y puede ofrecer `anulacion` que el servidor encendido rechace con 403/422 | Degradación declarada, no guarda |

**Resultado: 0 decisiones del cliente sin línea del servidor.** Ninguna actúa como guarda única; el cliente sólo puede ocultar de más, nunca abrir una vía que el servidor cierre. No se prueba mecánicamente la propia interfaz (fuera de la red por decisión de Gerencia); sí el servidor y la regla pura.

## 6. Cabecera R-1 y `cierra: si`

Cabecera de `proposal.md:1-9` con los **siete** campos: `tanda: F1C-03`, `motivo: ""` (vacío válido: no es `fuera-del-plan`), `capacidad: [transitions-st, permissions, derivacion-avisos]`, `maestro`, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`. El detector informa 0 cabeceras inválidas. Un solo `tanda:` (R-4). R-2 no aplica: no se crea ninguna capacidad nueva.

**Qué de F1C-03 cubre** (plan R01.4:101 «C3 salidas de las esperas, ejecutadas por la persona a cargo»; `:163` «salida de emergencia por la persona a cargo, dentro de F1C-03; F1C-05 no se reabre»):

- Las cuatro esperas con su salida decidida: externas con cobro de diagnóstico (nueva) o anulación (existente); `Solicitado` con `sin_pieza_en_almacen`; SKU sin abandono, con aviso a Comercial si se retrasa.
- La caducidad con plazos 79/31/20/13 medidos (`medicion/p90-esperas-2026-10-21`), que sugiere o escala y nunca ejecuta.
- La regla del ejecutor (persona a cargo, o respaldo con motivo), impuesta en servidor y espejada en cliente.
- Interruptor `SALIDAS_ESPERAS` que nace cerrado, en `DEPLOY.md` §17 y `.env.example`, con guardián de ficheros (`D`).
- Corrección 37 para el maestro en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.

**Qué NO cubre (y no es contenido de la fila):** el nivel general «propietario del registro» (`R08.4.md:2037`, aplazado), la disponibilidad por usuario (llega con M6), el importe del cobro (F1C-02) y el botón de retroceso. **`cierra: si` queda sostenido.** Condiciones de persona que archivar no da por hechas: preguntas S-1/S-2/S-12 al panel, encender `SALIDAS_ESPERAS=true`, prueba en la app (RQ-PM-45 manual) y recalcular los plazos provisionales; constan en «Tareas de persona» de `tasks.md` con dueño y destino (regla del ciclo 1).

## 7. TDD estricto

- **Rojo visto por lote:** apply-progress lo registra en prosa por lote, no en la tabla «TDD Cycle Evidence» de la plantilla: I3a (15 rojas y 2 ficheros sin cargar), I3b (16 rojas de 25; 7 de 9), I4 (13 rojas de 28; 5 en los barridos), I5 (5 de 12 y dos ficheros sin cargar). Cada requisito con código nuevo tiene un rojo anotado con su causa.
- **Excepciones explicadas:** SE-2 pasó en verde desde el principio porque el área ya precedía; su discriminación la prueba la mutación SE-2, que reproduje (cae `S:238`). Las pruebas de caracterización (apagado, `Rev./Diagnostico`) nacieron en verde por diseño.
- **Aserciones:** revisé los seis ficheros de prueba nuevos (`S` 81 `expect`, `A` 50, `P` 31, `SH` 66, `V` 7, `D` 18). Sin tautologías ni `toBeDefined` sueltos. Los `toEqual([])` (`A:58-59`, `A:170`, `A:204`, `V:77`, `V:85`) tienen compañera no vacía en el mismo fichero. Los bucles recorren constantes no vacías (`ESTADOS_SIN_SALIDA`, `IDS_SALIDAS_NUEVAS`) o colecciones ya afirmadas no vacías antes (`A:72` sigue a `A:71`). Sin `vi.mock` de módulos propios; los espías son sólo sobre `logger`.
- **Capa:** unitarias puras en `shared`; integración HTTP/pg-mem en `server`; la interfaz no tiene pruebas por decisión de Gerencia. Cobertura: no disponible (sin herramienta configurada); informativo.

## 8. Coherencia con el diseño

| Decisión | ¿Seguida? | Nota |
|---|---|---|
| D1 sin desplazar líneas de ficheros muy citados | Sí | `transitions.ts:262` y `:330`, `ticketService.ts:128/131/134` editadas dentro de su línea; los auxiliares van al final (`:318`, `:329`, `:334`) |
| D2/D3 interruptor hermano (`salidasEsperas.ts:20-27`) y conjuntos disjuntos | Sí | Disjunción en `S:278` y `SH:71` |
| D4 alarma sobre `secuenciaDelReloj` y `alarmas_avisadas`, sin migración | Sí | `esperasVencidas.ts:54`; `marcarYAvisarAlarma` reutilizada; sin DDL |
| D5 guardas en servidor: 409 B, 403 B, 422 C en el agregado | Sí | `ticketService.ts:128`, `:131`, `:134`; SE-0..SE-5 las fijan |
| D7 plazos propios, no derivados del SLA | Sí | `plazosEsperas.ts` no importa `sla.ts` (`P:51`) |
| D10 comentario de `estados.ts` en sitio | Sí | Mismo número de líneas; ver S1 |
| D13 corrección del maestro | Sí | Entrada 37 al final del fichero de correcciones |

## 9. Hallazgos

**CRITICAL: ninguno.**

**WARNING**

- **W1 · Cuatro casillas de cierre sin marcar.** `I3a.c`, `I3b.c`, `I4.c` e `I5.c` de `tasks.md` siguen sin marcar, aunque los commits de cierre existen (`df53227f`, `3d33f071`, `59c8b76e`, `165d5c2d`) y los códigos de cada lote constan en apply-progress. Son tareas de cierre del orquestador; hay que marcarlas antes de `archive` o el estado no pasa a `ready`. No es regla del ciclo 1: es trabajo del repositorio, no de persona.
- **W2 · RQ-PM-45 «el cliente y el servidor coinciden» está probado por dos mitades, no por un cruce.** Ningún test de `apps/` importa `puedeEjecutarConSalidasEsperas`, así que no hay barrido que compare, para interruptor × ejecutor × transición, la regla pura con la respuesta del servidor. La regla pura se prueba en `SH:183-205` y el servidor en `S:116-235`; los barridos usan sólo a la persona a cargo. La garantía real es estructural (cliente y servidor llaman a la MISMA `ejecutorDeSalida`), pero el escenario pide una comparación. Riesgo bajo: el cliente sólo puede ocultar de más.
- **W3 · RQ-AV-27 «el primero se reintenta en la pasada siguiente» no es observable en las pruebas.** pg-mem no honra el `ROLLBACK` (declarado en apply-progress); `A:116` prueba que el fallo de uno no impide los demás, y el reintento descansa en que `marcarYAvisarAlarma` pone la marca dentro de la transacción (`alarmasSla.ts:44-52`, heredado de F1B-08). Límite del entorno de pruebas, no defecto del código.

**SUGGESTION**

- **S1 · Nota R-7 para el `archive-report`:** `estados.ts:131-140` sigue describiendo «la única salida» y «un alta en otro sistema» para las esperas, desfasado con c3 (D10 sólo corrigió `:154` y `:158`). Debe quedar escrito en el informe de archivo como pendiente del expediente.
- **S2 · Escenarios con dos mitades en capas distintas.** RQ-PM-42 «derivado nulo, inactivo o de otra área» y RQ-PM-44 «motivo de espacios» se prueban por HTTP en una variante y en la regla pura en las otras (`SH:140`, `SH:160`). Dos casos HTTP más darían el literal del escenario; no es necesario para el veredicto.
- **S3 · La tarea I6.1 habla de «mutaciones M1-M8».** El diseño y la propuesta no definen una M8 como mutación (la lista de la propuesta, `:172-175`, termina en el barrido de citas, regla de mutación 4, que el detector verifica en 0 y apply-progress I5.10 documenta). Aclarar la redacción al archivar.

## 10. Conclusión

PASS CON AVISOS. Sin CRITICAL, la tanda está lista para `sdd-archive` una vez marcadas las cuatro casillas de cierre (W1). Recordatorio para el archive: `reconciliacion/registro.test.ts:218-220` pasa de DIEZ a NUEVE «en curso» al archivar (tarea I7 anotada en apply-progress).
