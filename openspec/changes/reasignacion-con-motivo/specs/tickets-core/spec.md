# Delta para tickets-core — reasignar la persona a cargo sin cambiar de estado, con motivo (F1B-05, `cierra: si`)

Numeración comprobada contra `openspec/specs/tickets-core/spec.md`: el último requisito vivo es RQ-TC-49; los nuevos son
RQ-TC-50, RQ-TC-51 y RQ-TC-52. El delta **no modifica** ningún requisito vivo. Supuestos S-1…S-7 de `proposal.md` y S-8 de `design.md` (DD-6), todos
reversibles. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

**Escalera de guardas de la ruta**, de la primera a la última: **A** existencia (`404`) < **B** permiso (`403`) < **C**
contenido (`422`: primero el motivo; después, dentro del destino, ausente, igual al actual, inexistente o inactivo) < **D**
unicidad de la carrera (`409`: la persona a cargo cambió entre la lectura y la escritura). Los
escenarios de posición activan **dos guardas a la vez** (regla de mutación 1).

## MODIFIED Requirements

### RQ-TC-11 · Un ticket sólo se borra si nació aquí

`eliminarTicket` **SHALL** rechazar con `409` cualquier ticket que no haya nacido en la app o que no
esté `managed_by_app` (`apps/desk/server/db/eliminarTicket.ts:116`, con `TicketNoBorrable` en
`:24-29`), y el mensaje **SHALL** decir por qué: borrarlo aquí sólo lo haría volver en la siguiente
sincronización (`routes/tickets.ts:97`).

Las dos puertas —`404` y `409`— **SHALL** vivir en la función y no en la ruta, «para que ningún
llamador futuro pueda saltárselas y para que el simulacro las evalúe igual»
(`eliminarTicket.ts:96-98`). El borrado **SHALL** ser en orden explícito de diez tablas hijas más la
cabecera (`eliminarTicket.ts:31-33`).

(Previously: nueve tablas hijas. La décima es `reasignaciones`, que F1B-05 añade al barrido para que las filas de un ticket
borrado no sigan contando en «en uso» de RQ-PM-11; lo fija RQ-TC-51.)

## ADDED Requirements

### RQ-TC-50 · `POST /api/tickets/:id/reasignar`: cambiar la persona a cargo sin cambiar de estado, con la escalera A < B < C < D

El servidor **SHALL** exponer `POST /api/tickets/:id/reasignar`, en módulo propio, que cambia `tickets.derivado_a` al
usuario `destino` del cuerpo, con un `motivo` escrito, **sin cambiar `status`** ni ninguna otra columna del ticket. En
caso de éxito responde `200`. **MUST NOT** vaciar la persona a cargo (no hay camino a «sin derivar» por esta ruta), ni
reasignar en bloque. Las guardas **SHALL** evaluarse en este orden total, sin solape de códigos:

1. **A · existencia (`404`):** el ticket no existe. **SHALL** responder `404` aunque el cuerpo sea inválido y el usuario no
   tenga permiso.
2. **B · permiso (`403`):** el usuario no cumple el predicado de `permissions` RQ-PM-27. **SHALL** responder `403` aunque
   el cuerpo sea inválido.
3. **C · contenido (`422`)**, en este orden:
   1. **Motivo**: obligatorio; vacío o de sólo espacios da `422`. Se guarda **recortado**. Un validador único de
      `packages/shared` lo decide.
   2. **Destino ausente**: sin `destino` da `422`.
   3. **Destino igual a la persona a cargo actual** (SUPUESTO S-4, reversible): `422`, porque no es una reasignación.
   4. **Destino inexistente o inactivo**: `422`, con el mismo criterio con que la derivación de una transición rechaza un
      destino que no es un usuario activo.
4. **D · carrera (`409`):** si entre la lectura del ticket y la escritura otra reasignación cambió la persona a cargo, el
   `UPDATE`, condicionado a la persona a cargo leída, no toca ninguna fila. La ruta **SHALL** responder `409`, **MUST NOT**
   insertar fila en `public.reasignaciones` y **MUST NOT** crear aviso; `derivado_a` queda como lo dejó la otra
   reasignación. D **SHALL** evaluarse después de C: un cuerpo inválido da `422` aunque la persona a cargo ya haya cambiado.

