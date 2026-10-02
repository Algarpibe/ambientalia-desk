# Delta para `transitions-st` — tres transiciones menos y la cifra anclada a 31 (F1C-09)

Procedencia: `decision/tres-transiciones-y-la-cifra-anclada` (`openspec/config.yaml:3403-3424`, E-140),
maestro vigente R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1249-1254`,
`:6454`). Supuestos S-1..S-5 y pregunta P-1 de `proposal.md`, tal como los deja la propuesta. Las cifras
nuevas se derivan por aritmética del catálogo vigente; el recuento definitivo lo fijan las aserciones.

## ADDED Requirements

### Requirement: RQ-TS-23 · Se retiran tres transiciones del catálogo de servicio

`TRANSITIONS` **SHALL NOT** contener las ids `marcar_pendiente`, `servicio_externo_pendiente` ni
`servicio_externo_notificado` (retiradas por E-103/E-106). Las tres eran de área `Servicio Técnico` simple y
sin campo de fecha, así que **SHALL** conservarse sin cambio el emparejamiento de las ocho compartidas y los
diez campos de fecha reentrantes. Una id retirada **SHALL** rechazarse en el servidor como transición
desconocida y no escribir nada. Una prueba **SHALL** fijar la ausencia por id, no sólo por recuento.

#### Scenario: el catálogo tiene 31 entradas y ninguna es una retirada
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se cuentan sus entradas y se buscan las tres ids
- THEN hay 31 entradas con 31 ids distintas y ninguna de las tres figura

#### Scenario: una id retirada se rechaza y no escribe
- GIVEN un cliente con la lista vieja y un ticket en `En Proceso`
- WHEN envía `marcar_pendiente` al endpoint de transición
- THEN el servidor responde `400 'Transición desconocida'` (guarda 1, escalón A) y no cambia estado ni inserta fila en `ticket_transitions`

#### Scenario: un ticket de servicio que quedó en `Pendiente` no ofrece transiciones
- GIVEN un ticket de flujo `servicio` en `Pendiente` (aún sin migrar)
- WHEN se listan las transiciones aplicables a ese estado
- THEN la lista es vacía y cualquier transición de servicio ejecutada sobre él responde `409`

#### Scenario: mutación — reponer una retirada pone dos pruebas en rojo
- GIVEN una de las tres entradas repuesta en el catálogo
- WHEN corre la suite
- THEN falla el recuento de 31 y falla la prueba de lista de ids retiradas

### Requirement: RQ-TS-24 · `diagnostico_complementario` sale de `En Proceso`

`diagnostico_complementario` **SHALL** declarar `from: ['En Proceso']` y seguir llevando a
`Continuación del proceso` (E-119). Su área y sus campos **SHALL** quedar como estaban. **SHALL NOT** ser
ejecutable desde `Pendiente` en el flujo de servicio.

#### Scenario: origen y destino exactos
- GIVEN `TRANSITIONS`
- WHEN se lee la entrada `diagnostico_complementario`
- THEN `from` es exactamente `['En Proceso']` y `to` es `Continuación del proceso`

#### Scenario: ejecución desde `En Proceso`
- GIVEN un ticket de servicio en `En Proceso` y un usuario con el área de la transición
- WHEN ejecuta `diagnostico_complementario`
- THEN responde `200`, el ticket pasa a `Continuación del proceso` y queda su fila en `ticket_transitions`

#### Scenario: desde `Pendiente` de servicio responde 409
- GIVEN un ticket de servicio en `Pendiente`
- WHEN se ejecuta `diagnostico_complementario`
- THEN responde `409` («no aplica desde el estado») y no escribe nada

#### Scenario: mutación — devolver el origen a `Pendiente` pone en rojo el invariante 1
- GIVEN `from: ['Pendiente']` restaurado
- WHEN corre `invariantesGrafo.test.ts`
- THEN falla el invariante 1 (declarados ≠ derivados), porque `Pendiente` volvería a ser estado de servicio

### Requirement: RQ-TS-25 · `Pendiente` pasa a ser estado sólo de soporte remoto

`Pendiente` **SHALL** figurar en `ESTADOS_SOLO_SOPORTE_REMOTO` y **SHALL NOT** figurar en
`ESTADOS_SERVICIO`, que **SHALL** tener exactamente **20** estados (supuesto S-1; antes 21). `ESTADOS`
**SHALL** seguir en **23** y `Pendiente` **SHALL** seguir clasificado `sin_clasificar` en
`CLASIFICACION_EN_ESPERA`, porque `soporte_pendiente` y `continuacion_soporte` lo usan.
`FASE_POR_ESTADO` **SHALL NOT** contener `Pendiente` y el reparto de fases **SHALL** pasar de 4·12·5 a
4·11·5. `ESTADOS_SIN_SALIDA`, `ESTADOS_EN_ESPERA` y la columna de tablero `pendiente` **SHALL** quedar sin
cambio. Ninguna lista del reloj del SLA **SHALL** contener `Pendiente` (supuesto S-4: si el diseño encuentra
una, se quita en esta tanda).

#### Scenario: los registros dicen 20 / 23 y `Pendiente` es sólo de soporte remoto
- GIVEN el registro de estados tras el cambio
- WHEN se leen `ESTADOS_SERVICIO`, `ESTADOS` y `ESTADOS_SOLO_SOPORTE_REMOTO`
- THEN `ESTADOS_SERVICIO` tiene 20 sin `Pendiente`, `ESTADOS` tiene 23 y `ESTADOS_SOLO_SOPORTE_REMOTO` incluye `Pendiente`

#### Scenario: el bucle de soporte remoto no se ve afectado
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN ejecuta `Soporte pendiente` y `Continuación soporte`
- THEN pasa por `Pendiente` y vuelve a `En Proceso`, con `200` las dos veces

#### Scenario: mutación sobre el registro vigilado — `Pendiente` fuera de la lista sólo-SR
- GIVEN `Pendiente` quitado de `ESTADOS_SOLO_SOPORTE_REMOTO` y fuera del catálogo de servicio
- WHEN corre `invariantesGrafo.test.ts`
- THEN falla el invariante 1 (regla de mutación 2)

#### Scenario: el reloj del SLA no nombra `Pendiente`
- GIVEN la tabla de alarmas de `packages/shared/src/sla.ts`
- WHEN se inspeccionan sus claves
- THEN son exactamente `Notificado`, `Remisión creada` y `Notificación cliente`

### Requirement: RQ-TS-26 · La cifra anclada del maestro dice 31 / 35 / 20 en el mismo commit que el código

`openspec/config.yaml` **SHALL** declarar en `cifras_ancladas` `transiciones` = 31, `pasos_del_mapa` = 35 y
`estados` = 20 de servicio, y **SHALL** cerrar la `divergencia` caducada de `pasos_del_mapa`. La descripción
de la capacidad `transitions-st` en `capabilities` **SHALL** decir «31 transiciones y 20 estados». Estos
valores **SHALL** coincidir con `TRANSITIONS.length`, con las aristas del diagrama completo y con
`ESTADOS_SERVICIO.length`, y **SHALL** cambiar en el mismo commit que el código.

#### Scenario: las tres cifras coinciden con el código
- GIVEN `cifras_ancladas` y el código tras el cambio
- WHEN se comparan
- THEN 31 = `TRANSITIONS.length`, 35 = aristas del diagrama completo y 20 = `ESTADOS_SERVICIO.length`

#### Scenario: la mención a `Pendiente` de `esperas` queda coherente
- GIVEN la entrada `esperas` de `cifras_ancladas`
- WHEN se lee su recuento de estados de servicio
- THEN no cuenta `Pendiente` entre los 20 y sigue diciendo 11 estados en espera

### Requirement: RQ-TS-27 · Los guardianes numéricos llevan las cifras nuevas

Cada prueba que fija una cifra derivada del catálogo **SHALL** afirmar la nueva y ninguna **SHALL** quedar
con la antigua. Las pruebas que usaban `marcar_pendiente` como «transición de servicio sobre un ticket de
soporte remoto» **SHALL** usar `diagnostico_complementario`, y la posición del `409` de flujo **SHALL**
seguir fijada (regla de mutación 1).

| Guardián | Antes → después |
|---|---|
| Invariante 2 (`invariantesGrafo.test.ts`) | 34 transiciones, 21 estados → 31, 20 |
| Unión de ids de los tres catálogos | 44 → 41 |
| Permisos por área | 102 (60/42) → 93 (54/39); barrido de cargo 816 → 744 |
| Ejecución (`transicionesEjecucion.test.ts`) | 34 transiciones en 36 ejecuciones → 31 en 33 |
| Cargos por transición (`cargos.test.ts`) | 5×10×(34+3)=1.850 → 5×10×(31+3)=1.700 |
| Fechas derivadas (`fechasDerivadas.test.ts`) | «31 restantes» → 28 |
| Reentrancia C2 | nueve estados → ocho (sale `Pendiente`) |
| Fases del mapa | 4·12·5 → 4·11·5 |

#### Scenario: ninguna cifra antigua sobrevive en las aserciones
- GIVEN los ficheros de prueba de la tabla
- WHEN se busca la cifra antigua como aserción
- THEN no aparece y todas las pruebas pasan con la nueva

#### Scenario: la guarda de flujo sigue ganando a la de estado con el ejemplo nuevo
- GIVEN un ticket `Soporte remoto` en `En Proceso`
- WHEN se ejecuta `diagnostico_complementario` (de servicio, mismo estado origen)
- THEN responde `409` con el mensaje de flujo; invertir las guardas 3 y 4 lo pone en rojo

### Requirement: RQ-TS-28 · Existe un script de migración de los tickets de servicio en `Pendiente`

Existirá `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`, verificable por una prueba sobre pg-mem
(si pg-mem no admite una sentencia, el diseño declara qué parte se revisa por lectura). El script **SHALL**:
(1) calificar por esquema toda tabla; (2) abrir con un recuento previo de sólo lectura en tres grupos:
servicio con `managed_by_app = true`, servicio con `managed_by_app = false` (listado por número) y soporte
remoto, donde «servicio» es toda clasificación normalizada distinta de «Soporte remoto» (criterio de
`packages/shared/src/flujos.ts:56-60`); (3) dentro de una transacción, insertar en `desk.ticket_transitions`
**una fila nueva** por ticket del primer grupo (`from_status` `Pendiente`, `to_status` `En Proceso`,
`performed_by` que nombra la migración, `transition_id` marcador que no es id del catálogo) y pasar su
`status` a `En Proceso`; (4) ser idempotente (filtro `status = 'Pendiente'`); (5) **SHALL NOT** modificar ni
borrar ninguna fila existente de `ticket_transitions`; (6) **SHALL NOT** tocar los otros dos grupos,
porque el sincronizador devolvería al segundo a `Pendiente` (`packages/zoho-sync/src/db/repo.ts:71`; S-3, P-1);
(7) cerrar con un recuento posterior; (8) llevar la reversión comentada.

#### Scenario: tres tickets, tres desenlaces
- GIVEN tres tickets en `Pendiente`: servicio con `managed_by_app = true`, servicio con `false` y soporte remoto
- WHEN se ejecuta el script
- THEN el primero queda en `En Proceso` con una fila nueva de traza y los otros dos conservan `Pendiente` y no ganan fila

#### Scenario: el recuento previo no escribe y lista los gobernados por Zoho
- GIVEN el mismo estado de datos
- WHEN se ejecuta sólo la sección de recuento previo
- THEN devuelve 1 / 1 / 1, lista por número el ticket gobernado por Zoho y no modifica ninguna tabla

#### Scenario: segunda ejecución sin efectos
- GIVEN el script ya ejecutado una vez
- WHEN se ejecuta otra vez
- THEN no cambia ningún ticket ni inserta ninguna fila

#### Scenario: el historial existente no se reescribe
- GIVEN un ticket con filas previas, entre ellas `marcar_pendiente`
- WHEN se ejecuta el script
- THEN las filas previas quedan byte a byte iguales y la fila añadida es identificable por su marcador

#### Scenario: atomicidad
- GIVEN un fallo forzado entre el `INSERT` y el `UPDATE`
- WHEN se ejecuta el script
- THEN el `ROLLBACK` deja tickets y trazas como estaban (si pg-mem no lo admite, se declara en el diseño y se revisa por lectura)

#### Scenario: todo va calificado por esquema
- GIVEN el texto del script
- WHEN se buscan tablas sin calificar
- THEN toda referencia a `tickets` y `ticket_transitions` va como `desk.tickets` y `desk.ticket_transitions`

### Requirement: RQ-TS-29 · La migración no se ejecuta sola; ejecutarla en producción es tarea de persona

Ni el arranque de la aplicación, ni `migrate.ts`, ni `schema.sql`, ni ninguna ruta **SHALL** ejecutar el
script de `RQ-TS-28`. Su ejecución en producción (recuento previo, migración, recuento posterior) es tarea de
Alfonso, fuera del recuento de tareas (regla del ciclo 1); **archivar el cambio no la da por hecha**.

#### Scenario: nada del código invoca el script
- GIVEN el árbol del repositorio
- WHEN se busca una referencia al fichero del script fuera de `docs/` y de su propia prueba
- THEN no hay ninguna

## MODIFIED Requirements

### Requirement: RQ-TS-01 · El catálogo de transiciones es la única fuente

El catálogo de transiciones del flujo de servicio técnico **SHALL** vivir en
`packages/shared/src/transitions.ts` y **SHALL** ser exactamente **31** entradas sobre **20** estados
(recuento fijado en `invariantesGrafo.test.ts:50-54`).
(Previously: 34 entradas sobre 21 estados.)

- El cliente **MUST** consumir ese catálogo; **MUST NOT** reescribirlo. Es la regla invariable 1 de
  `CLAUDE.md`.
- Lo que la aplicación ejecuta **SHALL** ser `TRANSITIONS`, no `TRANSICIONES_BASE`: la segunda no se
  exporta, y la primera es la que añade la casilla de derivación a todas. Los invariantes **MUST**
  afirmarse sobre `TRANSITIONS` (`invariantesGrafo.test.ts:15-21`).
- Las transiciones aplicables a un estado se obtienen por `transitionsForStatus` y una transición por su id
  con `transitionById`.

**Los siete invariantes del grafo** (F0-04) **SHALL** permanecer en verde:

| # | Invariante | Prueba |
|---|---|---|
| 1 | Los estados declarados son exactamente los derivados de los `from`/`to` | `invariantesGrafo.test.ts:35-42` |
| 2 | 31 transiciones, 20 estados, 31 ids distintos (antes 34, 21, 34) | `:50-54` |
| 3 | `Finalizado` es el único estado sin transición de salida | `:62-66` |
| 4 | Ningún `from` ni `to` apunta fuera del registro | `:76-82` |
| 5 | Las ocho transiciones compartidas son ésas, cada una con su pareja de áreas | `:91-106` |
| 6 | Los campos de fecha reentrantes son exactamente diez | `:137-150` |
| 7 | La superficie HTTP saliente es la declarada | `apps/desk/server/superficieSaliente.test.ts` |

El invariante 1 **SHALL** existir mientras exista `estados.ts`: sin él, la lista declarada a mano
sustituye una regex frágil por una lista frágil, «que es PEOR porque parece rigurosa»
(`estados.ts:8-10`).

#### Scenario: el invariante 2 fija 31, 20 y 31 ids
- GIVEN `TRANSITIONS` y `ESTADOS_SERVICIO` tras el cambio
- WHEN corre el invariante 2
- THEN afirma 31 transiciones, 20 estados y 31 ids distintas

#### Scenario: los invariantes 5 y 6 no cambian
- GIVEN el catálogo sin las tres retiradas
- WHEN corren los invariantes 5 y 6
- THEN siguen en ocho compartidas y diez campos de fecha reentrantes

### Requirement: RQ-TS-04 · `Finalizado` es el único estado terminal

`Finalizado` **SHALL** ser el único estado sin transición de salida
(`invariantesGrafo.test.ts:62-66`; maestro M1.3.8), y **SHALL** ser el único estado que produce
`statusType: 'Closed'` (`transitionExec.ts:5`, `:39`). Todos los demás producen `'Open'`. Retirar las tres
transiciones y sacar `Pendiente` del catálogo de servicio **SHALL NOT** crear ningún otro terminal.
(Previously: sin la cláusula sobre la retirada; el requisito no tenía escenarios.)

`areasSiguientes` **SHALL** devolver lista vacía para un estado terminal: no hay a quién pasarle el
testigo (`packages/shared/src/transitions.ts:325-334`).

#### Scenario: `Finalizado` sigue siendo el único sin salida
- GIVEN los 20 estados de `ESTADOS_SERVICIO`
- WHEN se calculan las transiciones salientes de cada uno
- THEN sólo `Finalizado` no tiene ninguna, y `Notificado` conserva sus tres salidas

#### Scenario: en la unión, `Pendiente` sigue teniendo salida
- GIVEN la unión de los tres catálogos
- WHEN se calculan las salidas de `Pendiente`
- THEN tiene `continuacion_soporte` y no es terminal

### Requirement: RQ-TS-05 · Alcanzabilidad de los 20 estados de servicio

**Verificado por cierre transitivo** sobre `TRANSITIONS` (la cifra se fija en la prueba; la tabla es la
derivación):

| Desde | Estados alcanzados, contando el origen | No alcanzados |
|---|---|---|
| `OV asignada` | 18 | `Ticket creado`, `Remisión creada` |
| `Ticket creado`, sólo por botones | 18 | `OV asignada`, `Remisión creada` |
| `Ticket creado`, sumando el paso sin botón de RQ-TS-03 | 19 | `OV asignada` |

(Previously: 19, 19 y 20 sobre 21 estados; la diferencia es `Pendiente`, que sale del catálogo de servicio.)

`Remisión creada` **MUST NOT** ser alcanzable por ninguna transición con botón; su única entrada es el paso
sin botón de `estadoPorRemision.ts`. No hay estados huérfanos y no hay callejones sin salida más allá de
`Finalizado`.

**Discrepancia con el maestro (R08.1, histórica).** M1.3.8 (`R08.1.md:1413`) decía «18 desde `OV asignada`,
y desde `Ticket creado` los otros 20». Las dos cifras eran correctas pero no sobre la misma base. Con 20
estados de servicio la conclusión —«no hay estados huérfanos»— se sostiene.

#### Scenario: alcanzabilidad desde `OV asignada`
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se calcula el cierre transitivo desde `OV asignada`
- THEN alcanza 18 estados y no alcanza `Ticket creado` ni `Remisión creada`

#### Scenario: no hay huérfanos con el paso sin botón
- GIVEN `TRANSITIONS` y el paso `TRANSICION_REMISION_CONFIRMADA`
- WHEN se calcula el cierre desde `Ticket creado`
- THEN alcanza 19 estados, todos menos `OV asignada`

### Requirement: RQ-TS-07 · Permisos por área

El permiso **SHALL** calcularse con `canExecuteTransition(userAreas, isAdmin, transitionArea)`
(`packages/shared/src/permissions.ts:4-6`), que es siete líneas y el único sitio de la regla.

- Las áreas base **SHALL** ser exactamente tres: `Comercial`, `Servicio Técnico`, `Compras`.
- Un área compuesta se descompone por el separador `' / '` (`packages/shared/src/transitions.ts:313-315`).
- **Ocho** de las **31** transiciones **SHALL** ser compartidas por dos áreas: cinco `Comercial / Compras` y
  tres `Comercial / Servicio Técnico`. El emparejamiento id → área está fijado
  (`invariantesGrafo.test.ts:91-106`).
- Un administrador **MAY** ejecutar las 31 sin que su área importe (`permissions.ts:5`; probado contra el
  servidor en `permisos.test.ts:89-109`).
- La matriz completa **SHALL** ser 31 × 3 = **93 casos: 54 prohibidos y 39 permitidos**
  (23 transiciones de área simple × 2 áreas prohibidas + 8 compartidas × 1 prohibida).
(Previously: 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área simple.)

**El espejo del cliente es legítimo desde F0-04.** `TransitionPanel.tsx:56-58` filtra los botones por área
en el navegador; con la matriz probada contra el servidor cumple el punto 3 de la regla invariable 13
(`permisos.test.ts:35-39`).

#### Scenario: la matriz tiene 93 casos
- GIVEN la matriz derivada del grafo
- WHEN se cuenta
- THEN son 93 casos, 54 prohibidos y 39 permitidos, y el total va escrito a mano en la prueba

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde un estado de origen válido
- THEN el servidor responde `403` y el ticket no se mueve

#### Scenario: el administrador ejecuta las 31
- GIVEN un administrador con un rol que no cubre ninguna transición
- WHEN ejecuta cada una de las 31 desde un estado válido
- THEN todas responden `200`

### Requirement: RQ-TS-11 · La traza: fecha, hora y persona, sin excepciones

Toda transición **SHALL** dejar fila en `ticket_transitions` con su origen, su destino, su área y **quién la
ejecutó** (`repo.ts:314-318`). Es M1.10 del maestro, `[DECIDIDO — R08]`, «no admite excepciones».

- El actor **SHALL** ser el usuario de la sesión, y **MAY** caer a la constante `TRANSITION_ACTOR` sólo si
  la sesión no trae nombre (`ticketService.ts:153`, `transitionActor.ts:3`).
- La cobertura **SHALL** ser de las **31**: el barrido ejercita **todos** los `from` de cada transición
  —`habilitar_servicio` tiene tres—, o sea **33 ejecuciones**, y comprueba en cada una el estado destino y la
  fila del historial (`transicionesEjecucion.test.ts:105-117`, `:272-285`).
  (Previously: 34 transiciones, 36 ejecuciones.)
- La fila de la creación del ticket **SHALL** llevar `from_status = '(creación)'`
  (`transitions.ts:100-110`).
- La fila que añade la migración de `RQ-TS-28` **SHALL** cumplir esta traza (origen, destino, actor que
  nombra la migración, fecha y hora) sin ser una transición del catálogo.

#### Scenario: el barrido ejercita 31 transiciones en 33 ejecuciones
- GIVEN el barrido de `transicionesEjecucion.test.ts`
- WHEN se ejecuta
- THEN hace 33 ejecuciones, con `diagnostico_complementario` desde `En Proceso`, y cada una deja su fila con destino correcto

#### Scenario: la fila de migración lleva fecha, hora y actor
- GIVEN un ticket migrado
- WHEN se lee su fila añadida en `ticket_transitions`
- THEN tiene `performed_at` no nulo y un `performed_by` que nombra la migración

### Requirement: RQ-TS-12 · Derivación: de quién es el trabajo a partir de aquí

Las **31** transiciones **SHALL** terminar en una casilla «Derivado a», y **ninguna MAY** exigirla: derivar
no puede frenar un ticket (`transitions.ts:96-98`; maestro M1.9.2).
(Previously: las 34 transiciones.)

- La clave y el nombre de columna **SHALL** ser `derivado_a` (`transitions.ts:89-94`).
- **Tres** etapas proponen destinatario y **28** heredan el que el ticket ya traía
  (antes 31): `escalado_a_revision` (Cargo · `Director Técnico`), `escalado_a_comercial`
  (Cargo · `Coordinador Comercial`) y `aprobacion` (`primerDerivado`).
- Las dos primeras **SHALL** nombrar un **cargo y no una persona** (`transitions.ts:44-46`).
- El motor **SHALL** distinguir dos silencios (`transitionExec.ts:48-61`): la clave **ausente** no toca lo
  que hubiera; la clave **vacía** borra la derivación.
- Un id de persona recibido **MUST** comprobarse: inexistente o dada de baja produce `422`
  (`ticketService.ts:138-142`).

#### Scenario: las 31 llevan la casilla y ninguna la exige
- GIVEN `TRANSITIONS`
- WHEN se inspeccionan los campos de las 31
- THEN todas terminan en `derivado_a` y ninguna lo declara `required`

### Requirement: RQ-TS-20 · `priority` deja de ser obligatorio en `escalado_a_revision` y `devolucion_a_correccion`

En `escalado_a_revision` y `devolucion_a_correccion` (las dos de área Servicio Técnico), el campo `priority`
SHALL ser **opcional**: una transición SHALL pasar la validación de campos obligatorios sin él. El campo SHALL
seguir declarado con sus opciones `High | Medium | Low` y con destino `priority`, de modo que, si viene, se
aplica como hoy (`RQ-TS-09`) sujeto a la guarda de `RQ-TS-21`.

#### Scenario: sin `priority` la transición pasa
- GIVEN un ticket en un estado válido de origen de `escalado_a_revision` y un usuario del área `Servicio Técnico`
- WHEN ejecuta la transición sin `priority` y con el resto de campos obligatorios
- THEN responde `200` y la prioridad del ticket no cambia

#### Scenario: sin `priority` en la devolución
- GIVEN un ticket en un estado válido de origen de `devolucion_a_correccion` y un usuario de `Servicio Técnico`
- WHEN ejecuta la transición sin `priority`
- THEN responde `200` y la prioridad no cambia

#### Scenario: el campo sigue declarado
- GIVEN el grafo de transiciones
- WHEN se inspeccionan los campos de las dos transiciones
- THEN `priority` figura con `target: 'priority'`, opciones `High`, `Medium`, `Low` y no obligatorio

#### Scenario: las demás transiciones no cambian
- GIVEN las 31 transiciones
- WHEN se comparan los campos obligatorios con los de antes de este cambio
- THEN sólo difiere `priority` en esas dos
(Previously: «las 34 transiciones».)

## REMOVED Requirements

Ninguno. Las entradas retiradas del catálogo no tenían requisito propio; las deja fuera `RQ-TS-23`.
