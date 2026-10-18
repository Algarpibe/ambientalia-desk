# Delta para transitions-soporte-remoto

## MODIFIED Requirements

### Requirement: RQ-SR-01 · Catálogo separado de cinco transiciones sobre cinco estados

El sistema **SHALL** declarar el catálogo de `Soporte remoto` como registro **separado** de `TRANSITIONS` y
de `TRANSITIONS_EQUIPO_NUEVO`, con la misma forma de `Transition` (`id`, `name`, `from: string[]`, `to`,
`area`, `fields`, `packages/shared/src/transitions.ts:55-62`) y exactamente estas cinco entradas
(`R08.2.md:1556-1567`):

| Transición | Origen → destino |
|---|---|
| Asignación | Solicitud Soporte → En Proceso |
| Ejecutar | En Proceso → Finalizado |
| Soporte pendiente | En Proceso → Pendiente |
| Continuación soporte | Pendiente → En Proceso |
| Anulación | En Proceso, Pendiente → Anulado |

- El catálogo **SHALL** cubrir exactamente los cuatro estados `Solicitud Soporte`, `En Proceso`,
  `Pendiente`, `Finalizado` y `Anulado` (RQ-TS-40, F1C-01).
- **Sin anulación desde `Solicitud Soporte` (S-5):** el catálogo **MUST NOT** declarar ninguna salida desde
  `Solicitud Soporte` distinta de `Asignación`: lo que se cancela al nacer se borra, no se anula. `Anulación`
  (`anulacion_soporte`) sale de `En Proceso` y de `Pendiente` **[SUPUESTO S-3 de F1C-01]**, es de área `Comercial`
  (`decision/f1c01-area-anulado`) y declara `comment()`, el motivo obligatorio y su detalle (RQ-TS-40).
- Las cuatro de trabajo **SHALL** declarar sólo `comment()` y la casilla de derivación `derivacion()` (S-3), sin
  motivo obligatorio ni campo de fecha; el bucle `En Proceso ↔ Pendiente` es el que mide la espera del
  cliente (`R08.2.md:1568`) y **SHALL** tener cero campos de fecha reentrantes.
- Regla 13: el servidor impone origen, flujo y área con este mismo catálogo compartido; el cliente lo
  consume.

(Previously, hasta F1C-01: cuatro transiciones sobre cuatro estados, y ninguna anulación.)

#### Scenario: Las cinco transiciones existen con sus pares exactos
- GIVEN el catálogo de `Soporte remoto`
- WHEN se listan sus entradas con `from` y `to`
- THEN son exactamente los cinco pares de la tabla, y ninguna más

#### Scenario: Ninguna entrada declara campos de fecha ni motivo obligatorio
- GIVEN las cuatro entradas de trabajo del catálogo
- WHEN se leen sus `fields`
- THEN sólo hay comentario y casilla de derivación, y el ciclo `En Proceso → Pendiente → En Proceso` tiene
  cero campos de fecha reentrantes

#### Scenario: No hay salida de anulación desde Solicitud Soporte (S-5, mutación)
- GIVEN el catálogo en verde
- WHEN se añade una entrada cuyo `from` incluye `Solicitud Soporte` y cuyo `to` no es `En Proceso`
- THEN la prueba que fija las salidas de `Solicitud Soporte` en exactamente `Asignación` falla

#### Scenario: Comercial anula un soporte remoto desde Pendiente — ROJO
- GIVEN un ticket `Soporte remoto` en `Pendiente`
- WHEN un usuario de Comercial ejecuta `Anulación` con un motivo de la lista
- THEN responde `200` y el ticket pasa a `Anulado`, cerrado

### Requirement: RQ-SR-02 · Área por equivalencia con Servicio Técnico

Ninguna fuente accesible da el área de las cuatro transiciones (`ÁREA_RESPONSABLE` vacía en las cuatro
filas de la hoja, §0; M1.5 tampoco). El sistema **SHALL** declarar las cuatro de trabajo como área `Servicio Técnico`,
por equivalencia con el grafo de servicio y con `transitions-equipo-nuevo` RQ-EN-02 — supuesto reversible
S-1, un dato por transición. *Hipótesis*, no cerrada: `Asignación` podría ser de Comercial, que es quien
recibe la solicitud. Se confirma en P.3 (`docs/sdd/ENTRADA.md`). `Anulación` es de área `Comercial` por decisión
(`decision/f1c01-area-anulado`), no por equivalencia.

(Previously, hasta F1C-01: el catálogo eran sólo las cuatro.)

#### Scenario: Las cuatro exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN intenta ejecutar `Asignación`
- THEN el servidor responde `403`; y lo mismo con las otras tres desde su estado de origen

#### Scenario: Un usuario de Servicio Técnico las ejecuta
- GIVEN un usuario de `Servicio Técnico` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN ejecuta `Asignación`
- THEN responde `200` y el ticket pasa a `En Proceso`

#### Scenario: La anulación de soporte remoto exige Comercial — ROJO
- GIVEN un usuario cuya única área es `Servicio Técnico` y un ticket `Soporte remoto` en `En Proceso`
- WHEN intenta ejecutar `Anulación` con un motivo de la lista
- THEN el servidor responde `403`

### Requirement: RQ-SR-05 · Un ticket `Soporte remoto` ve y ejecuta sólo las cinco del catálogo

Un ticket con `clasificaciones = 'Soporte remoto'` cuyo estado actual pertenece a los cinco estados del
catálogo **SHALL** tener flujo aplicable `soporte-remoto` (regla completa en `transitions-equipo-nuevo`
RQ-EN-04). Sólo entonces `executeTransition` **SHALL** aceptar sus cinco transiciones, y la guarda 3
(`ticketService.ts:231-234`, `transitions-equipo-nuevo` RQ-EN-05, escalón B) **SHALL** responder `409` con
un mensaje que nombre el flujo «soporte remoto» para cualquier transición de otro catálogo, con
independencia del estado. No requiere código nuevo en panel, avisos ni SLA: son genéricos por flujo.

- Un `Soporte remoto` heredado cuyo estado no pertenece al catálogo (p. ej. `Rev./Diagnostico`, `Ticket
  creado`) **MUST NOT** quedar varado: sigue en flujo `servicio` sin tocar sus datos (S-6).
- `Ejecutar` **SHALL** llevar a `Finalizado`, sin salida, y `Anulación` a `Anulado`, también sin salida.

(Previously, hasta F1C-01: cuatro transiciones sobre cuatro estados.)

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