El **motivo va antes que el destino**: un cuerpo sin motivo y con destino inválido da el `422` del motivo. **El destino**
puede ser cualquier persona activa, sin exigir que sea del área (SUPUESTO S-6, reversible: el maestro habla de «técnicos de
la misma área», pero la derivación de hoy tampoco lo exige). **Reasignarse a uno mismo se permite** (SUPUESTO S-5,
reversible) y no genera aviso (`derivacion-avisos` RQ-AV-20). Un ticket sin persona a cargo (origen nulo) **SHALL**
poder reasignarse; su `de` queda nulo en la traza.

La ruta recibe la configuración del correo para el aviso, y se registra en `apps/desk/server/app.ts` sobre las líneas que
ya existen. **No** se tocan `apps/desk/server/services/ticketService.ts` ni `packages/zoho-sync/src/db/repo.ts`.

#### Scenario: un usuario del área reasigna, el estado no cambia — ROJO
- GIVEN un ticket en un estado con área de salida Servicio Técnico a cargo de «Ana», y un usuario con esa área
- WHEN reasigna a «Beto» con motivo «Ana sale de vacaciones»
- THEN responde `200`, `derivado_a` es el id de Beto y `status` es el mismo que antes

#### Scenario: ticket inexistente, 404 antes que 403 y que 422 — ROJO
- GIVEN un identificador de ticket que no existe, un usuario sin permiso y un cuerpo inválido (sin motivo y sin destino)
- WHEN reasigna
- THEN responde `404`, no `403` ni `422`

#### Scenario: 403 antes que 422 — ROJO
- GIVEN un ticket que existe, un usuario sin permiso y un cuerpo sin motivo
- WHEN reasigna
- THEN responde `403`, no `422`, y no cambia nada

#### Scenario: el permiso se evalúa aunque el cuerpo sea válido — ROJO
- GIVEN un ticket que existe, un usuario sin permiso y un cuerpo válido
- WHEN reasigna
- THEN responde `403` y `derivado_a` no cambia

#### Scenario: sin motivo, 422 — ROJO
- GIVEN un usuario con permiso y un destino válido
- WHEN envía el motivo vacío, ausente o de sólo espacios
- THEN responde `422`, `derivado_a` no cambia y no se inserta traza

#### Scenario: el motivo va antes que el destino — ROJO
- GIVEN un usuario con permiso, un motivo vacío y un destino ausente
- WHEN reasigna
- THEN el `422` es el del motivo

#### Scenario: el motivo va antes que cada falla del destino — ROJO
- GIVEN un usuario con permiso, un motivo vacío y, por separado, un destino igual al actual, un destino inexistente y un destino inactivo
- WHEN reasigna en cada caso
- THEN en los tres el `422` es el del motivo

#### Scenario: destino ausente, 422 — ROJO
- GIVEN un usuario con permiso y un motivo válido
- WHEN no envía `destino`, o lo envía vacío
- THEN responde `422` y no cambia nada

#### Scenario: destino igual a la persona a cargo actual, 422 (S-4) — ROJO
- GIVEN un ticket a cargo de «Ana», un usuario con permiso y un motivo válido
- WHEN envía como destino a Ana
- THEN responde `422`, no se inserta traza y no se crea aviso

#### Scenario: destino inexistente o inactivo, 422 — ROJO
- GIVEN un usuario con permiso, un motivo válido y un destino que no existe, o que está inactivo
- WHEN reasigna
- THEN responde `422` y no cambia nada

#### Scenario: destino igual al actual antes que destino inexistente — CARACTERIZACIÓN
- GIVEN un destino que a la vez es la persona a cargo actual e inactivo
- WHEN se reasigna
- THEN el `422` que se contesta es el de destino igual al actual, que precede al de inexistente o inactivo

#### Scenario: la persona a cargo cambió entre la lectura y la escritura, 409 — ROJO
- GIVEN un ticket a cargo de «Ana», un usuario con permiso y un cuerpo válido hacia «Beto», y que entre la lectura del ticket y la escritura otra reasignación lo deja a cargo de «Carla»
- WHEN se aplica la escritura
- THEN responde `409`, no queda ninguna fila nueva en `public.reasignaciones`, no se crea aviso y `derivado_a` sigue siendo «Carla»

#### Scenario: posición, el 422 de contenido antes que el 409 de carrera — ROJO
- GIVEN un ticket cuya persona a cargo cambió entre la lectura y la escritura, un usuario con permiso y un motivo vacío
- WHEN reasigna
- THEN responde `422` del motivo, no `409`, y no cambia nada

#### Scenario: el motivo se guarda recortado — ROJO
- GIVEN un motivo «  cambio de turno  »
- WHEN se reasigna
- THEN la traza guarda «cambio de turno» (`trazas` RQ-TZ-20)

