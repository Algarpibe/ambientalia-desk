# Tareas — Reasignar la persona a cargo sin cambiar de estado, con motivo, traza y aviso (F1B-05)

Propuesta: `openspec/changes/reasignacion-con-motivo/proposal.md` (con su «Adenda tras el diseño»). Diseño canónico:
`openspec/changes/reasignacion-con-motivo/design.md` (§3 firmas, §5 guardas, §6 sincronizador, §7 pruebas y mutaciones, §8 lotes, §9 citas).
Requisitos: RQ-TC-50, RQ-TC-51, RQ-TC-52, RQ-PM-27, RQ-TZ-20 y RQ-AV-20 (más RQ-PM-11, RQ-TZ-06 y RQ-TZ-17 modificados) de los deltas de `specs/`.

**Reglas de todos los lotes.** Cada lote es un intento del registro en el worktree `C:\dev\Desk_2_R1.023-worktrees\reasignacion-con-motivo`, techo 800, válvula 720.
Strict TDD: cada pieza va como pareja «prueba en rojo» → «implementación en verde», en ese orden, y el rojo se **ve** antes de escribir el verde.
Los textos de error se comparan contra `MENSAJES_REASIGNACION`, no contra literales. `apps/desk/server/services/ticketService.ts` y `packages/zoho-sync/src/db/repo.ts` no se tocan.
`docs/sdd/ENTRADA.md` no se toca. Ninguna casilla edita una línea de un fichero muy citado sin que el diseño §9 la haya previsto (en sitio, sin insertar líneas).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1.277 brutas (361 + 277 + 339 + 300), ×1,8 = 2.299 repartidas en cuatro intentos de 650, 499, 610 y 540 |
| Budget risk | Low: ningún intento supera 800 (el mayor, 650, queda bajo la válvula de 720) |
| Chained PRs recommended | No: un solo cambio en su rama de worktree, cuatro intentos de construcción más verify, fusión a `main` al cerrar |
| Suggested split | L1 → L2 → L3 → L4 (intentos secuenciales; verify aparte) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (no aplica: no hay cadena de PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

El presupuesto es de 800 líneas POR INTENTO, no por cambio. Cuatro intentos de construcción más el de verify: ninguno supera el presupuesto.
Si al medir un lote pasa de 720, se parte antes de asentar (salida prevista en la cabecera de cada lote).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| L1 | Predicado, validador, tabla y acceso a la traza | commit L1 | `npx vitest run packages/shared/src/reasignacion.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/db/reasignaciones.test.ts` | pg-mem de las pruebas | Revertir el commit del lote; la tabla es inerte sin lectores |
| L2 | Aviso, usos, borrado e historial | commit L2 | `npx vitest run apps/desk/server/services/avisoReasignacion.test.ts apps/desk/server/auth/users.test.ts apps/desk/server/db/eventoReasignacion.test.ts` | pg-mem | Revertir el commit del lote |
| L3 | Ruta, registro y sincronizador | commit L3 | `npx vitest run apps/desk/server/routes/reasignacion.test.ts apps/desk/server/reasignacionSync.test.ts apps/desk/server/escritoresTransiciones.test.ts` | `appWith` y `upsertTicket` reales sobre pg-mem | Revertir el commit del lote (quita el `registerReasignacionRoutes` de `apps/desk/server/app.ts`) |
| L4 | Cliente y documentos | commit L4 | `npx vitest run apps/desk/src/lib/reasignacion.test.ts` | N/A: los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00); lo cubre P-1 | Revertir el commit del lote |

---

## Lote 1 · dominio, esquema y datos

**Estimación:** 361 brutas (`shared/reasignacion.ts` 55, su prueba 95, `index.ts` 1, `schema.sql` 13, `migrate.ts` 2, `migrate.test.ts` 40, `db/reasignaciones.ts` 60, su prueba 95) × 1,8 = **650**.
**Salida prevista si pasa de 720** (diseño §8): sacar `db/reasignaciones.ts` y su prueba al lote 2.

