# Delta for `transitions-equipo-nuevo`

Cambio `verificacion-gas-patron-certificado` (F1A-03, `cierra: si`). Construye E3/E4 (la guarda de Verificación por
compuesto y gas patrón vigente) y E5 (el certificado de fábrica en `Liberación`), que `salidas-verificacion` dejó
fuera (`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:9-18`). Decisiones de Gerencia que
lo respaldan: `decision/f1a03-familia-y-gas-patron` (`openspec/config.yaml:2887-2902`, la guarda en `:2892`) y
`decision/f1a03-certificado-liberacion` (`:2904-2916`, el literal en `:2909`). Numeración: el último requisito vivo
es RQ-EN-07 (`openspec/specs/transitions-equipo-nuevo/spec.md:245`); aquí se añaden RQ-EN-08 a RQ-EN-12.

**Vocabulario.** «Con compuesto» = el equipo del ticket tiene `compuesto` no nulo (`hojas-vida` RQ-HV-13). «Patrón
vigente de un compuesto» = existe al menos una fila de `public.gases_patron` de ese compuesto que cumple el
predicado de `gases-patron` RQ-GP-03. Ambos términos se definen allí; esta spec sólo los usa.

## ADDED Requirements

### Requirement: RQ-EN-08 · `liberacion` desde `En Proceso` responde 409 si el equipo tiene compuesto y hay patrón vigente — escalón B, tras el área y antes del contenido

El servidor **SHALL** rechazar con `409` la ejecución de `liberacion` sobre un ticket del flujo `equipo-nuevo` que
está en `En Proceso`, cuando su equipo **tiene compuesto** y existe **patrón vigente** de ese compuesto. El mensaje
**SHALL** nombrar `Verificación` como el paso que falta, de modo que se distinga del `409` de estado de origen
(`apps/desk/server/services/ticketService.ts:126-128`) y del de flujo (`:125`). Nada se escribe: el ticket sigue en
`En Proceso` y no se crea fila en `ticket_transitions`.

- **No aplica** si el ticket está en `Verificación` (ya pasó), si el ticket no tiene equipo, si su equipo no tiene
  compuesto, ni si el patrón vigente es de **otro** compuesto.
- **Sólo `liberacion`.** `verificacion` (`packages/shared/src/transitions.ts:357`) sigue siendo voluntaria: ninguna
  otra transición del catálogo cambia de comportamiento.
- **El servidor decide** (regla invariable 13, punto 2): no hay contrapartida en el cliente que sea la guarda. Cualquier
  mensaje o bloqueo del navegador es comodidad, legítima sólo porque este requisito está probado en el servidor.
- **Posición, escalón B de `transitions-st` §3.8** (`openspec/specs/transitions-st/spec.md:1106-1111`). La guarda
  **SHALL** ejecutarse **después** de los `409` de flujo y de estado de origen (`ticketService.ts:125-128`) y de los
  `403` de área, cargo y prioridad (`:129-131`), y **antes** de toda guarda de contenido, escalón C: valores
  derivados, obligatorios y `422` del certificado (`:132-134`). Por qué es B y no C: decide si la operación puede
  ocurrir sobre ese sujeto ahora, no valida lo que la petición aporta.
- `Finalizado` **SHALL** seguir siendo el único estado sin salida y `liberacion.from` **SHALL** seguir siendo
  exactamente `['En Proceso', 'Verificación']` (`transitions.ts:359`): la guarda no quita origen alguno.

#### Scenario: Equipo con compuesto y patrón vigente — liberar desde En Proceso es 409
- GIVEN un ticket `Equipo nuevo` en `En Proceso` cuyo equipo tiene compuesto `SO₂`, y un gas patrón de `SO₂` disponible con vencimiento posterior a hoy
- WHEN un usuario de Servicio Técnico ejecuta `liberacion` con un número de certificado válido
- THEN responde `409` con un mensaje que nombra `Verificación`
- AND el ticket sigue en `En Proceso` y no existe fila nueva en `ticket_transitions`

