# Delta for `tickets-core`

Cambio `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`). Introduce el modelo `1 ticket : N
OV` en tabla propia (`public.ov_asociaciones`, supuesto S-1), su índice único parcial, la cuarentena de
subOV (S-2, lectura literal de `decision/subov-lote-convencion`), la liberación con traza y la lista de OV en la
ficha del ticket. La puerta 1 del alta gana la tercera vía y la guarda de cuarentena.

## MODIFIED Requirements

### Requirement: RQ-TC-08 · Una orden de venta, un ticket — en la puerta del alta

Ésta es la **primera** de las tres puertas. El alta **SHALL** rechazar con `409` una orden ya asociada
a otro ticket, mirando ahora **tres vías** —`salesorder_id`, `orden_venta` y la asociación vigente de
`public.ov_asociaciones` (`RQ-TC-17`)— (`ticketService.ts:96-100`, con `ticketConOrdenVenta` en
`repo.ts:362-379`, ampliado con la tercera vía).

- La razón **SHALL** quedar escrita: el buscador ya sólo ofrece las libres, «pero una lista no es una
  frontera» — basta mandar el id a mano o llegar con la lista cacheada para duplicar la orden
  (`ticketService.ts:92-95`).
- La **fecha** de la orden **SHALL** viajar con su número y guardarse en el alta
  (`ticketService.ts:32-36`, `:43`; `repo.ts:391-397`): sin ella, `habilitar_servicio` pide una fecha
  que nadie puede rellenar.
- Antes de esta comprobación de unicidad (escalón D), el alta **SHALL** aplicar la guarda de
  cuarentena de `RQ-TC-18` (escalón C) cuando la OV recibida lleve sufijo: una subOV en cuarentena se
  rechaza con `422` sin llegar a comprobar unicidad.
- El alta **SHALL** escribir la asociación (`RQ-TC-17`) en la misma transacción que crea el ticket.

La segunda puerta es de `transitions-st` RQ-TS-14; la tercera es de `remisiones` RQ-RE-16. Las tres
ganan aquí la vía de la asociación vigente. Las pruebas de posición existentes —
`ordenVentaUnTicket.test.ts` y `apps/desk/server/remisiones.test.ts:988`— **MUST NOT** cambiar sus
aserciones actuales.

(Previously: dos vías —`salesorder_id` y `orden_venta`—, sin cuarentena ni escritura de asociación.)

#### Scenario: El alta sin cambios sigue igual

- GIVEN un alta sin ninguna OV en cuarentena y sin asociación previa
- WHEN se crea el ticket
- THEN responde `201`, igual que hoy

#### Scenario: La asociación vigente por la tercera vía bloquea el alta

- GIVEN una OV con asociación vigente a otro ticket, sin coincidir por `salesorder_id` ni por
  `orden_venta` en columna
- WHEN se crea un ticket con esa OV
- THEN responde `409`, igual que si coincidiera por columna

#### Scenario: Las pruebas de posición existentes no cambian

- GIVEN `ordenVentaUnTicket.test.ts` y `remisiones.test.ts:988` tal como existen hoy
- WHEN se ejecutan tras este cambio
- THEN pasan sin modificar sus aserciones

## ADDED Requirements

### Requirement: RQ-TC-17 · Modelo de asociación ticket↔OV: tabla propia, 1:N, nunca se borra

El sistema **SHALL** persistir la relación ticket↔orden de venta en una tabla propia del esquema
`public` (`public.ov_asociaciones`, supuesto S-1), con una fila por asociación: ticket, OV
(`salesorder_id` y número congelado), la vía que la creó, fecha, hora y persona, y —al liberarse—
fecha, hora, persona y motivo de liberación. El sistema **MUST NOT** ejecutar `DELETE` sobre esta
tabla en ningún flujo: liberar es una actualización de la misma fila (`RQ-TC-19`), nunca un borrado.

Una OV **SHALL** tener como máximo una asociación **vigente** (no liberada) a la vez, impuesto por un
índice único parcial de base de datos sobre las filas no liberadas. La condición **SHALL** aplicarse
por igual a una OV simple y a una subOV (`RQ-TC-18`): cada subOV **SHALL** poder asociarse a
exactamente un ticket vigente.

Los tres escritores actuales de `orden_venta` —el alta (`RQ-TC-08`), `habilitar_servicio`
(`transitions-st` RQ-TS-14) y la remisión de entrada (`remisiones` RQ-RE-16)— **SHALL** escribir
también la fila de asociación, en la misma transacción que su escritura de columna.

#### Scenario: Escribir la OV crea la asociación en la misma transacción

- GIVEN un alta de ticket con orden de venta libre
- WHEN se crea el ticket
- THEN existe una fila de `ov_asociaciones` vigente para ese ticket y esa OV, con persona y fecha de
  la creación

