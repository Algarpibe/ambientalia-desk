# Delta para derivacion-avisos — «Solicitud repuestos» deriva al Director Técnico y «Entrega de Repuestos» devuelve al técnico (F1C-11)

## MODIFIED Requirements

### RQ-AV-02 · Cinco etapas proponen destinatario; las otras 26 heredan

`DERIVACION_POR_DEFECTO` **SHALL** llevar exactamente **cinco** entradas
(`packages/shared/src/transitions.ts:274-282`), y proponer **SHALL** ser la excepción: en una lista de cinco
entradas se ve de un vistazo cuáles pisan lo heredado.
(Previously: «tres entradas» y «las otras 28 heredan»; con 31 transiciones, 31 − 3 = 28. `solicitud_repuestos` y
`entrega_repuestos` entran por `decision/cargo-encargado-de-inventario`.)

| Etapa | Propone | Por qué |
|---|---|---|
| `escalado_a_revision` | Cargo · `Director Técnico` | Escalar una revisión es subirla al inmediato superior |
| `escalado_a_comercial` | Cargo · `Coordinador Comercial` | Sale de Servicio Técnico y pasa a Comercial |
| `aprobacion` | `primerDerivado` | El cliente aprobó y el trabajo vuelve al taller |
| `solicitud_repuestos` | Cargo · `Director Técnico` | El Director Técnico es el encargado del inventario: entrega las piezas |
| `entrega_repuestos` | `primerDerivado` | Entregadas las piezas, el ticket vuelve al técnico que lo tenía a cargo |

**Recuento por comando:** `grep -cE "^  \{ id: '" transitions.ts` da **31** transiciones y el bloque declara
**5** entradas, así que las que heredan son **26** (31 − 5). El maestro vigente R08.4 dice 31 transiciones
(`R08.4.md:1250-1254`).

- Las que proponen un cargo (`escalado_a_revision`, `escalado_a_comercial` y `solicitud_repuestos`) **SHALL**
  nombrar un **cargo y no una persona**: un id ataría el Blueprint a que esa persona siga en la empresa
  (`transitions.ts:44-46`; maestro M1.9.2).
- El cargo nombrado **SHALL** pertenecer a la lista cerrada `CARGOS`, porque el tipo de la propuesta lo exige
  (`transitions.ts:51-53`).
- La propuesta **SHALL** ser sólo eso: una casilla que abre prellenada y que quien ejecuta puede cambiar. El
  servidor **MUST NOT** imponer quién recibe el ticket en estas dos etapas; sólo valida que la persona enviada
  exista y esté activa (`apps/desk/server/services/ticketService.ts:138-142`). El cliente rellena la casilla
  como comodidad, no como guarda (regla invariable 13, punto 2).
- Con **varios** titulares activos del cargo, la propuesta **SHALL** ser la primera persona de la lista, que llega
  ordenada por nombre (`apps/desk/src/lib/personas.ts:76-79`).
- Sin titular activo del cargo, o con un `primerDerivado` nulo o dado de baja, la propuesta **SHALL** caer a lo
  heredado (`apps/desk/src/lib/personas.ts:73`, `:79`): derivar no puede frenar un ticket.
- `destinatarioDelEscalado` (`packages/shared/src/sla.ts:92-109`) **SHALL** seguir leyendo cualquier propuesta de
  tipo `cargo` del grafo, de modo que `En Proceso` devuelve `Director Técnico` por la vía `solicitud_repuestos`
  y `Solicitado` devuelve `ningun_cargo`. Ningún estado con alarma (`ALARMAS_SLA`) es `En Proceso` ni
  `Solicitado`, así que no cambia a quién se avisa.

#### Scenario: cinco proponen, 26 heredan
- GIVEN `TRANSITIONS` y `DERIVACION_POR_DEFECTO`
- WHEN se cuentan las ids con entrada propia y las que no
- THEN hay 5 con propuesta y 26 sin ella, sobre 31 transiciones

#### Scenario: el mapa entero queda fijado
- GIVEN `DERIVACION_POR_DEFECTO`
- WHEN se compara con el mapa esperado
- THEN es exactamente `escalado_a_revision` → cargo `Director Técnico`, `escalado_a_comercial` → cargo `Coordinador Comercial`, `aprobacion` → `primerDerivado`, `solicitud_repuestos` → cargo `Director Técnico` y `entrega_repuestos` → `primerDerivado`