- [x] 1.1 Anotar el commit de partida del intento (`git rev-parse HEAD`) y abrir el intento del registro en el worktree.
- [x] 1.2 **Rojo** `packages/shared/src/reasignacion.test.ts`, `puedeReasignar`: barrido de todos los estados de los tres catálogos (`packages/shared/src/flujos.ts:19-22`) por cada área, contra un esperado calculado en la prueba desde `from` y `area`; administrador pasa en cualquier estado; estado sin salida sólo administrador; cargo sin área no pasa; sujeto ausente da `false`. Fija RQ-PM-27: «barrido de estados por áreas contra la ruta» (mitad pura), «el administrador pasa en cualquier estado», «estado sin salida, sólo el administrador (S-2)», «el cargo no abre la puerta (S-3)», «sujeto ausente falla cerrado», «no hace falta ser la persona a cargo».
- [x] 1.3 **Verde** crear `packages/shared/src/reasignacion.ts` con `MENSAJES_REASIGNACION` y `puedeReasignar` (consume `packages/shared/src/transitions.ts:327-334`, `packages/shared/src/flujos.ts:64-66`, `packages/shared/src/flujos.ts:13-16`, `packages/shared/src/cargos.ts:37`).
- [x] 1.4 **Rojo** en la misma prueba, `reasignacionDelCuerpo`: devuelve un solo error, en el orden motivo, destino ausente, destino igual al actual; recorta motivo y destino; no cadena vale vacío; origen nulo se compara con `''`. Fija RQ-TC-50: «el motivo va antes que el destino», «el motivo va antes que cada falla del destino» (mitad pura), «destino ausente, 422», «destino igual a la persona a cargo actual, 422 (S-4)», «el motivo se guarda recortado», «no se puede vaciar por esta ruta», y RQ-TC-52 «un solo validador del motivo».
- [x] 1.5 **Verde** `reasignacionDelCuerpo` en `packages/shared/src/reasignacion.ts` y una línea nueva al final de `packages/shared/src/index.ts` (hoy acaba en `packages/shared/src/index.ts:37`).
- [x] 1.6 **Rojo** `packages/zoho-sync/src/db/migrate.test.ts`: mover los recuentos del diseño §3(b) (`packages/zoho-sync/src/db/migrate.test.ts:282` título a 43 y 30, `:283` a `[10, 30, 3]`, `:284`, `:285` y `:286` a `43`, `:652` la misma suma `+ 2` con su etiqueta); bloque `describe` nuevo detrás del último (`packages/zoho-sync/src/db/migrate.test.ts:771-779`) con: tabla en `public`, `CREATE` calificado y último, índice en una sola sentencia, y `INSERT` directo con motivo vacío rechazado por el `CHECK`. Fija RQ-TZ-20: «la base rechaza un motivo vacío», «el esquema califica la tabla y va al final». No cambian las `ALTER` (`packages/zoho-sync/src/db/migrate.test.ts:376-378`), la posición 116 (`:522`) ni `creates[36]` (`:545`).
- [x] 1.7 **Verde** añadir `CREATE TABLE IF NOT EXISTS public.reasignaciones` y su índice al final de `packages/zoho-sync/src/db/schema.sql` (patrón de `packages/zoho-sync/src/db/schema.sql:613-622`; comentarios sin `;` y sin tildes) y `'reasignaciones'` a `PUBLIC_TABLES` en `packages/zoho-sync/src/db/migrate.ts:73`, en sitio.
- [x] 1.8 **Rojo** `apps/desk/server/db/reasignaciones.test.ts`: escritura y traza juntas; origen nulo; dato viejo (`reasignar` con `de` equivocado devuelve `false`, `derivado_a` intacto, tabla vacía, también con `de: null`); lectura ordenada por `id`; encadenadas A→B y B→C con `de` Ana y `de` Beto; `usosEnReasignaciones` cuenta `de` y `a` pero no `reasignado_por`; `UPDATE` que sólo toca `derivado_a` (`status` y `managed_by_app` intactos); atomicidad por verbos `BEGIN, UPDATE, INSERT, ROLLBACK` por la conexión de la transacción, con el molde de `apps/desk/server/prioridadTop5.test.ts:333-345` y un `UPDATE` que sí devuelve fila. Fija RQ-TC-51: «la actualización y la traza van juntas», «si falla la traza, `derivado_a` no cambia», «el `de` de la traza es el valor vigente al aplicar», «el estado no se mueve»; y RQ-TZ-20: «la fila queda con origen, destino, motivo recortado, actor y fecha».
- [x] 1.9 **Verde** crear `apps/desk/server/db/reasignaciones.ts` (`ticketParaReasignar`, `reasignar` con `UPDATE … WHERE id = $1 AND derivado_a = $3` o `IS NULL` dentro de `enTransaccion` de `apps/desk/server/db/transaccion.ts:13-28`, `reasignacionesDelTicket`, `usosEnReasignaciones`). Si pg-mem rechaza el parámetro repetido con `OR`, dos `COUNT`.
- [x] 1.10 **Mutación** `CREATE TABLE` sin `public.` en `schema.sql`: debe ponerse rojo el guardián de `packages/zoho-sync/src/db/migrate.test.ts:271`. Restaurar.
- [x] 1.11 **Mutación** quitar el `CHECK` del motivo en `schema.sql`: debe ponerse rojo el `INSERT` directo con motivo vacío de `migrate.test.ts`. Restaurar.
- [x] 1.12 **Mutación** `puedeReasignar` siempre verdadero: debe ponerse rojo el barrido puro de `packages/shared/src/reasignacion.test.ts`. Restaurar.
- [x] 1.13 **Mutación** destino delante de motivo en `reasignacionDelCuerpo`: debe ponerse rojo el par 3 y 4 de `packages/shared/src/reasignacion.test.ts`. Restaurar.
- [x] 1.14 **Mutación** `INSERT` de la traza fuera de la transacción en `reasignar`: debe ponerse roja la prueba de verbos de `apps/desk/server/db/reasignaciones.test.ts`. Restaurar.
- [x] 1.15 **Mutación** quitar la condición sobre `derivado_a` del `UPDATE`: debe ponerse roja la prueba de dato viejo de `apps/desk/server/db/reasignaciones.test.ts`. Restaurar.
- [x] 1.16 Correr `npm test`, `npm run typecheck`, `npm run lint` (`--max-warnings 165`: no pueden subir de 165 avisos) y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; los cuatro con código de salida 0 MIRADO.
- [x] 1.17 Medir: `git diff --shortstat --no-renames` contra el commit de 1.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera antes de asentar.
- [x] 1.18 Commit del lote 1 (conventional commit, sin atribución de IA) y asentar el intento.

