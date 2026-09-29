# Capacidad `transitions-equipo-nuevo` — el flujo as-is de M1.4

| Dato | Valor |
|---|---|
| Capacidad | `transitions-equipo-nuevo` (`openspec/config.yaml:113-121`) |
| Estado | nueva — primer contenido: F1B-06, cambio `blueprint-equipo-nuevo` (`cierra: no`) |
| Apartado del maestro | M1.4, «Flujo equipo-nuevo» (`R08.2.md:1491-1514`), marcado «aún no implementada» (`:1492`); as-is de seis filas y cinco estados (`:1493-1514`); evidencia de 181 tickets (`:1518`) |
| Depende de | `tickets-core` (RQ-TC-10, disparador de rama; RQ-TC-15, alta) · `transitions-st` (estados compartidos por nombre, orden de guardas de `executeTransition`) · `permissions` (`canExecuteTransition`, sin cambio) · `derivacion-avisos` (`areasSiguientes`) |
| Fuente de diseño | `docs/analisis-tickets/DF-equipo-nuevo-030226.xlsx` (`openspec/config.yaml:116`) |

## 0 · Procedencia y método

Rige la regla de método de `CLAUDE.md`: ruta y línea para el código, línea del maestro exportado para
el maestro, «hipótesis» para lo demás. Este cambio (F1B-06, primero de dos) construye **5 de las 6**
filas del as-is de M1.4. La sexta —`Verificación —Liberación→ Finalizado`— y las dos salidas de
`Verificación` (`Liberación` y `rechazada → Notificado`) son contenido de **F1A-03**
(`plan:142`; `openspec/config.yaml:1981`) y quedan explícitamente fuera (supuesto s4 de la propuesta).

## 1 · El catálogo — 5 transiciones sobre 5 estados

### Requirement: RQ-EN-01 · Catálogo separado, 6 transiciones sobre 5 estados

El sistema **SHALL** declarar el catálogo de `Equipo nuevo` como registro **separado** de
`TRANSITIONS` (`packages/shared/src/transitions.ts:295`) — no fundido en él —, con la misma forma de
`Transition` (`id`, `name`, `from: string[]`, `to: string`, `area: string`, `fields`,
`transitions.ts:55-62`) y la casilla de derivación en las seis (`:295-298`).

| Transición | Origen → destino | Área |
|---|---|---|
| Ingreso equipo nuevo | Ingresado → En Proceso | Servicio Técnico |
| Producto no conforme | En Proceso → Notificado | Servicio Técnico |
| Análisis y acciones | Notificado → Ingresado | Servicio Técnico |
| Verificación | En Proceso → Verificación | Servicio Técnico |
| Liberación | En Proceso, Verificación → Finalizado | Servicio Técnico |
| Rechazo de verificación | Verificación → Notificado | Servicio Técnico |

- El catálogo **SHALL** cubrir exactamente los mismos cinco estados: `Ingresado`, `En Proceso`,
  `Notificado`, `Finalizado` y `Verificación`. Sólo cambia el número de transiciones, no el de estados.
- `Verificación` **SHALL** tener exactamente dos salidas: `Liberación` (mismo id que desde `En
  Proceso`, `from` ampliado por s1) hacia `Finalizado`, y `Rechazo de verificación`
  (`rechazo_verificacion`, nueva, s2) hacia `Notificado`. Las dos declaran sólo `comment()` y
  `derivacion()`, sin motivo obligatorio (s3), igual que el resto del catálogo.
- `Finalizado` **SHALL** seguir siendo el único estado terminal de la unión de los dos catálogos: el
  invariante **SHALL** endurecerse a `sinSalida = ['Finalizado']` exactamente — quitar cualquiera de
  las dos salidas de `Verificación` **MUST** devolverlo a esa lista y poner la prueba en rojo.