#### Scenario: origen nulo se puede reasignar — ROJO
- GIVEN un ticket sin persona a cargo
- WHEN un usuario con permiso lo reasigna a «Beto» con motivo
- THEN responde `200` y la traza guarda `de` nulo

#### Scenario: reasignarse a uno mismo se permite (S-5) — ROJO
- GIVEN un usuario con permiso, que no es la persona a cargo
- WHEN se reasigna el ticket a sí mismo con motivo
- THEN responde `200` y `derivado_a` es su propio id

#### Scenario: el destino puede ser de otra área (S-6) — ROJO
- GIVEN un destino activo cuyas áreas no incluyen ninguna de las de salida del estado
- WHEN se reasigna
- THEN responde `200`

#### Scenario: no se puede vaciar por esta ruta — ROJO
- GIVEN un ticket con persona a cargo
- WHEN se envía `destino` nulo o cadena vacía
- THEN responde `422` y `derivado_a` no cambia

### RQ-TC-51 · La reasignación es atómica, no mueve el estado ni el reloj, sobrevive a la sincronización y se borra con su ticket

Al aplicarse, el servidor **SHALL**, en una **misma transacción**: actualizar `tickets.derivado_a` e insertar la fila de
traza en `public.reasignaciones` (`trazas` RQ-TZ-20). Si el alta de la traza falla, `derivado_a` **MUST NOT** cambiar, y si
falla la actualización no queda traza. La actualización **MUST NOT** tocar `status` ni ninguna otra columna del ticket más
allá de `derivado_a`.

- **Nada en `ticket_transitions`.** La reasignación **MUST NOT** escribir en `ticket_transitions`: el inventario exacto de
  escritores de `trazas` RQ-TZ-16 no cambia, la entrada vigente del estado que lee el reloj de la alarma
  (`derivacion-avisos` RQ-AV-16) es la misma antes y después, y `primerDerivado` (RQ-AV-03) devuelve lo mismo.
- **No pone `managed_by_app`.** La reasignación **MUST NOT** fijar `managed_by_app = true`: si lo hiciera, el sincronizador
  dejaría de refrescar la fila entera. `derivado_a` está fuera de las columnas que reescribe el sincronizador, así que la
  reasignación **SHALL** sobrevivir a una pasada de sincronización: tras `upsertTicket` con un estado nuevo de Zoho,
  `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` sigue `false`. No hay delta en `zoho-sync`: es
  comportamiento que ya existe, que esta prueba de extremo a extremo fija.
- **Aviso fuera de la transacción:** `derivacion-avisos` RQ-AV-20. Que el correo falle **MUST NOT** deshacer lo escrito.
- **Carrera:** el `de` de la traza **SHALL** ser el `derivado_a` que el ticket tenía cuando se aplicó la reasignación; el
  `UPDATE` condicionado de RQ-TC-50 (D, `409`) impide que dos reasignaciones simultáneas dejen un `de` que ya no es
  cierto. **Límite declarado:** pg-mem no ejercita el bloqueo de fila real de PostgreSQL ni dos conexiones concurrentes;
  la suite prueba la condición del `UPDATE` de forma determinista, y que el motor serialice las escrituras reales es
  hipótesis no probada aquí.
- **Se borra con su ticket (SUPUESTO S-8, reversible):** eliminar un ticket **SHALL** borrar también sus filas de
  `public.reasignaciones`. Hoy la lista de tablas que barre el borrado (`apps/desk/server/db/eliminarTicket.ts:45-56`) no
  la incluye; sin ello las filas huérfanas seguirían contando en «en uso» (`permissions` RQ-PM-11) y la persona que
  figura en ellas no podría borrarse nunca.

#### Scenario: la actualización y la traza van juntas — ROJO
- GIVEN una reasignación válida
- WHEN se aplica
- THEN `derivado_a` y la fila de `public.reasignaciones` existen juntos

#### Scenario: si falla la traza, `derivado_a` no cambia — ROJO
- GIVEN una reasignación válida y un fallo forzado en el alta de la traza
- WHEN se aplica
- THEN `derivado_a` conserva su valor anterior y no queda traza; sacar el alta de la traza de la transacción pone esta prueba en rojo

#### Scenario: eliminar el ticket borra sus reasignaciones y libera a la persona (S-8) — ROJO
- GIVEN un ticket con una reasignación hacia «Beto», que no tiene otro uso
- WHEN se elimina el ticket
- THEN no queda ninguna fila suya en `public.reasignaciones` y «Beto» vuelve a poder borrarse

