```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:4aaab858537661a9762d7415cc0c48abfa26e3c11b52186066b1c0b9d1a74e67
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 50/50
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:f60c7aad24fbb90cc4d69f123d166e4d9fe70cb1e197211d13144d7ff07729af
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:0684d7205496de2a374f30c9a4fe00caad3af7d3a36e1010f395bafc17b2ae3f
```

# Informe de verificación — `calibracion-directa` (F1C-08, `cierra: si`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\calibracion-directa`, base `96e35cf9`, HEAD `47368e68` (árbol `24bcbe2e`). Modo: Strict TDD, artefactos hybrid.
Verificado el 2026-10-20 sin cambiar código: cada mutación se restauró (`restaurado=true`) y `git status --short` quedó vacío antes de escribir este informe.

## Veredicto: PASS con avisos — 0 CRITICAL · 3 WARNING · 4 SUGGESTION

Los códigos completos salen en 0; las 18 mutaciones reproducidas (todas las obligatorias del encargo más las de la tasks) ponen la suite en rojo, una a una; la tabla de la regla 13 coincide línea a línea con el árbol; ninguna inserción desplaza un fichero muy citado; las cifras coinciden con los vigilantes. Los avisos son escenarios con cobertura sólo indirecta o parcial, no defectos de código.

## 1. Códigos de salida (los corrió el orquestador sobre `47368e68`; se dan por evidencia)

| Comando | Código | Detalle |
|---|---|---|
| `npm run typecheck` | **0** | — |
| `npm run lint` | **0** | 0 errores, 165 avisos (la cifra de partida) |
| detector de citas | **0** | 13 abreviadas informativas, las mismas de `main` |
| `npm test` | **0** | 307 ficheros pasan (3 saltados), 5.207 pruebas pasan (11 saltadas) |
| `npm run build` | **0** | `index-C4Y09m4Y.js`, 424.619 bytes |

Re-ejecución propia, sólo de los ficheros afectados, en primer plano: `packages/shared` (10 ficheros: `calibracionDirecta`, `invariantesGrafo`, `reentrancia`, `cifrasAncladas`, `estados`, `tipoEvento`, `transitions`, `mapaBlueprint`, `decisionales`, `bodegaje`) **213/213**; servidor (`calibracionDirecta`, `permisos`, `deployControlCalidad`, `transicionesEjecucion`) **81/81**.

## 2. Completitud de tareas

`tasks.md`: 4 casillas abiertas, **1a.8, 1b.5, 2.8 y 3.6**, todas «Códigos EN SERIE», que ejecuta el orquestador (encargo: ya corridos). No son trabajo de código: ver S-1. Las demás (1a.1-1a.7, 1b.1-1b.4, 2.1-2.7, 3.1-3.5) están marcadas y coinciden con el árbol. «Fuera del recuento» (cuatro tareas de personas) está declarado aparte con dueño y destino (regla del ciclo 1).

## 3. Strict TDD: constancia del rojo antes del verde en `apply-progress.md`

| Lote | Rojo registrado | Resultado |
|---|---|---|
| 1a.2 | `Failed to load url ./calibracionDirecta` (0 pruebas, módulo inexistente) | OK |
| 1a.3 | reentrancia medida por ejecución en una prueba desechable ANTES de escribir cifras; 8 de 18 caen | OK |
| 1a.4 | 21 pruebas rojas en 9 ficheros (`36 → 38`, `44 → 46`, `50 → 52`, `31 → 33`, `11 → 10`) | OK |
| 1a.5 | rojos NO listados que aparecieron al mover el catálogo (`transitions.test`, `cargos.test`, `prioridad.test`, `transitionsSoporteRemoto.test`, `comentariosVigilados`), vistos tras el verde del catálogo, declarado | Aviso de método, honesto |
| 1b.1 | 5 de 35 caen: `entradasAPorFacturarSinControlCalidad` no es una función | OK |
| 2.2/2.3 | 10 de 26 caen (`200 → 409`, `200 → 422`, `403 → 409`) | OK |
| 2.2/2.3 | CD-1, CD-2, CD-5, CD-6 NO tuvieron rojo previo: el interruptor ya existía por la cláusula del lote 1a. Declarado y suplido por mutación (P1/M2) | OK, ver §4 |
| 3.1 | N/A por decisión de Gerencia (`.tsx` fuera de la red, F0-00); lo cubre `typecheck` | OK |
| 3.2 | rojo de `DEPLOY.md` §16 visto antes del texto (1 de 6) y regla de mutación 2 sobre el fichero vigilado (`apply-progress.md:202`) | OK |