#### Scenario: Desde Verificación la guarda no aplica
- GIVEN el mismo equipo y el mismo patrón vigente, pero el ticket está en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `liberacion` con número de certificado
- THEN responde `200` y el ticket pasa a `Finalizado`

#### Scenario: Equipo sin compuesto no es bloqueado aunque haya patrones vigentes
- GIVEN gases patrón vigentes de `SO₂` y `CO`, y un ticket en `En Proceso` cuyo equipo tiene compuesto nulo
- WHEN se ejecuta `liberacion`
- THEN responde `200` y el ticket pasa a `Finalizado`

#### Scenario: Ticket sin equipo no es bloqueado
- GIVEN un patrón vigente de `SO₂` y un ticket `Equipo nuevo` en `En Proceso` sin equipo asociado
- WHEN se ejecuta `liberacion`
- THEN responde `200`, sin `409` de Verificación

#### Scenario: El patrón vigente de otro compuesto no bloquea
- GIVEN un equipo con compuesto `CO` y sólo un patrón vigente de `SO₂`
- WHEN el ticket en `En Proceso` ejecuta `liberacion`
- THEN responde `200` (la guarda compara por compuesto, no por «hay algún patrón»)

#### Scenario: La guarda no alcanza a `verificacion`
- GIVEN un equipo con compuesto `SO₂` y patrón vigente de `SO₂`, ticket en `En Proceso`
- WHEN se ejecuta `verificacion`
- THEN responde `200` y el ticket pasa a `Verificación`

#### Scenario: Posición — el 409 de estado de origen gana a la guarda de compuesto
- GIVEN un ticket `Equipo nuevo` en `Ingresado` (no es origen de `liberacion`) con equipo con compuesto y patrón vigente
- WHEN se ejecuta `liberacion`
- THEN responde `409` con el mensaje de «no aplica desde el estado», no con el de Verificación
- AND mover la guarda de compuesto delante de `ticketService.ts:126-128` pone esta prueba en rojo (regla de mutación 1)

#### Scenario: Posición — el 403 de área gana a la guarda de compuesto
- GIVEN un usuario cuya única área es `Comercial`, y un ticket en `En Proceso` con equipo con compuesto y patrón vigente
- WHEN ejecuta `liberacion`
- THEN responde `403` y no `409`
- AND mover la guarda delante de `ticketService.ts:129-131` pone esta prueba en rojo

#### Scenario: Posición — la guarda de compuesto gana al 422 del certificado y de obligatorios
- GIVEN un ticket en `En Proceso` con equipo con compuesto y patrón vigente, y un cuerpo SIN número de certificado
- WHEN un usuario de Servicio Técnico ejecuta `liberacion`
- THEN responde `409` y no `422`
- AND mover la guarda detrás de `ticketService.ts:134` pone esta prueba en rojo, porque activa a la vez las dos guardas

#### Scenario: Finalizado sigue siendo el único estado sin salida y `liberacion.from` no cambia
- GIVEN el catálogo de `Equipo nuevo` tras el cambio
- WHEN se calcula `sinSalida` sobre la unión de catálogos y se lee `liberacion.from`
- THEN `sinSalida` es exactamente `['Finalizado']` (`packages/shared/src/invariantesGrafo.test.ts:177-180`)
- AND `liberacion.from` es exactamente `['En Proceso', 'Verificación']`

### Requirement: RQ-EN-09 · Sin patrón vigente la liberación pasa y el servidor registra el motivo; la tabla vacía es un caso normal, no un error

Cuando `liberacion` desde `En Proceso` la ejecuta un ticket cuyo equipo **tiene compuesto** y **no existe patrón
vigente** de ese compuesto —con la tabla `public.gases_patron` vacía, o con todas las filas del compuesto vencidas o
no disponibles, o sin ninguna fila de ese compuesto—, el servidor **SHALL** dejar pasar la transición (sujeta al
certificado, RQ-EN-10) y **SHALL** añadir a los `values` que se guardan íntegros en `ticket_transitions`
(`packages/zoho-sync/src/db/repo.ts:314-318`) un motivo con el texto «Sin gas patrón vigente de <compuesto>», con el
compuesto en su forma canónica. Lectura literal de `openspec/config.yaml:2892`: «si no existe, se libera y queda
registrado el motivo».

