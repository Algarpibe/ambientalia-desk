# Delta para transitions-st — guarda de remisión vigente en «Habilitar Servicio» (F1B-03, parte L, lotes 1 y 2)

Todas las citas son contra el worktree `tipo-servicio-ticket-sin-ov`, partida `5f68822`. El delta **no modifica** RQ-TS-02
(se conservan los tres orígenes, supuesto S-4 de la propuesta) ni RQ-TS-32, ni amplía la tabla de guardas de RQ-TS-06: la
posición de la guarda nueva se fija en RQ-TS-33, como hizo RQ-TS-32 (supuesto S-8). Que esa tabla ya esté incompleta frente
al código —no lista cargo, prioridad, verificación ni alta validada— se anota como hallazgo y no se corrige aquí.

## ADDED Requirements

### RQ-TS-33 · «Habilitar Servicio» exige remisión de entrada vigente

`habilitar_servicio` **SHALL** responder `422`, con `{ error }` en español, cuando el ticket no tenga una **remisión de
entrada vigente**, y **SHALL** pasar en cuanto la tenga. La imposición **SHALL** ser del servidor; el botón del cliente es
sólo comodidad (regla invariable 13, punto 3).

**Definición de «vigente» (a la letra de Gerencia; no es un supuesto).** Una remisión de entrada vigente **SHALL** ser una
fila de `public.remisiones` del ticket con `tipo = 'entrada'` y `anulada_at IS NULL`: **creada y no anulada**. El estado de
envío **MUST NOT** entrar en la guarda: una remisión de entrada no anulada en `pendiente`, `error`, `ok` u `ok_con_avisos`
**SHALL** contar por igual. Fuentes: «La guarda exigirá remisión de entrada vigente (no anulada) para los tres»
(`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`) y «remisión de entrada vigente (creada y no anulada)»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). El supuesto S-1 de la primera versión de
este delta —exigir `ok` u `ok_con_avisos`— queda **retirado** (revisión de la planificación, 2026-10-03): contradecía esa
letra sin una decisión que lo respaldara y ataba «Habilitar Servicio» a que n8n responda. Las remisiones históricas
(`apps/desk/server/db/remisionesHistoricas.ts:140`) **SHALL** contar (supuesto S-5). Una remisión anulada **MUST NOT**
contar; una segunda remisión de entrada tras una anulada **SHALL** contar. Una fila de `tipo` distinto de `entrada`
**MUST NOT** contar.

**Consecuencia declarada — no es un defecto.** El estado `Remisión creada` se deriva **sólo de remisiones confirmadas**
(RQ-TS-03, `openspec/specs/transitions-st/spec.md:98` y `openspec/specs/transitions-st/spec.md:101-103`; recuento en
`apps/desk/server/db/estadoPorRemision.ts:43-47`). Por tanto un ticket **SHALL** poder seguir en `Ticket creado` con una
remisión de entrada `pendiente` o en `error` y **aun así habilitarse desde ahí**, sin pasar por `Remisión creada`. La guarda
y ese estado responden a preguntas distintas —«la remisión se creó y no se anuló» frente a «el documento de la remisión
existe»— y este requisito **MUST NOT** alinearlas: RQ-TS-03 no se modifica. La divergencia se fija por prueba en
`remisiones` RQ-RE-20. Es además lo que da uso al origen `Ticket creado` (supuesto S-4).

**Escalón y código.** La guarda es de **estado del sujeto (escalón B)**: al ticket le falta un documento previo; no valida
nada que el usuario haya enviado (no es C) y no hay conflicto de unicidad (no es D). El código es `422` y no `409`, para que
las dos precondiciones de «Habilitar Servicio» contesten con la misma forma (supuesto S-2). El mensaje **SHALL** nombrar qué
falta (una remisión de entrada vigente) de modo accionable, y **SHALL** ser **un solo texto**: «No se puede habilitar el
servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.». No hay un segundo texto
para la remisión sin confirmar, porque ese caso ya no se rechaza.