#### Scenario: «Solicitud repuestos» propone al titular activo del cargo Director Técnico
- GIVEN la propuesta por defecto de `solicitud_repuestos` en `TRANSITIONS`, y una lista de personas activas donde una tiene `cargo` «director tecnico» (sin tilde ni mayúsculas) y otra es técnico
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el id de la persona con ese cargo, no el derivado heredado

#### Scenario: «Solicitud repuestos» cae al heredado si no hay titular activo
- GIVEN la propuesta por defecto de `solicitud_repuestos`, un ticket derivado a un técnico, y una lista de personas activas sin nadie con cargo Director Técnico (porque nadie lo tiene o porque quien lo tiene está dado de baja)
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el derivado heredado y la etapa sigue siendo ejecutable

#### Scenario: con dos Directores Técnicos activos gana el primero de la lista
- GIVEN dos personas activas con cargo Director Técnico, la lista ordenada por nombre
- WHEN `derivacionInicial` calcula la propuesta de `solicitud_repuestos`
- THEN devuelve la primera de ellas, siempre la misma

#### Scenario: «Entrega de Repuestos» devuelve el ticket al primer derivado
- GIVEN la propuesta por defecto de `entrega_repuestos`, un ticket cuyo primer derivado es un técnico activo y cuyo derivado vigente es el Director Técnico
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el técnico que tomó el ticket primero, no el Director Técnico

#### Scenario: «Entrega de Repuestos» cae al heredado si el primer derivado no sirve
- GIVEN la propuesta por defecto de `entrega_repuestos` y un primer derivado nulo o dado de baja
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el derivado heredado

#### Scenario: el servidor no impone el destinatario de «Solicitud repuestos»
- GIVEN un ticket en `En Proceso` y un usuario de Servicio Técnico que ejecuta `solicitud_repuestos`
- WHEN envía `derivado_a` con una persona activa que no es el Director Técnico
- THEN el servidor responde `200` y el ticket queda derivado a esa persona

#### Scenario: el servidor sigue rechazando una persona inexistente o dada de baja
- GIVEN un ticket en `En Proceso`
- WHEN se ejecuta `solicitud_repuestos` con `derivado_a` de una persona dada de baja
- THEN el servidor responde `422` y no escribe la derivación

#### Scenario: `En Proceso` lee `Director Técnico` por la vía `solicitud_repuestos`, y `Solicitado` no tiene cargo
- GIVEN `TRANSITIONS` con las cinco propuestas
- WHEN se llama a `destinatarioDelEscalado` para `En Proceso` y para `Solicitado`
- THEN `En Proceso` devuelve `{ hay: true, cargo: 'Director Técnico', via: ['solicitud_repuestos'] }` y `Solicitado` devuelve `{ hay: false, motivo: 'ningun_cargo' }`
- AND ningún estado de `ALARMAS_SLA` es `En Proceso` ni `Solicitado`

#### Scenario: las tres retiradas no tenían propuesta de derivación
- GIVEN `DERIVACION_POR_DEFECTO`
- WHEN se buscan `marcar_pendiente`, `servicio_externo_pendiente` y `servicio_externo_notificado`
- THEN ninguna figura, y las cinco entradas son `escalado_a_revision`, `escalado_a_comercial`, `aprobacion`, `solicitud_repuestos` y `entrega_repuestos`
(Previously: «las tres entradas siguen siendo `escalado_a_revision`, `escalado_a_comercial` y `aprobacion`».)

#### Scenario: el comentario de recuento del código dice la cifra nueva
- GIVEN el bloque de comentario sobre la herencia en `transitions.ts`
- WHEN se lee su recuento de transiciones que heredan y su mención de las entradas de la lista
- THEN dice 26 y «cinco entradas», coherente con las 31 transiciones y las cinco propuestas, y ningún comentario del fichero conserva la cuenta antigua

#### Scenario: quitar una entrada nueva pone el mapa en rojo
- GIVEN `DERIVACION_POR_DEFECTO` sin `solicitud_repuestos`, o con `entrega_repuestos` cambiada a tipo `cargo`
- WHEN corre la suite
- THEN falla la prueba del mapa entero
