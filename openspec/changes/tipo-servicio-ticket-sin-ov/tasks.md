# Tareas: guarda de remisión vigente en «Habilitar Servicio» y OVI de garantía (F1B-03, parte L)

Worktree `C:\dev\Desk_2_R1.023-worktrees\tipo-servicio-ticket-sin-ov`, partida `5f68822`. Preflight: auto · hybrid · ask-on-risk · 800 (válvula 720) · strict_tdd. Un intento de `gentle-ai sdd-attempt` por lote, en este worktree, uno a la vez; no se fusiona `main` con un intento abierto. Citas contra el árbol del 2026-10-03. Convención del diseño (§1): en ficheros citados, sólo **ediciones en la misma línea** o **añadidos al final**, también en los de prueba. Una edición en sitio cuenta 2 en el presupuesto.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | Lote 1 ≈ 389 (código 54 · pruebas por enumeración 225 · pruebas existentes 100 · `tasks.md` 10) · Lote 2 ≈ 201 · Lote 3 bloqueado, ≈ 310 a reestimar tras Q1 · Verify ≈ 360 (intento propio) |
| Riesgo sobre 800 | Bajo en los lotes 1 y 2 (márgenes 331 y 519 sobre la válvula de 720) |
| Estrategia de entrega | ask-on-risk; una rama, fusión a `main` al cerrar cada lote tras el `settle`; no hay PR |
| Medida | `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; binarios aparte |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

**Por qué `Decision needed before apply: Yes`.** No es riesgo de tamaño: el apply **NO se lanza**. El ciclo se detiene aquí por decisión registrada (`decision/cuarta-tanda-f1b03-parte-l`, consecuencia 4, `openspec/config.yaml:3727-3747`) para que se revise la planificación. Cadena (`chain_strategy`): no aplica, una rama. Estimaciones por encima de 400 en el lote 1 se dan por buenas porque no hay revisión por PR: el techo operativo es el del registro de intentos (800).

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| 1 | Guarda en servidor (RQ-TS-33, RQ-RE-20) | `npx vitest run packages/shared/src/remision.test.ts apps/desk/server/services/ticketService.test.ts apps/desk/server/db/remisionVigente.test.ts` | `POST /api/tickets/:id/transition` con `habilitar_servicio` contra pg-mem | `git revert` del lote 1; para retirar sólo la guarda, quitar su llamada de la línea 131 |
| 2 | Cliente (comodidad) y cierre | `npx vitest run apps/desk/src/lib/habilitarServicio.test.ts apps/desk/src/lib/botonRemision.test.ts` | `npm run build` y comprobación de persona en la app (`.tsx` fuera de la red, F0-00) | `git revert` del lote 2, **antes** que el 1 si ambos están publicados (botón desactivado sin imposición detrás) |
| 3 | OVI de garantía | — | — | **BLOQUEADO** |

## Lote 1 — guarda en servidor (RQ-TS-33, RQ-RE-20)

Si al cerrar la parte de pruebas existentes el lote midiera más de 720, se parte como dice el diseño §11: **1a** = 1.1-1.19 y 1.22-1.42 (con las 8 suites adaptadas, porque sin ellas la suite queda roja) y **1b** = 1.20-1.21 (enfrentamiento RQ-RE-20). El intento se cierra por sublote.

- [ ] 1.1 Abrir el intento 1 con `gentle-ai sdd-attempt` en este worktree. **Partida:** la carpeta del cambio (proposal, exploration, design, specs, tasks; ≈ 1.200 líneas) debe estar commiteada ANTES de abrirlo y ese commit es la partida; si se mantiene `5f68822`, su `wc -l` se resta y se anota (si no, el registro se la imputa al lote). Línea base: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores) y anotarla.
- [ ] 1.2 `apps/desk/server/reconciliacion/registro.test.ts`: con la carpeta del cambio presente (`tanda: F1B-03`, `cierra: no`) la prueba de `:220` («en curso» son exactamente SEIS) **se pone roja**, porque `apps/desk/server/reconciliacion/comprobaciones.ts:222` cuenta «en curso» toda cabecera con `tanda` del plan que no sea archivada con `cierra: si`. Confirmar el rojo con `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`; GREEN en sitio: `F1B-03` entre `F0-04` y `F1B-04` en `:220` y «SEIS»→«SIETE» en el título de `:218`, sin añadir líneas. Si no se pusiera roja, se anota y no se toca.
- [ ] 1.3 RED `packages/shared/src/remision.test.ts`, al final: tabla `tipo` × `estado` × anulada (entrada/otro, `ok`/`ok_con_avisos`/`pendiente`/`error`/desconocido, con/sin `anuladaAt`); lista vacía; los dos textos de `motivoSinRemisionVigente` (sin utilizable → texto 1; con entrada no anulada `pendiente` o `error` → texto 2; anulada o tipo distinto → texto 1; vigente → `null`); ninguno contiene «cliente», «equipo» ni «provisional». Import en sitio, en la línea de `import` existente de `./remision`. Cubre «El predicado discrimina sobre datos sucios» y «El motivo es accionable» (RQ-TS-33). Rojo: exports inexistentes.
- [ ] 1.4 GREEN `packages/shared/src/remision.ts`, **al final** (tras `faltaFotoPorNovedad`, `:110-112`; sin `import`): `RemisionParaVigencia`, `esRemisionEntradaVigente`, `motivoSinRemisionVigente` con los dos textos exactos de `design.md` §4. Sin tocar el índice del paquete (ya exporta el fichero).
- [ ] 1.5 Mutaciones de regla 2 sobre el predicado, una a una, revertidas y comprobadas con `git diff -- packages/shared/src/remision.ts` (vuelve al diff del GREEN): (m1) quitar `r.tipo === 'entrada' &&` → roja «tipo distinto»; (m2) quitar `!r.anuladaAt &&` → roja «anulada»; (m3) añadir `|| r.estado === 'pendiente'` → roja «pendiente»; (m4) quitar `|| r.estado === 'ok_con_avisos'` → roja «ok_con_avisos».
- [ ] 1.6 Ayudante nuevo `apps/desk/server/testing/remisionDePrueba.ts`: `remisionDePrueba(db, ticketId, over?)` y `conRemisionVigente(db, ticketId)`; por omisión `tipo 'entrada'`, `estado 'ok'`, sin anular (columnas de `packages/zoho-sync/src/db/schema.sql:271-287`). Sin prueba propia: lo ejercen las de 1.7-1.21; se declara.
- [ ] 1.7 RED `apps/desk/server/services/ticketService.test.ts`, al final (bloque RQ-TS-33): `422` sin remisión desde `OV asignada`, desde `Ticket creado` y desde `Remisión creada` con su única remisión anulada, con `error` en español, sin cambio de estado y sin fila en `ticket_transitions`; y `200` con `conRemisionVigente` en los tres, llegando a `Ingresado`. Escenarios «Sin remisión desde …» (3) y «Con remisión vigente pasa desde los tres orígenes».
- [ ] 1.8 RED mismo bloque, filas sucias con `remisionDePrueba(db, id, over)`: `pendiente`, `error`, anulada y `tipo` distinto → `422`; `ok_con_avisos`, histórica (`origen: 'historico'`, `ok`) y segunda `ok` tras una anulada → `200`. Cinco escenarios de RQ-TS-33 más «Una remisión de tipo distinto…».
- [ ] 1.9 RED mismo bloque: ticket de «Equipo nuevo» nacido en `Ticket creado` sin remisión → `422`; con ella → `200`. Escenarios «Equipo nuevo sin remisión queda bloqueado» y «… con remisión vigente pasa» (S-3, Q5).
- [ ] 1.10 RED mismo bloque: el `error` del rechazo es exactamente uno de los dos textos de `design.md` §4, en español, sin códigos internos; el segundo sólo con una entrada no anulada `pendiente` o `error`. Escenario «El motivo es accionable y en español».
- [ ] 1.11 RED mismo bloque, espía «sin consultas extra»: a partir del texto SQL `SELECT tipo, estado, anulada_at FROM remisiones` (el de la lectura nueva), `ingreso_a_servicio` (que sí lee remisiones por la otra consulta) y una transición de «Soporte remoto» no lo ejecutan. Molde del espía de F1B-15. Escenario «Sin consultas extra en otras transiciones».
- [ ] 1.12 RED→verde mismo bloque, hechos estructurales sobre el catálogo (nace verde; su rojo es el día que cambie el hecho): `EXCEPCIONES_POR_CARGO.transiciones` no contiene `habilitar_servicio` (`packages/shared/src/cargos.ts:32`) y la transición no declara campo de prioridad (`packages/shared/src/transitions.ts:189`; `packages/shared/src/prioridad.ts:82`); comentario que declara que verificación sólo la calcula `liberacion`. Escenario «Posiciones sin escenario posible». Se declara el mutante equivalente: mover la guarda delante de cargo, prioridad o verificación **dentro de la línea 131** no lo caza nada.
- [ ] 1.13 P1 · área (regla 1): ticket en `Ticket creado`, sin remisión, sin cliente ni equipo; usuario de Servicio Técnico sin Comercial → `403` de permiso. Nace verde; su rojo es 1.35.
- [ ] 1.14 P2 · alta validada: cliente provisional y equipo pendiente, sin remisión; Comercial; valores completos → `422` que contiene «provisional» y no «remisión de entrada». Nace verde; su rojo es 1.36.
- [ ] 1.15 P3 · obligatorios: sin remisión; Comercial; `values` vacío → `422` con `error` de remisión y `errors` ausente. RED real (hoy contesta con `errors`).
- [ ] 1.16 P4 · cuarentena: sin remisión; orden en cuarentena y serial presentes → `422` con `error`, sin `errors`. RED real. Se conserva porque el delta lo pide; **no añade discriminación** (mismo `throw` de la línea 134 que P3).
- [ ] 1.17 P5 · OV ya asociada: sin remisión; valores completos; la orden ya está en otro ticket → `422` de remisión, no `409`. RED real.
- [ ] 1.18 P6 · estado: ticket de servicio en `Ingresado`, sin remisión; Comercial → `409` «no aplica desde el estado». Nace verde; su rojo es 1.40.
- [ ] 1.19 P7 · flujo: ticket «Soporte remoto» en `Solicitud Soporte` (`packages/shared/src/flujos.ts:56-61`), sin remisión → `409` que nombra los dos flujos. Nace verde; su rojo es 1.41.
- [ ] 1.20 RED nuevo `apps/desk/server/db/remisionVigente.test.ts` (RQ-RE-20): sobre la misma tabla de filas (`pendiente`, `error`, `ok`, `ok_con_avisos`, anulada, histórica `ok`, vigente tras anulada) la guarda (`vigenciaDeRemisiones` + predicado) y el recuento de `sincronizarEstadoPorRemision` (efecto: `Ticket creado` pasa o no a `Remisión creada`; molde `apps/desk/server/db/estadoPorRemision.test.ts:56-62`) coinciden en todos los de entrada; y una fila `ok` no anulada de `tipo` distinto: la guarda no la cuenta, el recuento sí, y la prueba **nombra** `tipo` como única divergencia. Rojo: lectura inexistente.
- [ ] 1.21 Caracterización mismo fichero (nace verde): `remisionPendienteDe` sigue devolviendo la `pendiente` y la guarda sigue diciendo que no hay vigente; `listRemisionesByTicket` devuelve las no anuladas de cualquier estado, como antes. Rojo previo por mutación: añadir `AND estado <> 'error'` en `apps/desk/server/db/remisiones.ts:76-79`, comprobar rojo y revertir con `git diff`.
- [ ] 1.22 GREEN `apps/desk/server/db/remisiones.ts`: el tipo `RemisionParaVigencia` en sitio en la línea 3 y `vigenciaDeRemisiones(db, ticketId)` **al final** (tras la línea 230): `SELECT tipo, estado, anulada_at FROM remisiones WHERE ticket_id = $1`, sin ningún filtro.
- [ ] 1.23 GREEN `apps/desk/server/services/ticketService.ts`: import de `vigenciaDeRemisiones` en sitio en la línea 5, del predicado en la 6, llamada `await exigirRemisionVigente(db, t, id)` en la línea 131 **inmediatamente detrás** de `await exigirAltaValidada(db, t, current.row)` y antes del comentario de cierre; `exigirRemisionVigente` **al final** (tras la línea 264), sale sin consultar si `t.id !== 'habilitar_servicio'`; `422` con `{ error }`. Cuatro líneas en sitio, ninguna insertada antes del final.
- [ ] 1.24 Adaptar `apps/desk/server/services/ticketService.test.ts` (14 puntos): `conRemisionVigente(db, id)` en la MISMA línea que crea el ticket, líneas 104, 197, 208, 713, 723, 733, 915, 927, 1055, 1066, 1073, 1081, 1087 y 1231; import en sitio en una línea de `import` existente. Sin líneas nuevas.
- [ ] 1.25 Adaptar `apps/desk/server/transiciones.test.ts` (7 puntos): el ayudante `ticketEnFaseInicial` (línea 16, sirve a seis pruebas) y las líneas 304, 316, 371, 398, 412 y 437; import en sitio.
- [ ] 1.26 Adaptar `apps/desk/server/ordenVentaUnTicket.test.ts` (4 puntos): líneas 139, 278, 294 y 308; import en sitio.
- [ ] 1.27 Adaptar `apps/desk/server/permisos.test.ts` (2 puntos): los barridos de las líneas 54-55 y 100-101, con la remisión condicionada a `t.id === 'habilitar_servicio'`, en la misma línea. Comprobar que Servicio Técnico y Compras siguen recibiendo `403` antes de la guarda y que Comercial y administrador siguen dando `200`.
- [ ] 1.28 Adaptar `apps/desk/server/cargoPermiso.test.ts` (1 punto): línea 260, misma condición (Comercial).
- [ ] 1.29 Adaptar `apps/desk/server/transicionesEjecucion.test.ts` (1 punto): líneas 263-264, misma condición (los tres orígenes).
- [ ] 1.30 Adaptar `apps/desk/server/flujoEquipoNuevo.test.ts` (1 punto): línea 68 (P4 de F1B-15).
- [ ] 1.31 Adaptar `apps/desk/server/routes/ovAsociaciones.test.ts` (1 punto): línea 170 (`ovLiberada`). **Hipótesis (a) a comprobar:** la remisión `ok` no altera la puerta 3, porque `remisionPendienteDe` sólo mira `pendiente` (`apps/desk/server/db/remisiones.ts:69`); se comprueba corriendo la suite y se anota el resultado en `apply-progress.md`.
- [ ] 1.32 **Hipótesis (b) a comprobar** en `apps/desk/server/transiciones.test.ts:201-204`: la segunda transición lee la remisión para su fecha derivada, pero el aserto de `:204` es sobre avisos. Se comprueba quitando temporalmente la remisión de ese ticket (la prueba debe seguir verde, y se revierte con `git diff`) y se anota.
- [ ] 1.33 Endurecer, en sitio y sin añadir líneas, `apps/desk/server/transiciones.test.ts:233-234` (verde por la razón equivocada: sólo mira el código `422`, hoy por la persona derivada y con la guarda por la remisión): cada `expect` pasa a exigir además que el cuerpo contenga el error de la persona. Control: con el ayudante de la línea 16 quitado, deben ponerse rojas por la razón correcta; restaurarlo.
- [ ] 1.34 Endurecer, en sitio, `apps/desk/server/services/ticketService.test.ts:929-930` (primer aserto verde por la razón equivocada: `422` de cuarentena y `422` de remisión son indistinguibles por el código): el aserto de `:930` pasa a exigir también `JSON.stringify(r.body.errors)` con `EN_CUARENTENA`. Control: quitar la remisión de `:927` → rojo con el texto de remisión; restaurar.
- [ ] 1.35 Mutación P1: llamar a `exigirRemisionVigente` antes del `if` de la línea 129 → P1 (1.13) roja (`422` en vez de `403`); revertir y comprobar con `git diff`.
- [ ] 1.36 Mutación P2: intercambiar las dos llamadas de la línea 131 → P2 (1.14) roja; revertir.
- [ ] 1.37 Mutación P3: mover la llamada detrás de la línea 134 → P3 (1.15) roja; revertir.
- [ ] 1.38 Mutación P4: **la misma de 1.37**; anotar que P4 (1.16) también se pone roja y que no discrimina más (el `throw` de la 134 es único); revertir.
- [ ] 1.39 Mutación P5: mover la llamada detrás de la línea 152 → P5 (1.17) roja. Además, con la llamada entre la 134 y la 148, P3 roja y P5 verde: así P5 discrimina lo que P3 no; revertir.
- [ ] 1.40 Mutación P6: llamar a la guarda al final de la línea 125 (tras `exigirMismoFlujo`, antes del `if` de la 126) → P6 (1.18) roja (`422` en vez de `409`); revertir.
- [ ] 1.41 Mutación P7: llamar a la guarda en la línea 125 entre el `404` y `exigirMismoFlujo` → P7 (1.19) roja; con la llamada detrás de `exigirMismoFlujo`, P6 roja y P7 verde; revertir.
- [ ] 1.42 Mutación m5: quitar la salida temprana `if (t.id !== 'habilitar_servicio') return` de `exigirRemisionVigente` → roja la prueba del espía (1.11); revertir.
- [ ] 1.43 Cierre verde del lote: `npm test`, `npm run typecheck`, `npm run lint` (techo 165, 0 nuevos). Ninguna prueba existente se borra ni se debilita.
- [ ] 1.44 Medida del intento **antes del `settle`**: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear (`remisionDePrueba.ts`, `remisionVigente.test.ts`, `tasks.md` si no estaba commiteado); binarios aparte. Válvula 720, techo 800. Si pasa de 720, partir según el encabezado del lote y cerrar 1a. Registrar la cifra.
- [ ] 1.45 Commit del lote: `feat(tickets): guarda de remisión de entrada vigente en «Habilitar Servicio» (F1B-03, cierra: no)`; luego `settle` y fusión a `main` con el intento cerrado.

## Lote 2 — cliente y cierre

- [ ] 2.1 Abrir el intento 2 desde el commit del lote 1 (en el mismo worktree) y anotar línea base de `npm test`, `typecheck`, `lint` (165).
- [ ] 2.2 RED nuevo `apps/desk/src/lib/habilitarServicio.test.ts`: `motivoNoHabilitar(motivoAlta, remisiones)` — con `motivoAlta` y sin remisión devuelve el de alta primero (D7, orden de la línea 131); `remisiones` `null` o `undefined` → `null` (botón activo, decide el servidor); con una vigente → `null`; con una `pendiente` no anulada → texto 2. Escenarios «El cliente desactiva el botón…» y «Si la carga de remisiones falla, decide el servidor». Rojo: módulo inexistente.
- [ ] 2.3 RED mismo fichero, prueba estructural (escenario «El cliente no redefine "vigente"» de RQ-RE-20; añadida por esta planificación, el diseño no la nombra): lee `apps/desk/src/lib/habilitarServicio.ts` y `apps/desk/src/lib/botonRemision.ts` y exige que importen `esRemisionEntradaVigente` o `motivoSinRemisionVigente` y que no contengan `'ok_con_avisos'`. Rojo hoy: `botonRemision.ts:39` lo contiene.
- [ ] 2.4 GREEN nuevo `apps/desk/src/lib/habilitarServicio.ts`: `motivoNoHabilitar`, sin copia de la regla.
- [ ] 2.5 Mutación: invertir el orden de los motivos → roja 2.2 (orden); devolver el motivo de remisión con `remisiones` nulo → roja 2.2 (nulo). Revertir con `git diff`.
- [ ] 2.6 GREEN `apps/desk/src/lib/botonRemision.ts`: línea 39 en sitio, `vigentes.some(esRemisionEntradaVigente)`, sin cambio de comportamiento. Las siete pruebas de `apps/desk/src/lib/botonRemision.test.ts` siguen verdes **sin tocarlas** (`git diff` de ese fichero vacío). Mutación: sustituir el predicado por `() => true` → se pone roja alguna de las siete; si ninguna, se declara y se añade al final una prueba con `ok`/`pendiente`.
- [ ] 2.7 `apps/desk/src/components/TransitionPanel.tsx`, en sitio: línea 8 (import), 70 (`motivoNoHabilitar`, junto a `motivoAlta`), 130 (`disabled` y `title`) y 137 (el motivo visible). Sin rojo previo: `.tsx` fuera de la red de pruebas por decisión de Gerencia (F0-00); no se propone jsdom. `npm run typecheck` y `npm run build`.
- [ ] 2.8 Nuevo `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`, sólo lectura: tickets en `Ticket creado`, `OV asignada` y `Remisión creada` por estado, clasificación y `managed_by_app`, en «con remisión vigente (S-1)», «con remisión sin confirmar» y «sin ninguna». Se escribe; **ejecutarla es de persona** (sección de personas).
- [ ] 2.9 `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, **al final**: texto para los pasajes de `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`, `:1949`, `:3482` y el Anexo H (propuesta §0). El `.docx` no se toca. Lo de la OVI se redacta como pendiente de Q1.
- [ ] 2.10 **Casilla de la regla 13**, por escrito en `apply-progress.md`, decisión a decisión con la tabla de `design.md` §7 y la línea del servidor fijada contra el árbol de ese día (`exigirRemisionVigente`, llamada en `apps/desk/server/services/ticketService.ts:131`; `exigirAltaValidada`, `:258-264`; área y cargo `:129-131`). Dejar escrito que `botonRemision.ts:39` no tiene imposición (presentación, `apps/desk/server/routes/remision.ts:174-183`).
- [ ] 2.11 Barrido de citas (regla 4), sin excluir `openspec/changes/archive/`: `grep -rnoE "(ticketService|ticketService\.test|remisiones|remisiones\.test|remision|remision\.test|estadoPorRemision|botonRemision|TransitionPanel|transiciones\.test|permisos\.test|cargoPermiso\.test|transicionesEjecucion\.test|flujoEquipoNuevo\.test|ordenVentaUnTicket\.test|ovAsociaciones\.test)\.(ts|tsx):[0-9]+(-[0-9]+)?" --include=*.md --include=*.yaml --include=*.ts --include=*.tsx .` Se esperan cero desplazamientos; cada resultado se lee contra el fichero, principio y final del rango por separado. Atención: la línea 131 de `ticketService.ts` (frases «última guarda de B», «tras `exigirAltaValidada` van los obligatorios», el comentario de la línea 254), `TransitionPanel.tsx` 70, 130, 137, `botonRemision.ts:39` y los 31 puntos de prueba.
- [ ] 2.12 Pase de abreviadas (el detector no las bloquea): `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/transitions-st/spec.md`, `openspec/specs/tickets-core/spec.md`, `openspec/specs/remisiones/spec.md`, `openspec/specs/permissions/spec.md` y los comentarios de `ticketService.ts`. Informar de lo hallado.
- [ ] 2.13 Reparar lo que 2.11 y 2.12 den por roto, caso A (se apunta a hoy), B (se nombra la revisión) o C (se conserva y se añade qué lo cerró). Nunca renumerar a ciegas.
- [ ] 2.14 Detector: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [ ] 2.15 `npm run reconcile` (o el barrido de `registro.test.ts`): sigue «SIETE en curso», con F1B-03; sin defectos de registro.
- [ ] 2.16 Cierre verde: `npm test`, `npm run typecheck`, `npm run lint` (165), `npm run build`.
- [ ] 2.17 Medida del intento antes del `settle` (misma fórmula; el `.sql` y los documentos nuevos cuentan con `wc -l`), válvula 720, techo 800; registrar. Commit: `feat(tickets): botón «Habilitar Servicio» con el predicado de remisión vigente y cierre de la guarda (F1B-03, cierra: no)`; `settle` y fusión.

