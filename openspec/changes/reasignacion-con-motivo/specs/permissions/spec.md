# Delta para permissions — quién reasigna, y una fuente más de «en uso» (F1B-05, `cierra: si`)

Numeración comprobada contra `openspec/specs/permissions/spec.md`: el último requisito vivo es RQ-PM-26; el nuevo es
RQ-PM-27. **Modifica** RQ-PM-11: una tercera fuente de «en uso» (figurar como origen o destino de una reasignación). Supuestos
S-2 y S-3 de `proposal.md`, reversibles. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

## MODIFIED Requirements

### RQ-PM-11 · Una persona con historial no se borra

`borrarUsuario` **SHALL** rechazar el borrado si la persona tiene referencias **por id**, lanzando
`UsuarioEnUso` con el recuento delante (`users.ts:118-123`, `:151-153`), que la ruta traduce a `409`.

Las referencias que cuentan **SHALL** ser tres, y **la segunda es la que importa**
(`users.ts:125-140`):

1. `tickets.derivado_a` (`users.ts:137`).
2. `ticket_transitions.values->>'derivado_a'` (`users.ts:138`) — el rastro de auditoría que enseña el
   panel de Historia. Borrar a alguien derivado alguna vez dejaría ese panel mostrando un UUID crudo
   para siempre, «y reescribir el `values` para evitarlo sería falsificar la auditoría»
   (`users.ts:128-131`).
3. `public.reasignaciones`, filas cuyo `de` **o** `a` es el id de la persona (`trazas` RQ-TZ-20; F1B-05). Es la misma
   razón que la segunda: el historial enseña origen y destino de cada reasignación traducidos por id, y borrar a
   quien figura en una dejaría el evento mostrando un id crudo para siempre. `reasignado_por` guarda el **nombre** y
   **MUST NOT** contarse.

Lo que guarda el **nombre** —quién ejecutó la transición, quién firmó la remisión— **MUST NOT**
contarse: es texto y sobrevive al borrado (`users.ts:133-134`).

Cuando sí se borra, el orden **SHALL** ser: sesiones, avisos, lecturas, y **la fila del usuario la
última** (`users.ts:154-157`). La razón: el esquema no tiene claves foráneas, así que un fallo a
medias con este orden deja a la persona existiendo con menos estado personal —molesto, nunca
corrupto—, y al revés dejaría justo los huérfanos que esto viene a evitar (`users.ts:142-150`).

`listPersonas` **SHALL** ser una consulta aparte de `listUsers` y **MUST NOT** ser un filtro sobre
ella: `listUsers` alimenta la consola de administración y `listPersonas` lo pide cualquiera que
ejecute una transición; reutilizarla «publicaría el modelo de autorización entero a todo el mundo por
comodidad» (`users.ts:63-81`). Sólo devuelve los activos (`:75`).

#### Scenario: quien figura como origen de una reasignación no se borra — ROJO
- GIVEN una persona sin ticket a su cargo ni transición que la derive, que es el `de` de una fila de `public.reasignaciones`
- WHEN se intenta borrarla
- THEN `borrarUsuario` lanza `UsuarioEnUso` y la ruta responde `409`

#### Scenario: quien figura como destino de una reasignación no se borra — ROJO
- GIVEN una persona sin otra referencia, que es el `a` de una fila de `public.reasignaciones`
- WHEN se intenta borrarla
- THEN `borrarUsuario` lanza `UsuarioEnUso` y la ruta responde `409`

#### Scenario: el recuento suma la tercera fuente — ROJO
- GIVEN una persona con un ticket a su cargo y una reasignación en la que figura
- WHEN se intenta borrarla
- THEN el recuento de `UsuarioEnUso` incluye las referencias de las dos fuentes

#### Scenario: haber reasignado por nombre no impide el borrado — ROJO
- GIVEN una persona cuyo nombre sólo figura en `reasignado_por`, sin ningún id en `de` ni `a`
- WHEN se la borra
- THEN el borrado se permite

## ADDED Requirements

### RQ-PM-27 · Reasignar pide el área de salida del estado o ser administrador