## 4. Mutaciones reproducidas (`herramientas/mut.mjs`; restauración comprobada en cada una)

`T` = `apps/desk/server/calibracionDirecta.test.ts`, `S` = `packages/shared/src/calibracionDirecta.test.ts`, `G` = `packages/shared/src/invariantesGrafo.test.ts`, `R` = `packages/shared/src/reentrancia.test.ts`, `P` = `apps/desk/server/permisos.test.ts`.

| Id | Mutación | Cae | Resultado |
|---|---|---|---|
| a | servidor pasa `tieneOrdenVenta: true` (`ticketService.ts:309`) | `T`: «sin OV por ninguna vía… (M1)», «asociación LIBERADA no cuenta», CD-3 (3) | CAE |
| b | sin la cláusula de `controlCalidad.ts:105` (`if (false)`) | 6: «apagado, el atajo da 409», «apagado, el escape da 409», CD-2, CD-6, la pura «apagado, las dos dan motivo», la propiedad «apagado: finalizacion_servicio sí cuenta» | CAE |
| c1 | atajo con destino `Por Facturar` (`transitions.ts:262`) | 5: catálogo (RQ-TS-52), «encendido, el atajo deja… En Proceso», «apagar con un ticket ya en el atajo», «OV por cualquiera de las vías», recorrido HTTP a `Por Facturar` | CAE |
| c2 | el interruptor deja de quitar `finalizacion_servicio` | 4: «lo que ya hacía el interruptor no cambia», propiedad «encendido: exactamente los tres rechazos», «sin falla_calibracion… son dos», recorrido HTTP | CAE |
| d1 | sin `falla_calibracion` en el catálogo | 20 (catálogo, derivación, `CLAVE_DESCRIPCION_FALLA`, «el grafo ofrece el escape y su destino cotiza», invariantes 2 y 6, …) | CAE |
| d2 | escape → `Por Facturar` | 8: catálogo, «el grafo ofrece el escape…», invariante 6, propiedad (dos), «con descripción: queda en Rev./Diagnostico» | CAE |
| d3 | escape → `Finalizado` | 8: las mismas de d2 | CAE |
| e1 | servidor: tipo fijo `Calibración` en la llamada (`ticketService.ts:309`) | 3: «otro tipo no pasa (M5)», «otro tipo: el escape da 409», CD-4 | CAE |
| e2 | regla pura: atajo sin chequeo de tipo | 5: cuatro de la regla pura y «otro tipo no pasa» HTTP | CAE |
| e3 | regla pura: escape sin chequeo de tipo | 4: «tres textos distintos», «escape: sólo Calibración», «otro tipo: el escape», CD-4 | CAE |
| P1 | guarda nueva ANTES del interruptor | CD-2 (1; la única que lo ve, como declara apply-progress) | CAE |
| P2 | guarda nueva tras el `403` de área | CD-3 (1) | CAE |
| P3 | guarda nueva tras el `422` agregado | CD-3 y CD-4 (2) | CAE |
| M7a | `errFalla` fuera del `if` del `422` | 3: «ausente, vacía o en blanco», «el 422 es UNO», control 422 | CAE |
| M7b | `errFalla` fuera de `errors` | 2: las dos primeras | CAE |
| M7d | `erroresDescripcionFalla` nunca da error | 4: la pura, «ausente, vacía…», «el 422 es UNO», control 422 | CAE |
| M8 | sin el `delete plan.customFields[CLAVE_DESCRIPCION_FALLA]` (`ticketService.ts:133`) | «con descripción: … la descripción va a la traza y NO al ticket (S-15)» (1) | CAE |
| PM-41 | `calibracion_directa` pasa a `Administrativo` | 4: tres de `tipoEvento.test.ts` y el catálogo de `calibracionDirecta.test.ts` | CAE (protege la premisa de S-9) |