- **Lo escribe el servidor, no la persona**: es un hecho derivado. Un valor equivalente que el cliente mande en el
  cuerpo **MUST NOT** sustituirlo ni suprimirlo.
- **No hay motivo** cuando no hay guarda que explicar: ticket sin equipo, equipo sin compuesto, o `liberacion` desde
  `Verificación`.
- **La tabla se lee en cada ejecución**; ninguna respuesta anterior se reutiliza.
- **Consecuencia que se escribe como requisito:** hasta que ningún equipo tenga compuesto, la guarda no alcanza a
  nadie; con compuestos sembrados pero la tabla vacía, todos los equipos con compuesto salen de `En Proceso` con
  motivo; sólo con compuestos y patrones vigentes la guarda bloquea (RQ-EN-08).
- **Compuesto no reconocido.** Un equipo cuyo `compuesto` guardado no resuelve a la lista cerrada
  (`gases-patron` RQ-GP-01) —sólo posible por escritura directa en base— **SHALL** tratarse como «con compuesto» y
  «sin patrón vigente» (no como «sin compuesto»), con el motivo nombrando el valor guardado. Supuesto reversible del
  spec: falla hacia visible, no hacia silencio.

#### Scenario: Tabla vacía — pasa y registra el motivo
- GIVEN `public.gases_patron` vacía y un ticket en `En Proceso` con equipo de compuesto `SO₂`
- WHEN se ejecuta `liberacion` con número de certificado
- THEN responde `200` y el ticket pasa a `Finalizado`
- AND la fila de `ticket_transitions` guarda en `values` un motivo que contiene «Sin gas patrón vigente de SO₂»

#### Scenario: Gas vencido no cuenta — pasa con motivo
- GIVEN un único gas de `SO₂`, disponible, con vencimiento anterior a hoy
- WHEN el ticket en `En Proceso` con equipo `SO₂` ejecuta `liberacion` con certificado
- THEN responde `200` con el motivo registrado

#### Scenario: Gas no disponible no cuenta — pasa con motivo
- GIVEN un único gas de `SO₂` con `disponible = false` y vencimiento futuro
- WHEN el ticket en `En Proceso` con equipo `SO₂` ejecuta `liberacion` con certificado
- THEN responde `200` con el motivo registrado

#### Scenario: Sin equipo, sin compuesto o desde Verificación no hay motivo
- GIVEN tres tickets liberables: uno sin equipo, uno con equipo sin compuesto (ambos en `En Proceso`), y uno en `Verificación` con equipo `SO₂`
- WHEN se ejecuta `liberacion` en cada uno
- THEN en ninguno de los tres `values` de la transición contiene un motivo de gas patrón

#### Scenario: El motivo lo impone el servidor
- GIVEN un ticket en `En Proceso` con equipo `SO₂` sin patrón vigente, y un cuerpo cuyos `values` traen un texto propio en el lugar del motivo, o lo omiten
- WHEN se ejecuta `liberacion` con certificado
- THEN `values` guardado contiene el motivo del servidor con el compuesto, en los dos casos

#### Scenario: La tabla se lee en cada ejecución
- GIVEN un ticket en `En Proceso` con equipo `SO₂` y la tabla vacía, donde una primera ejecución de `liberacion` falla por `422` (sin certificado)
- WHEN se inserta un gas de `SO₂` vigente y se repite la ejecución
- THEN responde `409` (la guarda ve el dato nuevo)

#### Scenario: Compuesto no reconocido en el equipo — pasa con motivo, no se ignora
- GIVEN un equipo con `compuesto` guardado `XYZ` (fuera de la lista), por escritura directa, y un patrón vigente de `SO₂`
- WHEN el ticket en `En Proceso` ejecuta `liberacion` con certificado
- THEN responde `200` y el motivo registrado nombra `XYZ`

### Requirement: RQ-EN-10 · El certificado de fábrica es obligatorio en la liberación desde `Verificación` y en la de un equipo con compuesto — `422`, escalón C

