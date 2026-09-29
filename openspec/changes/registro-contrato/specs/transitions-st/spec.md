# Delta for `transitions-st`

Cambio `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`). `habilitar_servicio` (puerta 2) y las
dos aprobaciones que añaden una OV ganan la guarda de contrato vencido de `tickets-core` RQ-TC-25, en el
escalón C, como **última** guarda de contenido y antes de la unicidad. La tabla de guardas de
`executeTransition` (RQ-TS-06) gana esa fila. La sección §3.8 no es un requisito: ver «Fuera de alcance».

## MODIFIED Requirements

### Requirement: RQ-TS-14 · Una orden de venta, un ticket — en la puerta de la transición

`habilitar_servicio` es la segunda de las tres puertas por las que una OV entra en un ticket. Al
escribir `orden_venta`, la transición **SHALL** rechazar con `409` una orden ya asociada a otro
ticket, mirando **tres vías** —`salesorder_id`, `orden_venta` y la asociación vigente de
`public.ov_asociaciones` (`tickets-core` RQ-TC-17)—, excluyendo el propio ticket
(`ticketService.ts:148-152`, con `ticketConOrdenVenta` en `packages/zoho-sync/src/db/repo.ts:362-379`,
ampliado con la tercera vía).

Antes de esta comprobación de unicidad (escalón D), `habilitar_servicio` **SHALL** aplicar la misma
guarda de cuarentena que el alta (`tickets-core` RQ-TC-18, escalón C) cuando la OV recibida lleve
sufijo (`ticketService.ts:134`), y **a continuación** la guarda de contrato vencido (`tickets-core`
RQ-TC-25, escalón C): una subOV de un lote cuyo contrato venció se rechaza con `422` sin llegar a
comprobar unicidad. La guarda de vencido **SHALL** ser la **última** guarda de contenido de la
transición: los obligatorios y la fecha derivada (`:134`) y la persona derivada (`:138-142`) **SHALL**
seguir ganándole. La transición **SHALL** escribir la asociación (`tickets-core` RQ-TC-17) en la misma
transacción que escribe `orden_venta`.

La tercera puerta —el alta de remisión— está construida (`remisiones` RQ-RE-16,
`tercera-puerta-orden-venta`) y comparte la misma tercera vía, la misma cuarentena y la misma guarda de
vencido. Las otras dos puertas y la regla completa pertenecen a las specs `tickets-core` y `remisiones`.

(Previously: tres vías, cuarentena y escritura de asociación, sin guarda de contrato vencido; la última
guarda de contenido antes de la unicidad era la persona derivada.)

#### Scenario: `habilitar_servicio` sin OV en cuarentena sigue igual

- GIVEN una transición `habilitar_servicio` con una OV libre y sin sufijo
- WHEN se ejecuta
- THEN responde `200`, igual que hoy, y queda escrita la asociación

#### Scenario: OV en cuarentena bloquea `habilitar_servicio` antes de la unicidad

- GIVEN una OV con sufijo no canónico
- WHEN se ejecuta `habilitar_servicio` con esa OV
- THEN responde `422` de cuarentena, no `409` de unicidad

#### Scenario: Una subOV de contrato vencido bloquea `habilitar_servicio`

- GIVEN una subOV libre de un lote con contrato cuya fecha de fin es anterior a hoy
- WHEN se ejecuta `habilitar_servicio` con esa OV
- THEN responde `422` de contrato vencido y no se escribe `orden_venta` ni asociación

#### Scenario: El vencido gana al 409 de unicidad — posición fijada por prueba

- GIVEN una subOV de un lote vencido con asociación vigente a otro ticket
- WHEN se ejecuta `habilitar_servicio` con esa OV
- THEN responde `422` de vencido, no `409`; invertir el orden de las dos guardas debe poner esta prueba
  en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: La persona derivada inválida gana al vencido

- GIVEN una subOV de un lote vencido y una derivación a una persona dada de baja
- WHEN se ejecuta la transición
- THEN responde `422` «La persona a la que se deriva no existe o está dada de baja», no el de vencido

#### Scenario: Un lote sin contrato o con contrato aún no iniciado no bloquea