Ninguna mutación sobrevivió. Cuando una lista de caídas pasa de seis, el script sólo imprime las seis primeras; el recuento es el de «Tests N failed».
Observación coherente con `apply-progress.md:182`: el atajo a `Por Facturar` desde `Ingresado` (c1) NO lo ve la propiedad del grafo, porque `Ingresado` no se alcanza desde `En Proceso`; lo ven el catálogo y el recorrido HTTP. Las mutaciones M3 (descripción en `custom_fields`) y M2 de `DEPLOY.md` no se repitieron: constan en `apply-progress.md:173,202`, y `deployControlCalidad.test.ts` pasa 6/6.

## 5. Matriz requisito, escenario y prueba

### transitions-st (8 requisitos, 34 escenarios, todos COMPLIANT)

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-TS-52 · tipos/áreas/recorridos/campos; fechas de ingreso; `ingreso_a_servicio` igual; heredan derivación | `S:33`, `S:41`, `S:46`, `S:50` | OK |
| RQ-TS-53 · apagado, atajo 409 / escape 409 / ruta de hoy igual | `T:41`, `T:51`, `T:60` | OK |
| RQ-TS-53 · encendido, atajo a `En Proceso` con traza; apagar con un ticket ya en el atajo | `T:67`, `T:77` | OK |
| RQ-TS-54 · sin OV; otro tipo; OV por las tres vías; no lee el contenido de la OV | `T:91`/`S:82`, `T:119`/`S:85`, `T:100`/`T:112`, `T:131` | OK |
| RQ-TS-55 · con falla describe y sale; 422 ausente/blanco; escape sin atajo; destino cotiza; grafo | `T:139`, `T:152`/`S:122`, `T:174`, `T:189`, `S:64` | OK |
| RQ-TS-55 · el 422 va junto a los demás de contenido (ajustado) | `T:167` | OK, ver W-3 |
| RQ-TS-56 · atajo, QA y `Por Facturar`; `finalizacion_servicio` 409 | `T:204` | OK |
| RQ-TS-56 · entradas sin QA = tres rechazos (encendido y apagado medido); ensuciar el catálogo | `G:380-400`, `G:393` y casos M3 | OK, ver W-3 |
| RQ-TS-57 · cifra de reentrantes (12; 10/2); campos entran por el escape | `G:137`, `R:77`, `R:226-240` | OK |
| RQ-TS-58 · 38/23/46, 52 filas 19/16/13/4, 10 con una salida, 5/33, Decisionales 16, alcanzabilidad | `cifrasAncladas.test.ts`, `tipoEvento.test.ts`, `mapaBlueprint.test.ts`, `estados.test.ts`, `decisionales.test.ts`, `G` | OK |
| RQ-TS-59 · CD-1 a CD-6 | `T:223`, `T:230`, `T:237`, `T:244`, `T:251`, `T:257` | OK |

### permissions (4 requisitos, 16 escenarios: 10 COMPLIANT, 5 PARTIAL, 1 MANUAL; 0 FAILING)

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-PM-38 · tipo ajeno 409; sin OV 409; escape otro tipo 409; mensajes distintos; 409 antes que 403 | `T:119`, `T:91`/`S:82`, `T:181`, `S:92`, `T:237` | OK |
| RQ-PM-39 · la función de visibilidad | `S:111` | OK |
| RQ-PM-39 · cliente y servidor coinciden en cada combinación | `S:111` y `T:91-131`, sin tabla común | PARTIAL, ver W-2 |
| RQ-PM-39 · panel con el interruptor (MANUAL) | de persona (Supervisión); archivar NO lo da por hecho | Fuera del recuento |
| RQ-PM-40 · matriz 114 (69/45); ST pasa y los demás 403; compuesta 114 (70/44) y 1.026; no Decisionales | `P:77`, `P:43`/`P:89`, `P:349`/`P:356`/`P:446`, `decisionales.test.ts`/`tipoEvento.test.ts` | OK |
| RQ-PM-41 · autor del atajo no firma; autor del escape no firma; otro habilitado firma; admin autor no firma | sin prueba propia | PARTIAL x4, ver W-1 |

Cumplimiento: 44/50 escenarios con prueba directa que pasa; los 5 PARTIAL (W-1, W-2) se cuentan como cubiertos con aviso por cobertura indirecta, y el MANUAL queda fuera del recuento por la regla del ciclo 1 (dueño Supervisión). El sobre declara por eso 12/12 y 50/50; la diferencia está en los avisos, no en ningún fallo.

## 6. Tabla de la regla 13 (`apply-progress.md:210-220`) contrastada con el árbol de HEAD