Reasignar la persona a cargo de un ticket (`tickets-core` RQ-TC-50) **SHALL** exigir **ser administrador** o tener **alguna**
de las áreas con transiciones de salida del estado actual del ticket: las que da `areasSiguientes(estado,
catalogoDelTicket(ticket))` de `packages/shared`, el mismo criterio con que ya se ejecutan las transiciones
(RQ-PM-01). El criterio **SHALL** vivir en un **predicado único de `packages/shared`**, junto a `SujetoDePermiso`, que
consumen el servidor (la guarda) y el cliente (la visibilidad del panel). **MUST NOT** reescribirse en ninguno de los dos
(regla invariable 13; molde H5).

- **Quién gana (decisión de Gerencia).** El maestro dice «la persona a cargo y el Director o el Coordinador del área»; la
  decisión `decision/e089-e220-visibilidad-y-traspaso` gana y aplaza esa restricción por propietario a F1C-05. Hasta
  entonces **MUST NOT** exigirse ser la persona a cargo ni ser Director o Coordinador. Es la corrección 30 del maestro.
- **Estado sin salida** (SUPUESTO S-2, reversible): en un estado sin transiciones de salida, o fuera del catálogo del
  ticket, la lista de áreas es vacía y **sólo reasigna un administrador**.
- **El cargo no interviene** (SUPUESTO S-3, reversible): no hay excepción por cargo nueva; un Director Técnico sin el área
  del estado no pasa por serlo, y RQ-PM-21 (el cargo sólo restringe) no se ve afectado.
- **Posición.** Quien no pasa recibe `403`, en el escalón **B** del orden total (existencia < estado y permiso < contenido
  < unicidad): detrás del `404` de existencia y delante de todo `422` de contenido.
- Si el sujeto no llega al predicado, se trata como «sin permiso» (falla cerrado). Una petición sin sesión no llega a
  ninguna guarda: `401`.
- **El cliente** consume el predicado para mostrar u ocultar el panel; esa decisión es comodidad legítima porque la
  imposición del servidor está probada (regla invariable 13, punto 3), con un barrido de estados por áreas que enfrenta
  predicado y ruta.

#### Scenario: un usuario del área del estado reasigna — ROJO
- GIVEN un ticket en un estado cuya área de salida es Servicio Técnico y un usuario con esa área, que no es administrador ni la persona a cargo
- WHEN reasigna
- THEN el permiso no lo detiene

#### Scenario: sin el área y sin ser administrador, 403 — ROJO
- GIVEN un usuario sin ninguna de las áreas de salida del estado y que no es administrador
- WHEN reasigna
- THEN responde `403` y no cambia nada

#### Scenario: el administrador pasa en cualquier estado — ROJO
- GIVEN un administrador sin las áreas del estado
- WHEN reasigna
- THEN el permiso no lo detiene

#### Scenario: estado sin salida, sólo el administrador (S-2) — ROJO
- GIVEN un ticket en un estado sin transiciones de salida y un usuario con cualquier área, no administrador
- WHEN reasigna
- THEN responde `403`; y un administrador, en el mismo estado, pasa

#### Scenario: el cargo no abre la puerta (S-3) — ROJO
- GIVEN un usuario con cargo Director Técnico y sin el área del estado, no administrador
- WHEN reasigna
- THEN responde `403`

#### Scenario: no hace falta ser la persona a cargo — ROJO
- GIVEN un ticket a cargo de «Ana» y un usuario del área del estado distinto de Ana
- WHEN reasigna
- THEN el permiso no lo detiene

#### Scenario: sujeto ausente falla cerrado — ROJO
- GIVEN una llamada al predicado de `shared` sin sujeto
- WHEN se evalúa
- THEN devuelve `false`

#### Scenario: barrido de estados por áreas contra la ruta — ROJO
- GIVEN todos los estados del catálogo y las tres áreas base
- WHEN se compara el resultado del predicado de `shared` con la respuesta de la ruta (`403` o paso del permiso) para cada pareja estado-área
- THEN coinciden en todas; y un predicado que devolviera siempre verdadero pone en rojo el barrido

#### Scenario: sin sesión, 401 — ROJO
- GIVEN una petición sin sesión
- WHEN llama a la ruta de reasignar
- THEN responde `401`, antes de cualquier guarda