**Posición exacta.** La guarda **SHALL** ser la décima del orden de `executeTransition`: se llama en la misma línea que
`exigirAltaValidada` (`apps/desk/server/services/ticketService.ts:131`), **inmediatamente después** de ella, y **antes**
de los obligatorios, las fechas derivadas, la cuarentena y el certificado
(`apps/desk/server/services/ticketService.ts:132-134`) y antes de la OV ya asociada
(`apps/desk/server/services/ticketService.ts:148-152`). Queda **detrás** de: transición desconocida y ticket inexistente (A),
fuera de flujo (B), estado fuera del `from` (B), área (B), cargo (B), prioridad (B), verificación (B) y alta validada (B, RQ-TS-32).
La función **SHALL** definirse al final del fichero, tras `exigirAltaValidada`
(`apps/desk/server/services/ticketService.ts:258-264`), sin desplazar ninguna línea existente.

**Alcance.** Sólo `habilitar_servicio` la calcula; en las demás transiciones la guarda **MUST NOT** consultar remisiones.
Se aplica a sus tres orígenes (`packages/shared/src/transitions.ts:178`: `OV asignada`, `Ticket creado` y `Remisión creada`)
y, por el supuesto S-3 (pregunta Q5), a todas las clasificaciones que pasen por esa transición, incluido el equipo nuevo.
Tipo de servicio y OV no entran en la guarda (RQ-TS-33 no introduce ramificación por `tipo_servicio`).

**Una sola noción de «vigente».** El predicado puro **SHALL** vivir en `packages/shared` y lo **SHALL** consumir el servidor
(la guarda) y el cliente (el botón). No habrá copia de la regla en `apps/desk/src`. El recuento de `estadoPorRemision.ts`
**MUST NOT** reescribirse; en qué coincide con la guarda y en qué diverge a propósito se fija en `remisiones` RQ-RE-20.

**Cliente (regla invariable 13, decisión a decisión).** «Habilitar Servicio» **SHALL** quedar desactivado, con el motivo a
la vista, cuando el predicado compartido aplicado a las remisiones del ticket (prop `remisiones`,
`apps/desk/src/components/TransitionPanel.tsx:50`) diga que no hay una vigente. Esa decisión del cliente **SHALL** tener su
imposición en el servidor: `exigirRemisionVigente`, llamada en `apps/desk/server/services/ticketService.ts:131`, probada por
los escenarios de posición de este requisito; por eso el espejo es comodidad legítima. El cliente **MUST NOT** recalcular
«vigente» por su cuenta. Si la carga de las remisiones falla, el botón **SHALL** quedar activo y decide el servidor. El
espejo vive en `.tsx`, fuera de la red de pruebas por decisión de Gerencia (F0-00): su comprobación es de persona.

**Aviso no bloqueante de «remisión sin confirmar» (cliente; presentación).** Cuando el ticket tenga al menos una remisión
de entrada vigente y **ninguna** de las vigentes esté confirmada (`ok` u `ok_con_avisos`), el cliente **SHALL** mostrar
junto al botón un aviso de «remisión sin confirmar», y **MUST NOT** desactivar «Habilitar Servicio» por ello. Ese aviso
**no tiene imposición en el servidor y no la necesita**: no decide ni impide nada, y el servidor habilita igual. Es
presentación, no un espejo (regla invariable 13). La noción de «confirmada» **SHALL** salir de un predicado de
`packages/shared`, no de una condición propia del cliente. Con las remisiones sin cargar **MUST NOT** mostrarse aviso.

#### Scenario: Sin remisión desde `OV asignada`
- GIVEN un ticket en `OV asignada` sin ninguna remisión y un usuario de Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` con el motivo en español y el ticket no cambia de estado ni se escribe ninguna fila de traza

#### Scenario: Sin remisión desde `Ticket creado`
- GIVEN un ticket en `Ticket creado` sin remisión y un usuario de Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` y el ticket sigue en `Ticket creado`

#### Scenario: Sin remisión vigente desde `Remisión creada`
- GIVEN un ticket en `Remisión creada` cuya única remisión confirmada está anulada
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` y el ticket no cambia de estado

#### Scenario: Con remisión vigente pasa desde los tres orígenes
- GIVEN un ticket con una remisión de entrada en `ok`, en cada uno de los tres estados de origen
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200` y el ticket llega a `Ingresado` en los tres casos