- GIVEN una subOV libre de un lote sin contrato, y otra de un lote cuyo contrato empieza mañana
- WHEN se ejecuta `habilitar_servicio` con cada una
- THEN ambas responden `200`, igual que hoy

### Requirement: RQ-TS-18 · `Aprobación` y `Aprobación y S. Repuestos` añaden una OV, no la sustituyen

Las transiciones `Aprobación` y `Aprobación y S. Repuestos` **SHALL** poder recibir una OV nueva y
**SHALL** crear una asociación adicional (`tickets-core` RQ-TC-17) sin tocar la OV de entrada —
`orden_venta`/`fecha_orden_venta` del ticket, protegidas por `ov_elegida_en_app_at` (`zoho-sync`
RQ-ZS-01, sin cambios en este delta)—. La fecha de orden de compra (OC) que acompañe a esta OV
**SHALL** guardarse en la propia asociación (S-5) y **MUST NOT** escribirse sobre `orden_venta` ni
`fecha_orden_venta`. La única columna de fecha de OC que el ticket sigue recibiendo es
`fecha_orden_compra_final` en `aprobacion`, por su campo propio y como hoy (comportamiento vigente, sin
cambios en este delta). Las dos transiciones **SHALL** aplicar las mismas guardas de cuarentena,
**contrato vencido** (`tickets-core` RQ-TC-25, escalón C, después de la cuarentena y antes de la
unicidad) y unicidad que `RQ-TS-14`: una OV adicional de un lote vencido se rechaza con `422`.

(Previously: las mismas guardas de cuarentena y unicidad que `RQ-TS-14`, sin la de contrato vencido.)

#### Scenario: Tras `Aprobación` con OV nueva, la de entrada no cambia

- GIVEN un ticket con su OV de entrada ya asociada
- WHEN se ejecuta `Aprobación` con una OV distinta y su fecha de OC
- THEN el ticket queda con dos asociaciones vigentes, y `orden_venta`/`fecha_orden_venta` del ticket
  no cambian

#### Scenario: La fecha de OC vive en la asociación nueva

- GIVEN la ejecución del escenario anterior
- WHEN se consulta la asociación creada por `Aprobación`
- THEN tiene la fecha de OC; en `aprobacion` el ticket conserva además `fecha_orden_compra_final`
  (comportamiento vigente), y `orden_venta`/`fecha_orden_venta` no la reciben

#### Scenario: Una OV adicional de contrato vencido se rechaza en `Aprobación`

- GIVEN un ticket en `Notificación cliente` y una subOV libre de un lote con contrato vencido
- WHEN se ejecuta `Aprobación` con esa OV como adicional
- THEN responde `422` de contrato vencido y no se crea asociación

#### Scenario: El vencido gana al 409 también en `Aprobación y S. Repuestos`

- GIVEN una subOV de un lote vencido ya asociada a otro ticket
- WHEN se ejecuta `Aprobación y S. Repuestos` con esa OV como adicional
- THEN responde `422` de vencido, no `409`

### Requirement: RQ-TS-06 · Orden de las guardas, y qué contesta cada una

`POST /api/tickets/:id/transition` (`routes/tickets.ts:192-194`) **SHALL** exigir sesión
(`routes/tickets.ts:35`) y **SHALL** aplicar las guardas de `executeTransition`
(`services/ticketService.ts:114-223`) **en este orden**, que es el que exige el orden total de
precedencia (§3.8): existencia (A) y estado/permiso (B) antes que contenido (C), y éste antes que
unicidad (D).

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | La transición existe | A | `400 'Transición desconocida'` | `ticketService.ts:123` |
| 2 | El ticket existe | A | `404 'Ticket no encontrado'` | `:125` |
| 3 | La transición pertenece al flujo aplicable del ticket | B | `409`, mensaje de flujo | `transitions-equipo-nuevo` RQ-EN-05 |
| 4 | El estado actual está en el `from` de la transición | B | `409 '…no aplica desde el estado…'` | `:126-128` |
| 5 | El área del usuario cubre el área de la transición | B | `403 '…no tiene permiso para esta transición…'` | `:129-131` |
| 6 | Los campos obligatorios están presentes | C | `422 { errors: plan.errors }` | `:134` |
| 7 | Una fecha derivada tecleada sin fuente no es una fecha real | C | `422 { errors }` | `:134` (fijada por el diseño; ver `RQ-TS-08`) |
| 8 | La persona a la que se deriva existe y está activa | C | `422 'La persona a la que se deriva no existe o está dada de baja'` | `:138-142` |
| 9 | La subOV aportada no es de un lote con contrato vencido | C | `422`, motivo de contrato vencido | línea nueva, entre `:142` y `:148` (fijada por el diseño; `tickets-core` RQ-TC-25) |
| 10 | La orden de venta no está ya asociada a otro ticket | D | `409 '…ya está asociada al ticket #…'` | `:148-152` |

