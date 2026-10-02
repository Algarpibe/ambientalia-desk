# Delta para `transitions-soporte-remoto` — `Pendiente` pasa a estado sólo de soporte remoto (F1C-09)

## ADDED Requirements

### Requirement: RQ-SR-12 · `Pendiente` es estado sólo de soporte remoto

La lista de estados sólo de soporte remoto (`ESTADOS_SOLO_SOPORTE_REMOTO`) **SHALL** ser exactamente
`Solicitud Soporte` y `Pendiente`. `Pendiente` **SHALL** seguir en `ESTADOS` y en `CLASIFICACION_EN_ESPERA`
con clase `sin_clasificar`, y **SHALL** quedar excluido de `ESTADOS_SERVICIO`. El bucle
`En Proceso ↔ Pendiente` de `RQ-SR-01` **SHALL** funcionar sin cambio, y los cuatro estados del catálogo de
`Soporte remoto` **SHALL** seguir siendo `Solicitud Soporte`, `En Proceso`, `Pendiente` y `Finalizado`. La
prueba de estados sólo de soporte remoto (`invariantesGrafo.test.ts`) **SHALL** fijar la lista de dos.

#### Scenario: la lista sólo-SR tiene exactamente dos estados
- GIVEN `ESTADOS_SOLO_SOPORTE_REMOTO` tras el cambio
- WHEN se lee
- THEN es exactamente `['Solicitud Soporte', 'Pendiente']` (en el orden que fija el registro)

#### Scenario: `Pendiente` no está en el catálogo de servicio
- GIVEN `ESTADOS_SERVICIO` y `TRANSITIONS`
- WHEN se busca `Pendiente` como `from`, `to` o miembro
- THEN no aparece, y el catálogo de `Soporte remoto` sigue cubriendo sus cuatro estados

#### Scenario: un `Soporte remoto` heredado en `Pendiente` sigue en su flujo
- GIVEN un ticket `Soporte remoto` en `Pendiente`
- WHEN se listan sus transiciones ejecutables
- THEN es exactamente `Continuación soporte` y el flujo aplicable es `soporte-remoto`

## MODIFIED Requirements

### Requirement: RQ-SR-05 · Un ticket `Soporte remoto` ve y ejecuta sólo las cuatro del catálogo

Un ticket con `clasificaciones = 'Soporte remoto'` cuyo estado actual pertenece a los cuatro estados del
catálogo **SHALL** tener flujo aplicable `soporte-remoto` (regla completa en `transitions-equipo-nuevo`
RQ-EN-04). Sólo entonces `executeTransition` **SHALL** aceptar sus cuatro transiciones, y la guarda 3
(`ticketService.ts:231-234`, `transitions-equipo-nuevo` RQ-EN-05, escalón B) **SHALL** responder `409` con
un mensaje que nombre el flujo «soporte remoto» para cualquier transición de otro catálogo, con
independencia del estado. No requiere código nuevo en panel, avisos ni SLA: son genéricos por flujo.

- Un `Soporte remoto` heredado cuyo estado no pertenece al catálogo (p. ej. `Rev./Diagnostico`, `Ticket
  creado`) **MUST NOT** quedar varado: sigue en flujo `servicio` sin tocar sus datos (S-6).
- `Ejecutar` **SHALL** llevar a `Finalizado`, sin salida.

#### Scenario: Solicitud Soporte sólo ofrece Asignación
- GIVEN un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN se listan las transiciones ejecutables por Servicio Técnico
- THEN es exactamente `Asignación`

#### Scenario: El bucle Pendiente ↔ En Proceso funciona
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN ejecuta `Soporte pendiente` y luego `Continuación soporte`
- THEN pasa `Pendiente` y vuelve a `En Proceso`, con `200` las dos veces

#### Scenario: Ejecutar finaliza
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN ejecuta `Ejecutar`
- THEN pasa a `Finalizado` y ya no ofrece ninguna transición

#### Scenario: Una transición de servicio sobre soporte remoto da 409 con el flujo
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN se ejecuta `diagnostico_complementario` (servicio, mismo estado origen, `from: ['En Proceso']`)
- THEN responde `409` con el mensaje de flujo que nombra «soporte remoto»
(Previously: el ejemplo era `marcar_pendiente`, retirada por F1C-09; `diagnostico_complementario` sale ahora
del mismo estado origen, así que el escenario conserva su sentido.)

#### Scenario: La guarda de flujo gana a la de estado (posición, mutación 1)
- GIVEN un ticket de servicio en `Rev./Diagnostico` (estado ausente del catálogo de soporte remoto)
- WHEN se ejecuta `Asignación` (catálogo soporte remoto, `from: [Solicitud Soporte]`)
- THEN responde `409` con el mensaje de flujo, no con «no aplica desde el estado»; invertir el orden de
  las guardas 3 y 4 pone esta prueba en rojo

#### Scenario: Soporte remoto heredado en estado sólo de servicio no queda varado
- GIVEN un ticket `Soporte remoto` en `Rev./Diagnostico`
- WHEN se listan sus transiciones ejecutables
- THEN son las de `TRANSITIONS` desde ese estado

### Requirement: RQ-SR-06 · Los ids del catálogo son únicos entre los tres catálogos (S-8)

Los cuatro ids **SHALL** ser distintos entre sí y **MUST NOT** coincidir con ningún id de `TRANSITIONS`
ni de `TRANSITIONS_EQUIPO_NUEVO`. En particular, `Soporte pendiente` **MUST NOT** reutilizar el id
`marcar_pendiente`, aunque esa id esté retirada de `TRANSITIONS` desde F1C-09: las filas históricas de
`ticket_transitions` la conservan y buscar una transición por id **SHALL** dar un único catálogo o ninguno.
(Previously: `marcar_pendiente` era una transición vigente de `TRANSITIONS` (`transitions.ts:206`).)

#### Scenario: Ninguna colisión de ids
- GIVEN los tres catálogos
- WHEN se reúnen todos sus ids
- THEN no hay ningún duplicado

#### Scenario: `marcar_pendiente` no pertenece a ningún catálogo
- GIVEN el id `marcar_pendiente`
- WHEN se resuelve a su catálogo
- THEN no se resuelve a ninguno (retirada), y el id de `Soporte pendiente` es distinto de ella

#### Scenario: `diagnostico_complementario` sigue siendo de servicio
- GIVEN el id `diagnostico_complementario`
- WHEN se resuelve a su catálogo
- THEN es `TRANSITIONS` (servicio), no el de soporte remoto

## REMOVED Requirements

Ninguno.