---

## Lote 2 · aviso, usos, borrado e historial

**Estimación:** 277 brutas (`avisoReasignacion.ts` 45, su prueba 70, `users.ts` 8, `users.test.ts` 18, `eliminarTicket.ts` 2 y su prueba 15 hipótesis, `eventoReasignacion.ts` 45, su prueba 70, `historial.ts` 4) × 1,8 = **499**.
**Salida prevista si pasa de 720** (diseño §8 sólo fija la del lote 1; esta la propone `tasks`, no el diseño): el par `eventoReasignacion` y `historial.ts` pasa a un intento 2b.

- [x] 2.1 Anotar el commit de partida del intento (`git rev-parse HEAD`) y abrir el intento.
- [x] 2.2 Leer `apps/desk/server/db/eliminarTicket.ts` y las pruebas que lo cubren: el diseño marca como hipótesis que llevan recuentos que habrá que mover y no se leyeron; anotar cuáles en `apply-progress.md`.
- [x] 2.3 **Rojo** `apps/desk/server/services/avisoReasignacion.test.ts`, función pura `avisoReasignacion`: texto con motivo y nombre del actor; `null` si `nuevo === actorId`; sin red ni base. Fija RQ-AV-20: «la decisión del aviso es una función pura», «reasignarse a uno mismo no crea aviso» (mitad pura), «el destino recibe el aviso con el motivo y el nombre de quien reasigna».
- [x] 2.4 **Verde** crear `apps/desk/server/services/avisoReasignacion.ts` con `avisoReasignacion`, reutilizando `AvisoNuevo` (`apps/desk/server/services/avisoDerivacion.ts:12-16`) sin tocar `ticketService.ts`.
- [x] 2.5 **Rojo** en la misma prueba, `notificarReasignacion`: aviso creado en `avisos` con `ticket_id`, un solo elemento enviado con `conCopia: true` (S-7), sellado con `marcarEnviados` si salió, `enviado_at` en `NULL` con el correo fallando o sin URL, un fallo del aviso no revierte nada, un administrador que es también destino recibe uno solo, la persona de origen no recibe nada. Fija RQ-AV-20: «el correo fallando no tumba la reasignación», «los administradores reciben copia sin duplicados», «no se avisa a la persona de origen», «el aviso se escribe fuera de la transacción».
- [x] 2.6 **Verde** `notificarReasignacion` con la secuencia de `apps/desk/server/services/ticketService.ts:179-183` y `apps/desk/server/services/ticketService.ts:215-219` (`crearAviso` de `apps/desk/server/db/avisos.ts:8-18`, `dispararAvisos` de `apps/desk/server/avisosWebhook.ts:53-57`, `marcarEnviados` de `apps/desk/server/db/avisos.ts:57-62`, `logger.warn` si no salió).
- [x] 2.7 **Rojo** bloque nuevo al final de `apps/desk/server/auth/users.test.ts`: figurar como `de` no deja borrar; figurar como `a` no deja borrar; el recuento de `UsuarioEnUso` suma las dos fuentes; `reasignado_por` sólo por nombre sí permite borrar. Fija RQ-PM-11: los cuatro escenarios «quien figura como origen…», «…destino…», «el recuento suma la tercera fuente», «haber reasignado por nombre no impide el borrado».
- [x] 2.8 **Verde** `apps/desk/server/auth/users.ts`: `await usosEnReasignaciones(db, id)` sumado sobre la línea del `return` (`apps/desk/server/auth/users.ts:136-140`), `import` en `apps/desk/server/auth/users.ts:4` y comentario de `apps/desk/server/auth/users.ts:126-134` reescrito sin cambiar su número de líneas («Dos» pasa a «Tres»).
- [x] 2.9 **Rojo** en las pruebas de `eliminarTicket` (fichero hallado en 2.2): eliminar un ticket con reasignación a «Beto» deja `public.reasignaciones` sin filas suyas y «Beto» vuelve a poder borrarse; mover los recuentos que haga falta. Fija RQ-TC-51: «eliminar el ticket borra sus reasignaciones y libera a la persona (S-8)».
- [x] 2.10 **Verde** añadir `reasignaciones` a la lista de tablas de `apps/desk/server/db/eliminarTicket.ts:54`, sobre la misma línea (`apps/desk/server/db/eliminarTicket.ts:45-56`).
- [x] 2.11 **Rojo** `apps/desk/server/db/eventoReasignacion.test.ts`: evento puro (`eventName: 'AppReasignacion'`, `time`, `actor`, título con origen y destino por nombre, detalles De, A, Motivo, Reasignado por); origen nulo se lee «Sin derivar»; id que no resuelve se enseña crudo; `getHistorialTicket` con una transición y una reasignación las ordena de más reciente a más antigua; la reasignación aparece una sola vez y ninguna línea de traspaso procede de ella; un ajuste de `prioridad_ajustes` no entra; abrir el historial dos veces no escribe. Fija RQ-TZ-20: «el historial enseña el evento con De, A, Motivo y Reasignado por», «origen nulo se lee “Sin derivar”», «id que no resuelve se enseña crudo», «la reasignación no genera además una línea de traspaso», «abrir el historial no escribe»; RQ-TZ-06: «la reasignación entra en la misma línea de tiempo»; RQ-TZ-17: «una reasignación sí aparece en el historial».
- [x] 2.12 **Verde** crear `apps/desk/server/db/eventoReasignacion.ts` (`eventoReasignacion`, `eventosReasignacion` con `SELECT id, name FROM users` sólo si hay filas; molde de `apps/desk/server/db/ticketFuentes.ts:101-105` y `apps/desk/server/db/ticketFuentes.ts:115-125`) y editar en sitio `apps/desk/server/db/historial.ts:3` (`import`) y `apps/desk/server/db/historial.ts:157` (unión a cuatro fuentes). No se inserta ninguna línea.
- [x] 2.13 **Mutación** quitar la supresión «a uno mismo» en `avisoReasignacion`: debe ponerse roja la prueba pura de `apps/desk/server/services/avisoReasignacion.test.ts`. Restaurar.
- [x] 2.14 **Mutación** quitar la tercera fuente de `usosDeUsuario`: debe ponerse rojo el bloque nuevo de `apps/desk/server/auth/users.test.ts`. Restaurar.
- [x] 2.15 Correr `npm test`, `npm run typecheck`, `npm run lint` (`--max-warnings 165`, no pueden subir de 165 avisos) y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; los cuatro con código de salida 0 MIRADO.
- [x] 2.16 Medir: `git diff --shortstat --no-renames` contra el commit de 2.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera.
- [x] 2.17 Commit del lote 2 y asentar el intento.