Las 9 filas son ciertas. `ticketService.ts:128` llama a `exigirInterruptorControlCalidad` (definida `:285`) y a `exigirCalibracionDirecta` (`:305-311`); `:129-130` es el `403` de área, `:131` el cargo, `:132` `valoresConFechasDerivadas` (por etiqueta, `fechasDerivadas.ts:17-18`), `:133` el `delete` de la descripción, `:134` el `422` agregado con `errFalla`. `transitionExec.ts:77` es `if (f.required && faltaObligatorio)`. `TransitionPanel.tsx:57` encadena los filtros y `:209` es `f.required`. `permisosControlCalidad.ts:16` responde `config.controlCalidadLiberacion === true`, igual que la guarda. El cliente lee UNA vía de la OV y el servidor TRES (`ticketService.ts:307-308`): oculta de más, nunca de menos. Ver W-2.

## 7. Regla de mutación 4

`git diff --numstat 96e35cf9 HEAD`: `transitions.ts` 1/1, `estados.ts` 1/1, `ticketCreate.ts` 1/1, `sla.ts` 1/1, `TransitionPanel.tsx` 2/2; `ticketService.ts` 20/6 y `controlCalidad.ts` 21/2 con hunks `+298,14` y `+115,19` (al final) y el resto de una línea (`:5-6`, `:128`, `:133-134`, `:238`; `:7`, `:105`); `index.ts` +1 al final; `DEPLOY.md` +9 desde la 802. Ningún fichero muy citado se desplaza. Diez citas de fuera del archivo leídas y ciertas: `DEPLOY.md:760`, `cargoPermiso.test.ts:17-18`, `facturar.test.ts:13`, `valoresTransicion.ts:13`, `config.yaml:4350`, `permissions/spec.md:90`, `transitions-equipo-nuevo/spec.md:239` y `:430`, `transitions-st/spec.md:513`. Las cuatro cifras de comentario reparadas (`bodegaje.test.ts:105`, `bodegaje.ts:12`, `transicionesEjecucion.test.ts:283`, `config.yaml:110`) dicen 12 / 38.

## 8. Cabecera R-1 y `cierra: si`

