# Informe de verificación — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\control-calidad-liberacion`, rama `control-calidad-liberacion`, base `e8eaea23`, HEAD `18375c99`.
Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Verificado el 2026-10-20 sin cambiar código; cada mutación se restauró y `git diff --exit-code` dio 0 tras ella.

## Veredicto: PASS con avisos — 0 CRITICAL · 1 WARNING · 4 SUGGESTION

Los cuatro códigos salen en 0; las mutaciones del encargo (y las de posición) ponen la suite en rojo, una a una; la tabla de la regla 13 coincide línea a línea con el código; la rama no toca nada vedado.

## 1. Códigos de salida (en serie, sobre HEAD, árbol limpio)

| Orden | Comando | Código | Detalle |
|---|---|---|---|
| 1 | `npm test` | **0** | 305 ficheros pasan (3 omitidos), 5.152 pruebas pasan (11 omitidas), 238 s. Sin el timeout de `onTaskUpdate` que apply-progress declaró en el lote 3 |
| 2 | `npm run typecheck` | **0** | — |
| 3 | `npm run lint` | **0** | 0 errores, **165** avisos (línea base intacta) |
| 4 | `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 7.516 comprobadas; línea base 0 informadas; **cabeceras R-1 inválidas 0**; 13 abreviadas rotas informativas, ninguna en ficheros de la rama (CLAUDE.md, ENTRADA.md, specs vivas y registros anteriores) |

## 2. Matriz requisito · escenario · prueba · resultado

Todas las pruebas citadas pasan (`npm test` en 0). `S` = `packages/shared/src/controlCalidad.test.ts`, `C` = `packages/shared/src/controlCalidadCatalogo.test.ts`, `H` = `apps/desk/server/controlCalidad.test.ts`.

### transitions-st

| Requisito · escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| RQ-TS-46 · tipos, áreas, recorridos y campos | `C:23`, `C:37`, `C:42` | OK |
| RQ-TS-46 · no es de cierre, columna, dos salidas | `C:49`, `C:61` | OK |
| RQ-TS-46 · los tres «Rechazo» no cambian (caracterización) | `C:65`, `C:71` | OK |
| RQ-TS-47 · apagado, `finalizacion_servicio` como hoy | `H:36` | OK |
| RQ-TS-47 · apagado, el envío da 409 | `H:43` | OK |
| RQ-TS-47 · encendido, el envío lleva a Control de calidad | `H:54` | OK |
| RQ-TS-47 · encendido, `finalizacion_servicio` da 409 | `H:61` | OK |
| RQ-TS-47 · apagar con tickets dentro no los vara | Indirecta: barridos `permisos.test.ts` y `transicionesEjecucion.test.ts` (harness apagado por defecto) y `S:200`; ver S-1 | OK (indirecta) |
| RQ-TS-48 · falta una casilla | `H:289` (una de las tres) y obligatorio de `transitionExec.ts:76-77`; ver S-2 | OK |
| RQ-TS-48 · sin patrón vigente no se exige gas | `H:281`, `S:131` | OK |
| RQ-TS-48 · con patrón vigente se exige | `H:274`, `S:137` | OK |
| RQ-TS-48 · el rechazo exige motivo y nada más | `H:262`, `S:163`, `S:169` | OK |
| RQ-TS-48 · los errores van juntos | `H:289`, `S:160` | OK |
| RQ-TS-49 · aprobado lleva a Por Facturar | `H:337` | OK |
| RQ-TS-49 · el rechazo sube la prioridad | `H:344`, `H:352`, `S:178` | OK |
| RQ-TS-49 · el firmante sin permiso de prioridad puede rechazar | `H:360` | OK |
| RQ-TS-49 · `Urgent` no se rebaja | `H:366`, `S:178` | OK |
| RQ-TS-50 · cifras 36 / 23 / 44; 50 filas; 17/16/13/4 | `cifrasAncladas.test.ts:58,64,70`, `tipoEvento.test.ts:43,49`, `invariantesGrafo.test.ts:50` | OK |
| RQ-TS-50 · alcanzabilidad e invariantes | `invariantesGrafo.test.ts:50-54,137,172`, `mapaBlueprint.test.ts` | OK |
| RQ-TS-51 · CC-1 (409 de estado gana al del interruptor) | `H:71` | OK |
| RQ-TS-51 · CC-2 (409 del interruptor gana al 403 de área) | `H:78` (control `H:85`) | OK |
| RQ-TS-51 · CC-3 (403 de área gana al de firmante) | `H:299` | OK |
| RQ-TS-51 · CC-4 (403 de firmante gana a todo 422) | `H:306` | OK |
| RQ-TS-51 · CC-5 (403 de firmante gana al 422 del motivo del admin) | cubierto por `H:306` y P-a; `H:314` prueba otro par (409 de estado); ver S-3 | OK (par vecino) |
| RQ-TS-51 · CC-6 (422 de contenido gana a la persona derivada) | `H:319` prueba otro par (409 del interruptor frente al 422); ver S-3 | OK (par vecino) |

### permissions

| Requisito · escenario | Prueba | Res. |
|---|---|---|
| RQ-PM-32 · sólo el literal `true` lo enciende | `packages/zoho-sync/src/config.test.ts:109` | OK |
| RQ-PM-32 · apagado, el flujo de hoy no cambia | `H:36`; barridos de `permisos.test.ts` y `transicionesEjecucion.test.ts` | OK |
| RQ-PM-32 · `DEPLOY.md` lo documenta | `apps/desk/server/deployControlCalidad.test.ts:17,23,28,35,39` | OK |
| RQ-PM-33 · firma el Coordinador que no intervino | `S:46`, `H:137` | OK |
| RQ-PM-33 · quien intervino no firma | `S:55`, `S:59`, `H:145`, `H:154` | OK |
| RQ-PM-33 · Decisional / Compras / Administrativo no son intervención | `S:63`, `H:161` | OK |
| RQ-PM-33 · con Coordinador, ni Especialista ni Director | `S:26`, `S:39`, `H:170` | OK |
| RQ-PM-33 · vacante: Director y Especialista, no un Técnico | `S:29`, `S:34`, `S:42`, `H:177`, `H:182` | OK |
| RQ-PM-33 · fila con id frente a fila sin id | `S:69`, `S:73` | OK |
| RQ-PM-33 · ticket de Zoho sin traza de Desk | Implícita: `S:46` y `H:137` no llevan traza; sin prueba con ese nombre (S-4) | OK (implícita) |
| RQ-PM-34 · con habilitado libre, el admin no firma | `S:86`, `H:189` | OK |
| RQ-PM-34 · sin habilitado libre, firma con motivo | `S:81`, `S:99`, `H:197`, `H:243` | OK |
| RQ-PM-34 · sin motivo, 422 | `S:151`, `H:233` | OK |
| RQ-PM-34 · el admin que intervino no firma | `S:91`, `H:202` | OK |
| RQ-PM-34 · rechazo de respaldo | vía de respaldo `H:197`, `H:202`; el motivo del admin no cuenta en el rechazo `S:163` | OK |
| RQ-PM-35 · fuera de Decisionales por cargo con la regla encendida | `decisionales.test.ts:151`, `C:76` | OK |
| RQ-PM-35 · el barrido da 16 | `decisionales.test.ts:32-39` | OK |
| RQ-PM-35 · el 403 es el de firmante | `H:217` | OK |
| RQ-PM-36 · un Técnico no firma; quien intervino recibe su causa | `H:182`, `H:145`, `S:107` | OK |
| RQ-PM-36 · admin con habilitado libre | `H:189` | OK |
| RQ-PM-36 · firmante válido pasa apagado y encendido | encendido `H:137`; apagado: barridos del harness (S-1) | OK |
| RQ-PM-37 · la ruta dice lo mismo que la guarda | `H:438` | OK |
| RQ-PM-37 · la función de visibilidad | `S:200`, `S:207` | OK |
| RQ-PM-37 · MANUAL, panel encendido y apagado | De persona; `.tsx` fuera de la red (F0-00). Queda en la lista de pruebas de la app | pendiente, no es hallazgo |

### derivacion-avisos y trazas

| Requisito · escenario | Prueba | Res. |
|---|---|---|
| RQ-AV-24 · sin habilitado libre avisa a los administradores | `H:391` | OK |
| RQ-AV-24 · no va al Director Técnico | `H:402` | OK |
| RQ-AV-24 · con un habilitado libre no se avisa | `H:409` | OK |
| RQ-AV-24 · vacante, Director libre evita el aviso; si intervino, se avisa | Sin prueba HTTP; regla pura `S:34`, `S:102` (S-4) | OK (pura) |
| RQ-AV-24 · sin administradores, el envío se escribe | `H:402` (el único admin es el actor: 200, 0 avisos) | OK |
| RQ-AV-24 · el actor no se avisa; un envío rechazado no avisa | actor `H:391`; sólo el envío avisa `H:416`; el rechazado sin prueba propia (S-4) | OK |
| RQ-AV-24 · un fallo al crear el aviso no deshace el envío | `H:425` | OK |
| RQ-TZ-22 · una transición guarda nombre e id | `packages/zoho-sync/src/db/repo.test.ts:172`, `H:93` | OK |
| RQ-TZ-22 · migración aditiva y sin relleno | `packages/zoho-sync/src/db/migrate.test.ts:374-383` | OK |
| RQ-TZ-22 · el barrido de escritores sigue verde | `apps/desk/server/escritoresTransiciones.test.ts:54` | OK |
| RQ-TZ-23 · aprobación del admin con motivo y checklist | `H:243`, `H:250` | OK |
| RQ-TZ-23 · el rechazo deja su motivo | `H:250` | OK |
| RQ-TZ-24 · cuenta sólo los rechazos | `S:188`, `H:378` | OK |
| RQ-TZ-24 · traza vacía o ids nulos | `S:192` | OK |

## 3. Mutaciones reproducidas, una a una

Arnés propio fuera del repositorio: reemplaza el texto, corre `vitest`, restaura el fichero y comprueba `git diff --exit-code` (0 en las 23). El `herramientas/mut.mjs` que cita `tasks.md` no existe en la rama.

| Mutación | Fichero:línea | Pruebas que caen | Rojo |
|---|---|---|---|
| M1 interruptor encendido por defecto (lectura invertida) | `packages/zoho-sync/src/config.ts:125` | `config.test.ts:109` | sí |
| M2 apagado aparece el estado (el envío pasa) | `packages/shared/src/controlCalidad.ts:104` | `S:200`, `S:207`, `H:43`, `H:78`, `H:319` | sí |
| M2b encendido, `finalizacion_servicio` sigue | `controlCalidad.ts:105` | `S:200`, `S:207`, `H:61` | sí |
| M3 firma el técnico asignado | `controlCalidad.ts:39` | `S:55`, `S:102`, `H:145`, `H:197`, `H:391`, `H:416` | sí |
| M4 firma el autor de una Operativa | `controlCalidad.ts:40` | `S:59`, `S:69`, `S:73`, `S:81`, `S:91`, `H:154`, `H:202` | sí |
| M5 Decisional o Compras / Logístico cuenta | `controlCalidad.ts:41` | `S:63`, `H:161`, `H:378` | sí |
| M6 firma el Especialista con Coordinador activo | `controlCalidad.ts:20` | `S:26`, `S:39`, `H:170` | sí |
| M7 firma un Técnico | `controlCalidad.ts:21` | `S:29`, `S:34`, `S:42`, `S:99`, `H:182` | sí |
| M8 el admin firma habiendo otro habilitado | `controlCalidad.ts:58` | `S:86`, `H:189` | sí |
| M9 el admin firma sin motivo | `controlCalidad.ts:83` | `S:151`, `S:160`, `H:233`, `H:289` | sí |
| M10a el aviso va al Director Técnico | `apps/desk/server/db/avisos.ts:137` | `H:391`, `H:402` | sí |
| M10b el aviso no sale | `apps/desk/server/services/controlCalidad.ts:50` | `H:391` | sí |
| M11a el rechazo no sube la prioridad | `controlCalidad.ts:94` | `S:178`, `H:344`, `H:352`, `H:360` | sí |
| M11b el retrabajo no se cuenta | `controlCalidad.ts:99` | `S:188`, `S:192`, `H:378` | sí |
| M11c el retrabajo no se registra (`performed_by_id` nulo) | `apps/desk/server/services/ticketService.ts:155` | `H:93`, `H:137` | sí |
| M12 aprobado no lleva a Por Facturar | `packages/shared/src/transitions.ts:262` | `C:23`, `transicionesEjecucion.test.ts` (2), `H:137`, `H:337`, `H:378` | sí |
| P-a 403 de firmante tras el 422 agregado | `ticketService.ts:131,134` | `H:306` (CC-4) | sí |
| P-b 409 del interruptor tras el 403 de área | `ticketService.ts:128,131` | `H:78` (CC-2) | sí |
| P-c 409 del interruptor antes del 409 de estado | `ticketService.ts:126,128` | `H:71` (CC-1) | sí |
| P-d 403 de firmante antes del 403 de área | `ticketService.ts:129,131` | `H:299` (CC-3) | sí |
| P-e `errCC` fuera del agregado, tras la persona derivada | `ticketService.ts:134,147` | sólo `H:289` (errores juntos); ver S-3 | sí |
| S-8 las salidas de QA dependen del interruptor | `controlCalidad.ts:106` | `S:200`, `permisos.test.ts` (4), `transicionesEjecucion.test.ts` (1) | sí |
| Checklist obligatorio pasa a opcional | `packages/shared/src/camposControlCalidad.ts:33` | `C:23`, `H:289` | sí |

Nota de método: el primer intento de M10a rompió la sintaxis y dio «no tests»; no cuenta como rojo. Se rehízo con una consulta válida.

## 4. Regla 13: la tabla de `apply-progress.md:281-300` contra el código

Las nueve decisiones del cliente se contrastaron con HEAD: **sin desvíos**.
- `ticketService.ts:128` llama a `exigirInterruptorControlCalidad` (`:285-288`, 409 con `motivoQuitadaPorInterruptor`); `:129-130` es el 403 de área; `:131` el 403 de firmante por `exigirFirmaControlCalidad` (`:295-297`); `:133` fija `prioCC` y borra `CLAVES_SOLO_TRAZA_CC`; `:134` es el 422 agregado con `errCC`.
- `TransitionPanel.tsx:55` pide el contexto (estado inicial apagado), `:57` añade `visibleConControlCalidad`, `:209` pinta el asterisco con `f.required`, `:32-36` es `yaLoTraeElTicket`.
- `routes/permisosControlCalidad.ts:16` responde `config.controlCalidadLiberacion === true`, la misma lectura que la guarda (`ticketService.ts:286`).
- `transitionExec.ts:76-77` exige el checkbox marcado; `invariantesGrafo.test.ts:137` fija «Fecha Finalización ST» como reentrante.
- Cada decisión del cliente tiene línea del servidor o declara que no decide. Los espejos legítimos (punto 3 de la regla 13) están probados: `H:71-85`, `H:299-314`, `H:337-372`.

## 5. Cabecera R-1 y `cierra: no`

`proposal.md:1-9`: `tanda: F1C-07`, `motivo: ""`, `capacidad: [transitions-st, permissions, derivacion-avisos, trazas]` (las cuatro existen; ninguna nueva), `maestro: ["M9.1","M1.7","M2.5"]`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`. Siete campos; el detector da 0 cabeceras inválidas. `cierra: no` lo sostiene `proposal.md` §4 (D11) y §5: foto del equipo embalado, firma con imagen (F1E-04), checklist alimentado por el diagnóstico e informe de salida (1E), firma «Revisó» (1E/F1E-04), calibración directa por QA y guarda de salida desde Por Entregar. Cada fila dice por qué no entra (entidad inexistente, con ruta:línea) y dónde caerá. La línea para el `archive-report` está en §5. `tasks.md`: 28 tareas marcadas, 0 pendientes; lo de personas va fuera del recuento (regla del ciclo 1).