---

## Lote 3 · ruta, registro y sincronizador

**Estimación:** 339 brutas (`routes/reasignacion.ts` 50, `app.ts` 4, prueba de la ruta 240, `reasignacionSync.test.ts` 45) × 1,8 = **610**.
**Salida prevista si pasa de 720** (la propone `tasks`; el diseño §8 sólo da la del lote 1): sacar `reasignacionSync.test.ts` y su mutación a un intento 3b.

- [x] 3.1 Anotar el commit de partida del intento (`git rev-parse HEAD`) y abrir el intento.
- [x] 3.2 **Rojo** `apps/desk/server/routes/reasignacion.test.ts`, escalón A y B con `appWith` (`apps/desk/server/testing/appHarness.ts:46-54`): sin sesión `401`; usuario del área reasigna (`200`, `derivado_a` cambia, `status` igual); ticket inexistente con usuario sin permiso y cuerpo vacío da `404`; ticket existente sin permiso y sin motivo da `403`; sin permiso con cuerpo válido `403` y nada cambia; administrador pasa; no hace falta ser la persona a cargo. Fija RQ-TC-50: «un usuario del área reasigna, el estado no cambia», «ticket inexistente, 404 antes que 403 y que 422», «403 antes que 422», «el permiso se evalúa aunque el cuerpo sea válido»; RQ-PM-27: «un usuario del área del estado reasigna», «sin el área y sin ser administrador, 403», «sin sesión, 401».
- [x] 3.3 **Verde** crear `apps/desk/server/routes/reasignacion.ts` (`registerReasignacionRoutes`, molde de `apps/desk/server/routes/prioridad.ts:62-77`) con guardas A y B, y registrarlo en sitio en `apps/desk/server/app.ts:22` (`import`) y `apps/desk/server/app.ts:61` (llamada con `{ db, config }` como `apps/desk/server/app.ts:59`).
- [x] 3.4 **Rojo** en la misma prueba, escalón C y pares de posición del diseño §5: motivo vacío, ausente y de espacios `422`; par 3 y 4 (motivo de espacios, sin destino, texto del motivo); par 3 y 5 y 3 y 6 (motivo vacío con destino igual, inexistente e inactivo, el texto del motivo las tres veces); par 4 y 5 (ticket sin persona a cargo, destino ausente, texto de destino ausente); par 5 y 6 (destino igual al actual e inactivo, texto de destino igual); destino ausente o vacío `422`; no vaciar por la ruta; destino inexistente o inactivo `422`; en todos `derivado_a` intacto y sin traza ni aviso. Fija RQ-TC-50: «sin motivo, 422», «el motivo va antes que el destino», «el motivo va antes que cada falla del destino», «destino ausente, 422», «destino igual a la persona a cargo actual, 422 (S-4)», «destino inexistente o inactivo, 422», «destino igual al actual antes que destino inexistente», «no se puede vaciar por esta ruta».
- [x] 3.5 **Verde** guardas C de la ruta con `reasignacionDelCuerpo` y `getUserById` activo (criterio de `apps/desk/server/services/ticketService.ts:138-142`).
- [x] 3.6 **Rojo** en la misma prueba, éxito y D: motivo recortado en la traza; origen nulo `200` con `de` nulo; reasignarse a uno mismo `200` (S-5); destino de otra área `200` (S-6); encadenadas A→B y B→C dejan dos filas; `409` determinista con `appWith({}, dbPropia)` (`apps/desk/server/testing/appHarness.ts:46-54`) y un `Queryable` sin `connect` (`apps/desk/server/db/transaccion.ts:15`) que escribe otro `derivado_a` justo antes del `UPDATE tickets SET derivado_a` (sin traza, sin aviso, `derivado_a` sigue en «Carla»); posición `422` antes que `409` con motivo vacío y persona a cargo cambiada. Fija RQ-TC-50: «el motivo se guarda recortado», «origen nulo se puede reasignar», «reasignarse a uno mismo se permite (S-5)», «el destino puede ser de otra área (S-6)», «la persona a cargo cambió entre la lectura y la escritura, 409», «posición, el 422 de contenido antes que el 409 de carrera».
- [x] 3.7 **Verde** guarda D (`reasignar` devuelve `false` da `409` con `MENSAJES_REASIGNACION.carrera`) y `200` con `{ ticketId, derivadoA }`.
- [x] 3.8 **Rojo** en la misma prueba, aviso y no-interferencia: aviso para el destino con motivo y nombre del actor; a uno mismo no crea aviso; origen sin aviso; correo fallando o sin configurar `200` con `enviado_at` `NULL`; fallo del aviso tras la transacción deja `derivado_a` y traza; `ticket_transitions` con N filas antes y después; `entradasActuales` y `primerDerivado` iguales; `escritoresTransiciones` sigue en verde (`apps/desk/server/escritoresTransiciones.test.ts:55-59`). Fija RQ-AV-20: «el destino recibe el aviso…», «reasignarse a uno mismo no crea aviso», «no se avisa a la persona de origen», «el correo fallando no tumba la reasignación», «el aviso se escribe fuera de la transacción»; RQ-TC-51: «`ticket_transitions` no cambia», «la entrada vigente del estado es la misma», «`primerDerivado` no cambia»; RQ-TZ-20: «la reasignación no escribe en `ticket_transitions`», «el reloj de la alarma y `primerDerivado` no se mueven».
- [x] 3.9 **Verde** llamar a `notificarReasignacion` desde la ruta, después de la transacción y fuera de ella.
- [x] 3.10 **Rojo** en la misma prueba, barrido HTTP de estados de los tres catálogos por áreas con cuerpo sin motivo (`403` frente a `422`), comparado con `puedeReasignar` de `shared`. Fija RQ-PM-27: «barrido de estados por áreas contra la ruta», «estado sin salida, sólo el administrador (S-2)»; RQ-TC-52: «un solo predicado, sin segunda copia» (la ruta llama al de `shared`). Verde: sin código nuevo si la guarda B ya lo cumple; si no, ajustarla.
- [x] 3.11 **Rojo** `apps/desk/server/reasignacionSync.test.ts` con `instalarArnes`, `appWith` y `adminCookie` (`apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:46-54`, `apps/desk/server/testing/appHarness.ts:86-89`), `upsertTicket` y `ticketRowFromZoho` importados como en `apps/desk/server/prioridadTop5.test.ts:5-6`: ticket fabricado por el propio sincronizador, precondición `managed_by_app === false`, `POST` `200`, segundo `upsertTicket` con `status: 'En Proceso'`, y `derivado_a` igual al destino, `status` `En Proceso` y `managed_by_app` `false`. Fija RQ-TC-51: «la reasignación sobrevive al sincronizador», «la reasignación no fija `managed_by_app`». Verde: ya cumple con la ruta de 3.3 a 3.9 (caracterización de comportamiento existente de `packages/zoho-sync/src/db/repo.test.ts:47-55`).
- [x] 3.12 **Mutación** `403` delante del `404`: debe ponerse rojo el par 1 y 2 de `apps/desk/server/routes/reasignacion.test.ts`. Restaurar.
- [x] 3.13 **Mutación** `422` delante del `403`: debe ponerse rojo el par 2 y 3. Restaurar.
- [x] 3.14 **Mutación** destino delante de motivo en la ruta: debe ponerse rojo el par 3 y 4 de la ruta. Restaurar.
- [x] 3.15 **Mutación** `puedeReasignar` siempre verdadero: debe ponerse rojo el barrido HTTP de `apps/desk/server/routes/reasignacion.test.ts`. Restaurar.
- [x] 3.16 **Mutación** `managed_by_app = true` en el `UPDATE`: debe ponerse roja `apps/desk/server/reasignacionSync.test.ts` (el estado de Zoho no entra). Restaurar.
- [x] 3.17 **Mutación** quitar la supresión «a uno mismo» en la ruta: debe ponerse roja la prueba de a-uno-mismo de la ruta. Restaurar.
- [x] 3.18 **Mutación** quitar la condición sobre `derivado_a` del `UPDATE`: deben ponerse rojas la de dato viejo y el `409` de la ruta. Restaurar.
- [x] 3.19 Correr `npm test`, `npm run typecheck`, `npm run lint` (`--max-warnings 165`, no pueden subir de 165 avisos) y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; los cuatro con código de salida 0 MIRADO.
- [x] 3.20 Medir: `git diff --shortstat --no-renames` contra el commit de 3.1 más `wc -l` de lo nuevo sin trackear; registrar la cifra. Si pasa de 720, partir según la cabecera.
- [x] 3.21 Commit del lote 3 y asentar el intento.