#### Scenario: Segunda asociación vigente sobre la misma OV es rechazada por la base

- GIVEN una OV ya asociada vigente a un ticket
- WHEN otra escritura intenta insertar una segunda fila vigente para la misma OV
- THEN el índice único parcial rechaza la segunda fila, y la aplicación traduce el conflicto a la
  misma respuesta que hoy dan las guardas de columna

### Requirement: RQ-TC-18 · Clasificador de subOV y cuarentena (S-2)

`packages/shared` **SHALL** exportar un clasificador puro que decida si un número de OV es una subOV
en cuarentena: **cuarentena** es exactamente un número con sufijo que **no** casa
`^OV-(\d{4})-(\d{3,4})-(\d{2})$` (`decision/subov-lote-convencion`, 2026-09-10,
`Decisiones_Gerencia_2026-09-10.md:459-461`). Una OV simple `OV-AAAA-NNN` y una `OVI-` **MUST NOT**
clasificarse en cuarentena.

Una OV en cuarentena **MUST NOT** poder asociarse a ningún ticket por ninguna de las tres puertas: el
alta la rechaza con `422` en el **escalón C** —contenido—, evaluado **antes** de la comprobación de
unicidad del **escalón D** (`RQ-TC-08`; `transitions-st` §3.8 / F1B-10). Una OV en cuarentena **SHALL**
quedar fuera del desplegable (`soloLibres`, `zoho-sync` RQ-ZS-14) y del saldo por lote, y **SHALL**
listarse aparte, visible para Comercial.

#### Scenario: subOV con sufijo no canónico es rechazada antes de comprobar unicidad

- GIVEN una OV con número `OV-2026-001-X9` (sufijo no canónico) sin asociación vigente
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de cuarentena (escalón C), no el `409` de unicidad (escalón D)

#### Scenario: OV simple y OVI no entran en cuarentena

- GIVEN los números `OV-2026-001` y `OVI-2026-001`
- WHEN se evalúan con el clasificador
- THEN ninguno se clasifica en cuarentena

### Requirement: RQ-TC-19 · Liberar una asociación: sólo Comercial, con motivo, sin borrar

El sistema **SHALL** exponer una acción de liberación manual (el diseño fija método y URL exactos) que
**MUST** exigir rol Comercial en el servidor y **SHALL** exigir un motivo no vacío. Liberar **SHALL**
poner fecha, hora, persona y motivo de liberación sobre la fila existente y **MUST NOT** borrarla
(`RQ-TC-17`). Tras liberarse, la OV **SHALL** quedar libre para las tres puertas y para el desplegable,
y **SHALL** poder reasociarse a un ticket distinto.

Esta acción **SHALL** ser transitoria: se retira el día en que exista una vía C2 de anulación formal
(`Decisiones_Gerencia_2026-09-10.md:484-486`).

#### Scenario: Liberar conserva la fila con su motivo

- GIVEN una asociación vigente
- WHEN Comercial la libera con un motivo
- THEN la fila sigue existiendo, con fecha, hora, persona y motivo de liberación, y deja de contar
  como vigente

#### Scenario: Sin rol Comercial, la liberación se rechaza

- GIVEN un usuario sin rol Comercial
- WHEN intenta liberar una asociación
- THEN responde `403` y la fila no cambia

#### Scenario: Tras liberar, la OV es reasociable

- GIVEN una OV recién liberada
- WHEN se crea un ticket nuevo con esa misma OV
- THEN la asociación se crea sin que el índice único parcial la rechace, y ninguna de las tres vías de
  las puertas la encuentra ya en el ticket que la liberó (S-7: liberar limpia sus columnas)

### Requirement: RQ-TC-20 · La ficha del ticket lista sus OV, vigentes y liberadas

La lectura del ticket **SHALL** exponer la lista completa de sus asociaciones —vigentes y liberadas—,
cada una con su OV, la vía que la creó, la fecha y, si aplica, la fecha de OC (`transitions-st`
RQ-TS-18). `cf_n_ticket` **SHALL** seguir siendo sólo una sugerencia de precarga y **MUST NOT**
sustituir esta lista como fuente de verdad.

#### Scenario: La ficha devuelve las dos listas

- GIVEN un ticket con una asociación vigente y otra liberada
- WHEN se consulta su detalle
- THEN la respuesta incluye las dos, distinguibles por su estado de liberación

## Fuera de alcance de este delta

- Registro de contrato, vigencia y prioridad → cambio 3 de F1B-11.
- Relleno retroactivo de asociaciones para tickets existentes: dato de persona pendiente.
- IV-8 (guarda de titularidad con mantenedor): no se añade ninguna guarda cliente↔OV nueva aquí.
- Subdividir desde Desk una OV de lote llegada sin subdividir (maestro `R08.2.md:2177`).
- `cf_n_ticket` sigue siendo sólo sugerencia; no se convierte en fuente de verdad.