- Las nuevas aristas cierran un ciclo que incluye a `Verificación`: `En Proceso → Verificación →
  Notificado → Ingresado → En Proceso` (vía `rechazo_verificacion` y `analisis_y_acciones`, ya
  existente). El componente conexo de reentrancia **SHALL** incluir `Verificación`, con cero campos de
  fecha reentrantes — las seis entradas sólo declaran comentario.
- Regla 13: ninguna decisión nueva vive en el cliente. `executeTransition` impone origen, flujo y área
  con el mismo catálogo compartido (`apps/desk/server/services/ticketService.ts:125-131`); ampliar
  `liberacion.from` y añadir `rechazo_verificacion` basta para que el servidor las imponga sin tocar la
  guarda.

(Previously: `Verificación` **MUST NOT** tener salida — excepción nombrada del invariante 3 de la
unión, `packages/shared/src/invariantesGrafo.test.ts:177-180`; 5 transiciones, no 6.)

#### Scenario: Las seis transiciones existen y sólo Finalizado queda sin salida
- GIVEN el catálogo de `Equipo nuevo` tras el cambio
- WHEN se listan sus 6 entradas y se calcula `sinSalida` sobre la unión con `TRANSITIONS`
- THEN cubren exactamente los 6 pares de la tabla y `sinSalida` es exactamente `['Finalizado']`

#### Scenario: El invariante 1 se extiende a la unión de los dos catálogos
- GIVEN la unión de `TRANSITIONS` y el catálogo de `Equipo nuevo`
- WHEN se calculan los estados derivados de los `from`/`to` de los dos
- THEN el resultado es exactamente `ESTADOS` (`estados.ts:112`) tras registrar `Verificación`, y el
  guardián de `transitions-st` (`invariantesGrafo.test.ts:35-42`) se extiende para comprobar la unión,
  no sólo `TRANSITIONS`

#### Scenario: Quitar las DOS salidas de Verificación pone el invariante en rojo (mutación)
- GIVEN el invariante `sinSalida = ['Finalizado']` en verde
- WHEN se retira `Verificación` del `from` de `liberacion` Y se borra `rechazo_verificacion`
- THEN `sinSalida` vuelve a incluir `Verificación` y la prueba del invariante falla

#### Scenario: Quitar UNA sola salida la caza la prueba de pares, no el invariante (mutación)
- GIVEN la prueba que fija que las salidas de `Verificación` son exactamente `liberacion` y
  `rechazo_verificacion`
- WHEN se retira sólo una de las dos
- THEN esa prueba de pares falla, aunque `sinSalida` siga en `['Finalizado']` —con una salida
  restante el estado no queda sin salida, y el invariante no puede distinguirlo—

#### Scenario: Liberación ejecuta desde Verificación (E1)
- GIVEN un ticket `Equipo nuevo` en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `Liberación`
- THEN responde `200` y el ticket pasa a `Finalizado`

#### Scenario: Rechazo de verificación ejecuta desde Verificación (E2)
- GIVEN un ticket `Equipo nuevo` en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `Rechazo de verificación`, con o sin comentario
- THEN responde `200` y el ticket pasa a `Notificado`

#### Scenario: El ciclo de reentrancia pasa a incluir Verificación
- GIVEN la tabla de reentrancia de `TRANSITIONS_EQUIPO_NUEVO` tras el cambio
- WHEN se calcula sobre las seis entradas
- THEN el ciclo `Ingresado → En Proceso → Notificado` se amplía a `En Proceso → Verificación →
  Notificado → Ingresado`, con cero campos de fecha reentrantes

## 2 · Área de las cinco — supuesto s2

### Requirement: RQ-EN-02 · Área por equivalencia con Servicio Técnico

Ninguna fuente accesible da el área de las seis transiciones (ni el maestro, ni Zoho). El sistema
**SHALL** declarar las seis como área `Servicio Técnico`, por equivalencia con el grafo de servicio —
supuesto reversible s2 de la propuesta, aplicado por la regla de ejecución.