La transición `liberacion` **SHALL** declarar el campo de texto `certificado_fabrica` (número del certificado de
calibración de fábrica del equipo) como **no obligatorio en el catálogo**: la obligatoriedad es contextual y la impone
el servidor, porque `buildTransitionPlan` decide sin contexto del ticket (`apps/desk/server/transitionExec.ts:76-77`).
Lectura literal de `openspec/config.yaml:2909` (supuesto s2 de la propuesta): el servidor **SHALL** exigirlo en

1. **toda** `liberacion` desde `Verificación`, cualquiera que sea el equipo, y
2. la `liberacion` desde `En Proceso` de un equipo **con compuesto** (que, por RQ-EN-08, sólo llega aquí sin patrón vigente),

y **MUST NOT** exigirlo en la `liberacion` desde `En Proceso` de un ticket sin equipo o con equipo sin compuesto, ni en
ninguna otra transición. Falta o sólo espacios → `422`, sin escribir nada. El valor aceptado **SHALL** guardarse
recortado en la transición (`values` de `ticket_transitions`), porque es el certificado de **esa** liberación, no un dato
del equipo. Posición: escalón C, junto a los `422` de `ticketService.ts:134`; después de las guardas de B, incluida
RQ-EN-08.

**No es retroactivo y no exime a nadie** (`config.yaml:2909`; supuesto s12): un ticket que ya esté en `Verificación` el
día del despliegue **SHALL** exigir el número al liberarse, como cualquier otro.

#### Scenario: Verificación sin número — 422
- GIVEN un ticket `Equipo nuevo` en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `liberacion` sin número de certificado
- THEN responde `422` con un error que nombra el certificado
- AND el ticket sigue en `Verificación` y no hay fila nueva en `ticket_transitions`

#### Scenario: Sólo espacios equivale a faltar
- GIVEN un ticket en `Verificación`
- WHEN se ejecuta `liberacion` con `certificado_fabrica` igual a «   »
- THEN responde `422`

#### Scenario: Verificación con número — 200 y se guarda recortado
- GIVEN un ticket en `Verificación`
- WHEN se ejecuta `liberacion` con `certificado_fabrica` igual a « CF-2024-0117 »
- THEN responde `200` y el ticket pasa a `Finalizado`
- AND `values` de la fila de `ticket_transitions` contiene `CF-2024-0117` sin espacios

#### Scenario: Verificación sin equipo también lo exige
- GIVEN un ticket `Equipo nuevo` en `Verificación` sin equipo asociado
- WHEN se ejecuta `liberacion` sin número
- THEN responde `422` (la obligatoriedad desde Verificación no depende del equipo)

#### Scenario: Desde En Proceso con compuesto y sin patrón vigente — sin número es 422
- GIVEN un ticket en `En Proceso` con equipo de compuesto `CO` y ningún patrón vigente de `CO`
- WHEN se ejecuta `liberacion` sin número
- THEN responde `422`
- AND con un número válido responde `200`

#### Scenario: Desde En Proceso sin compuesto no se exige
- GIVEN un ticket en `En Proceso` con equipo sin compuesto, o sin equipo
- WHEN se ejecuta `liberacion` sin número
- THEN responde `200` (marcar el campo `required` en el catálogo pondría esta prueba en rojo)

#### Scenario: El certificado sólo se exige en `liberacion`
- GIVEN un ticket en `Verificación`
- WHEN se ejecuta `rechazo_verificacion` sin `certificado_fabrica`
- THEN responde `200` y el ticket pasa a `Notificado`

#### Scenario: Un ticket que ya estaba en Verificación al desplegar no se exime
- GIVEN un ticket en `Verificación` creado antes del cambio, sin ningún dato de certificado en su historial
- WHEN se ejecuta `liberacion` sin número
- THEN responde `422`

#### Scenario: Posición — el 403 de área gana al 422 del certificado
- GIVEN un usuario cuya única área es `Comercial` y un ticket en `Verificación`
- WHEN ejecuta `liberacion` sin número
- THEN responde `403` y no `422`

