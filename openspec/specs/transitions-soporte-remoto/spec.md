# Capacidad `transitions-soporte-remoto` — el flujo as-is de M1.5 y el campo «Modalidad»

| Dato | Valor |
|---|---|
| Capacidad | `transitions-soporte-remoto` (`openspec/config.yaml:123-127`; ya declarada, R-2 se cumple creando esta spec) |
| Estado | nueva — F1B-06, cambio 2 de 2, `blueprint-soporte-remoto` (`cierra: si`) |
| Apartado del maestro | M1.5, «Flujo soporte-remoto», `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1551-1568`; as-is de cuatro filas (`:1556-1567`); cuatro estados (`:3650`); Anexo H «No construido» (`:4642-4645`) |
| Depende de | `tickets-core` (RQ-TC-05, RQ-TC-06, RQ-TC-07, RQ-TC-10) · `transitions-equipo-nuevo` (RQ-EN-04 enrutado, RQ-EN-05 guarda 3) · `transitions-st` (estados por nombre, orden de guardas de `executeTransition`) · `permissions` (`canExecuteTransition`, sin cambio) · `derivacion-avisos` (`areasSiguientes`) |
| Fuente de diseño | `docs/analisis-tickets/DF-soporte-remoto-030226.xlsx` (`openspec/config.yaml:126`) |

## 0 · Procedencia y método

Rige la regla de método de `CLAUDE.md`: ruta y línea para el código, línea del maestro exportado para el
maestro, «hipótesis» para lo demás. Todas las citas del maestro son de la `R08.2.md`.

- **Hoja de mapeo, verificada por el orquestador el 2026-09-29:** `DF-soporte-remoto-030226.xlsx`
  (hoja `sheet1`, cabecera `STATUS_ORIGEN | TRANSICIÓN | STATUS_DESTINO | ÁREA_RESPONSABLE | TIPO_EVENTO |
  DESCRIPCION_EVENTO`) tiene **exactamente cuatro filas**: Solicitud soporte —Asignación→ En proceso;
  Pendiente —Continuación soporte→ En proceso; En proceso —Soporte pendiente→ Pendiente; En proceso
  —Ejecutar→ Finalizado. Coinciden con M1.5 (`R08.2.md:1552`).
- **La columna `ÁREA_RESPONSABLE` está VACÍA en las cuatro filas.** Por eso el área es un supuesto (S-1,
  RQ-SR-02) y no un dato: la fuente de diseño demostrablemente no la da, y M1.5 tampoco.
- La hoja escribe los estados en minúscula («En proceso», «Solicitud soporte»). Los nombres canónicos son
  los del maestro y del código: `En Proceso`, `Solicitud Soporte`.
- **M1.5 no dice** qué campos lleva cada transición, cómo nace el ticket, si hay anulación ni qué clase de
  espera tiene `Solicitud Soporte`: son los supuestos S-2, S-3, S-5 y S-7 de la propuesta.
- El campo «Modalidad» **no es de M1.5**: es alcance añadido por `decision/anexo-43-en-sitio`
  (`openspec/config.yaml:2413`, consecuencia (2) en `:2416`).
- Pruebas: todo escenario corre en node (`vitest.config.ts:16`). El selector de Modalidad de
  `CreateTicket.tsx` y su lectura en la ficha son `.tsx` y quedan **fuera de la red de pruebas** por
  decisión de Gerencia (F0-00, 2026-09-08); la regla 13 lo cubre: la imposición vive en el servidor
  (RQ-SR-07 a RQ-SR-10) y el selector es comodidad. No se propone `jsdom`.

## 1 · El catálogo — 4 transiciones sobre 4 estados

### Requirement: RQ-SR-01 · Catálogo separado de cuatro transiciones sobre cuatro estados

El sistema **SHALL** declarar el catálogo de `Soporte remoto` como registro **separado** de `TRANSITIONS` y
de `TRANSITIONS_EQUIPO_NUEVO`, con la misma forma de `Transition` (`id`, `name`, `from: string[]`, `to`,
`area`, `fields`, `packages/shared/src/transitions.ts:55-62`) y exactamente estas cuatro entradas
(`R08.2.md:1556-1567`):

| Transición | Origen → destino |
|---|---|
| Asignación | Solicitud Soporte → En Proceso |
| Ejecutar | En Proceso → Finalizado |
| Soporte pendiente | En Proceso → Pendiente |
| Continuación soporte | Pendiente → En Proceso |