#### Scenario: Una remisión `pendiente` habilita, y desde `Ticket creado` (consecuencia declarada)
- GIVEN un ticket en `Ticket creado` cuya única remisión de entrada está en `pendiente` y no anulada (n8n no ha respondido, así que el servidor no lo ha pasado a `Remisión creada`)
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200` y el ticket llega a `Ingresado` sin haber pasado por `Remisión creada`

#### Scenario: Una remisión con `error` habilita
- GIVEN un ticket cuya única remisión de entrada terminó en `error` y no está anulada
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200`

#### Scenario: Una remisión anulada no habilita
- GIVEN un ticket cuyas remisiones de entrada, una o varias y en cualquier estado, tienen todas `anulada_at`
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422`

#### Scenario: Una segunda vigente tras una anulada sí habilita
- GIVEN un ticket con una remisión anulada y otra posterior de entrada, no anulada
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200`

#### Scenario: `ok_con_avisos` cuenta como vigente
- GIVEN un ticket cuya remisión de entrada está en `ok_con_avisos`
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200`, como con cualquier otro estado de envío

#### Scenario: La remisión histórica `ok` cuenta (supuesto S-5)
- GIVEN un ticket cuya única remisión es histórica (`origen = 'historico'`, estado `ok`, no anulada)
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200`

#### Scenario: Una remisión de tipo distinto de entrada no cuenta
- GIVEN un ticket cuya única fila no anulada y en `ok` tiene `tipo` distinto de `entrada` (insertada a mano en la prueba; hoy ningún código la escribe, `apps/desk/server/db/remisiones.ts:44-53`)
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422`

#### Scenario: Equipo nuevo sin remisión queda bloqueado (supuesto S-3, Q5)
- GIVEN un ticket de la clasificación «Equipo nuevo», nacido en `Ticket creado`, sin remisión de entrada
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422`, igual que cualquier otro ticket

#### Scenario: Equipo nuevo con remisión vigente pasa
- GIVEN el mismo ticket de equipo nuevo con una remisión de entrada en `ok`
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200`

#### Scenario: P1 · el área gana a la remisión
- GIVEN un ticket sin remisión y un usuario de Servicio Técnico sin el área Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `403` de permiso y no `422` (llamar a la guarda antes del `if` de área pone la prueba en rojo)

#### Scenario: P2 · la alta validada gana a la remisión
- GIVEN un ticket con cliente provisional (o equipo pendiente) **y** sin remisión, y un usuario de Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` con el mensaje de alta pendiente de RQ-TS-32, no el de remisión (intercambiar las dos llamadas de la línea 131 pone la prueba en rojo)

#### Scenario: P3 · la remisión gana a los obligatorios
- GIVEN un ticket sin remisión, un usuario de Comercial y `values` vacío
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` con `error` de remisión y sin `errors` de obligatorios (mover la guarda detrás de `apps/desk/server/services/ticketService.ts:134` pone la prueba en rojo)

#### Scenario: P4 · la remisión gana a la cuarentena de subOV
- GIVEN un ticket sin remisión y una orden de venta en cuarentena
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` de remisión y no el de cuarentena