#### Scenario: `ticket_transitions` no cambia — ROJO
- GIVEN un ticket con N filas en `ticket_transitions`
- WHEN se reasigna
- THEN siguen siendo N y el inventario de escritores no cambia

#### Scenario: la entrada vigente del estado es la misma — ROJO
- GIVEN un ticket cuya entrada más reciente del estado actual es E
- WHEN se reasigna
- THEN la entrada que lee la alarma sigue siendo E

#### Scenario: `primerDerivado` no cambia — ROJO
- GIVEN un ticket cuyo `primerDerivado` es P, o ninguno
- WHEN se reasigna
- THEN `primerDerivado` devuelve P, o ninguno, tras reasignar

#### Scenario: el estado no se mueve — ROJO
- GIVEN un ticket en un estado S
- WHEN se reasigna
- THEN `status` sigue siendo S y ninguna otra columna cambia salvo `derivado_a`

#### Scenario: la reasignación sobrevive al sincronizador — ROJO
- GIVEN un ticket venido de Zoho, reasignado por la ruta, y luego un `upsertTicket` con un estado nuevo de Zoho
- WHEN termina la pasada
- THEN `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` es `false`

#### Scenario: la reasignación no fija `managed_by_app` — ROJO
- GIVEN un ticket con `managed_by_app` en `false`
- WHEN se reasigna
- THEN sigue en `false`; añadir `managed_by_app = true` al `UPDATE` pone la prueba del sincronizador en rojo

#### Scenario: el `de` de la traza es el valor vigente al aplicar — ROJO
- GIVEN un ticket a cargo de «Ana» reasignado a «Beto» y luego de «Beto» a «Carla»
- WHEN se leen las dos filas de traza
- THEN la primera tiene `de` Ana y `a` Beto, y la segunda `de` Beto y `a` Carla

### RQ-TC-52 · El cliente consume el predicado y el validador de `shared`, y no decide nada que el servidor no imponga (regla invariable 13)

El panel «Reasignar» del detalle del ticket (`apps/desk/src/components/`, con la lógica decidible en `apps/desk/src/lib/`
y su prueba) **SHALL** consumir **el mismo** predicado de permiso (`permissions` RQ-PM-27) y **el mismo** validador de motivo
de `packages/shared` que usa el servidor, y **MUST NOT** reescribirlos. Los `.tsx` quedan fuera de la red de pruebas por
decisión de Gerencia; la lógica decidible va en `lib/` y se prueba allí, sin `jsdom` ni `testing-library`. Cada decisión del
cliente nombra su contrapartida en el servidor (regla de mutación 3):

| Decisión del cliente | Qué la impone en el servidor |
|---|---|
| Muestra el panel sólo a quien puede reasignar | Guarda B (`403`) con el mismo predicado de `shared` (RQ-PM-27) |
| No ofrece a la persona a cargo actual | `422` de destino igual al actual (RQ-TC-50) |
| Ofrece sólo personas activas | `422` de destino inexistente o inactivo (RQ-TC-50) |
| No ofrece «Sin derivar» | `422` de destino obligatorio (RQ-TC-50) |
| Desactiva el botón con motivo vacío o de sólo espacios | `422` de motivo, con el mismo validador de `shared` (RQ-TC-50) |
| Recarga ticket e historial al terminar | No decide nada |

El cliente **SHALL** enseñar el mensaje de error que dice el servidor, no uno propio. Una decisión del cliente sin línea en
esta tabla sería la guarda, y el cierre de la tanda **SHALL** rellenar la columna con ruta y línea. Que el servidor y el
cliente usan la misma función lo fija el barrido de estados por áreas (`permissions` RQ-PM-27).

#### Scenario: un solo predicado, sin segunda copia — CARACTERIZACIÓN
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan las comprobaciones de quién puede reasignar
- THEN cliente y servidor pasan por el predicado de `shared` y ninguno lo reescribe

#### Scenario: un solo validador del motivo — CARACTERIZACIÓN
- GIVEN el validador del motivo de `shared`
- WHEN se evalúan el motivo vacío, el de sólo espacios y uno con texto
- THEN rechaza los dos primeros y acepta el tercero, y la ruta y la lógica de `lib/` llaman a esa misma función

#### Scenario: la lógica de `lib/` no ofrece la persona a cargo ni «Sin derivar» — ROJO
- GIVEN la lista de personas activas y un ticket a cargo de «Ana»
- WHEN la lógica de `lib/` construye las opciones del desplegable
- THEN «Ana» y «Sin derivar» no están entre ellas