- El catálogo **SHALL** cubrir exactamente los cuatro estados `Solicitud Soporte`, `En Proceso`,
  `Pendiente` y `Finalizado`.
- **Sin anulación (S-5):** el catálogo **MUST NOT** declarar transición de anulación ni de salida desde
  `Solicitud Soporte` distinta de `Asignación`.
- Las cuatro **SHALL** declarar sólo `comment()` y la casilla de derivación `derivacion()` (S-3), sin
  motivo obligatorio ni campo de fecha; el bucle `En Proceso ↔ Pendiente` es el que mide la espera del
  cliente (`R08.2.md:1568`) y **SHALL** tener cero campos de fecha reentrantes.
- Regla 13: el servidor impone origen, flujo y área con este mismo catálogo compartido; el cliente lo
  consume.

#### Scenario: Las cuatro transiciones existen con sus pares exactos
- GIVEN el catálogo de `Soporte remoto`
- WHEN se listan sus entradas con `from` y `to`
- THEN son exactamente los cuatro pares de la tabla, y ninguna más

#### Scenario: Ninguna entrada declara campos de fecha ni motivo obligatorio
- GIVEN las cuatro entradas del catálogo
- WHEN se leen sus `fields`
- THEN sólo hay comentario y casilla de derivación, y el ciclo `En Proceso → Pendiente → En Proceso` tiene
  cero campos de fecha reentrantes

#### Scenario: No hay salida de anulación (S-5, mutación)
- GIVEN el catálogo en verde
- WHEN se añade una entrada cuyo `from` incluye `Solicitud Soporte` y cuyo `to` no es `En Proceso`
- THEN la prueba que fija las salidas de `Solicitud Soporte` en exactamente `Asignación` falla

## 2 · Área de las cuatro — supuesto S-1

### Requirement: RQ-SR-02 · Área por equivalencia con Servicio Técnico

Ninguna fuente accesible da el área de las cuatro transiciones (`ÁREA_RESPONSABLE` vacía en las cuatro
filas de la hoja, §0; M1.5 tampoco). El sistema **SHALL** declarar las cuatro como área `Servicio Técnico`,
por equivalencia con el grafo de servicio y con `transitions-equipo-nuevo` RQ-EN-02 — supuesto reversible
S-1, un dato por transición. *Hipótesis*, no cerrada: `Asignación` podría ser de Comercial, que es quien
recibe la solicitud. Se confirma en P.3 (`docs/sdd/ENTRADA.md`).

#### Scenario: Las cuatro exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN intenta ejecutar `Asignación`
- THEN el servidor responde `403`; y lo mismo con las otras tres desde su estado de origen

#### Scenario: Un usuario de Servicio Técnico las ejecuta
- GIVEN un usuario de `Servicio Técnico` y un ticket `Soporte remoto` en `Solicitud Soporte`
- WHEN ejecuta `Asignación`
- THEN responde `200` y el ticket pasa a `En Proceso`

## 3 · Estado `Solicitud Soporte`

### Requirement: RQ-SR-03 · `Solicitud Soporte` se registra, sólo de soporte remoto

`Solicitud Soporte` **SHALL** registrarse en `ESTADOS` y en `CLASIFICACION_EN_ESPERA`
(`packages/shared/src/estados.ts:59-112`) con clase `sin_clasificar` (S-2, valor válido del tipo,
`:40`), y **SHALL** quedar **excluido** de `ESTADOS_SERVICIO` (`:182-190`), igual que `Verificación`
lo está por ser sólo de equipo nuevo. La unión de los estados derivados de `from`/`to` de los tres
catálogos **SHALL** ser exactamente `ESTADOS`.

- `Finalizado` **SHALL** seguir siendo el **único** estado sin salida de la unión de los tres catálogos:
  `sinSalida = ['Finalizado']` exactamente (`packages/shared/src/invariantesGrafo.test.ts`).
- El tablero **SHALL** tener columna propia `solicitud_soporte` para `Solicitud Soporte`, inmediatamente
  después de `ticket_creado` (`columns.ts:15`), por `decision/e225-columna-propia-dos-estados`.

#### Scenario: La unión de los tres catálogos deriva exactamente ESTADOS
- GIVEN `TRANSITIONS`, `TRANSITIONS_EQUIPO_NUEVO` y el catálogo de soporte remoto
- WHEN se calculan los estados de sus `from`/`to`
- THEN el conjunto es exactamente `ESTADOS`, con `Solicitud Soporte` dentro