## Lote 3 — OVI de garantía — BLOQUEADO

Sin casillas ejecutables y fuera del recuento. Lo desbloquea la respuesta de Gerencia a Q1 y a las cinco preguntas de OVI de `design.md` §10, registrada en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`; entonces se **replanifica** este lote contra esa respuesta (los deltas de `permissions` y `tickets-core` son borrador condicionado a Q1 = A).

## Instrucciones para `verify` (SIN casilla; intento propio, ≈ 360 líneas)

- Re-ejecutar las mutaciones m1-m5 y P1-P7 contra el árbol de ese día y fijar las líneas de las funciones nuevas (`design.md` §7: «se fijan en `verify`»).
- Comprobar las dos pruebas endurecidas (1.33, 1.34) y las hipótesis (a) y (b) anotadas.
- Contrastar dato a dato los informes de los subagentes antes de cada `settle`; los 31 escenarios de la matriz, uno a uno.
- Verificar que Q4 y Q5 siguen siendo supuestos declarados y que ninguna copia de «vigente» queda en `apps/desk/src`.
- El `verify-report.md` es un sumando del presupuesto, no un extra.

## Instrucciones para `archive` (SIN casilla)

- **Medir antes de aplicar** la parte revisable (fusión de los deltas de `transitions-st` y `remisiones` en las specs vivas más `archive-report.md`) con `git diff --shortstat --no-renames`: ≤ 800; si pasa, se para y se consulta (regla del archivo). La mudanza de carpetas no pide techo.
- El commit de archivo contiene **sólo** este cambio (`git show --numstat`); no meter los ficheros sin trackear del repositorio.
- **No fusionar** los deltas `permissions` y `tickets-core` (borrador bloqueado por Q1): quedan fuera y la cabecera del `proposal.md` pasa a `capacidad: [transitions-st, remisiones]`; el `archive-report.md` dice que el lote 3 no se construyó.
- **`cierra: no`: F1B-03 NO sale de «en curso».** `apps/desk/server/reconciliacion/comprobaciones.ts:222` cuenta «en curso» toda cabecera con `tanda` del plan que no sea archivada **con** `cierra: si`; un `proposal.md` archivado con `cierra: no` sigue en esa lista. Por tanto `registro.test.ts:220` conserva `F1B-03` tras archivar (a diferencia de F1B-15, que cerraba) y el segundo cambio de F1B-03 (prefijos) llevará el mismo `tanda:`. No tocar esa línea al archivar; sí comprobar que la prueba sigue verde.
- Segundo barrido de citas tras la fusión (inserta líneas en dos specs vivas): `transitions-st/spec.md` y `remisiones/spec.md`, separando casos A, B y C.
- `archive-report.md`, en una línea: cubre la guarda de remisión vigente (parte L, lotes 1 y 2); deja fuera los prefijos (segundo cambio), la OVI de garantía y la calibración directa. Tipo de servicio y ticket sin OV: ya construidos por tandas anteriores.

## De personas — no son tareas de esta tanda; archivar no las da por hechas

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| **Q1** (qué es «crear la OVI» en Desk) y las preguntas adicionales de OVI (`design.md` §10: área del acto, aprobaciones, tickets que ya traen la OVI, sin cargos asignados, relación con tipo «Garantía») | Gerencia, con el Director Técnico | **Bloquea el lote 3** | `openspec/config.yaml` → `decisiones_de_gerencia_adenda` |
| **Q2** (calibración directa, supuesto: queda en F1C-08), **Q3** (conservar `Ticket creado`, S-4), **Q4** («vigente» exige confirmación, S-1), **Q5** (alcanza a equipo nuevo, S-3) | Gerencia | Supuestos aplicados; **confirmar antes de publicar** | `openspec/config.yaml` → `decisiones_de_gerencia`; panel |
| Ejecutar contra producción la consulta del 2026-09-25 y la de 2.8, y entregar las cifras | Gerencia | Condición de **publicación**, no de construcción ni de fusión | Panel, `docs/sdd/ENTRADA.md` y paquete de despliegue |
| Asignar `cargo_permiso` «Director Técnico» en producción | Gerencia o administrador | Condición de despliegue del lote 3 | `DEPLOY.md` y paquete de despliegue |
| Comprobación de Drive y n8n sobre los prefijos | Gerencia | Segundo cambio de F1B-03 | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177` |
| Verificación en la app tras desplegar: botón desactivado, los dos textos, con la remisión pendiente y con la confirmada | Persona de Comercial | Tras publicar el lote 2 | `archive-report.md` |