#### Scenario: P5 · la remisión gana a la OV ya asociada
- GIVEN un ticket sin remisión y una orden de venta ya asociada a otro ticket
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` de remisión y no `409` (mover la guarda detrás de `apps/desk/server/services/ticketService.ts:152` pone la prueba en rojo)

#### Scenario: P6 · el estado gana a la remisión
- GIVEN un ticket en `Ingresado` sin remisión
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `409` «no aplica desde el estado» y no `422` (llamar a la guarda antes de la comprobación del `from` pone la prueba en rojo)

#### Scenario: P7 · el flujo gana a la remisión
- GIVEN un ticket de `Soporte remoto` sin remisión
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `409` de flujo y no `422` (llamar a la guarda antes de `exigirMismoFlujo` pone la prueba en rojo)

#### Scenario: Posiciones sin escenario posible
- GIVEN las guardas de cargo, prioridad y verificación, que comparten la línea 131
- WHEN se enumera su solapamiento con la guarda nueva
- THEN la prueba declara por escrito que no hay escenario para cargo (`habilitar_servicio` no tiene excepción de cargo, `packages/shared/src/cargos.ts:32`) ni para verificación (sólo la calcula `liberacion`), y que prioridad es hipótesis (la transición no lleva campo de prioridad) comprobada por el diseño

#### Scenario: Sin consultas extra en otras transiciones
- GIVEN cualquier transición distinta de `habilitar_servicio`
- WHEN se ejecuta con un espía sobre las lecturas de `remisiones`
- THEN el espía no registra ninguna lectura causada por la guarda nueva

#### Scenario: El predicado discrimina sobre datos sucios (regla de mutación 2)
- GIVEN filas de `public.remisiones` con cada combinación de `tipo`, `estado` y `anulada_at`
- WHEN se evalúa el predicado y la guarda
- THEN cuenta toda fila de `tipo = 'entrada'` no anulada, sea cual sea su `estado`, y sólo ésas; la prueba se pone roja si se quita cualquiera de las dos condiciones, y también si se **reintroduce** un filtro por `estado` (deja de pasar «`pendiente` habilita»)

#### Scenario: El motivo es accionable y en español
- GIVEN un rechazo de la guarda
- WHEN se lee `error`
- THEN es el texto único del requisito, en español, nombra la remisión de entrada vigente como lo que falta, dice qué hacer y no menciona códigos internos ni «cliente», «equipo» o «provisional»

#### Scenario: El cliente desactiva el botón con el predicado compartido
- GIVEN la ficha de un ticket en un estado de origen sin remisión vigente, y un usuario que puede ejecutar la transición
- WHEN se muestra el panel de transiciones
- THEN «Habilitar Servicio» está desactivado con el motivo visible; y comprobación de persona, no automática, por estar el `.tsx` fuera de la red de pruebas

#### Scenario: Si la carga de remisiones falla, decide el servidor
- GIVEN un ticket cuyas remisiones no llegaron al cliente
- WHEN el usuario pulsa «Habilitar Servicio»
- THEN el botón está activo, no hay aviso, y el servidor contesta `422` si no hay remisión vigente

#### Scenario: Aviso no bloqueante de «remisión sin confirmar»
- GIVEN la ficha de un ticket cuya única remisión de entrada vigente está en `pendiente` o en `error`, y un usuario que puede ejecutar la transición
- WHEN se muestra el panel de transiciones
- THEN «Habilitar Servicio» está **activo** y junto a él se lee el aviso de «remisión sin confirmar»; con alguna vigente confirmada no hay aviso; la decisión de cuándo avisar se prueba en `.ts` y su aparición en pantalla es comprobación de persona

## Supuestos que afectan a este requisito

| Supuesto | Qué dice | Pregunta |
|---|---|---|
| S-1 | **RETIRADO** (revisión de la planificación, 2026-10-03). «Vigente» es la letra: entrada, creada y no anulada | Q4, resuelta por la letra |
| S-2 | `422`, escalón B, detrás de `exigirAltaValidada` | — |
| S-3 | Alcanza a equipo nuevo y a los tres orígenes | Q5: condición de publicación, E-158 de `docs/sdd/ENTRADA.md` |
| S-4 | Se conservan los tres `from`; RQ-TS-02 no cambia | Q3: supuesto revisado y mantenido |
| S-5 | Las históricas cuentan | — |
| S-6 | El cliente desactiva el botón con el predicado compartido; el aviso de «sin confirmar» es presentación | — |

Si Gerencia responde Q3 «sí» (retirar `Ticket creado`), es **otro cambio**: rompe el invariante 3, modifica RQ-TS-02 y mueve
las cifras ancladas.

## Fuera de alcance — para el `archive-report`

- Tipo de servicio y ticket sin OV: ya construidos (propuesta §3.1); este delta no escribe requisitos nuevos para ellos.
- Calibración directa (Q2) y cualquier cambio en `packages/shared/src/transitions.ts`, cifras ancladas o mapa.
- Reparar el histórico de tickets que llegaron a `Ingresado` sin remisión.
- **Lote 3 (OVI de garantía):** está bloqueado por Q1 (E-157 de `docs/sdd/ENTRADA.md`) y su borrador vive en el delta de `permissions` y `tickets-core`. Si no hay respuesta registrada al terminar el lote 2, no entra en esta tanda y esos dos deltas salen del cambio antes de archivar. Ninguna parte de RQ-TS-33 depende de él.
- Alinear la guarda con el estado `Remisión creada`, en cualquiera de los dos sentidos: la divergencia es una consecuencia declarada, y cambiarla pide una decisión.