#### Scenario: Solicitud Soporte no es un estado de servicio
- GIVEN `ESTADOS_SERVICIO`
- WHEN se comprueba si contiene `Solicitud Soporte`
- THEN no lo contiene, y sí contiene `Solicitud Soporte` la lista de estados sólo de soporte remoto

#### Scenario: Finalizado sigue siendo el único sin salida
- GIVEN la unión de los tres catálogos
- WHEN se calcula `sinSalida`
- THEN es exactamente `['Finalizado']`

#### Scenario: Quitar `Ejecutar` deja a `Finalizado` sin entrada de soporte remoto (mutación)
- GIVEN la prueba de pares que fija las entradas y salidas del catálogo
- WHEN se borra `Ejecutar` del catálogo
- THEN esa prueba falla, aunque `sinSalida` siga en `['Finalizado']` (el invariante no distingue una
  entrada retirada)

#### Scenario: Clase de espera de Solicitud Soporte
- GIVEN el registro `CLASIFICACION_EN_ESPERA`
- WHEN se consulta `Solicitud Soporte`
- THEN devuelve `sin_clasificar`

## 4 · Nacimiento

### Requirement: RQ-SR-04 · El ticket `Soporte remoto` nace en `Solicitud Soporte`

Cuando `clasificaciones = 'Soporte remoto'`, `createTicket` (`packages/zoho-sync/src/db/repo.ts:420-435`)
**SHALL** fijar el estado inicial `Solicitud Soporte` y **SHALL** escribir la foto de creación en
`ticket_transitions` con `to_status = 'Solicitud Soporte'`; el resto de campos de esa fila **SHALL**
quedar como hoy —`transition_id='enviar'`, `transition_name='Enviar'`, `from_status='(creación)'`,
`area='Comercial'` (S-7)—. Las otras dos clasificaciones **SHALL** seguir naciendo en `Ticket creado`.
Ningún ticket **MUST** nacer en `OV asignada` (`tickets-core` RQ-TC-07). El ticket **SHALL** seguir
exigiendo equipo en el alta (`ticketService.ts:24`).

#### Scenario: Alta de soporte remoto
- GIVEN un alta válida con `clasificaciones = 'Soporte remoto'` y equipo existente
- WHEN se crea el ticket
- THEN responde `201`, la fila queda con `status = 'Solicitud Soporte'` y la foto #1 lleva
  `to_status = 'Solicitud Soporte'`, `transition_id = 'enviar'`, `area = 'Comercial'`

#### Scenario: Las otras clasificaciones no cambian
- GIVEN un alta con `Equipo nuevo` o `Equipo para servicio de mantenimiento`
- WHEN se crea el ticket
- THEN nace en `Ticket creado`, con `to_status = 'Ticket creado'` en la foto #1

#### Scenario: Soporte remoto sin equipo sigue rechazado
- GIVEN un alta `Soporte remoto` sin `equipoId`
- WHEN se crea el ticket
- THEN responde `422 'Falta el equipo'`, y no se escribe nada

## 5 · Enrutado y guarda 3

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

## 6 · Ids únicos

### Requirement: RQ-SR-06 · Los ids del catálogo son únicos entre los tres catálogos (S-8)

Los cuatro ids **SHALL** ser distintos entre sí y **MUST NOT** coincidir con ningún id de `TRANSITIONS`
ni de `TRANSITIONS_EQUIPO_NUEVO`. En particular, `Soporte pendiente` **MUST NOT** reutilizar el id
`marcar_pendiente`, aunque esa id esté retirada de `TRANSITIONS` desde F1C-09: las filas históricas de
`ticket_transitions` la conservan y buscar una transición por id **SHALL** dar un único catálogo o ninguno.
(Previously: `marcar_pendiente` era una transición vigente de `TRANSITIONS` (`transitions.ts:206` en `fd253aa`).)

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

## 7 · Modalidad

### Requirement: RQ-SR-07 · Dominio de Modalidad, validado en el servidor con 422

El alta **SHALL** aceptar un campo `modalidad` cuyo dominio es exactamente `remoto` y `en sitio` (S-4;
`decision/anexo-43-en-sitio`). Un valor fuera del dominio (incluida la cadena vacía y variantes de
mayúsculas) **SHALL** responder `422` nombrando el campo, sin escribir nada. La guarda es de **contenido**
(escalón C) y **SHALL** ganar al `409` de unicidad de la OV (escalón D). No hay guarda de remisión: la rama
«no exige remisión» (`openspec/config.yaml:2413`); F1B-03.