### Requirement: RQ-EN-11 · El PDF del certificado es opcional, sólo `application/pdf`, con el límite común de subida

El sistema **SHALL** permitir adjuntar, en la liberación, el PDF del certificado de fábrica, con la lista blanca
`application/pdf` y el límite común de subida (`apps/desk/server/util/subida.ts:6`, `:10`). Un adjunto de otro tipo
**SHALL** rechazarse con `415`, como ya hace la única subida de ticket con imágenes
(`apps/desk/server/routes/tickets.ts:56`), y uno que supere el límite **SHALL** rechazarse nombrando ese límite. La
ausencia del PDF **MUST NOT** impedir ni condicionar la liberación; su presencia **MUST NOT** eximir del número
(RQ-EN-10). Dónde se almacena y cómo se vincula a la transición lo fija `design.md`.

#### Scenario: Liberación sin PDF pasa
- GIVEN un ticket en `Verificación`
- WHEN se ejecuta `liberacion` con número y sin adjunto
- THEN responde `200`

#### Scenario: PDF válido se acepta
- GIVEN un fichero de tipo `application/pdf` por debajo del límite
- WHEN se adjunta al certificado de la liberación
- THEN responde con éxito y el PDF queda asociado a ese ticket

#### Scenario: Tipo distinto de PDF — 415
- GIVEN un fichero de tipo `image/png`
- WHEN se intenta adjuntar como PDF del certificado
- THEN responde `415` y no se guarda nada

#### Scenario: Más grande que el límite — rechazado
- GIVEN un PDF de tamaño superior a `LIMITE_SUBIDA_BYTES`
- WHEN se intenta adjuntar
- THEN se rechaza con un mensaje que nombra el límite en MB

#### Scenario: El PDF no sustituye al número
- GIVEN un ticket en `Verificación` y un PDF ya adjunto
- WHEN se ejecuta `liberacion` sin `certificado_fabrica`
- THEN responde `422`

### Requirement: RQ-EN-12 · Alcance: la `liberacion` de servicio no cambia y lo ya liberado no se toca

El cambio **SHALL** afectar sólo a `liberacion` del flujo `equipo-nuevo` (`transitions.ts:359`). `liberacion_sin_factura`
(`transitions.ts:246`, flujo de servicio) **MUST NOT** ganar guarda de compuesto ni certificado. La aplicación del
esquema y del cambio **MUST NOT** modificar, marcar ni rellenar ninguna fila existente de `ticket_transitions` ni de
`tickets` (`config.yaml:2913`: «no se marca ni se corrige»).

#### Scenario: `liberacion_sin_factura` no se ve afectada
- GIVEN un ticket de servicio en `Por Facturar` cuyo equipo tiene compuesto `SO₂` y existe un patrón vigente de `SO₂`
- WHEN se ejecuta `liberacion_sin_factura` con sus campos de hoy
- THEN responde `200` y no exige `certificado_fabrica`

#### Scenario: Lo ya liberado no cambia
- GIVEN un ticket `Finalizado` con su fila de `liberacion` previa al cambio
- WHEN se aplica el esquema nuevo (`migrate`, `packages/zoho-sync/src/db/migrate.ts:24`) sobre esa base
- THEN la fila de `ticket_transitions` y el ticket permanecen idénticos y no se añade ninguna marca ni motivo

## MODIFIED Requirements

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
  (`rechazo_verificacion`, nueva, s2) hacia `Notificado`. `Rechazo de verificación` declara sólo `comment()` y
  `derivacion()`, sin motivo obligatorio (s3), igual que el resto del catálogo. `Liberación` declara además el
  campo de texto `certificado_fabrica`, **no obligatorio en el catálogo** (RQ-EN-10): es la única de las seis que
  lleva un campo de negocio.
- `Finalizado` **SHALL** seguir siendo el único estado terminal de la unión de los dos catálogos: el
  invariante **SHALL** endurecerse a `sinSalida = ['Finalizado']` exactamente — quitar cualquiera de
  las dos salidas de `Verificación` **MUST** devolverlo a esa lista y poner la prueba en rojo.