---

## Lote 4 · cliente y documentos

**Estimación:** 300 brutas (`client.ts` 10, `lib` 30 y su prueba 45, `PanelReasignar.tsx` 75, `TicketDetailView.tsx` 8, corrección 30 35, `DEPLOY.md` 12, paquete de despliegue 60, `openspec/config.yaml` 15, tabla de la regla 13 10) × 1,8 = **540**.
**Salida prevista si pasa de 720** (la propone `tasks`; el diseño §8 sólo da la del lote 1): sacar los documentos (corrección 30, `DEPLOY.md`, paquete, `config.yaml`) a un intento 4b.
**Mutaciones del diseño §7 en este lote:** ninguna; las once caen en L1 a L3. Los `.tsx` no admiten rojo previo bajo `strict_tdd` (fuera de la red de pruebas, F0-00): el rojo se exige sólo a `lib/`.

- [x] 4.1 Anotar el commit de partida del intento (`git rev-parse HEAD`) y abrir el intento.
- [x] 4.2 **Rojo** `apps/desk/src/lib/reasignacion.test.ts`: `opcionesReasignacion` no incluye a la persona a cargo ni «Sin derivar» (tipo de `apps/desk/src/lib/personas.ts:4`); `puedeEnviarReasignacion` es `reasignacionDelCuerpo(...).ok` (motivo vacío o de espacios desactiva, destino igual al actual desactiva). Fija RQ-TC-52: «la lógica de `lib/` no ofrece la persona a cargo ni “Sin derivar”», «un solo validador del motivo».
- [x] 4.3 **Verde** crear `apps/desk/src/lib/reasignacion.ts` con ambas funciones, consumiendo el validador de `@ambientalia/shared`, sin reescribirlo.
- [x] 4.4 Añadir al final de `apps/desk/src/api/client.ts` `reasignarTicket(ticketId, { destino, motivo })` (molde de `apps/desk/src/api/client.ts:736-740`; errores por `erroresDelServidor`, `apps/desk/src/api/client.ts:748-757`). `.tsx`/cliente fuera de la red: sin rojo previo.
- [x] 4.5 Crear `apps/desk/src/components/PanelReasignar.tsx` (molde de `apps/desk/src/components/PanelPrioridad.tsx:16-40`; props `ticketId`, `status`, `clasificacion`, `derivadoActual`, `onCambio`; se pinta sólo si `puedeReasignar`; personas de `getPersonas()` en `apps/desk/src/api/client.ts:217-218`; muestra el error del servidor, no uno propio).
- [x] 4.6 Montar el panel en sitio en `apps/desk/src/components/TicketDetailView.tsx`: `import` en la línea 15, estado `versionHistoria` en la 72, `key` del `HistoriaPanel` en la 291 (DD-7) y el panel en la 320 con `derivadoActual={ticket.derivado ?? null}` como `apps/desk/src/components/TicketDetailView.tsx:338`. Releer cada línea antes de editar: sin insertar líneas.
- [x] 4.7 Rellenar la **tabla de la regla 13** (regla de mutación 3) con ruta y línea del servidor ya construido, decisión a decisión, las seis filas de RQ-TC-52; se escribe en `openspec/changes/reasignacion-con-motivo/apply-progress.md`, sección «Tabla de la regla 13», y no en este `tasks.md`.
- [x] 4.8 Añadir la corrección 30 a `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (la última es la 29, `docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456`): `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035` pasa a «cualquiera del área del estado, o un administrador» hasta F1C-05, y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062` pasa a construida. Releer ambos rangos contra el `.md` antes de citarlos.
- [x] 4.9 Añadir a `DEPLOY.md` un apartado: tabla nueva `public.reasignaciones` creada por `migrate` al arrancar, sin interruptor ni variables, y la comprobación de lectura tras desplegar (tarea P-4: la tabla existe y se puede leer en producción).
- [x] 4.10 Añadir al final de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` un apartado nuevo (después del §8): qué entra (ruta, tabla, aviso, historial, panel), los supuestos S-2, S-4, S-5, S-6 y S-8 para confirmar por Gerencia, y las tareas de persona P-1 a P-4 sin casillas.
- [x] 4.11 **RETIRADA por el orquestador, no hecha:** `openspec/config.yaml` no se toca — la entrada de la decisión está a mitad de un fichero citado por número de línea y no hay patrón de nota al final; el estado de aplicación queda en el paquete de despliegue (§9) y en el `archive-report.md`. Texto original: Registrar en `openspec/config.yaml` lo que pide el cierre: la nota de aplicación de `decision/e089-e220-visibilidad-y-traspaso` (reasignación construida, S-1 a S-8 pendientes de confirmación, traspaso en el paquete) junto a su entrada existente; leer primero la entrada vecina para copiar su forma y no citar líneas de memoria.
- [x] 4.12 **Barrido de citas, regla de mutación 4:** correr `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` para `apps/desk/server/db/historial.ts` (31 citas), `apps/desk/server/auth/users.ts` (22), `apps/desk/server/app.ts` (42), `packages/zoho-sync/src/db/migrate.test.ts` y `apps/desk/src/components/TicketDetailView.tsx` (72), y comprobar CADA resultado contra el fichero. Diseño §9: no se desplaza ninguna línea porque no se inserta ninguna. Hay que RELEER por contenido las cuatro citas que abarcan la unión del historial (`openspec/specs/trazas/spec.md:28`, que es histórica y no se toca por caso B, y `openspec/specs/trazas/spec.md:141`) y las siete que caen en `usosDeUsuario` o su comentario. Segundo pase de las abreviadas (`:NN`) en los ficheros que ya citan esos módulos. Anotar el resultado en `apply-progress.md`.
- [x] 4.13 Correr `npm test`, `npm run typecheck`, `npm run lint` (`--max-warnings 165`, no pueden subir de 165 avisos) y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; los cuatro con código de salida 0 MIRADO.
- [x] 4.14 Medir: `git diff --shortstat --no-renames` contra el commit de 4.1 más `wc -l` de lo nuevo sin trackear (los binarios, si los hubiera, aparte); registrar la cifra. Si pasa de 720, partir según la cabecera.
- [x] 4.15 Commit del lote 4 y asentar el intento. `docs/sdd/ENTRADA.md` queda sin tocar (comprobar con `git diff --stat`).

## Lote 5 · cierre (remediación del verify)

Hallazgos de `openspec/changes/reasignacion-con-motivo/verify-report.md` (`## Hallazgos`); sólo pruebas y documentos, sin código de producción.