*Hipótesis*, no cerrada por ninguna fuente: `Liberación` podría ser de área Comercial, por analogía con
`liberacion_sin_factura` (`transitions.ts:246`). El catálogo **SHALL** declararla Servicio Técnico
hasta que una fuente la corrija.

(Previously: «las cinco transiciones»; ahora «las seis», con `rechazo_verificacion` incluida por s2.)

#### Scenario: Las seis transiciones exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial`
- WHEN intenta ejecutar cualquiera de las seis transiciones del catálogo de `Equipo nuevo`
- THEN el servidor responde `403`, incluidas `Liberación` desde `Verificación` y `Rechazo de
  verificación`

## 3 · Entrada al flujo — supuesto s3

### Requirement: RQ-EN-03 · La entrada a `Ingresado` es la misma que la de servicio

El sistema **MUST NOT** declarar una transición de entrada propia para `Equipo nuevo`: un ticket con
`clasificaciones = 'Equipo nuevo'` **SHALL** entrar a `Ingresado` por el mismo `habilitar_servicio`
compartido (`transitions.ts:178`, `from: [OV asignada, Ticket creado, Remisión creada]`), coherente
con el alta de `tickets-core` RQ-TC-15, que nace en `Ticket creado`.

#### Scenario: `habilitar_servicio` funciona igual para las tres clasificaciones
- GIVEN un ticket con `clasificaciones = 'Equipo nuevo'` en `Ticket creado`
- WHEN se ejecuta `habilitar_servicio`
- THEN el ticket pasa a `Ingresado`, igual que para las otras dos clasificaciones

## 4 · El flujo aplicable de un ticket — routing, cubre heredados (s5)

### Requirement: RQ-EN-04 · El flujo se determina por clasificación y por si el estado actual pertenece a ese catálogo

El sistema **SHALL** determinar el flujo aplicable de un ticket así, con **tres flujos**:

- si `clasificaciones = 'Equipo nuevo'` **Y** su estado actual (`current.row.status`) pertenece a los 5
  estados del catálogo de `Equipo nuevo` (§1), el flujo aplicable **SHALL** ser `equipo-nuevo`;
- si `clasificaciones = 'Soporte remoto'` **Y** su estado actual pertenece a los 4 estados del catálogo de
  `transitions-soporte-remoto` (`Solicitud Soporte`, `En Proceso`, `Pendiente`, `Finalizado`), el flujo
  aplicable **SHALL** ser `soporte-remoto`;
- en cualquier otro caso (otra clasificación, o `Equipo nuevo` / `Soporte remoto` con un estado que sólo
  existe en el grafo de servicio) el flujo aplicable **SHALL** ser `servicio`.