- Las nuevas aristas cierran un ciclo que incluye a `Verificación`: `En Proceso → Verificación →
  Notificado → Ingresado → En Proceso` (vía `rechazo_verificacion` y `analisis_y_acciones`, ya
  existente). El componente conexo de reentrancia **SHALL** incluir `Verificación`, con cero campos de
  fecha reentrantes — el campo `certificado_fabrica` es de texto, no de fecha.
- Regla 13: ninguna decisión nueva vive en el cliente. `executeTransition` impone origen, flujo y área
  con el mismo catálogo compartido (`apps/desk/server/services/ticketService.ts:125-131`); ampliar
  `liberacion.from` y añadir `rechazo_verificacion` basta para que el servidor las imponga sin tocar la
  guarda. Las dos guardas que dependen del ticket y del equipo (RQ-EN-08, RQ-EN-10) las impone también el servidor.

(Previously: `Verificación` **MUST NOT** tener salida — excepción nombrada del invariante 3 de la
unión, `packages/shared/src/invariantesGrafo.test.ts:177-180`; 5 transiciones, no 6. Y, hasta este cambio, las dos
salidas de `Verificación` y las cuatro restantes declaraban «sólo `comment()` y `derivacion()`»; ahora `Liberación`
añade `certificado_fabrica`.)

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
- WHEN un usuario de Servicio Técnico ejecuta `Liberación` con el número del certificado de fábrica
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

#### Scenario: Los campos declarados — cinco sin campo de negocio y `liberacion` con el certificado
- GIVEN el catálogo `TRANSITIONS_EQUIPO_NUEVO` tras el cambio
- WHEN se leen las claves de `fields` de cada entrada
- THEN las cinco que no son `liberacion` declaran exactamente `comment` y `derivado_a`
- AND `liberacion` declara exactamente `comment`, `derivado_a` y `certificado_fabrica`, este último con `required` falso
- AND añadir un campo a cualquier otra entrada, o marcar `certificado_fabrica` como obligatorio, pone la prueba en rojo (sustituye a «exactamente comentario y derivación» de `invariantesGrafo.test.ts:213-216`)

## Notas fuera de bloques Requirement

- La sección «Fuera de alcance de esta spec» de la spec viva (`openspec/specs/transitions-equipo-nuevo/spec.md:263-271`)
  **se actualiza al fusionar**: se retiran sus viñetas **E3/E4** y **E5** (`:266-269`), porque este cambio las construye;
  se conservan las demás (Soporte remoto → `blueprint-soporte-remoto`; guarda de `habilitar_servicio` → F1B-03; columna
  propia de tablero para `Verificación` y mapa de los tres flujos → F1B-09).
- La tabla de guardas de RQ-EN-05 (`openspec/specs/transitions-equipo-nuevo/spec.md:201-209`) no se reescribe: ya omite
  las guardas de cargo y prioridad de F1C-05. La posición exacta de la guarda de compuesto es la que fija RQ-EN-08, tras
  la guarda 5 (área) y antes de las de contenido (6-8).
- Comprobaciones de persona, NO escenarios automáticos (los `.tsx` están fuera de la red de pruebas por decisión de
  Gerencia F0-00, `vitest.config.ts:16-20`): el campo del certificado y el adjunto de PDF en el formulario de
  `Liberación`, y el mensaje legible del `409`. **Dueño:** Calidad / Comercial, verificación en la aplicación tras
  desplegar (P.4 de la propuesta). **Archivar este cambio no las da por hechas.**

## Fuera de alcance de este delta

- Siembra de compuestos y gases patrón en producción: tarea de persona (Alfonso, `openspec/config.yaml:2897`).
- Pantalla de mantenimiento de gases patrón y edición del compuesto desde la ficha de la hoja de vida → F1B-02 y F1D-01.
- Certificado propio de Ambientalia y sus tres firmas → módulo de informes (`config.yaml:2914`).
- Marcar o corregir liberaciones anteriores (`config.yaml:2913`).
- Columna propia de `Verificación` en el tablero → F1B-09; `remision.ts` (IV-12) y el sincronizador (IV-11) no se tocan.