- [x] 5.1 **W-1** Prueba de ruta con un pool falso que SÍ expone `connect` (`apps/desk/server/routes/reasignacion.test.ts`, bloque nuevo al final): registra el orden y afirma `tx:BEGIN, tx:UPDATE tickets, tx:INSERT reasignaciones, tx:COMMIT, pool:INSERT avisos`. Mutación TX roja.
- [x] 5.2 **W-2** Dos `INSERT` directos que la base rechaza, con `a` nulo y con `reasignado_por` nulo (`packages/zoho-sync/src/db/migrate.test.ts`, final del bloque de `public.reasignaciones`). Mutación S7 roja, quitando cada `NOT NULL` por separado.
- [x] 5.3 **W-3** Misma comprobación de DD-2 con `de: null` (`apps/desk/server/db/reasignaciones.test.ts`, `describe` de `reasignar`): `status`, `managed_by_app` y `updated_at` iguales. Mutación D6b roja.
- [x] 5.4 **S-3** Tres imprecisiones de `apply-progress.md` corregidas en sus líneas (cita de `avisoReasignacion.ts`, abreviada rota en prosa, delta de `tickets-core` que SÍ modifica RQ-TC-11).
- [x] 5.5 **S-5** `docs/runbooks/borrar-tickets-de-prueba.md`: «diez tablas», `DELETE` de `public.reasignaciones` tras `ticket_history` (el orden de `apps/desk/server/db/eliminarTicket.ts:53-54`) y su fila en la comprobación del paso 3. `CreateTicket.tsx` no se toca.
- [x] 5.6 **S-6** `DEPLOY.md`: «el historial falla al leerla» apunta a la consulta, `apps/desk/server/db/reasignaciones.ts:45`.