`proposal.md:1-9`: siete campos (`tanda: F1C-08`, `motivo` vacío válido, `capacidad`, `maestro`, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`). La fila `Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:106` es «Rutas abreviadas». `decision/p15-p59-rutas` (`config.yaml:2023-2039`): equipo sin novedad NO se rehabilita; calibración directa sí con tres condiciones, las tres implementadas y probadas (S-2, S-5 y S-14 como supuestos reversibles). La fila queda entera: `cierra: si` es coherente. El `archive-report.md` debe decir en una línea que equipo sin novedad queda fuera por decisión.

## 9. Cifras

38/23/46 (`cifrasAncladas.test.ts`, `config.yaml:110`, bloque `cifras_ancladas` con igual número de líneas); 52 filas, 19/16/13/4 (`tipoEvento.test.ts`); derivación 5/33; 10 estados con una salida (`estados.test.ts`); 12 reentrantes, 10 obligatorios y 2 opcionales (`G:137`); matriz 114 (69/45), compuesta 114 (70/44), cargo por área por transición 1.026 (`P:77`, `:349`, `:356`, `:446`). Verdes en la corrida propia.

## 10. Coherencia con el diseño

D2, D3 (`ticketService.ts:308`), D4, D5, D6, D7, D8 y D10 se cumplen. Desviaciones declaradas y aceptables: «un único 422 con dos errores» no es realizable (`transitions-st/spec.md:108-111` ya ajustada); apagado excluye `rechazo_revision` (`transitions-st/spec.md:140`).

## 11. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · RQ-PM-41 sin prueba propia (4 escenarios).** Ningún test hace que el autor de una fila `calibracion_directa` o `falla_calibracion` intente firmar (`T:204-219` firma con un Coordinador que no intervino). Protegido por derivación: `intervino` (`controlCalidad.ts:38-43`) lee `tipoEventoDeTransicion` y `tipoEvento.test.ts` fija las dos como Operativas; la mutación PM-41 lo prueba. Falta la composición. Remedio: cuatro casos HTTP sobre el molde de `controlCalidad.test.ts:197-207`, o declarar la cobertura indirecta en el archive-report.
- **W-2 · RQ-PM-39 «cliente y servidor coinciden en cada combinación» no es cierto con la letra.** El cliente decide la OV con la clave `Orden de Venta` de `delTicket` (una vía, `TransitionPanel.tsx:57`) y el servidor lee tres (`ticketService.ts:307-308`): un ticket con la OV sólo en `salesorder_id` o en una asociación vigente se oculta en el panel y el servidor lo aceptaría. Declarado como S-12 (`apply-progress.md:214`), pero la delta sigue prometiendo lo contrario (`permissions/spec.md:50`). No rompe la regla 13 (oculta de más). Ajustar el texto de la delta antes del archive, o hacer que el cliente lea las tres vías.
- **W-3 · Dos escenarios ajustados en el apply son más débiles que la spec original.** RQ-TS-55 «el 422 va junto a los demás» ya no prueba convivencia con otro error (`T:167`); RQ-TS-56 apagado fija tres ids medidas (`G:380-400`). Medidos, documentados, con la delta ajustada, y M7a/M7b/M7d los hacen caer.

### SUGGESTION
- **S-1 · Marcar 1a.8, 1b.5, 2.8 y 3.6** en `tasks.md` tras este verify (los códigos ya los corrió el orquestador).
- **S-2 · Cliente sin prueba por decisión (F0-00).** `TransitionPanel.tsx:57` y las claves `Tipo de Servicio` y `Orden de Venta` de `delTicket` sólo las cubre `typecheck`; coinciden con las de `TicketProperties.tsx:158,164` (hipótesis de lectura). Las cubre la prueba manual de Supervisión.
- **S-3 · CD-1, CD-2, CD-5 y CD-6 no tuvieron rojo previo** (el interruptor ya existía). Suplido por P1/M2; que el archive-report lo conserve.
- **S-4 · Citas rotas antes de la rama** (`openspec/specs/transitions-st/spec.md:44`; las «otras 32» de `transitions.ts:262`, `apply-progress.md:243`): no son de F1C-08; llevarlas a la bandeja.

## 12. Siguiente paso

`sdd-archive`, sin CRITICAL. Antes: decidir W-2 y registrar W-1 en el archive-report. Condiciones: intento con techo `2 x carpeta + 800`, medir antes de aplicar la parte con carga de revisión (fusión de las dos deltas más el `archive-report.md`), fusión por script y commit con sólo el cambio archivado. Pendientes de personas, fuera del recuento: S-1 a S-16 de Gerencia, encendido de `CONTROL_CALIDAD_LIBERACION`, línea en `.env.example` (Supervisión), pegar la corrección 36 en el maestro, prueba manual del panel.

## Adenda del orquestador — remediación del intento 6b (2026-10-20)

El informe de arriba es la foto de `ac1abd65` y no se reescribe. La remediación, sobre esa cabeza, cierra W-1 y W-2 y aplica S-1:

- **W-1 cerrado.** Cuatro casos HTTP de RQ-PM-41 al final de `apps/desk/server/calibracionDirecta.test.ts` (autor del atajo no
  aprueba, autor del escape no rechaza, otro habilitado aprueba, administrador autor no firma). Rojo por mutación: con
  `calibracion_directa` como `Administrativo` en `packages/shared/src/transitions.ts:262` caen tres; con `falla_calibracion`, una.
  El orquestador reprodujo la primera: 3 de 31 en rojo, restaurada.
- **W-2 cerrado.** El escenario de RQ-PM-39 dice ahora lo que es cierto (S-12: el cliente oculta de más, nunca de menos), y una
  prueba de tabla de 32 filas (interruptor × tipo × cuatro vías de OV × las dos transiciones) lo fija, con un oráculo independiente
  de la regla pura. El orquestador reprodujo «el servidor deja de leer la asociación»: 2 de 31 en rojo, restaurada.
- **S-1 aplicada:** casillas 1a.8, 1b.5, 2.8 y 3.6 marcadas en `tasks.md` con su commit.
- **Recuento tras la remediación:** 49 de 50 escenarios con prueba directa que pasa; el restante es el MANUAL de persona, fuera del
  recuento (regla del ciclo 1). W-3 sigue como aviso: los dos escenarios están medidos y sus mutaciones caen.
- **Códigos en serie sobre el árbol remediado:** typecheck 0, lint 0 (165 avisos), detector 0 (13 abreviadas informativas), `npm test`
  0 (307 ficheros pasan y 3 se saltan; 5.212 pruebas pasan y 11 se saltan).