## Matriz de cobertura (31 escenarios firmes: 26 de RQ-TS-33 y 5 de RQ-RE-20)

| Requisito · escenario | Tarea | Prueba |
|---|---|---|
| RQ-TS-33 · sin remisión desde `OV asignada`, `Ticket creado`, `Remisión creada` | 1.7, 1.23 | bloque RQ-TS-33, `ticketService.test.ts` |
| RQ-TS-33 · con remisión pasa desde los tres orígenes | 1.7, 1.23 | ídem |
| RQ-TS-33 · `pendiente`, `error`, anulada no habilitan | 1.8, 1.5 (m2, m3) | ídem |
| RQ-TS-33 · segunda vigente tras anulada · `ok_con_avisos` · histórica `ok` | 1.8, 1.5 (m4) | ídem |
| RQ-TS-33 · tipo distinto de `entrada` | 1.8, 1.5 (m1) | ídem y `remision.test.ts` |
| RQ-TS-33 · equipo nuevo sin y con remisión | 1.9 | ídem |
| RQ-TS-33 · P1 a P7 | 1.13-1.19; mutaciones 1.35-1.41 | ídem |
| RQ-TS-33 · posiciones sin escenario posible | 1.12 | ídem |
| RQ-TS-33 · sin consultas extra en otras transiciones | 1.11, 1.42 (m5) | ídem |
| RQ-TS-33 · el predicado discrimina sobre datos sucios | 1.3, 1.5, 1.8 | `remision.test.ts`, `ticketService.test.ts` |
| RQ-TS-33 · motivo accionable y en español | 1.3, 1.10 | ídem |
| RQ-TS-33 · el cliente desactiva el botón | 2.2, 2.7 | `habilitarServicio.test.ts`; `.tsx`: persona |
| RQ-TS-33 · si la carga falla, decide el servidor | 2.2, 2.7 | `habilitarServicio.test.ts` |
| RQ-RE-20 · guarda y recuento coinciden en los de entrada | 1.20 | `remisionVigente.test.ts` |
| RQ-RE-20 · la divergencia por `tipo` está declarada | 1.20 | ídem |
| RQ-RE-20 · una `pendiente` sigue bloqueando la creación de otra | 1.21 | ídem |
| RQ-RE-20 · el listado del panel no cambia | 1.21 | ídem |
| RQ-RE-20 · el cliente no redefine «vigente» | 2.3, 2.6 | `habilitarServicio.test.ts`, `botonRemision.test.ts` |

**Recuento de tareas ejecutables.** Lote 1: **45** (1.1-1.45). Lote 2: **17** (2.1-2.17). Lote 3: **0** (bloqueado, fuera del recuento). Total: **62**. Verify y archive van sin casilla.