- Un ticket `Equipo nuevo` o `Soporte remoto` heredado cuyo estado actual no existe en su catálogo — p. ej.
  `Rev./Diagnostico`, `Ticket creado` — **MUST NOT** quedar varado: **SHALL** seguir viendo y pudiendo
  ejecutar las transiciones de `TRANSITIONS` (servicio) desde ese estado, sin tocar sus datos (s5;
  caso real #979, `Decisiones_Gerencia_2026-09-10.md:105-108`; S-6 de `blueprint-soporte-remoto`).
- Un ticket de servicio (clasificación distinta de `Equipo nuevo` y de `Soporte remoto`) **SHALL** tener
  siempre flujo `servicio`, con independencia de su estado.
- La clasificación desambigua los estados compartidos por nombre: `En Proceso` y `Finalizado` existen en
  los tres catálogos.

(Previously: dos flujos. «Un ticket de servicio o de `Soporte remoto` (clasificación distinta de `Equipo
nuevo`) SHALL tener siempre flujo `servicio`, con independencia de su estado.»)

#### Scenario: Ticket `Equipo nuevo` heredado en un estado sólo de servicio sigue en servicio
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Rev./Diagnostico` (no existe en el catálogo
  de `Equipo nuevo`)
- WHEN se listan sus transiciones ejecutables
- THEN son las de `TRANSITIONS` (servicio) desde `Rev./Diagnostico`, y el ticket no queda sin
  transiciones

#### Scenario: Ticket `Equipo nuevo` en un estado de su catálogo pasa a flujo equipo-nuevo
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Ingresado`
- WHEN se calcula su flujo aplicable
- THEN es `equipo-nuevo`, no `servicio`

#### Scenario: Ticket `Soporte remoto` en un estado de su catálogo pasa a flujo soporte-remoto
- GIVEN un ticket `clasificaciones = 'Soporte remoto'` en `Solicitud Soporte`, `En Proceso`, `Pendiente`
  o `Finalizado`
- WHEN se calcula su flujo aplicable
- THEN es `soporte-remoto`, no `servicio`

#### Scenario: Ticket `Soporte remoto` heredado en un estado sólo de servicio sigue en servicio
- GIVEN un ticket `clasificaciones = 'Soporte remoto'` en `Rev./Diagnostico` o `Ticket creado`
- WHEN se calcula su flujo aplicable y se listan sus transiciones
- THEN es `servicio` y ve las de `TRANSITIONS` desde ese estado

#### Scenario: La clasificación desambigua `En Proceso`
- GIVEN tres tickets en `En Proceso`, uno `Equipo nuevo`, uno `Soporte remoto` y uno de servicio
- WHEN se calcula el flujo aplicable de cada uno
- THEN son `equipo-nuevo`, `soporte-remoto` y `servicio` respectivamente

## 5 · La guarda del servidor — 409 si la transición es de otro flujo, y su posición

### Requirement: RQ-EN-05 · `executeTransition` rechaza con 409 una transición de otro flujo, tercera guarda del orden A<B<C<D

`executeTransition` (`apps/desk/server/services/ticketService.ts:114-223`) **SHALL** ganar una guarda
nueva: tras comprobar que el ticket existe (guarda 2, `:125`, escalón A) y antes de comprobar que el
estado actual está en el `from` de la transición (guarda existente, escalón B), el sistema **SHALL**
comprobar que el catálogo de la transición coincide con el flujo aplicable del ticket (RQ-EN-04); si
no coincide, **SHALL** responder `409` con un mensaje que nombre el flujo.

Posición: **guarda 3**, primera del escalón B — antes de la comprobación de estado y de la de permiso,
después de las dos de existencia (escalón A). Necesita el ticket cargado
(`current.row.classification`, `packages/zoho-sync/src/db/rows.ts:23`), por eso no puede ir antes de
la guarda 2.

| Orden | Guarda | Escalón | Respuesta |
|---|---|---|---|
| 1 | La transición existe | A | `400` |
| 2 | El ticket existe | A | `404` |
| **3 (nueva)** | **La transición pertenece al flujo aplicable del ticket** | **B** | **`409`** |
| 4 | El estado actual está en el `from` | B | `409` |
| 5 | El área cubre la transición | B | `403` |
| 6-8 | Contenido (obligatorios, fecha derivada, persona) | C | `422` |
| 9 | OV no asociada a otro ticket | D | `409` |

#### Scenario: Ticket `Equipo nuevo` en `Ingresado` sólo ejecuta su transición
- GIVEN un ticket `Equipo nuevo` en `Ingresado`
- WHEN ejecuta `Ingreso equipo nuevo`
- THEN responde `200` y el ticket pasa a `En Proceso`
- WHEN el mismo ticket intenta `ingreso_a_servicio` (servicio, mismo estado origen)
- THEN responde `409`

#### Scenario: La guarda de flujo gana a la de estado — posición fijada por prueba
- GIVEN un ticket de servicio en `Rev./Diagnostico` (estado ausente del catálogo de `Equipo nuevo`)
- WHEN se ejecuta `Ingreso equipo nuevo` (`from: [Ingresado]`, catálogo `Equipo nuevo`)
- THEN responde `409` con el mensaje de flujo, no con «no aplica desde el estado» — invertir el orden
  de las guardas 3 y 4 debe poner esta prueba en rojo (regla de mutación 1 de `CLAUDE.md`)

## 6 · Filtro por flujo en cliente, avisos y SLA — supuesto s6

### Requirement: RQ-EN-06 · El filtro por flujo se refleja en panel, avisos por área y SLA de Notificado

- **Panel** (`TransitionPanel.tsx:56`): las transiciones ofrecidas **SHALL** filtrarse al flujo
  aplicable del ticket (RQ-EN-04). Es espejo legítimo bajo la regla invariable 13 punto 3, porque
  RQ-EN-05 lo impone y lo prueba en el servidor.
- **Avisos por área**: `areasSiguientes`/`areasAAvisar` (`avisoArea.ts`, vía `transitions.ts:327`)
  **SHALL** calcularse sobre el catálogo del flujo del ticket que ejecutó la transición, no siempre
  sobre `TRANSITIONS`. Delta en `derivacion-avisos` RQ-AV-04.
- **SLA de `Notificado`**: el reloj de 24 h (`sla.ts:32-35` en `bb58e83`; `apps/desk/server/db/sla.ts:40-45` en `bb58e83`)
  **MUST NOT** aplicarse a un ticket `Equipo nuevo` en `Notificado`, aunque el nombre del estado
  coincida con el de servicio — es del blueprint de servicio (s6). Delta en `transitions-st` RQ-TS-15.

#### Scenario: Un ticket `Equipo nuevo` en `Notificado` no cuenta para el SLA de 24 h
- GIVEN un ticket `Equipo nuevo` que lleva más de 24 h en `Notificado`
- WHEN se calcula `ticketsConSlaVencido`
- THEN no aparece en la lista

## 7 · Verificación — clasificación, campos y tablero

### Requirement: RQ-EN-07 · `Verificación` clasifica `sin_clasificar`, con dos campos, y cae en `Otros` en el tablero

`Verificación` **SHALL** registrarse en `CLASIFICACION_EN_ESPERA` (`estados.ts:59-106`) con clase
`sin_clasificar` — valor válido del tipo (`estados.ts:40`) — porque ninguna fuente da su clase real;
es supuesto reversible s7 de la propuesta.

- La transición `Verificación` **SHALL** declarar sólo dos campos: comentario y la casilla de
  derivación; ninguna fuente da otros.
- El tablero **MUST NOT** ganar columna propia para `Verificación`: cae en la columna de seguridad
  `Otros` (`columns.ts:34`, `FALLBACK_COLUMN_ID`, `:38`, `columnForStatus`, `:45-46`) por el mismo
  mecanismo que cualquier estado sin columna declarada. Columna propia es **F1B-09** (`plan:166`),
  fuera de este cambio.

#### Scenario: Un ticket en Verificación aparece en la columna Otros
- GIVEN un ticket cuyo estado es `Verificación`
- WHEN se calcula su columna de tablero (`columnForStatus`)
- THEN devuelve `'otros'`, no una columna propia

## Fuera de alcance de esta spec

- Soporte remoto (M1.5) → segundo cambio de F1B-06, `blueprint-soporte-remoto`.
- **E3/E4** · Guarda de obligatoriedad por tipo de analizador/convertidor y lista de gases patrón →
  `docs/sdd/ENTRADA.md` E-082 (dueño Gerencia/Calidad; sin destino de tanda).
- **E5** · Guarda de certificado en `Liberación` desde `Verificación` (`R08.2.md:1520`) →
  `docs/sdd/ENTRADA.md` E-083 (dueño Gerencia/Calidad; sin destino de tanda).
- Guarda de `habilitar_servicio` → F1B-03.
- Columna propia de tablero para `Verificación`; mapa generado de los tres flujos → F1B-09.