## 6. Alcance de la rama (`git diff e8eaea23 HEAD --stat`)

59 ficheros, +2.558/-182. **No toca** `.env.example`, `docs/sdd/ENTRADA.md`, `_to_delete/` ni n8n. `openspec/config.yaml`: 12 líneas en un solo bloque (`:1361-1372`, todas dentro de `cifras_ancladas`: pasos del mapa 44, transiciones 36, estados 23). Los tres ficheros de `docs/artefactos/` son el mapa regenerado que exige `mapaBlueprint.test.ts`. Árbol limpio al empezar y al acabar las pruebas (solo se añade este informe).

## 7. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · `.env.example` sin la línea de `CONTROL_CALIDAD_LIBERACION`.** La regla de secretos de `CLAUDE.md` pide el interruptor en `.env.example` y en `DEPLOY.md`; solo está en `DEPLOY.md` (§16, con su prueba `deployControlCalidad.test.ts:35`). Es decisión declarada del pliego (`.env.example` no se toca; `tasks.md`, «Fuera del recuento»), con dueño (Supervisión) y arrastra también la línea de `DECISIONALES_POR_CARGO`. No bloquea el archive; debe constar como pendiente en el `archive-report`.

### SUGGESTION
- **S-1 · Firma con el interruptor apagado sin caso propio en `controlCalidad.test.ts`.** Todos los `firmar(...)` usan la app encendida (`H:128`). «Apagar con tickets dentro no los vara» y «firmante válido pasa apagado» se cubren por los barridos con el harness apagado por defecto (la mutación S-8 cae en cinco pruebas de `permisos.test.ts` y `transicionesEjecucion.test.ts`), no por un caso con nombre. Un caso de dos líneas con la app apagada lo fijaría.
- **S-2 · «Falta una casilla» se prueba con una sola casilla** (`H:289`, «Funcionamiento verificado»); las otras dos dependen del mecanismo general de `transitionExec.ts:76-77`. La mutación del obligatorio del checklist sí cae, así que la guarda existe.
- **S-3 · CC-5 y CC-6 del spec no tienen prueba de su par exacto.** `H:314` y `H:319` prueban pares vecinos con otros nombres; el orden «403 de firmante gana al 422 del motivo del admin» lo fija en la práctica `H:306`. Mover `errCC` tras la persona derivada (`ticketService.ts:147`, P-e) solo lo detecta `H:289` por romper el agregado, no por la posición: ninguna prueba activa a la vez un `errCC` y una persona derivada inválida. Conviene una prueba de posición la próxima vez que se toque ese bloque (regla de mutación 1).
- **S-4 · Escenarios sin prueba con su nombre:** «ticket de Zoho sin traza de Desk» (RQ-PM-33), «vacante, el Director libre evita el aviso; si intervino, se avisa» (RQ-AV-24, solo en la regla pura) y «un envío rechazado no avisa». Riesgo bajo: lo cubren la regla pura y el orden estructural del aviso tras `applyTransition`.
- Nota TDD (declarada, no hallazgo): el ROJO de `DEPLOY.md` §16 no se vio antes de escribir el texto; se obtuvo después por la regla de mutación 2 (ensuciar el fichero vigilado).
- Cosmético: los criterios de éxito de `proposal.md` §15 siguen sin marcar; no cuentan para `tasks.md`.

## 8. Cumplimiento de strict TDD

`apply-progress.md` registra el ROJO visto (con causa) y el VERDE por tarea en los lotes 1a a 3, con sus mutaciones; aquí se reprodujeron 23. Única excepción documentada: 3.2 (ver arriba). Los `.tsx` sin prueba (`TransitionPanel.tsx`, `client.ts`) no son hallazgo: los cubre `npm run typecheck` por decisión de Gerencia (F0-00).

## 9. Siguiente paso

`sdd-archive`. Condiciones: medir antes de aplicar la parte con carga de revisión (fusión del delta en las cuatro specs vivas más el `archive-report.md`); abrir el intento con techo `2 × carpeta + 800` (regla del archivo); registrar W-1 y la lista de supuestos S-1..S-18 como pendientes de Supervisión y de Gerencia; el commit de archivo debe contener solo este cambio (`git show --numstat`).