#### Scenario: Modalidad válida se guarda
- GIVEN un alta `Soporte remoto` con `modalidad = 'en sitio'`
- WHEN se crea el ticket
- THEN responde `201` y la fila guarda `modalidad = 'en sitio'`

#### Scenario: Modalidad inválida da 422
- GIVEN un alta `Soporte remoto` con `modalidad = 'presencial'` (o `''`, o `'Remoto'`)
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` y no se escribe ningún ticket

#### Scenario: La guarda gana al 409 de la OV (posición)
- GIVEN un alta `Soporte remoto` con modalidad inválida y una OV ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` y no `409`; mover la guarda tras la de unicidad pone la prueba en rojo

### Requirement: RQ-SR-08 · Valor por defecto `remoto`

Cuando la clasificación es `Soporte remoto` y `modalidad` no se envía (ausente o `undefined`), el servidor
**SHALL** guardar `remoto`. El default lo pone el servidor, no el cliente.

#### Scenario: Sin modalidad se guarda remoto
- GIVEN un alta `Soporte remoto` sin campo `modalidad`
- WHEN se crea el ticket
- THEN responde `201` y la fila guarda `modalidad = 'remoto'`

### Requirement: RQ-SR-09 · En otra clasificación, Modalidad es NULL y enviarla da 422

Cuando la clasificación no es `Soporte remoto`, la fila **SHALL** quedar con `modalidad = NULL` y enviar
`modalidad` (con cualquier valor, incluso válido) **SHALL** responder `422`, sin escribir nada.

#### Scenario: Equipo nuevo o mantenimiento sin modalidad
- GIVEN un alta `Equipo nuevo` o `Equipo para servicio de mantenimiento` sin `modalidad`
- WHEN se crea el ticket
- THEN responde `201` y `modalidad` es `NULL`

#### Scenario: Modalidad enviada con otra clasificación
- GIVEN un alta `Equipo nuevo` con `modalidad = 'remoto'`
- WHEN se crea el ticket
- THEN responde `422` y no se escribe nada

### Requirement: RQ-SR-10 · Modalidad es de sólo lectura tras el alta

Ninguna transición del catálogo de soporte remoto **SHALL** declarar `modalidad` entre sus campos, y
ninguna ruta **SHALL** modificarla después del alta (S-4; pregunta 3 de la propuesta, revisable).

#### Scenario: Las transiciones no editan modalidad
- GIVEN las cuatro entradas del catálogo
- WHEN se leen sus `fields`
- THEN ninguna contiene `modalidad`

#### Scenario: Un valor de modalidad en una transición no la cambia
- GIVEN un ticket `Soporte remoto` con `modalidad = 'remoto'` en `En Proceso`
- WHEN se ejecuta `Ejecutar` con `values` que incluyen `modalidad = 'en sitio'`
- THEN la fila conserva `modalidad = 'remoto'`

### Requirement: RQ-SR-11 · Modalidad queda fuera de `TICKET_COLS`

`modalidad` **MUST NOT** figurar en `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:44-54`), de modo que
la sincronización con Zoho no la pise. Los tickets heredados quedan con `NULL` sin relleno (S-9).

#### Scenario: La sincronización no toca modalidad
- GIVEN un ticket con `modalidad = 'en sitio'` y una pasada de `upsertTicket` con datos de Zoho
- WHEN termina la pasada
- THEN `modalidad` sigue en `'en sitio'`

#### Scenario: `TICKET_COLS` no contiene modalidad (mutación)
- GIVEN `TICKET_COLS`
- WHEN se añade `modalidad`
- THEN la prueba que lo vigila falla

## Fuera de alcance

- **Rama de servicio en sitio** → 2027 T2 (`openspec/config.yaml:2413`, `:2415`).
- **Guarda de remisión** → F1B-03 (`openspec/config.yaml:2417`).
- **Columna propia de tablero para `Solicitud Soporte`** y mapa generado de los tres flujos → F1B-09.
- **Relleno de `modalidad` en heredados** y migración de datos (S-9).
- **Selector en `CreateTicket.tsx` y lectura en la ficha:** `.tsx`, fuera de la red de pruebas (F0-00);
  sin `jsdom`. La imposición está probada en el servidor (RQ-SR-07 a RQ-SR-10).
- **Transición de anulación** (S-5) y confirmación del área (P.3).
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