---

## En el archivo

No van en los lotes; los hace el `sdd-archive`, con la regla del archivo (la parte con carga de revisión, fusión del delta más `archive-report.md`, se mide antes de aplicar y no supera 800):

- Cambiar `apps/desk/server/reconciliacion/registro.test.ts:218-222`: F1B-05 sale de «en curso».
- Fusionar los cuatro deltas (`trazas`, `derivacion-avisos`, `permissions`, `tickets-core`) por script comparando bloques; comprobar los códigos de salida antes de asentar. La fusión de `trazas` desplaza lo que sigue a RQ-TZ-17: barrido de las citas a esa spec.
- Escribir el `archive-report.md` con una línea sobre qué parte del contenido de la fila F1B-05 cubrió (sostiene `cierra: si`), e incluir la medición de cada intento.
- Verificar con `git show --numstat` que el commit de archivo contiene sólo el cambio archivado.

## Tareas de personas — fuera del recuento, archivar no las da por hechas

Sin casillas: son decisiones o comprobaciones de personas, no trabajo de una tanda en este repositorio.

- **P-1** · Verificar en la aplicación el panel, el aviso y la línea del historial. Dueño: Analista. Destino: tras el despliegue. Queda escrito en: el paquete de despliegue de la tanda (`docs/sdd/Paquete_de_Despliegue_2026-10-06.md`).
- **P-2** · Confirmar o corregir S-2, S-4, S-5 y S-6. Dueño: Gerencia. Destino: panel. Queda escrito en: `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (traspaso de la tanda); `docs/sdd/ENTRADA.md` no se toca, porque la entrada la abre Supervisión.
- **P-3** · Pegar la corrección 30 en el maestro. Dueño: Gerencia. Destino: maestro. Queda escrito en: `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.
- **P-4** · Desplegar y comprobar que existe `public.reasignaciones` en producción. Dueño: Mantenedor. Destino: producción. Queda escrito en: `DEPLOY.md`.