(Previously: nueve filas, sin la guarda de contrato vencido. La 9 antigua (OV ya asociada) pasa a ser la
10. La cuarentena de OV va dentro de la fila 6, en la misma sentencia, `:134`.)

(Previously, antes de esa: ocho filas, sin la guarda 3 de flujo. La añade `blueprint-equipo-nuevo` (F1B-06) al
entrar en juego un segundo catálogo (`transitions-equipo-nuevo`): hasta entonces todo ticket tenía un
único flujo posible y la comprobación no hacía falta. Las guardas 3-7 antiguas pasan a ser 4-8, y la 8
antigua pasa a ser 9.)

(Previously, antes de esa: siete filas, sin la 6 (fecha derivada); evidencias `:117`, `:119`,
`:120-122`, `:123-125`, `:128`, `:140-144` y `:132-136` — caducas contra `4976787`, reancladas por
`fechas-derivadas-servidor`. La guarda 6 antigua (persona) pasó a fila 7; la 7 antigua (OV) pasó a
fila 8.)

El orden **MUST** tenerse en cuenta al probar: una matriz de permisos montada sobre un estado de
origen inválido comprueba el `409` de la guarda 4 y cree comprobar el `403` de la 5
(`permisos.test.ts:29-33`).

> **Given** un ticket en estado `En Proceso`
> **When** se ejecuta `aprobacion`, cuyo único `from` es `Notificación cliente`
> **Then** el servidor responde `409` y no escribe nada.

#### Scenario: La fecha derivada inválida sin fuente responde 422, detrás de los obligatorios
- GIVEN una transición con sus campos obligatorios completos, sin fuente disponible para una de las
  tres fechas derivadas, y un valor tecleado que no es una fecha real (p. ej. `2026-02-30`)
- WHEN se ejecuta la transición
- THEN el servidor responde `422 { errors }`, con el error de esa fecha

#### Scenario: La guarda de flujo (3) gana a la de estado (4) — posición fijada por prueba
- GIVEN un ticket de servicio en `Rev./Diagnostico` (estado ausente del catálogo de `Equipo nuevo`)
- WHEN se ejecuta `Ingreso equipo nuevo` (catálogo `transitions-equipo-nuevo`, `from: [Ingresado]`)
- THEN responde `409` con el mensaje de flujo, no con «no aplica desde el estado» — invertir el orden
  de las guardas 3 y 4 debe poner esta prueba en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: El vencido (9) queda detrás de los obligatorios (6) y delante de la unicidad (10)
- GIVEN una transición con una subOV de un lote vencido que además falta un campo obligatorio, y otra
  con la subOV de un lote vencido ya asociada a otro ticket
- WHEN se ejecutan las dos
- THEN la primera responde el `422` de obligatorios y la segunda el `422` de vencido, no `409`

## Fuera de alcance de este delta

- **§3.8 de esta spec** (tablas de `:832-837` y `:857-860`, orden del escalón C y del escalón D por
  puerta) es prosa de sección, **no un requisito**: ningún `RQ-TS-*` la posee, y este delta no la
  restablece. Lo que enumera guarda a guarda por puerta es propiedad de `RQ-TS-06` (arriba) y de
  `RQ-TC-08`/`RQ-RE-16`. Añadir el contrato vencido a la fila C y a la tabla de puertas de §3.8 es un
  arreglo documental del archivo, con barrido de citas (regla de mutación 4), no un cambio de requisito.
- IV-12 (orden del alta de remisión): no se reordena `remision.ts`.
- Bloquear al técnico la edición de prioridad (`transitions.ts:193`, `:195`): F1B-07.
