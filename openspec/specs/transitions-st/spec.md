# Capacidad `transitions-st` — el motor de transiciones del servicio técnico

| Dato | Valor |
|---|---|
| Capacidad | `transitions-st` (`openspec/config.yaml:87-89`) |
| Estado | **as-built completo**, contrastado contra el código. **§3.1 (C1) cerrada por F1A-01** y **C11 cerrada en su regla y en su destinatario de escalado por F1A-02** (RQ-TS-15 y RQ-TS-16), las dos el 2026-09-09; el resto del §3 sigue abierto, y §3.10 dice qué falta de C11 |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 109 ficheros y 929 pruebas en verde, 1 fichero y 2 pruebas saltados, 29,44 s. **Re-verificada en F1A-01** sobre `3aaa0f1`: las mismas cifras. **Ampliada en F1A-02** sobre `ec0ed1f`: 112 ficheros / 953 pruebas, 951 en verde y 2 saltadas |
| Tanda que la escribe | F0-02 |
| Contenido | **19** requisitos (`RQ-TS-01`…`RQ-TS-19`) · **10** entradas de comportamiento actual (§3.1–§3.10), de ellas **§3.1 ya CERRADA** por F1A-01 · **9** discrepancias maestro↔código (M-1…M-9) y **8** diseño↔código (D-1…D-8) |
| Diseño de procedencia | `docs/superpowers/specs/2026-06-04-subsistema-b-transiciones-postgres-design.md` (124 líneas, «Aprobado para planificación»). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | M1.3 (`R08.1.md:1106-1443`) · M1.9.1 (`:1614-1650`) · M1.9.2 (`:1651-1666`) · M1.9.3 (`:1667-1674`) · M1.10 (`:1675-1677`) · Anexo H.2 (`:4488-4496`) |
| Tandas que la tocan | **F1A-01** (C1 — **hecha**, 2026-09-09) · **F1A-02** (C11: la regla y el destinatario del escalado, **hechos**; el disparo, §3.10) · **F1B-06** (dos grafos nuevos) · **F1C-02** (C4) · **F1C-03** (C3) · **F1C-04** (C7) · **F1C-05** (permisos finos) · **F1C-06** y **C9** (tiempos). Origen: `openspec/changes/F0-04/proposal.md:30-36` |
| Depende de | `permissions` (la función pura), `trazas` (el historial), `tickets-core` (la fila del ticket) |

---

## 0 · Procedencia y método

**La regla que hace esta spec distinta de una ficción.** Toda afirmación sobre el código lleva
`ruta:línea`. Toda afirmación sobre el maestro lleva línea del `.md` exportado
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md`, 4.935 líneas). Lo demás
lleva **hipótesis** delante. El diseño de junio no es autoridad: cuando discrepa del código de
septiembre, manda el código y la discrepancia se escribe (§4).

### Las tres fuentes, enfrentadas

| Concepto | Diseño (02/06–12/08) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Catálogo de transiciones | «`shared/transitions.ts` (34 transiciones + campos obligatorios)» (`design:27`) | «34 transiciones y 21 estados» (`:360`, `:889`) | 34 entradas en `TRANSICIONES_BASE` (`packages/shared/src/transitions.ts:171-256` en `fd253aa`), fijadas por prueba (`invariantesGrafo.test.ts:50-54` en `fd253aa`) |
| Registro de estados | No existe en el diseño | «21 estados» (`:391`) | `estados.ts:59-112`. **No existía hasta F0-04**: se derivaban de los `from`/`to` (`estados.ts:3-4`) |
| Destino de escritura | «**Postgres** (no Zoho)» (`design:19`) | — | `packages/zoho-sync/src/db/repo.ts:276-319`. Ninguna llamada a Zoho |
| Actor | Constante `'Equipo Técnico'`, «el login/roles reales son el Subsistema H» (`design:20`) | M1.10: «toda etapa y toda transición deben registrar fecha, hora y persona» (`:1677`) | Usuario de la sesión, con la constante como respaldo (`ticketService.ts:153`, `transitionActor.ts:3`) |
| Permisos | «Mientras tanto **cualquiera puede ejecutar cualquier transición**» (`design:121`) | M1.9.1: «los permisos por área viven en `packages/shared/src/permissions.ts`» (`:1636`) | Impuesto en servidor (`ticketService.ts:129-131`) y probado en las 34 × 3 áreas (`permisos.test.ts:41-110` en `fd253aa`) |
| Endpoint | «Rewrite endpoint … en `server/app.ts`» (`design:88`) | — | `apps/desk/server/routes/tickets.ts:192-194` |

---

## 1 · El grafo

### RQ-TS-01 · El catálogo de transiciones es la única fuente

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
| 5 | Las siete transiciones compartidas son ésas, cada una con su pareja de áreas (Previously: ocho, hasta F1C-10) | `:91-106` |
| 6 | Los campos de fecha reentrantes son exactamente diez | `:137-150` |
| 7 | La superficie HTTP saliente es la declarada | `apps/desk/server/superficieSaliente.test.ts` |

El invariante 1 **SHALL** existir mientras exista `estados.ts`: sin él, la lista declarada a mano
sustituye una regex frágil por una lista frágil, «que es PEOR porque parece rigurosa»
(`estados.ts:8-10`).

### RQ-TS-02 · Dos entradas que nunca se cruzan

`OV asignada` y `Ticket creado` **SHALL** ser la misma fase con dos nombres —el de Zoho y el de la
app— y **MUST NOT** existir ningún camino de una a la otra (`transitions.ts:126-144`; maestro M1.3.2,
`:1145-1149`).

- `habilitar_servicio` **SHALL** salir de las tres fases tempranas —`OV asignada`, `Ticket creado` y
  `Remisión creada`— y llegar a `Ingresado` (`transitions.ts:178`).
- Un ticket venido de Zoho **MUST NOT** entrar en la fase `Remisión creada`: el corte está en
  `estadoPorRemision.ts:41`, que abandona antes de tocar nada si el estado actual no es
  `Ticket creado` ni `Remisión creada`.
- La razón **SHALL** quedar escrita: mover un ticket lo marca `managed_by_app = true`
  (`repo.ts:298`) y lo saca del sincronismo sin que nadie lo haya pedido
  (`estadoPorRemision.ts:32-34`).

> **Given** un ticket con estado `OV asignada`
> **When** se crea y confirma una remisión de entrada para ese ticket
> **Then** el estado del ticket NO cambia, y el ticket sigue en el ciclo de sincronización con Zoho.

### RQ-TS-03 · Dos pasos sin botón, aplicados por el servidor

Dos pasos del mapa **SHALL** aplicarse sin que nadie pulse nada, y **MUST NOT** figurar en
`TRANSITIONS` (`transitions.ts:146-151`; prueba de la exclusión, invertida por esta tanda, en
`invariantesGrafo.test.ts:120-127`):

| Constante | De | A | Disparador |
|---|---|---|---|
| `TRANSICION_REMISION_CONFIRMADA` | `Ticket creado` | `Remisión creada` | Existe al menos una remisión confirmada y vigente |
| `TRANSICION_REMISION_RETIRADA` | `Remisión creada` | `Ticket creado` | Se anula la última confirmada |

- El destino **SHALL** derivarse del recuento de remisiones confirmadas y vigentes, no de quién llama
  (`estadoPorRemision.ts:36-60`). Sólo cuentan las de estado `ok` u `ok_con_avisos` y sin
  `anulada_at` (`:43-47`).
- Es el **único paso reversible automático** del mapa (maestro M1.3.3, `:1161`).
- Un ticket que ya pasó de la fase temprana **MUST NOT** retroceder al anular una remisión
  (`estadoPorRemision.ts:41`).

**Las dos constantes SHALL declarar `from`/`to` explícitos** (`transitions.ts:150-151`), con el par
exacto de la tabla de arriba. Declararlos **MUST NOT** convertirlas en botón: **SHALL** seguir sin
`fields`, **SHALL** seguir siendo de área `Servicio Técnico` a secas y **SHALL** seguir fuera de
`TRANSITIONS`. `estadoPorRemision.ts:41` (la guarda de fase) y `:49` (la elección de destino) **SHALL**
derivarse de `TRANSICION_REMISION_CONFIRMADA.from`/`.to` y `TRANSICION_REMISION_RETIRADA.from`/`.to`, y
**MUST NOT** volver a codificar `STATUS_TICKET_CREADO`/`STATUS_REMISION_CREADA` como literales sueltos
en ese fichero: la declaración pasa a ser la única fuente, y `estadoPorRemision.ts` deja de ser una
tercera copia del mismo par.

(Previously: «Lo que no está en el archivo de transiciones es el `from`/`to`, porque no son grafo» —
las dos constantes sólo declaraban `id`, `name` y `area`, y `estadoPorRemision.ts` reconstruía el par
`Ticket creado`/`Remisión creada` con literales propios, duplicando la declaración de
`transitions.ts:142-144`.)

**Discrepancia de ubicación con el maestro, ahora también de contenido.** M1.3.3 (`R08.2.md:1198`)
dice que los dos pasos viven en `estadoPorRemision.ts`, «no en el archivo de transiciones», y que «lo
que no tienen es `from` ni `to`». Lo primero sigue siendo exacto para la *aplicación* del paso y sigue
siendo falso para su *declaración*; lo segundo, que antes era cierto, pasa a ser **falso** con esta
tanda. La corrección va como entrada 17 de `F0-01_Correcciones_para_el_maestro.md` (propuesta §8).

#### Scenario: las dos constantes declaran su `from`/`to` exacto
- GIVEN `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA`
- WHEN se inspeccionan sus propiedades
- THEN cada una tiene `from` y `to`, con el par de la tabla de arriba, y ninguna aparece en
  `TRANSITIONS`

#### Scenario: `estadoPorRemision.ts` deja de duplicar los nombres de estado como literales
- GIVEN la guarda de fase (`estadoPorRemision.ts:41`) y la elección de destino (`:49`)
- WHEN se comparan con las dos constantes de `transitions.ts`
- THEN las dos leen `.from`/`.to` de las constantes; ningún literal `'Ticket creado'` ni
  `'Remisión creada'` queda escrito aparte en `estadoPorRemision.ts`

#### Scenario: sin regresión de comportamiento — `estadoPorRemision.test.ts` sigue verde sin tocar sus aserciones
- GIVEN la suite `estadoPorRemision.test.ts` tal como existe hoy
- WHEN se ejecuta tras esta tanda
- THEN pasa entera, sin que ninguna de sus aserciones necesite cambiar — es refactor de fuente, no
  cambio de comportamiento (criterio 6 de la propuesta, §7)

### RQ-TS-04 · `Finalizado` es el único estado terminal

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

### RQ-TS-05 · Alcanzabilidad de los 20 estados de servicio

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

---

## 2 · La ejecución de una transición

### RQ-TS-06 · Orden de las guardas, y qué contesta cada una

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
| 7 bis | El contenido de `liberacion_sin_factura`: motivo de la lista cerrada, fecha de calendario real y, con la autorización excepcional, el texto (`RQ-TS-35`) | C | `422 { errors }` | misma sentencia agregada que 6 y 7 (`executeTransition`, el `422` de `:134`), detrás de los `403` de área y de cargo (`:129-131`) |
| 8 | La persona a la que se deriva existe y está activa | C | `422 'La persona a la que se deriva no existe o está dada de baja'` | `:138-142` |
| 9 | La subOV aportada no es de un lote con contrato vencido | C | `422`, motivo de contrato vencido | `:147`, tras la persona derivada y antes de la unicidad (`tickets-core` RQ-TC-25) |
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

#### Scenario: El contenido de la liberación (7 bis) queda detrás de los 403 y dentro del 422 agregado
- GIVEN un ticket en `Por Facturar` y un cuerpo de `liberacion_sin_factura` con un motivo fuera de la lista, de modo
  que dos guardas estén activas a la vez
- WHEN se ejecuta con un usuario que no cubre la guarda de cargo, y otra vez con un administrador
- THEN el primero recibe el `403` de cargo y el segundo el `422` de la lista cerrada — los escenarios de posición PL-1 a
  PL-4 están en `RQ-TS-35`, y mover la guarda nueva delante del `403` o detrás del `422` de la persona derivada debe
  ponerlos en rojo (regla de mutación 1 de `CLAUDE.md`). **ROJO** (el control con administrador).

### RQ-TS-07 · Permisos por área

El permiso **SHALL** calcularse con `canExecuteTransition(userAreas, isAdmin, transitionArea)`
(`packages/shared/src/permissions.ts:4-6`), que es siete líneas y el único sitio de la regla.

- Las áreas base **SHALL** ser exactamente tres: `Comercial`, `Servicio Técnico`, `Compras`.
- Un área compuesta se descompone por el separador `' / '` (`packages/shared/src/transitions.ts:313-315`).
- **Siete** de las **31** transiciones **SHALL** ser compartidas por dos áreas: cinco `Comercial / Compras` y
  dos `Comercial / Servicio Técnico` (`rechazo_comercial` y `rechazo_revision`). El emparejamiento id → área
  está fijado (`invariantesGrafo.test.ts:91-106`).
  (Previously: **ocho** compartidas, cinco `Comercial / Compras` y tres `Comercial / Servicio Técnico`; la
  tercera era `rechazo_cliente`, de área `Comercial` desde F1C-10.)
- Un administrador **MAY** ejecutar las 31 sin que su área importe (`permissions.ts:5`; probado contra el
  servidor en `permisos.test.ts:89-109`).
- La matriz completa **SHALL** ser 31 × 3 = **93 casos: 55 prohibidos y 38 permitidos**
  (24 transiciones de área simple × 2 áreas prohibidas + 7 compartidas × 1 prohibida).
  (Previously: 93 casos, 54 prohibidos y 39 permitidos, con 23 de área simple y 8 compartidas, hasta F1C-10;
  y antes de F1C-09, 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área simple.)

**El espejo del cliente es legítimo desde F0-04.** `TransitionPanel.tsx:56-58` filtra los botones por área
en el navegador; con la matriz probada contra el servidor cumple el punto 3 de la regla invariable 13
(`permisos.test.ts:35-39`).

#### Scenario: la matriz tiene 93 casos
- GIVEN la matriz derivada del grafo
- WHEN se cuenta
- THEN son 93 casos, 55 prohibidos y 38 permitidos, y el total va escrito a mano en la prueba

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde un estado de origen válido
- THEN el servidor responde `403` y el ticket no se mueve

#### Scenario: el administrador ejecuta las 31
- GIVEN un administrador con un rol que no cubre ninguna transición
- WHEN ejecuta cada una de las 31 desde un estado válido
- THEN todas responden `200`

#### Scenario: hay siete compartidas
- GIVEN el catálogo tras el cambio
- WHEN se cuentan las transiciones cuya área contiene `' / '`
- THEN son siete: cinco `Comercial / Compras` y dos `Comercial / Servicio Técnico`

### RQ-TS-08 · Campos y validación de obligatorios

`buildTransitionPlan(transition, values)` (`apps/desk/server/transitionExec.ts:37-99`) **SHALL** ser la
única validación de **presencia** de campos, **SHALL** ser puro y **SHALL** devolver la lista de errores
en `plan.errors` en lugar de lanzar.

**`buildTransitionPlan` DEJA de ser la única validación de campos, a secas.** Desde
`fechas-derivadas-servidor` hay una segunda validación, de **contenido** y sólo para las tres fechas
derivadas (`Fecha creación ticket`, `Fecha Remisión Entrada`, `Fecha Revisión Informe`). Vive fuera de
`buildTransitionPlan`, en `executeTransition` (`apps/desk/server/services/ticketService.ts:134`), por
dos razones: (1) no tocar `transitionExec.ts` — 40 citas vivas en 14 ficheros, medidas el 2026-09-21 —
y (2) acotar la validación nueva a esas tres fechas. Sus errores **SHALL** salir en el mismo
`422 { errors }` que los de presencia, **detrás** de ellos — presencia antes que validez, el sub-orden
que fija `transitions-st` §3.8. (Previously: «SHALL ser la única validación de campos», sin matiz.)
Desde `liberacion-sin-factura-motivo-fecha` hay una **tercera** validación de contenido, sólo para
`liberacion_sin_factura` (`RQ-TS-35`): vive en `packages/shared`, se cablea en esa misma sentencia de `422` y sus
errores también salen **detrás** de los de presencia. El motor sigue **sin** comprobar las opciones de un `select`: esa
comprobación es de la guarda de `RQ-TS-35`, no de `buildTransitionPlan`.

- Un campo `required` que llega vacío **SHALL** producir
  `Falta el campo obligatorio: <label>` (`transitionExec.ts:77`), y el llamador **SHALL** traducirlo a
  `422` (`ticketService.ts:134`).
- El **comentario NUNCA MAY declararse obligatorio**: el ayudante `comment()` no admite parámetro
  (`transitions.ts:65-74`), y por eso el motor se quedó sin la guarda aparte que lo comprobaba
  (`transitionExec.ts:95-99`). Es el principio de diseño nº 4 del maestro cumplido en el código
  (`:1416`).
- Un `checkbox` **required SHALL** exigir que llegue **marcado**: la condición es `asBool(raw) !== true`,
  no `empty` (`transitionExec.ts:76`). Ausente y presente-en-`false` **SHALL** producir el mismo
  `Falta el campo obligatorio: <label>`. Era el defecto **C1**, cerrado en **F1A-01** — ver §3.1.
  Desde `liberacion-sin-factura-motivo-fecha` **ninguna** transición del catálogo declara un `checkbox` obligatorio
  (`RQ-TS-35`); el motor lo **sigue soportando** y la condición se fija con una prueba **sintética** de
  `buildTransitionPlan` (casilla obligatoria ausente, en `false` y marcada), no con el catálogo.
- Un `checkbox` **opcional** ausente **SHALL** seguir escribiéndose como `false`: el chequeo de
  obligatorio va antes del bloque del checkbox, y éste antes del `if (empty) continue`
  (`transitionExec.ts:76-86`, fijado en `transitionExec.test.ts:89-111`).
- Las etiquetas de campo son las **etiquetas exactas de Zoho** (`transitions.ts:20-21`).

#### Scenario: `transitionExec.ts` sólo cambia un comentario
- GIVEN esta tanda completa
- WHEN se compara `apps/desk/server/transitionExec.ts` antes y después
- THEN sólo cambia un comentario (la línea 73, que deja de nombrar la casilla de `liberacion_sin_factura`, diseño §5): la
  validación de contenido de las tres fechas vive en `ticketService.ts` y ninguna línea de lógica se toca

#### Scenario: la casilla obligatoria sigue exigiéndose marcada, aunque el catálogo ya no tenga un caso vivo
- GIVEN una transición **sintética** con un `checkbox` `required` (definida en la prueba, no en `TRANSITIONS`)
- WHEN se construye el plan con la casilla ausente, con la casilla en `false` y con la casilla marcada
- THEN las dos primeras producen `Falta el campo obligatorio: <label>` y la tercera no produce error. **CARACTERIZACIÓN**
  (el motor ya se comporta así; la prueba existe porque el bloque C1 de `transicionesEjecucion.test.ts` deja de ejercitar
  `transitionExec.ts:76`, y quitar la condición `asBool(raw) !== true` debe seguir poniéndola en rojo)

### RQ-TS-09 · Mapeo de campos a columnas

El destino de cada valor **SHALL** derivarse de su `target` (`transitions.ts:17`):

| `target` | Destino | Evidencia |
|---|---|---|
| `comment` | El comentario de la transición | `transitionExec.ts:46` |
| `priority` | La columna `priority` | `transitionExec.ts:88` |
| `derivacion` | La columna `derivado_a` | `transitionExec.ts:13`, `:58-61` |
| `ovAdicional` | `plan.ovAdicional`, NUNCA una columna ni `custom_fields`: lo consume `asociarDesdeTransicion` para crear la asociación adicional (`RQ-TS-18`) | `transitionExec.ts:88` |
| `customField` | Columna promovida si la etiqueta está en `PROMOTED_COLUMNS`; si no, a `custom_fields` | `transitionExec.ts:4`, `:90-92` |

**Verificado en esta tanda:** las **27** etiquetas de campo distintas que declaran las 34 transiciones
*(cifra caduca, recontada el 2026-10-04 contra `8c182fb`: **28** claves `customField` distintas, contando el `campoFecha`;
con este cambio salen la casilla histórica y entran tres claves, así que son **30**, de las cuales **29** están en
`PROMOTED_COLUMNS` y sólo «Texto de la autorización» cae a `custom_fields`)*
—contando el `campoFecha` que arrastra el buscador de órdenes de venta— están **todas** en
`PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts`), de las 39 que ese mapa declara
*(**F1A-04**: 28 de 40. El campo nuevo, «Fecha de aviso al cliente», es además el ÚNICO de
`PROMOTED_COLUMNS` que no viene de Zoho — ver `rows.ts` y la guarda de `repo.test.ts`; hoy el mapa tiene 40
entradas, `rows.ts:85`)*,
**salvo la clave `OV adicional`** del campo nuevo de las dos aprobaciones: no es una etiqueta de Zoho,
NO está en `PROMOTED_COLUMNS` (lo fija el guardián de `transitionExec.test.ts`) y tampoco cae al cajón
`custom_fields`, porque su destino es `ovAdicional` y no `customField`. **Ninguna cae al cajón
`custom_fields`, con UNA excepción desde `liberacion-sin-factura-motivo-fecha`** (`RQ-TS-35`): la etiqueta de texto de
la autorización excepcional (supuesto S-2, «Texto de la autorización») NO está en `PROMOTED_COLUMNS` y **SÍ** cae a
`custom_fields`, a propósito. Las otras dos claves nuevas, `Motivo de liberación sin factura` (etiqueta visible «Motivo», diseño D2) y
`Fecha prevista de facturación`, **SÍ** están en `PROMOTED_COLUMNS` (dos entradas añadidas **al final** del mapa, que pasa de 40 a **42** sin mover las anteriores).
La entrada «Liberación del ticket sin facturar» **SE CONSERVA** en el mapa —es el histórico y la sigue escribiendo el
sincronizador—, aunque ya ninguna transición del catálogo declare esa etiqueta. Confirma M1.3.8 del maestro (`:1415`).

El campo `ordenVenta` **SHALL** comportarse como texto para el motor pero **SHALL** pintarse como
buscador contra las órdenes de venta de Books, y **SHALL** arrastrar la fecha declarada en su
`campoFecha` (`transitions.ts:8-14`, `:85-87`). El campo de OV adicional de `aprobacion_y_repuestos`
NO declara `campoFecha` (su `Fecha Orden De Venta` se teclea) y el de `aprobacion` arrastra
`Fecha Orden de Venta Final`; ninguno resuelve a `orden_venta`/`fecha_orden_venta` (`RQ-TS-18`).

(Previously: la tabla no tenía la fila `ovAdicional` —el `target` se añadió en este cambio— y la frase
de las 27 etiquetas no contemplaba la clave `OV adicional`, que no es etiqueta de Zoho.)

#### Scenario: el motivo y la fecha de la liberación van a columna y el texto a `custom_fields`
- GIVEN `liberacion_sin_factura` con los tres campos de `RQ-TS-35`
- WHEN se construye el plan con un motivo, una fecha y un texto válidos
- THEN el motivo y la fecha quedan en `plan.columns` (con las columnas de `PROMOTED_COLUMNS`) y el texto queda en
  `plan.customFields`. **ROJO**

#### Scenario: el mapa gana dos entradas al final y conserva la histórica
- GIVEN `PROMOTED_COLUMNS` tras el cambio
- WHEN se cuentan sus entradas y se busca «Liberación del ticket sin facturar»
- THEN hay 42 entradas, las dos nuevas son las últimas y la histórica sigue presente. **ROJO** (el recuento) /
  **CARACTERIZACIÓN** (la histórica)

### RQ-TS-10 · Las tres escrituras, atómicas

Una transición **SHALL** producir exactamente tres escrituras, y **SHALL** aplicarlas en una
transacción cuando el pool lo permita, con `ROLLBACK` ante cualquier fallo
(`packages/zoho-sync/src/db/repo.ts:322-347`):

1. **Comentario** en `conversations`, sólo si hay comentario: `kind='comment'`, `author_type='agent'`,
   `is_public=false`, `content_type='plainText'`, `commented_time=now()`, `source='app'`
   (`repo.ts:285-294`). El id se acuña con el prefijo `app-` (`:288`).
2. **Update del ticket**: `status`, `status_type`, las columnas tipadas, la fusión en `custom_fields`,
   y **SHALL** fijar `managed_by_app=true`, `source='app'`, `modified_time=now()` y `updated_at=now()`
   (`repo.ts:298-311`).
3. **Historial** en `ticket_transitions`: `transition_id`, `transition_name`, `from_status`,
   `to_status`, `area`, `performed_by`, `values` y `comment_id` (`repo.ts:314-318`).

Los nombres de columna del `SET` **MUST** proceder de `PROMOTED_COLUMNS` y **MUST NOT** poder llegar
de fuera (`repo.ts:296-297`; la columna de derivación es constante del código, `transitionExec.ts:8-13`).

### RQ-TS-11 · La traza: fecha, hora y persona, sin excepciones

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

### RQ-TS-12 · Derivación: de quién es el trabajo a partir de aquí

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

### RQ-TS-13 · Avisos: se calculan desde el estado de llegada

El destinatario **SHALL** calcularse desde el **estado de llegada** y **MUST NOT** calcularse desde el
área que ejecutó la transición (`packages/shared/src/transitions.ts:317-334`; maestro M1.9.3, `:1670-1671`).

- `areasAAvisar(estado, areasActor)` **SHALL** ser `areasSiguientes(estado)` **menos** las áreas de
  quien pulsó (`services/avisoArea.ts:15-17`). Sin la resta, `facturado` avisaría a Comercial de que
  le toca a Comercial.
- Un administrador tiene las tres áreas, así que **MUST NOT** disparar ningún aviso de área
  (`avisoArea.ts:11-13`; maestro `:1672`).
- Los avisos **SHALL** escribirse **después** de la transición y **fuera de su transacción**, porque
  `avisos` es tabla de la aplicación y `applyTransition` vive en el paquete de sincronización
  (`ticketService.ts:157-164`; maestro `:1673`).
- La contrapartida **SHALL** quedar escrita y aceptada: una caída entre las dos escrituras pierde el
  aviso (`ticketService.ts:161-163`; maestro `:1674`, punto abierto nº 36).
- Los avisos de una misma transición **SHALL** deduplicarse por persona antes de escribir
  (`ticketService.ts:193-194`, `:198-201`) y **SHALL** mandarse en **una** sola llamada a n8n
  (`:165-167`).
- El correo **MUST NOT** poder tumbar la transición; lo que no se sella queda en `NULL`, que es la cola
  de reintento (`ticketService.ts:209-219`).

### RQ-TS-14 · Una orden de venta, un ticket — en la puerta de la transición

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

### RQ-TS-18 · `Aprobación` y `Aprobación y S. Repuestos` añaden una OV, no la sustituyen

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

---


### RQ-TS-17 · Los dos estados de entrega pasan a espera externa

`Por Entregar` y `Por Entregar / Sin facturar` **SHALL** estar clasificados `'externa'` en
`CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59-106`), y sus dos entradas **SHALL**
vivir físicamente dentro del bloque `externa` del registro, no en el de `ninguna`: la lista **SHALL**
seguir agrupada por clase y no por orden alfabético, porque se lee para comprobar la clasificación
(`estados.ts:56-57`).

`ESTADOS_EN_ESPERA` **SHALL** tener **once** entradas tras la reclasificación: `externa` pasa de tres
a **cinco** (`En Espera de Repuestos`, `Servicio externo`, `Notificación cliente`, `Por Entregar`,
`Por Entregar / Sin facturar`) e `interna` se queda en **seis**. El array que fije la prueba **SHALL**
comprobarse contra la salida real de `ESTADOS.filter(...)` (`estados.ts:120`), nunca al revés: mover
las dos entradas cambia su POSICIÓN dentro de `ESTADOS_EN_ESPERA`, y un `toEqual` escrito de memoria
fijaría el orden equivocado.

Es fundamento nuevo, no la modificación de un requisito existente: `transitions-st` no declaraba antes
un requisito formal sobre la composición de `CLASIFICACION_EN_ESPERA`; sólo la mencionaba en prosa
(`RQ-TS-15`, §3.2, §3.7).

#### Scenario: los dos estados de entrega entran en el bloque `externa`
- GIVEN el registro `CLASIFICACION_EN_ESPERA` tras esta tanda
- WHEN se inspeccionan las entradas `'Por Entregar'` y `'Por Entregar / Sin facturar'`
- THEN las dos valen `'externa'` y están dentro del bloque rotulado `externa`, no del bloque `ninguna`

#### Scenario: `ESTADOS_EN_ESPERA` pasa de nueve a once, con el orden fijado contra el filtro
- GIVEN el registro reclasificado
- WHEN se calcula `ESTADOS_EN_ESPERA` (`ESTADOS.filter(...)`, `estados.ts:120`)
- THEN el resultado tiene **once** entradas, en el orden que produce el filtro sobre el registro
  agrupado por clase — no en el orden que tenía la lista de nueve con las dos añadidas al final

---


### RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** seguir declarándose como **dato**, no derivarse del grafo, y **SHALL** medirse en **horas
HÁBILES**, no de reloj. La tabla de alarmas (`packages/shared/src/sla.ts`) **SHALL** tener exactamente
**tres** entradas:

| Estado | Umbral (horas hábiles) | Equivale a |
|---|---|---|
| `Notificado` | 9 | 1 día hábil |
| `Remisión creada` | 27 | 3 días hábiles |
| `Notificación cliente` | 36 | 4 días hábiles |

- El cómputo **SHALL** usar la función compartida `horasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:174`)
  con los cierres de `public.calendario_cierres`, y **MUST NOT** reimplementar el calendario (jornada L-V
  8-17 h, festivos de Colombia y cierres declarados): el tiempo fuera de jornada, en fin de semana, en
  festivo o en un cierre **MUST NOT** contar.
- La unidad **SHALL** seguir siendo la **hora**, no el día.
- En el instante **exacto** del vencimiento la alarma **MUST NOT** estar vencida: la comparación es
  **estricta** (`horas hábiles transcurridas > umbral`). Un plazo de nueve horas hábiles que saltara en la
  hora nueve exacta no sería un plazo de nueve horas.
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). Reentrar en el estado abre una entrada nueva y
  reinicia el reloj.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** medirse ni reportarse como vencido
  (supuesto S-10): no se sabe cuándo entró en su estado. Se documenta, no se inventa un origen; `created_time`
  dice cuándo nació el ticket, que es otra cosa. Esto acota la regla a los tickets que la aplicación ha movido.
- Un estado **sin entrada** en la tabla **MUST NOT** vencer nunca.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA` ni la clasificación de espera. `Remisión creada` (`interna`) y
  `Notificación cliente` (`externa`) están en la vista de esperas y a la vez tienen alarma: la vista y la
  alarma son criterios independientes (`transitions-st` §3.7).
- La alarma **SHALL** ser independiente del reloj del SLA de `c7`: **MUST NOT** detenerse porque el ticket
  esté en `Notificación cliente`, y el reloj de `c7` (F1C-06) queda fuera de este requisito.
- La alarma **SHALL** aplicarse sólo a tickets cuyo flujo aplicable es `servicio` (supuesto S-9 revisado): un
  ticket `Equipo nuevo` en `Notificado` **MUST NOT** medirse, como ya fija `transitions-equipo-nuevo` RQ-EN-06
  (supuesto s6 de `blueprint-equipo-nuevo`), que este cambio no toca. Los tres estados con alarma son del
  catálogo de servicio; el único que se cruza con otro flujo es `Notificado`.
- Quien **dispara** la evaluación es la pasada periódica del servidor (`derivacion-avisos` RQ-AV-17); este
  requisito sólo fija la regla de vencimiento.

(Previously: «Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h» de reloj, comparación estricta sobre
horas naturales, y «El reloj **MUST NOT** aplicarse a un ticket cuyo flujo aplicable no es el de servicio».
La última viñeta decía que nada dispara y que no hay planificador; el disparo lo fija ahora RQ-AV-17. Las
sustituciones de las cifras de `ESTADOS_EN_ESPERA` de las notas históricas no cambian.)

#### Scenario: la tabla tiene exactamente tres alarmas, en horas hábiles
- GIVEN la tabla de alarmas de `packages/shared/src/sla.ts`
- WHEN se inspeccionan sus entradas
- THEN son exactamente `Notificado` 9, `Remisión creada` 27 y `Notificación cliente` 36, todas en horas hábiles

#### Scenario: exactamente en el umbral no vence, ni siquiera fuera de jornada
- GIVEN un ticket que entró en `Notificado` el lunes a las 8:00
- WHEN se evalúa el lunes a las 17:00 (9 h hábiles exactas) y el lunes a las 23:00 (fuera de jornada, sin horas nuevas)
- THEN en ninguno de los dos instantes está vencido

#### Scenario: un milisegundo después del umbral, vence
- GIVEN el mismo ticket, entrado en `Notificado` el lunes a las 8:00
- WHEN se evalúa el martes a las 8:00:00.001
- THEN está vencido (9 h hábiles y un milisegundo > 9)

#### Scenario: el fin de semana no cuenta
- GIVEN un ticket que entró en `Notificado` el viernes a las 16:00 (1 h hábil ese día)
- WHEN se evalúa el lunes a las 16:00 (1 + 8 = 9 h hábiles) y el lunes a las 16:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí; el sábado y el domingo no sumaron nada

#### Scenario: un festivo no cuenta
- GIVEN un ticket que entró en `Notificado` el viernes a las 8:00 y un lunes festivo de Colombia siguiente
- WHEN se evalúa el martes a las 8:00 (9 h hábiles: sólo las del viernes) y el martes a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí; sin el festivo habría vencido el lunes

#### Scenario: un cierre de `public.calendario_cierres` no cuenta
- GIVEN un ticket que entró en `Notificado` el lunes a las 8:00 y un cierre declarado el martes
- WHEN se evalúa el miércoles a las 8:00 y el miércoles a las 8:00:00.001
- THEN en el primer instante no está vencido (9 h hábiles exactas, las del lunes) y en el segundo sí

#### Scenario: `Remisión creada` vence pasadas 27 horas hábiles exactas
- GIVEN un ticket que entró en `Remisión creada` un lunes a las 8:00, sin festivos ni cierres esa semana
- WHEN se evalúa el miércoles a las 17:00 (27 h hábiles exactas) y el jueves a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí

#### Scenario: `Notificación cliente` vence pasadas 36 horas hábiles exactas
- GIVEN un ticket que entró en `Notificación cliente` un lunes a las 8:00, sin festivos ni cierres esa semana
- WHEN se evalúa el jueves a las 17:00 (36 h hábiles exactas) y el viernes a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí

#### Scenario: reentrar reinicia el reloj, se mide desde la última entrada
- GIVEN un ticket que entró en `Notificado` hace muchas horas hábiles, salió, y volvió a entrar hace 2 h hábiles
- WHEN se evalúa
- THEN no está vencido: el origen es la última entrada, no la primera

#### Scenario: un ticket sin foto de entrada no se mide
- GIVEN un ticket replicado de Zoho en `Notificado` sin ninguna fila en `ticket_transitions`
- WHEN se evalúa la alarma
- THEN no se reporta vencido, por muchas horas que hayan pasado desde `created_time`

#### Scenario: la alarma no lee la clasificación de espera
- GIVEN `Remisión creada` y `Notificación cliente`, que pertenecen a `ESTADOS_EN_ESPERA`, y con alarma declarada
- WHEN se calcula el vencimiento de cada uno
- THEN el resultado no cambia si se altera la clasificación de espera, y la aserción antigua «ningún estado con SLA está en `ESTADOS_EN_ESPERA`» (`packages/shared/src/sla.test.ts:51-55`) se reformula a propósito por «la alarma no lee `ESTADOS_EN_ESPERA`»

#### Scenario: el estado `Notificado` del catálogo `Equipo nuevo` no se mide
- GIVEN un ticket cuyo flujo aplicable es `Equipo nuevo`, en `Notificado`, con más de 9 h hábiles desde su entrada
- WHEN se evalúa la alarma
- THEN no está entre los vencidos (RQ-EN-06)

### RQ-TS-16 · A quién se escala — la segunda pieza de C11, cerrada en F1A-02

El destinatario de cada alarma **SHALL** ser un **cargo declarado como dato en la propia tabla de alarmas**
(`packages/shared/src/sla.ts`), no derivado de las transiciones salientes del estado (supuesto S-8). Las
tres alarmas de `RQ-TS-15` **SHALL** declarar el cargo `Coordinador Comercial`.

- Todo estado con alarma **SHALL** tener cargo declarado y no vacío; declarar una alarma sin cargo **MUST**
  ponerse en rojo en una prueba antes de llegar a producción (sustituye al invariante «todo estado con SLA
  tiene destinatario derivado», `packages/shared/src/sla.test.ts:188-191`).
- El cargo de `Notificado` coincide hoy con el que proponen sus transiciones salientes
  (`escalado_a_comercial`), pero esa coincidencia **MUST NOT** ser la fuente: `Notificado` → `Coordinador
  Comercial` es un supuesto (S-3; ninguna decisión lo nombra) y se revierte cambiando un literal de la tabla.
- `Remisión creada` → `Coordinador Comercial` lo fija `decision/escalado-remision-creada`
  (`openspec/config.yaml:1429-1431`) y `decision/escalado-destinatario-doble`
  (`openspec/config.yaml:1499-1500`); `Notificación cliente`, `decision/anexo-3-alerta`.
- Toda alarma **SHALL** declarar además un **área de respaldo** (`areaRespaldo`, una de `AREAS`,
  `packages/shared/src/transitions.ts:310`), hoy `Comercial` en las tres: es a quién va el aviso si el cargo
  no encuentra a nadie (`derivacion-avisos` RQ-AV-15, S-4 segunda revisión).
- La resolución del cargo a personas concretas la hace el servidor (`derivacion-avisos` RQ-AV-15).
- Qué se hace con `destinatarioDelEscalado` y con el caso `Rev./Diagnostico` → Director Técnico, que no tiene
  alarma, lo decide el diseño; esta spec **no** exige conservarlos ni retirarlos.

(Previously: «El destinatario del escalado SHALL derivarse de la tabla de derivación por cargo que ya existe,
no de una jerarquía aparte», con los tres casos `{hay: true}` / `ningun_cargo` / `ambiguo`, «exactamente dos
estados con destinatario» y `ticketsConSlaVencido` devolviéndolo junto al ticket. Sustituido porque `R08.1.md:1575`
lo proponía como camino, no como mandato, y las decisiones de Gerencia nombran el cargo directamente.)

#### Scenario: toda alarma declara un cargo
- GIVEN la tabla de alarmas
- WHEN se recorren sus tres entradas
- THEN cada una tiene el cargo `Coordinador Comercial`

#### Scenario: una alarma sin cargo pone en rojo la prueba
- GIVEN una entrada de alarma de prueba con el cargo vacío
- WHEN corre la prueba de invariantes de la tabla
- THEN falla, nombrando el estado

#### Scenario: cambiar el cargo no depende del grafo
- GIVEN la alarma de `Remisión creada` con otro cargo declarado en la tabla
- WHEN se resuelve su destinatario
- THEN se resuelve el cargo declarado, sin consultar `TRANSITIONS` ni `DERIVACION_POR_DEFECTO`

### RQ-TS-19 · `Remisión creada` sólo alarma si el ticket no tiene orden de venta

La alarma de `Remisión creada` **SHALL** disparar sólo cuando el ticket **no tiene orden de venta por ninguna
vía**, conforme a `decision/escalado-remision-creada` (`openspec/config.yaml:1429-1431`) y al supuesto S-6:

- ni `orden_venta` con valor,
- ni `salesorder_id` con valor,
- ni una asociación **vigente** (`liberada_at IS NULL`) en `public.ov_asociaciones` (`packages/zoho-sync/src/db/schema.sql:539`).

El predicado **SHALL** usar la MISMA definición de tres vías que `ticketConOrdenVenta` (las tres puertas de la
OV), que responde la pregunta inversa y no se puede llamar tal cual; una prueba **SHALL** enfrentar los dos. Un ticket con
orden de venta vencido en `Remisión creada` **MUST NOT** generar aviso **ni** marca de alarma. La condición
se evalúa en cada pasada: si más adelante pierde toda orden y sigue en el estado y vencido, alarma entonces.

#### Scenario: sin orden de venta por ninguna vía y vencido, alarma
- GIVEN un ticket en `Remisión creada`, con más de 27 h hábiles, sin `orden_venta`, sin `salesorder_id` y sin asociación vigente
- WHEN corre la pasada
- THEN dispara la alarma

#### Scenario: con `orden_venta`, sin alarma
- GIVEN el mismo ticket, con `orden_venta` informada y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: con `salesorder_id`, sin alarma
- GIVEN el mismo ticket, sólo con `salesorder_id` informado (sin `orden_venta`) y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: con asociación vigente, sin alarma
- GIVEN el mismo ticket, sólo con una fila vigente en `public.ov_asociaciones`, y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: una asociación liberada no cuenta como orden de venta
- GIVEN el mismo ticket, sólo con una fila de `public.ov_asociaciones` con `liberada_at` informado, y 28 h hábiles
- WHEN corre la pasada
- THEN dispara la alarma

#### Scenario: las otras dos alarmas no miran la orden de venta
- GIVEN un ticket en `Notificado` vencido y con orden de venta
- WHEN corre la pasada
- THEN dispara la alarma: la condición de orden de venta es sólo de `Remisión creada`

---

### RQ-TS-20 · `priority` deja de ser obligatorio en `escalado_a_revision` y `devolucion_a_correccion`

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



### RQ-TS-21 · Guarda de servidor: sólo admin o `puedeFijarPrioridadTop5` cambian la prioridad en una transición

Al ejecutar `escalado_a_revision` o `devolucion_a_correccion`, si `values.priority` **viene** y es **distinta** de la
prioridad actual del ticket, el servidor SHALL responder `403` salvo que el usuario sea administrador o cumpla
`puedeFijarPrioridadTop5` (se CONSUME, regla invariable 13). El mensaje SHALL decir que la prioridad sólo la cambia el
cargo que la gestiona. Si `values.priority` **no viene**, o **viene igual** a la actual, la transición SHALL pasar esta
guarda. Un `403` SHALL no escribir nada: ni estado, ni prioridad, ni fila en `ticket_transitions`. Una transición
distinta de esas dos MUST NOT quedar afectada por esta guarda. Como las dos transiciones son de Servicio Técnico y el
predicado exige además el área `Comercial`, en la práctica sólo el administrador, o un usuario con ambas áreas y cargo
`Director Comercial`, cambia ahí la prioridad (supuesto S-2). Cambio visible desde el despliegue: los técnicos dejan de
poder cambiar la prioridad en esas dos transiciones.

#### Scenario: técnico que cambia la prioridad, 403
- GIVEN un usuario no admin de `Servicio Técnico` y un ticket con prioridad `Low`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `403` y el ticket no cambia de estado ni de prioridad

#### Scenario: técnico en la devolución, 403
- GIVEN un usuario no admin de `Servicio Técnico` y un ticket con prioridad `High`
- WHEN ejecuta `devolucion_a_correccion` con `priority: 'Low'`
- THEN responde `403`

#### Scenario: la misma prioridad pasa
- GIVEN un ticket con prioridad `High` y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `200`

#### Scenario: sin el campo pasa
- GIVEN un técnico no admin
- WHEN ejecuta `escalado_a_revision` sin `priority`
- THEN responde `200`

#### Scenario: ticket sin prioridad y campo informado
- GIVEN un ticket con prioridad nula y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority: 'Medium'`
- THEN responde `403`, porque `Medium` es distinta de la actual

#### Scenario: administrador cambia la prioridad
- GIVEN un administrador y un ticket con prioridad `Low`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `200` y el ticket queda `High`

#### Scenario: usuario con ambas áreas y cargo Director Comercial
- GIVEN un usuario con áreas `Servicio Técnico` y `Comercial` y cargo `Director Comercial`
- WHEN ejecuta `escalado_a_revision` con una prioridad distinta
- THEN responde `200` y la prioridad cambia

#### Scenario: Director Comercial sin área de Servicio Técnico
- GIVEN un usuario sólo del área `Comercial` con cargo `Director Comercial`
- WHEN ejecuta `escalado_a_revision`
- THEN responde `403` por el área, no por esta guarda

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos
- WHEN un no admin de `Servicio Técnico` ejecuta `escalado_a_revision` con una prioridad distinta, y un administrador hace lo mismo
- THEN el primero recibe `403` y el administrador `200`

#### Scenario: otras transiciones no llevan la guarda
- GIVEN una transición distinta de las dos, que no declara `priority`
- WHEN un no admin la ejecuta con un valor `priority` cualquiera en el cuerpo
- THEN la guarda no interviene y el valor se ignora como hoy

### RQ-TS-22 · Posición de la guarda de prioridad

La guarda de `RQ-TS-21` SHALL evaluarse **inmediatamente después** del `403` de cargo y **antes** de todo `422`
(escalón B, F1B-10), y por tanto después de los `409` de flujo y de estado y del `403` de área. El `403` de área SHALL
ganar a esta guarda; esta guarda SHALL ganar al `422`. La suite MUST fallar si la guarda se mueve delante del `403` de
área o detrás del `422` (regla de mutación 1), con pruebas que activen las dos guardas a la vez.

#### Scenario: el 403 de área gana a la guarda de prioridad
- GIVEN un usuario sin el área `Servicio Técnico` y un cuerpo con `priority` distinta de la actual
- WHEN ejecuta `escalado_a_revision`
- THEN el `403` nombra el área, no la prioridad

#### Scenario: la guarda de prioridad gana al 422
- GIVEN un técnico no admin, `priority` distinta de la actual y valores que además darían `422`
- WHEN ejecuta `escalado_a_revision`
- THEN responde `403` de prioridad, no `422`

#### Scenario: el 409 de estado gana a la guarda
- GIVEN un ticket fuera de los estados de origen de la transición y un técnico con `priority` distinta
- WHEN ejecuta `escalado_a_revision`
- THEN responde `409`, no `403`

## 3 · Comportamiento actual, a corregir

Todo lo de esta sección es **as-built**. F0-02 la escribió y **no corrigió nada**; las tandas de la
Fase 1 sí, y cuando una entrada se cierra **se reescribe aquí en vez de borrarse**, porque lo que
queda abierto casi nunca es todo el punto: de C1 (§3.1, cerrada) sigue vivo el histórico ya escrito.

### 3.1 · C1 — el checkbox obligatorio que no frenaba nada · **CERRADO en F1A-01**

**Esta entrada ya no describe el comportamiento actual.** El requisito vive en **RQ-TS-08**; lo que
queda aquí es lo que el arreglo **no** repara, que sigue abierto.

**Qué era.** Un campo `checkbox` declarado `required` no detenía la transición, por dos vías: ausente
(`undefined`) y presente en `false` — la segunda es el camino **normal**, porque un formulario con la
casilla desmarcada manda `false`. La causa: la rama del `checkbox` iba **antes** del chequeo genérico
de obligatorios y hacía `continue`. El único caso vivo era `liberacion_sin_factura` →
`cfCheck('Liberación del ticket sin facturar', true)` (`transitions.ts:246-247` en `2a74fdc`; F1C-05 retiró la casilla, RQ-TS-35).

**Cómo se cerró, y por qué la estimación de «una línea» era corta.** Dos piezas, no una
(`transitionExec.ts:63-86`): (a) el chequeo de obligatorio pasa a ir **antes** del bloque del
checkbox, y (b) para un `checkbox` la condición es `asBool(raw) !== true`, no `empty`. **Verificado
por mutación:** con sólo (a) aplicada, la prueba de la vía `false` seguía roja con «expected 200 to
be 422». La corrección de la estimación va como entrada **14** de
`docs/sdd/F0-01_Correcciones_para_el_maestro.md`.

Cubierto por `transicionesEjecucion.test.ts:41-103` —las dos vías rechazadas con `422` y la casilla
marcada aceptada con `200`— y por `transitionExec.test.ts:89-111`, que fija que un `checkbox`
**opcional** ausente se siga escribiendo como `false`: es lo que impide corregir el defecto moviendo
el bloque demasiado abajo.

**LO QUE SIGUE ABIERTO: el histórico.** `liberacion_sin_facturar` es columna promovida
(`packages/zoho-sync/src/db/rows.ts:121`), así que las filas escritas **antes** de F1A-01 pueden
afirmar `false` en tickets que están exactamente en `Por Entregar / Sin facturar`. El arreglo detiene
la sangría; no repara lo ya escrito, y quien audite liberaciones sin factura sobre esos datos estará
auditando un dato falso. *Hipótesis:* hay filas así en producción; **no se ha verificado contra la
base de producción**, ni en F0-02 ni en F1A-01. Va al Anexo D como punto nuevo, en la entrada 14.

### 3.2 · C3 — cuatro estados de espera sin salida de emergencia · **destino F1C-03**

**Comportamiento actual, a corregir en C3** (maestro M1.3.4, `:1162-1189`, punto abierto nº 31). Los
cuatro **SHALL** estar declarados como dato, no derivados (`estados.ts:151-160`):

| Estado | Única salida | De qué depende |
|---|---|---|
| `En Espera de Repuestos` | `llegada_repuestos` | Que el proveedor entregue |
| `Solicitado` | `entrega_repuestos` | Que almacén entregue la pieza |
| `Servicio externo` | `retorno_servicio_externo` | Que el laboratorio externo devuelva el sensor |
| `En espera de SKU inventario` | `notif_cliente_sku` | Que se cree el SKU en inventario |

El discriminador **SHALL** ir escrito, no sobreentendido: «el suceso del que depende la única salida
ocurre **fuera** de la aplicación» (`estados.ts:129-133`).

**La lección de método, que vale más que la lista:** «salida única» no es proxy de nada. Hay **doce**
estados con una sola salida, entre ellos `Ingresado` y `Ticket creado`, que son trabajo corriente; y
cruzarlo con `en_espera` da **ocho**, con `Liberación Comercial`, `Remisión creada`, `Por Entregar` y
`Por Entregar / Sin facturar` dentro. Por eso los cuatro se declaran y no se derivan
(`estados.ts:142-147`). Los cuatro sobrantes quedan fuera porque su única salida **es un acto que se
ejecuta en la aplicación**: `Liberación Comercial` por `habilitado_para_entrega`, área Comercial
(`estados.ts:135-140`); `Remisión creada` por `habilitar_servicio`, área Comercial
(`transitions.ts:178`); `Por Entregar` por `entrega_al_cliente`, área Servicio Técnico
(`transitions.ts:250-251`); `Por Entregar / Sin facturar` por `entrega_sin_factura`, área Servicio
Técnico (`transitions.ts:248-249`) — los cuatro comparten la misma razón: hay una persona que todavía
no ha entrado, no un suceso del mundo que esperar.

*(Previously, hasta el archivado de `vista-todos-y-estados-en-espera` el 2026-09-10: «cruzarlo con
`en_espera` da **seis**, con `Liberación Comercial` y `Remisión creada` dentro». La cifra cambia porque
`Por Entregar` y `Por Entregar / Sin facturar` son dos de los doce estados con salida única y entran en
`en_espera` con esta tanda — verificado tabulando los 34 `from` de `transitions.ts`, no por sustitución
de «nueve» por «once».)*

#### Scenario: la derivación mal hecha da ocho, no cuatro, y las cuatro que sobran comparten razón
- GIVEN los doce estados con una sola transición de salida y los once estados `en_espera` (tras
  reclasificar `Por Entregar` y `Por Entregar / Sin facturar` a `externa`)
- WHEN se cruzan las dos listas
- THEN el resultado tiene **ocho** elementos, y los **cuatro** que no son de `ESTADOS_SIN_SALIDA` son
  `Liberación Comercial`, `Remisión creada`, `Por Entregar` y `Por Entregar / Sin facturar` — el
  `toEqual` de `packages/shared/src/estados.test.ts` que hoy fija «seis» y dos sobrantes se recalibra
  contra la salida real del cruce, no al revés

### 3.3 · C4 y la reentrancia — once campos de fecha (diez hasta F1C-05) que una segunda pasada reescribe · **destino F1C-02, F1C-06, C9**

**Comportamiento actual, a corregir en C4.** El grafo tiene ciclos, y las transiciones internas a un
ciclo reescriben sus campos de fecha al recorrerlo otra vez. Los campos afectados **SHALL** ser
exactamente **diez**, derivados del grafo y no de una tabla escrita a mano
(`packages/shared/src/reentrancia.ts:218`, conjunto fijado en `invariantesGrafo.test.ts:137-150`).

El más visible es el ciclo entre `Por Facturar` y `Por Entregar / Sin facturar`, que puede recorrerse
indefinidamente y pisa `Fecha Remisión de Salida` (maestro M1.3.5, `:1190-1192`).

**Lo que salva el caso, y por qué esto no obliga a rediseñar aquí:** `ticket_transitions.values` es
`jsonb` y guarda **todos** los valores de cada transición (`repo.ts:314-318`). Las columnas de
`tickets` guardan el **último** valor; el historial guarda **todos**. De ahí la regla que esta spec
deja escrita para `kpis` y F1C-06:

> **Los KPIs de G.6 SHALL calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`.**

Cuatro indicadores de G.6 —columnas 50, 53, 57 y 58— quedan rotos y **sin dueño** asignado
(`reentrancia.ts:71-83`). Elegir entre las dos soluciones de P34 es F1C-02; esta spec sólo registra
que se puede (`reentrancia.ts:32`).

### 3.4 · La tercera puerta de la orden de venta · **DECIDIDA, y se construye**

> **✅ RESUELTO EL 2026-09-10 · `decision/n52-cardinalidad-ov`.** Es el mismo defecto que
> `remisiones` §5.1 y `tickets-core` §4.2, visto desde la tercera spec. El punto abierto nº 52 quedó
> cerrado como **`1 ticket : N OV`**: **se construye la tercera puerta y las dos existentes se
> quedan.** Ver `remisiones` §5.1, que es donde vive el detalle.
>
> *(Previously, hasta el barrido del 2026-09-10: «**Destino: punto abierto nº 52 del maestro**, no una
> tanda — y el arreglo **puede ser retirar** las dos puertas existentes, no añadir la tercera». Ese
> enmarcado lo invirtió la decisión del 10/09.)*

**Comportamiento actual. IV-4 pasa de bloqueado a CONSTRUIBLE** (`config.yaml`,
`incumplimientos_vivos`, IV-4). La regla «una OV, un ticket» tiene **tres** puertas; las **dos**
primeras la comprueban, y ahora **en el mismo orden** entre sí:

| Puerta | Comprueba | Precedencia del `409` frente al `422` de obligatorios | Evidencia |
|---|---|---|---|
| Creación de ticket | Sí, `409` | El **`422` de obligatorios gana** | `ticketService.ts:96-100` (movida detrás de la guarda de cliente, `:61-79`) |
| Transición `habilitar_servicio` | Sí, `409` | El **`422` de obligatorios gana** | `ticketService.ts:148-152` (detrás de la guarda de derivación, `:138-142`; hoy `:134` es el `422` de las fechas derivadas de `fechas-derivadas-servidor`, no el bloque de la OV) |
| **Alta de remisión** | **No** | — | `apps/desk/server/routes/remision.ts:218-244` |

**Las dos primeras SON equivalentes ahora**: comprueban la misma regla en el mismo orden. La inversión
de precedencia que aquí se declaraba —«órdenes opuestos», «va aparte en §3.8»— la **resuelve**
`orden-precedencia-guardas`: el orden único que las hace equivalentes queda declarado, con sus cuatro
escalones, en §3.8. La tercera puerta —el alta de remisión— sigue sin comprobar esta regla de
cardinalidad, y por separado incumple el orden total en dos puntos propios: registrado como **IV-12**,
también en §3.8, sin corregirse aquí.

La tercera confiaba sólo en `WHERE COALESCE(orden_venta,'') = ''`, que impide pisar la OV del propio
ticket pero **no** evitaba que dos tickets distintos acabaran con la misma. Había un `it.fails`
esperando (`apps/desk/server/ordenVentaUnTicket.test.ts:161` en `b99d47a`), con una prueba que fijaba
el daño observable: la orden quedaba en los dos tickets, por sus dos vías (`:156-158` en `b99d47a`).
**CERRADO por `tercera-puerta-orden-venta` (`79cf09b`):** el `it.fails` se puso verde con un `409`, y
la tercera puerta llama hoy también a `ticketConOrdenVenta` (`remision.ts:230`).

(Previously: la fila de creación de ticket decía «el `409` de la OV gana», con evidencia `:45-49` sin
más — falso por CONTENIDO tras esta tanda, no sólo por línea. El párrafo siguiente declaraba las dos
primeras puertas «no equivalentes», con la inversión «aparte en §3.8». Corrección de Gerencia,
2026-09-17, opción (a): hallazgo de `sdd-design` —§6.3 y §7 de `design.md`—, no del encargo original de
`sdd-spec`; el barrido por fichero citado de la primera versión de este delta no lo cazaba porque las
dos frases hablan de CONTENIDO, no sólo de número de línea.)

#### Scenario: Las dos primeras puertas de la OV evalúan ya la misma regla en el mismo orden
- GIVEN un alta de ticket y una transición `habilitar_servicio`, cada una con los obligatorios sin
  completar y una orden de venta ya asociada a otro ticket
- WHEN se ejecuta cualquiera de las dos
- THEN las dos responden `422` (los obligatorios ganan) — ya no hay inversión de precedencia entre
  ellas

### 3.5 · C5 — las transiciones no llevan tipo de evento · **destino: sin tanda asignada**

**Comportamiento actual, a corregir en C5** (maestro `:1439-1443`, punto abierto nº 35). Las 34
transiciones llevan `area` y `fields` y **no** llevan tipo de evento (operativa / decisional /
logística): el `interface Transition` sólo declara `id`, `name`, `from`, `to`, `area`, `fields`
(`transitions.ts:55-62`). Sin ese atributo, el análisis de tiempos por tipo de evento de M7.3 no es
calculable.

### 3.6 · IV-1 — la vista consumía el nombre del estado por regex · **CERRADO en `vista-todos-y-estados-en-espera` (F1B-08)**

**Esta entrada ya no describe el comportamiento actual.** El requisito vive ahora en la capacidad
`vistas-tablero`, requisito RQ-VT-04; lo que queda aquí es el histórico del defecto y su cierre, con el
mismo patrón que §3.1 (C1).

**Qué era** (comportamiento a corregir, destino F1B-08 antes de esta tanda). `boardView.ts:35`
clasificaba las esperas con `/espera/i` sobre el nombre del estado, usado en `:43` y `:44`. El registro
declaraba ocho estados en espera (`estados.ts:59-111` en `ad1875b`); la regex casaba con exactamente
**dos**: `En Espera de Repuestos` y `En espera de SKU inventario`. Cero falsos positivos entre los 13
estados restantes. Defecto **por defecto**, no por exceso.

**Cómo se cerró.** `boardView.ts:39` consume la lista `ESTADOS_EN_ESPERA`
(`packages/shared/src/estados.ts:120`) directamente —no `enEsperaDe`—, en vez de la regex: D3 de
`design.md` prefirió el `.includes()` porque `enEsperaDe` devuelve la CLASE (`externa`/`interna`) y
obligaría al cliente a reescribir esa distinción, que es la misma regla movida un metro (ver
`vistas-tablero` RQ-VT-04, que traía esta misma imprecisión y se corrigió en el mismo archivado).
Cubierto por el tripwire real que importa `applyBoardView` y afirma sobre su salida (`vistas-tablero`
RQ-VT-04), verificado por mutación contra el tripwire falso que reimplementaba la regex localmente
(`estados.test.ts:113-121` en su momento, que se **retiró**: sus imports nunca incluían `boardView` y
por tanto nunca podía ponerse rojo al arreglar el fichero que decía vigilar; ese tripwire ya no existe
en el árbol).

F0-04 dejó el registro que lo cierra (`ESTADOS_EN_ESPERA`, `estados.ts:120`); consumirlo era F1A y se
hizo en esta tanda.

*(Previously: «destino REASIGNADO: F1B-08», sección clasificada como comportamiento actual a
corregir.)*

#### Scenario: el registro reemplaza la regex, y el tripwire real lo demuestra
- GIVEN el registro `ESTADOS_EN_ESPERA`, existente desde F0-04
- WHEN `boardView.ts:39` consume `ESTADOS_EN_ESPERA` en vez de `/espera/i`
- THEN el tripwire de `vistas-tablero` RQ-VT-04 se mantiene verde tras el cambio, y el tripwire falso
  que antes vivía en `estados.test.ts:113-121` ya no existe

### 3.7 · La vista y el reloj no leen la misma lista

**No es un defecto: es la regla, y si no queda escrita F1C-06 la pierde** (`estados.ts:26-33`). Tres
criterios distintos usan la palabra «espera» y **MUST** nombrarse distinto:

| Nombre | Criterio | Fuente | Alcance |
|---|---|---|---|
| `sin_salida` | Su única salida depende de algo que la aplicación no controla | M1.3.4 (`:1162`) | **4 estados** |
| `en_espera` | El ticket está parado esperando el acto de un tercero y el área dueña no puede hacer nada por su cuenta | Vista del tablero | **11 estados** |
| `bodegaje` | El tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente | M1.10 `[DEFINIDO — R08]` (`:1686`) | **3 periodos entre fechas**, no estados |

> **La vista muestra las once. El reloj del SLA NO lee esta clasificación** (`estados.ts:28`).

El reloj para en los tres bodegajes, que son periodos entre fechas. Un estado **MAY** estar
`en_espera` sin parar ningún reloj, y un bodegaje **MAY** transcurrir sin pasar por ningún estado de
la lista.

**Y desde F1A-02 esa regla tiene un caso que la demuestra, no sólo una advertencia.** El único
estado con SLA declarado es `Notificado`, y está clasificado `ninguna` (`estados.ts:91`): no es
ninguno de los once de la vista ni de los cuatro sin salida. La primera regla por tiempo que el
código tiene lee una lista **distinta** de la que enseña el tablero, exactamente como §3.7 anticipaba
cuando todavía era hipótesis. Probado en `packages/shared/src/sla.test.ts` — si alguien «arreglara»
el reloj haciéndolo leer `ESTADOS_EN_ESPERA`, se pone rojo. Ver `RQ-TS-15`.

**Actualizado el 2026-09-29 por `alarmas-horas-habiles` (F1B-08).** Desde entonces hay TRES estados con alarma
(RQ-TS-15; umbrales en `packages/shared/src/sla.ts:32-35`, alarmas en `sla.ts:137-141`): `Notificado` (9 h, `ninguna`, `estados.ts:91`), `Remisión creada` (27 h, `interna`, `estados.ts:86`) y `Notificación cliente` (36 h, `externa`, `estados.ts:65`). El reloj sigue sin leer
`ESTADOS_EN_ESPERA` (escenario S11 de la propuesta, RQ-TS-15): dos de los tres estados con alarma están en la
clasificación de espera, pero la alarma y la vista siguen siendo criterios independientes.

`Pendiente` **SHALL** quedar como `sin_clasificar`, que es valor válido y no un hueco: obligar a
clasificar forzaría a inventar la respuesta (`estados.ts:53-54`, `:101-105`). Lo decide Servicio
Técnico.

*(Previously, hasta el archivado de `por-entregar-es-espera` el 2026-09-12: la tabla
declaraba `en_espera` con **9 estados**, y el texto decía «la vista muestra las nueve».)*

⚠️ **Riesgo abierto, no resuelto por esta tanda (R-1 de `vista-todos-y-estados-en-espera`).**
`packages/shared/src/sla.test.ts:51-55` en `bb58e83` afirmaba que ningún estado con SLA está en `ESTADOS_EN_ESPERA`
— más fuerte que la regla escrita arriba, que sólo exige independencia, no exclusión mutua. Si una
tanda futura declara SLA para `Remisión creada` (la otra mitad de P21,
`Decisiones_Gerencia_2026-09-10.md:336-342`), esa prueba se pondrá roja sin que nada esté mal; se
reformula entonces, no se toca preventivamente aquí. Detalle en
`sdd/vista-todos-y-estados-en-espera/archive-report`.

#### Scenario: Remisión creada entra en la vista sin mover el reloj
- GIVEN que `Remisión creada` pasa a clase `interna` (P21) y por tanto entra en `ESTADOS_EN_ESPERA`
- WHEN se consulta `sla.ts` para ese estado
- THEN no tiene SLA declarado, y `packages/shared/src/sla.test.ts:51-55` en `bb58e83` sigue verde: la vista muestra
  un noveno estado en espera sin que el reloj se entere

### 3.8 · El orden único de precedencia entre guardas — cerrado en el motor por `orden-precedencia-guardas`

`plan:425` (`ad65161`) entrega un **orden total**, no una regla acotada por puerta ni redactada por
código HTTP.

**`SHALL`, sin recortes.** `A < B < C < D` es un orden total sobre las guardas. Toda guarda de un
escalón anterior **SHALL** evaluarse antes que cualquier guarda de un escalón posterior. No se acota
por grupo, no se enuncia como «precedencia observable» y no admite excepción escrita.

| Escalón | Qué clase de cosa comprueba | Guardas verificadas |
|---|---|---|
| **A · existencia** | ¿está presente y existe lo que la petición direcciona, o aporta por identificador? | `:123` transición desconocida · `:125` ticket no encontrado · `:24` falta el equipo · `:25` equipo manual o equipo nuevo (F1B-15) · `:28` cliente provisional (F1B-15) · `:27` equipo no registrado · `:39` OV no encontrada |
| **B · estado y permiso del sujeto** | ¿puede esta operación ocurrir sobre este sujeto ahora? | `:126-128` estado de origen · `:129-131` área · `:44` y `:131` cargo de la OVI que entra (F1B-03) |
| **C · contenido** | ¿es válido y coherente lo que la petición aporta como contenido? | `:61-79` equipo↔cliente · `:88` obligatorios · `:90` cliente no encontrado · `:91` contenido del alta manual (F1B-15) · `:134` obligatorios del plan · **`:134` fecha derivada sin fuente inválida, fijada por el diseño (`fechas-derivadas-servidor`, nueva; ver `RQ-TS-08`)** · `:138-142` derivación · **`:96` contrato vencido en el alta (misma sentencia que la cuarentena, antes de D) · `:147` contrato vencido en `habilitar_servicio`, última de C (`registro-contrato`, `tickets-core` RQ-TC-25)** |
| **D · unicidad sobre un valor aportado** | ¿el valor aportado choca con otro registro? | `:96` NIT del provisional ya en Books, 409 con candidatos (F1B-15, P-B) · `:96-100` OV ya usada en el alta (bloque que `orden-precedencia-guardas` movió detrás de `:90`) · `:148-152` OV ya usada en `habilitar_servicio` (bloque que `orden-precedencia-guardas` movió detrás de `:142`) |

**La frontera A/C.**
- `:90` «Cliente no encontrado» es **C**, no A: no comprueba una entidad aportada tal cual, comprueba
  el `clientId` **ya resuelto** —cuerpo, orden de venta (`:41`) o equipo (`:64`)—. Valida el resultado
  de una resolución, no un identificador recibido.
- `:138-142` «la persona a la que se deriva» es **C**, no A (obs. #702): no es existencia pura, rechaza
  también a quien existe pero está dado de baja (`:141`).

**El criterio de fondo de P1 sobrevive intacto:** primero lo que el usuario puede arreglar (A y C),
después lo que no (D). La escalera sólo lo hace decible sin contradecir a P2.

**Sub-orden dentro de un escalón**, fijado por dependencia de datos y por prueba, no por la escalera:
presencia antes que validez (`:134` obligatorios del plan antes que la fecha derivada sin fuente
inválida —misma línea, `fechas-derivadas-servidor`—, y ésta antes de `:138-142` derivación) y el hueco
se rellena antes de contarlo (`:61-79` antes de `:88`, porque la rama (i) de `:61-64` tiene que poner
`clientId` antes de `:84`).

#### a) Las dos puertas de la OV comprueban ahora la misma regla en el mismo orden

| Puerta | Orden declarado (guardas reales, tras esta tanda) | Quién gana ante el error doble (obligatorios / OV ya usada) |
|---|---|---|
| `createManagedTicket` | `:24` A · `:25` A · `:27` A · `:28` A · `:39` A · `:44` B (cargo de la OVI, F1B-03) · `:61-79` C · `:88` C · `:90` C · `:91` C · `:96` C (contrato vencido; Garantía sólo con OVI, F1B-03) · `:96` D (NIT en Books, P-B) · `:96-100` D (OV, última) | el **`422`** de obligatorios (`ticketService.test.ts:345`, `:352`) |
| `executeTransition` | `:123` A · `:125` A · `:126-128` B · `:129-131` B · `:134` C · fecha derivada C (nueva) · `:138-142` C · `:147` C (contrato vencido) · `:148-152` D (movida, última) | el **`422`** de obligatorios (`ticketService.test.ts:195`) |

Cero inversión: las dos puertas evalúan la misma pareja en el mismo orden.

(Previously: sin la guarda de contrato vencido en ninguna de las dos filas ni en el escalón C; la añade
`registro-contrato` (F1B-11, cambio 3 de 3) como última guarda de contenido de cada puerta, y el delta de
`RQ-TS-06` dejó este arreglo documental para el archivo.)

(Previously: la tabla citaba `createManagedTicket` en `ticketService.ts:22-60` en `38bd062` y `executeTransition`
en `:82-110` en `38bd062`, con **cinco** guardas cada uno —los dos rangos se cortaban justo donde empieza la guarda
equipo↔cliente— y las pruebas contradictorias citadas eran `ticketService.test.ts:295` y `:176`. Tras
`orden-precedencia-guardas` las evidencias pasaron a `:327`/`:336` y `:194`, y esta tanda —
`fechas-derivadas-servidor` — las reancla otra vez contra `4976787`: `:345`/`:352` y `:195`, más la
guarda de fecha derivada en `executeTransition`.)

#### b) El `409` de estado sigue contestando antes que el `403` de área — conservado como sub-orden de B

En `executeTransition`, la guarda del estado de origen **SHALL** evaluarse antes que la guarda del área
(`:126-128` antes de `:129-131`). Las **tres** pruebas de posición que clavan la cadena completa:
`ticketService.test.ts:158` (estado > área), `:164` (estado > obligatorios) y `:170` (área >
obligatorios).

**Alcance real, para no exagerarlo.** El middleware ya exige sesión antes de llegar aquí
(`routes/tickets.ts:35`): no es exposición a un anónimo, y el `403` llegaría igual en cuanto el ticket
estuviera en el estado bueno. Es inconsistencia de contrato, no fuga.

#### c) Contrato de errores: `404` frente a `422` (P3)

El sujeto que la propia ruta direcciona por identificador **SHALL** producir `404` cuando no exista; la
entidad referenciada desde el cuerpo de la petición, o desde un dato ya guardado, **SHALL** producir
`422` cuando no exista o no sea válida. La distinción es por **quién nombra al sujeto** (la URL) frente
a **quién aporta la referencia** (el cliente, en el cuerpo o en datos previos) — nunca por el código en
sí. Ningún código, texto ni guarda de producción de `ticketService.ts` ni de `remision.ts` cambia por
este contrato: se fija con un guión de prueba nuevo, que se pone en rojo al invertir cualquiera de los
dos casos.

**Bajo `strict_tdd`:** las dos comprobaciones del contrato 404/422 nacen **verdes** —el código ya
distingue por dónde llega el sujeto—; su rojo se obtiene **por mutación**: invertir el código de venta
en cada caso, correr el guión, confirmar el rojo, revertir con `git diff`.

#### Las tres puertas contra el orden total

| Puerta | Secuencia de escalones tras esta tanda | Veredicto |
|---|---|---|
| `createManagedTicket` | A A A A A C C C C C D D | **cumple** — la quinta C, la última, es el contrato vencido de `registro-contrato` (`:96`); la primera D es el NIT en Books de F1B-15 (`:96`) |
| `executeTransition` | A A B B C C C C D | **cumple** — la C añadida es la fecha derivada de `fechas-derivadas-servidor`; la última, el contrato vencido de `registro-contrato` (`:147`) |
| Alta de remisión (`remision.ts`, no se toca) | A A C A D C A D | **incumple, en dos puntos → IV-12** |

(Previously: `createManagedTicket` | A A A C C C D y `executeTransition` | A A B B C C C D, sin el contrato
vencido; antes de esa, `executeTransition` | A A B B C C D — seis escalones, sin la fecha derivada.)

**El precedente de F1B-01 es consecuencia del orden, no una excepción.** `remision.ts:155` —el `422`
del serial, escalón A— gana al `409` de remisión pendiente (`:177`, escalón D) porque A precede a D. La
prueba de posición `remisiones.test.ts:988` queda intacta, sin necesidad de declarar nada aparte.

**El alta de remisión no cumple el orden total, y se registra sin corregirse** (IV-12, `CLAUDE.md`,
`openspec/config.yaml`):
1. **C antes que A** — `remision.ts:127` (fecha inválida, C) corre antes que `:155` (falta el serial,
   A).
2. **A después de C** — `remision.ts:220` (OV no encontrada, A) corre después de `:127` y de `:197`
   (ítems fuera del checklist, C).

Ninguno de los dos se corrige aquí: reordenar el alta reabriría el precedente que F1B-01 fijó a
propósito, sin una decisión de Gerencia que lo pida.

#### Scenario: La guarda de contenido equipo↔cliente gana a la guarda de unicidad de la OV
- GIVEN un alta cuyo equipo pertenece a un cliente distinto del solicitado, y cuya orden de venta ya
  está asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (equipo↔cliente, escalón C) y no `409` (OV, escalón D)

#### Scenario: Dentro del escalón B, el estado de origen sigue precediendo al área
- GIVEN un ticket en un estado que no admite la transición pedida, ejecutado por un usuario sin el
  área requerida
- WHEN se ejecuta la transición
- THEN responde `409` (estado de origen) y no `403` (área)

#### Scenario: El sujeto direccionado por la URL responde 404; la referencia del cuerpo responde 422
- GIVEN una petición cuyo identificador de ruta no existe
- WHEN se procesa
- THEN responde `404`
- GIVEN una petición cuyo identificador de ruta sí existe, pero cuya referencia del cuerpo (p. ej. la
  orden de venta) no existe
- WHEN se procesa
- THEN responde `422`

#### Scenario: El alta de remisión no cumple el orden total, y el desvío queda registrado sin corregirse
- GIVEN una fecha inválida y un ticket sin serial en la misma petición de alta de remisión
- WHEN se envía
- THEN responde `422` de fecha inválida (escalón C) antes que la falta de serial (escalón A) — IV-12

#### Scenario: La fecha derivada sin fuente inválida es escalón C, y no altera la escalera A-B-C-D

**Garantía estructural documentada, no escenario con test de ejecución pendiente.** De las 34
transiciones declaradas en `packages/shared/src/transitions.ts`, sólo `habilitar_servicio`
(`:178-189`) declara `cfOrdenVenta` — el campo que activa la guarda de unicidad de OV, escalón D — y
esa misma entrada no declara ninguna de las tres fechas derivadas; y la única transición que declara
fechas derivadas junto a otros campos propios, `ingreso_a_servicio` (`:190-191`, declara `Fecha
creación ticket` y `Fecha Remisión Entrada`), no declara `cfOrdenVenta`. El GIVEN de abajo — una
fecha derivada inválida sin fuente Y una orden de venta ya asociada a otro ticket, en la MISMA
petición — no es alcanzable hoy con ninguna de las 34 transiciones reales: no existe una que declare
los dos campos a la vez.

La garantía queda sostenida por inspección de código y por la prueba de mutación de posición (regla
de mutación 1 de `CLAUDE.md`): el orden lineal de `executeTransition` valida la fecha derivada
(escalón C, `ticketService.ts:132-134`) incondicionalmente antes que la unicidad de OV (escalón D,
`ticketService.ts:148-152`), sin ninguna rama que pueda invertirlos, y ese mismo tramo está probado
en rojo y revertido por los casos `P-a`/`P-b` de
`apps/desk/server/services/valoresDeTransicion.test.ts:176-197`.

- GIVEN una transición con sus obligatorios completos, sin fuente para una fecha derivada, y un valor
  tecleado inválido, ejecutada sobre un ticket con una orden de venta ya asociada a otro ticket
- WHEN se ejecuta la transición
- THEN responde `422` de la fecha (escalón C) y no `409` de la OV (escalón D)

> **Nota — esta enmienda no cierra la puerta a la cobertura de ejecución.** Si en el futuro una
> transición real llega a declarar a la vez un campo de fecha derivada y `cfOrdenVenta`, el GIVEN de
> arriba pasa a ser alcanzable con datos reales y el requisito vuelve a exigir un test de integración
> que lo ejercite exactamente — esta nota documenta que hoy (34 transiciones, ninguna combina los dos
> campos) la garantía es estructural, no que quede eximida para siempre.

### 3.9 · Dos cuentas mal en el docblock de la derivación · **destino F1B-06**

**Comportamiento actual, a corregir en F1B-06** (la tanda que toca el fichero). El docblock de
`DERIVACION_POR_DEFECTO` (`transitions.ts:258-266`) tiene **dos** recuentos incorrectos, y van
juntos:

| Línea | Dice | Es |
|---|---|---|
| `transitions.ts:262` | «lo que hacen las otras **32**» | **31** (34 − 3 que proponen) |
| `transitions.ts:265` | «en **35** declaraciones no» | **34** |

Es defecto de **comentario, no de comportamiento**: el mapa tiene tres entradas y `TRANSITIONS`
tiene 34, y las dos cosas están probadas (`invariantesGrafo.test.ts:50-54` en `fd253aa`). Aquí el maestro tiene
razón y el código no: M1.9.2 (`R08.1.md:1653`) dice «treinta y una», que es la cifra correcta. Ver
M-5 en §4.2.

F0-02 **MUST NOT** corregirlo: es código, y esta tanda no toca código.

---

### 3.10 · C11 — lo único que falta es el planificador · **destino: sesión de trabajo**

> **CERRADO el 2026-09-29 por `alarmas-horas-habiles` (F1B-08).** El disparo existe —`pasadaAlarmas` encadenada en `apps/desk/server/index.ts:88` antes del ritmo de contratos y de la sincronización—; el destinatario ya no se deriva del grafo sino que lo declara `ALARMAS_SLA` (cargo y área de respaldo), con `destinatarioDelEscalado` como comprobación de coherencia (`sla.ts:26-29`). «No hay planificador» y la tabla de abajo quedan como registro de lo que era cierto al escribirse.

**Cerrado en F1A-02: la regla Y el destinatario del escalado** (`RQ-TS-15`, `RQ-TS-16`). **Abierto:
el disparo.** Es una cosa, no dos, y la lista se acortó al releer el maestro una línea más allá.

**No hay planificador. Nada consulta el reloj.** El maestro lo dice de sí mismo y sigue siendo cierto
después de esta tanda: «`[ABIERTO — AS-BUILT]` No existe hoy ninguna transición por tiempo en el
blueprint implementado. Ni escalado automático, ni caducidad de las cuatro esperas. Todo movimiento
requiere que alguien pulse un botón o que el servidor reaccione a una remisión» (`R08.1.md:1588`).
**Verificado por comando** en F1A-02: `grep -rn "setInterval\|cron\|scheduler"` sobre
`apps/desk/server/` y `packages/` no devuelve ninguna llamada. `ticketsConSlaVencido` es exactamente
la consulta que un planificador llamaría —y ya devuelve el ticket, desde cuándo y a quién escalarlo—;
hoy no la llama nadie.

> **Corrección de esta misma entrada, y es una lección de método.** Su primera redacción decía que el
> escalado estaba bloqueado por «una jerarquía de cargos que el modelo no tiene», y que declararla era
> una decisión de organización. **Era falso, y el error fue pararse una línea antes.** `R08.1.md:1574`
> pide el escalado «al inmediato superior»; `:1575` —la línea siguiente— dice de dónde sale:
> «Encaja con la derivación de M1.9.2, que ya sabe a qué cargo corresponde cada etapa: **el escalado
> puede apoyarse en esa misma tabla en lugar de mantener una jerarquía aparte**». Y la tabla ya traía
> el concepto con las mismas palabras: `DERIVACION_POR_DEFECTO` abre con «escalar una revisión es
> **subirla al inmediato superior**» (`transitions.ts:268`).
>
> Lo que sí sigue siendo cierto es que **no hay jerarquía general**: fuera de las etapas que declaran
> cargo, nadie sabe quién está por encima de quién. Pero C11 no la necesitaba, porque su alcance es un
> solo estado y ese estado sí declara el suyo.

**La primera de las dos piezas de la ampliación YA ESTABA CONSTRUIDA.** «Aviso redundante por correo
cuando una transición cambia de área» (`:1573`) es lo que el motor hace desde antes de esta tanda
(`ticketService.ts:187-219`; spec `derivacion-avisos` RQ-AV-04 y RQ-AV-09), y **el propio maestro lo
dice nueve líneas más abajo de pedirlo**: «`[AS-BUILT]` Al ejecutarse cualquier transición, el sistema
calcula el área destinataria del aviso a partir del estado de llegada y notifica en la aplicación **y
por correo**» (`:1582`). Lo que faltaba en ese canal era poder encenderlo sin romper la regla de
secretos: cerrado en `DEPLOY.md` §4.2.

**Qué hace falta para cerrar C11 del todo:**

| Pieza | Estado | Quién lo decide |
|---|---|---|
| La regla del reloj | **Hecha** (`RQ-TS-15`) | — |
| El destinatario del escalado | **Hecho** (`RQ-TS-16`) | — |
| El correo al cambiar de área | **Ya estaba**, y ahora documentado en `DEPLOY.md` §4.2 | — |
| **El disparo** | **Hecho** en F1B-08 (`index.ts:88`) | — |
| Si el SLA se extiende a otros estados | **Extendido** a tres estados en F1B-08 (`RQ-TS-15`) | — |
| Qué hacer con los tickets replicados, que no tienen traza | Abierto (`RQ-TS-15`) | Diseño + Gerencia |

---

## 4 · Discrepancias

### 4.1 · Diseño ↔ código

El diseño es del 04/06/2026 y el código de septiembre. Manda el código.

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «Mientras tanto **cualquiera puede ejecutar cualquier transición**; el actor es la constante temporal» (`design:121`) | Permiso por área impuesto en servidor (`ticketService.ts:129-131`), matriz de 102 casos probada (`permisos.test.ts:77-82` en `fd253aa`), y el actor es el usuario de la sesión (`ticketService.ts:153`) | **Superado.** El Subsistema H llegó. El diseño describe un estado del proyecto que ya no existe |
| D-2 | «Rewrite endpoint `POST /api/tickets/:id/transition` en `server/app.ts`» (`design:88`) | Vive en `apps/desk/server/routes/tickets.ts:192-194` | Movido. Cualquier cita del diseño a `app.ts` apunta a un fichero que ya no lo contiene |
| D-3 | `applyTransition(db, ticketId, fromStatus, transition, plan, actor)` — seis parámetros (`design:85`) | Siete: añade `values` al final (`repo.ts:322-330`) | El séptimo es lo que hace posible RQ-TS-11 y la salida de C4: sin `values` en el historial, `ticket_transitions` no guardaría «todos» los valores |
| D-4 | «El mapeo usa el inverso de `PROMOTED_COLUMNS` (ya existe en `server/db/rows.ts`)» (`design:56`) | Vive en `packages/zoho-sync/src/db/rows.ts`, importado como `@ambientalia/zoho-sync/db/rows` (`transitionExec.ts:2`) | Movido al paquete al extraerse la sincronización |
| D-5 | «Guard `ENABLE_WRITES`: **se quita** del endpoint de transición» (`design:22`) | `guardWrites` sigue existiendo (`routes/tickets.ts:27-33`) pero **no** se aplica al endpoint de transición; sí a `reply` (`:196`). La razón está escrita: «`ENABLE_WRITES` protege las escrituras hacia **Zoho**, y esto es local» (`:86`) | **Cumplido en el fondo, no en la letra.** El guard no desapareció: se acotó a lo que escribe hacia fuera |
| D-6 | «Frontend: **sin cambios**» (`design:23`, `:93`) | `TransitionPanel.tsx` filtra por área (`:56-58`), pinta el buscador de OV, la casilla de derivación y las fechas que la OV arrastra (`:64-66`) | **Superado.** El diseño no previó ninguna de las tres piezas |
| D-7 | El diseño no menciona derivación, avisos, el estado `Remisión creada`, el registro de estados ni la guarda de la OV | Los cinco existen (RQ-TS-03, RQ-TS-12, RQ-TS-13, RQ-TS-14; `estados.ts`) | **Alcance añadido después del diseño.** No es discrepancia sino crecimiento; se anota para que nadie use el diseño como inventario |
| D-8 | «Elimina `server/cfApiNames.ts`» (`design:29`) | No existe en el árbol (`find apps packages -name 'cfApiNames*'` → vacío) | Cumplido |

### 4.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.9.1 (`:1636`): «**Diez** de las 34 transiciones son compartidas por dos áreas» | **Ocho**: cinco `Comercial / Compras` y tres `Comercial / Servicio Técnico` (`transitions.ts:171-256` en `fd253aa`, emparejamiento fijado en `invariantesGrafo.test.ts:91-106`, y el reparto 26 simples / 8 compartidas en `permisos.test.ts:72-73` en `fd253aa`) | **Ya registrada en F0-01, re-confirmada aquí.** Está en `docs/sdd/F0-01_Correcciones_para_el_maestro.md:129` (entrada 1 del Anexo I) y desarrollada en `:142-167`, commiteada en `3d44e1e`. F0-02 no la descubre: la re-confirma por otra ruta —el emparejamiento de los invariantes y el reparto 26/8 de la matriz de permisos, que F0-01 no usó—. No es cosmética: la matriz de F1C-05 se dimensiona con esa cifra, y con diez saldrían 58 prohibidos y 44 permitidos en vez de 60 y 42 |
| M-2 | M1.9.2 (`:1665`), fila `Aprobación`: «Quien tomó el ticket … **+ Director Técnico**» | `aprobacion: { tipo: 'primerDerivado' }` y nada más (`transitions.ts:274`) | El «+ Director Técnico» **no está implementado**. Por su posición al final de una celda de tabla parece resto de edición del `.docx`; si es una decisión, no llegó al código. **Punto a aclarar antes de F1C-05** |
| M-3 | M1.3.8 (`:1413`): «18 desde `OV asignada`, y desde `Ticket creado` los otros 20» | 19 y 19 contando el origen; 20 desde `Ticket creado` sólo sumando el paso sin botón (RQ-TS-05) | Las cifras mezclan dos convenciones de recuento. La conclusión —sin huérfanos— se sostiene. **Corrección menor para el maestro** |
| M-4 | M1.3.3 (`:1151`): los dos pasos sin botón «viven en `estadoPorRemision.ts`, **no en el archivo de transiciones**» | Sus constantes están en `transitions.ts:150-151`; `estadoPorRemision.ts:9-12` las importa | Exacto para la aplicación, falso para la declaración. **Corrección menor para el maestro** |
| M-5 | M1.9.2 (`:1653`): «Treinta y una heredan al responsable que el ticket ya traía» | 34 − 3 = **31** ✓. El docblock del código tiene **dos** cuentas mal, y van juntas: `transitions.ts:262` dice «las otras **32**» (son 31) y `:265` dice «en **35** declaraciones» (son 34) | **El maestro tiene razón y el comentario del código no, dos veces.** Defecto de comentario, no de comportamiento. Registrado como comportamiento actual en §3.9, destino F1B-06. F0-02 no lo corrige: es código |
| M-6 | M1.10 (`:1677`): «el as-built ya escribe la marca de tiempo de cada transición; **lo que falta por confirmar** es que registre siempre el usuario que la ejecutó» | Confirmado: `performed_by` se escribe en las tres escrituras (`repo.ts:314-318`) y se comprueba en las 36 ejecuciones del barrido (`transicionesEjecucion.test.ts:272-285` en `fd253aa`) | **El pendiente del maestro está cerrado.** F0-04 lo cerró. **Actualización para el Anexo H** |
| M-7 | M1.9.1 (`:1615`) `[DECIDIDO]`: «Cada usuario ve **solo los estados y transiciones** de su rol» | Las **transiciones** sí se filtran (`TransitionPanel.tsx:56-58`). Los **tickets** no: el servidor los devuelve todos a todo el mundo, por decisión escrita en `docs/modelo-autorizacion.md` (`boardView.ts:29-32`) | Las dos mitades de la decisión tienen destinos distintos. La de visibilidad se decidió en contra a propósito. **Punto a aclarar** |
| M-8 | M1.3.8 (`:1415`): «Las 27 etiquetas de campo mapean a columnas reales. Ninguna cae al cajón `custom_fields`» | **Verificado cierto** en esta tanda: 27 etiquetas distintas, las 27 en `PROMOTED_COLUMNS`. **F1A-04: 28 de 40** | Sin discrepancia. Se anota porque es una de las afirmaciones as-built que sí resiste |
| M-9 | Anexo H.2 (`:1495`): servicio técnico «construido y verificado … coincide con el código en las 38 filas del mapa» | 34 transiciones + 2 pasos sin botón + las 2 salidas extra de `habilitar_servicio` = 38 (`transitions.ts:178`; maestro `:388` explica el recuento) | Sin discrepancia, pero el 38 **no** es un número de transiciones: son filas de mapa. Conviene no citarlo como tal |

### 4.3 · Lo que `config.yaml` dice y ya no es cierto

| Registro | Dice | Estado real | Lectura |
|---|---|---|---|
| IV-3 (`config.yaml`, `incumplimientos_vivos`) | «Hoy es un espejo **SIN COMPROBAR**: no hay prueba de que el servidor imponga la misma matriz» | La hay: `permisos.test.ts:41-110` en `fd253aa` prueba las 34 × 3 contra el servidor, y `:35-39` declara explícitamente el efecto | **F0-04 cerró IV-3.** El espejo de `TransitionPanel.tsx:56-58` pasó a comodidad legítima. `config.yaml` y la tabla de `CLAUDE.md` lo daban por vivo; **corregidos en esta tanda**, en commit aparte, porque un registro caduco sí es una corrección. Los vivos son **cuatro** |
| IV-3, ubicación | `TransitionPanel.tsx:56-57` | El filtro se cierra en `:58` | Cita corta por una línea, en **tres** sitios: `config.yaml` y `CLAUDE.md`, corregidos aquí, y **`permisos.test.ts:36`**, que es código y por tanto queda pendiente — destino **F1C-05** |
| IV-1 (`config.yaml`, `incumplimientos_vivos`) | «un estado de espera que no lleve "espera" en el nombre no se cuenta, **y uno que la lleve sin serlo sí**» | La segunda mitad no tiene ningún caso vivo: cero falsos positivos entre los 21 estados | Describía el riesgo del criterio, no un hecho. **Cuantificado en esta tanda**: 2 aciertos de 8, 0 falsos positivos. Ver §3.6 |
| `estado_al_baseline` (`config.yaml:72-77`) | 96 ficheros, 830 pruebas: 828 pasan / 2 saltadas (base `a3a8f03`) | 110 ficheros, 931 pruebas: 929 pasan / 2 saltadas (base `ad1875b`) | F0-04 añadió la red. Cifra de baseline, no error |

---



### RQ-TS-32 · «Habilitar Servicio» no pasa mientras el cliente sea provisional o el equipo esté pendiente

`habilitar_servicio` **SHALL** responder `422` mientras el cliente del ticket siga siendo provisional (no enlazado con
Books) o su equipo siga pendiente de validar. El predicado **SHALL** vivir en `packages/shared` y el servidor **SHALL**
imponerlo; el botón del cliente es sólo comodidad (regla 13). La guarda es de **estado del sujeto** (escalón B): se
evalúa **después** del permiso de área (RQ-TS-06, guarda 5) y **antes** de los obligatorios (guarda 6), de modo que un
usuario sin permiso recibe `403` y no `422`. El mensaje **SHALL** nombrar qué falta (cliente, equipo o ambos). Tras
el enlace y la validación, la misma transición **SHALL** pasar. Sólo se aplica a esta transición: el flujo de
soporte remoto no la contiene (`transitions.ts:388-397`) y en él la marca se ve pero **no bloquea** (supuesto Q3).
Los demás pasos del ticket no se ven afectados por las marcas.

#### Scenario: Cliente provisional bloquea
- GIVEN un ticket en `Ticket creado` con cliente provisional y equipo validado, y Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` nombrando el cliente y el ticket no cambia de estado

#### Scenario: Equipo pendiente bloquea
- GIVEN un ticket con cliente de Books y equipo pendiente
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` nombrando el equipo

#### Scenario: Ambos pendientes se nombran juntos
- GIVEN cliente provisional y equipo pendiente
- WHEN se ejecuta la transición
- THEN el `422` nombra los dos

#### Scenario: Tras enlazar y validar, pasa
- GIVEN un ticket antes bloqueado, ya con el cliente enlazado y el equipo validado
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200` y el ticket avanza

#### Scenario: Posición de la guarda
- GIVEN un ticket con algo pendiente y un usuario sin el área de la transición
- WHEN ejecuta `habilitar_servicio`
- THEN responde `403`, no `422` (mover la guarda antes del permiso pone la prueba en rojo)

#### Scenario: Posición frente a los obligatorios
- GIVEN un ticket con algo pendiente, un usuario de Comercial y un campo obligatorio de la transición ausente
- WHEN ejecuta `habilitar_servicio`
- THEN el `422` que contesta es el de lo pendiente, no el de obligatorios

#### Scenario: Soporte remoto no se bloquea
- GIVEN un ticket de `Soporte remoto` con cliente provisional
- WHEN avanza por las transiciones de su flujo
- THEN ninguna responde `422` por la marca, y la marca sigue visible

## 5 · Fuera de alcance de esta spec

- **La función pura de permisos y el modelo de roles y sesiones** → spec `permissions`. Aquí sólo está
  su uso por la transición (RQ-TS-07) y el `403` que produce.
- **El historial completo del ticket, su composición y su vista** → spec `trazas`. Aquí sólo está la
  fila que la transición escribe (RQ-TS-11).
- **La creación del ticket, el diccionario de campos del Anexo G y las clasificaciones** → spec
  `tickets-core`. Aquí sólo está la marca `'(creación)'` y la primera puerta de la OV.
- **El alta, envío y anulación de remisiones, y los accesorios** → spec `remisiones`. Aquí sólo está
  el enganche que mueve el estado (RQ-TS-03) y la tercera puerta de la OV sin cerrar (§3.4).
- **El cálculo de destinatarios, la plantilla del correo y la cola de reintento** → spec
  `derivacion-avisos`. Aquí sólo está que el aviso se calcula desde el estado de llegada y va fuera de
  la transacción (RQ-TS-13).
- **La sincronización con Zoho, su cadencia y el `managed_by_app` como cutover** → spec `zoho-sync`.
  Aquí sólo está que la transición lo pone en `true` (RQ-TS-10) y que las dos entradas no se cruzan
  (RQ-TS-02).
- **El cálculo de los indicadores de G.6 y los tres bodegajes** → spec `kpis` (no es de F0-02). Aquí
  sólo está la regla que los condiciona: se calculan sobre `ticket_transitions.values` (§3.3).
- **Los flujos de equipo nuevo y soporte remoto** → specs `transitions-equipo-nuevo` y
  `transitions-soporte-remoto` (no son de F0-02). F1B-06 añade sus dos grafos a este motor, y por eso
  los invariantes de RQ-TS-01 afirman conjuntos y no sólo números.
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). Todo requisito de
  esta spec que cite un `.tsx` describe código **no cubierto por pruebas**, y lo dice aquí una vez en
  lugar de repetirlo en cada línea.
### RQ-TS-23 · Se retiran tres transiciones del catálogo de servicio

`TRANSITIONS` **SHALL NOT** contener las ids `marcar_pendiente`, `servicio_externo_pendiente` ni
`servicio_externo_notificado` (retiradas por E-103/E-106). Las tres eran de área `Servicio Técnico` simple y
sin campo de fecha, así que **SHALL** haberse conservado sin cambio, **en la revisión de F1C-09
(`011f6ea`)**, el emparejamiento de las ocho compartidas y los diez campos de fecha reentrantes. Una id
retirada **SHALL** rechazarse en el servidor como transición desconocida y no escribir nada. Una prueba
**SHALL** fijar la ausencia por id, no sólo por recuento.
(Previously: la frase decía, en presente y sin revisión, que **SHALL** conservarse sin cambio el
emparejamiento de las ocho compartidas. Tras F1C-10 las compartidas son siete, por un cambio ajeno a esas
tres retiradas (`rechazo_cliente`, RQ-TS-30); lo que RQ-TS-23 afirma es que **retirarlas** no movió el
emparejamiento, y eso sigue siendo cierto de F1C-09.)

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

#### Scenario: retirar las tres no movió el emparejamiento de compartidas (revisión F1C-09)
- GIVEN el catálogo en la revisión `011f6ea`, antes de F1C-10
- WHEN se comparan las compartidas antes y después de retirar las tres
- THEN el emparejamiento de las ocho compartidas y los diez campos reentrantes es el mismo
  (a partir de F1C-10 son siete, por RQ-TS-30)

### RQ-TS-24 · `diagnostico_complementario` sale de `En Proceso`

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

### RQ-TS-25 · `Pendiente` pasa a ser estado sólo de soporte remoto

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

### RQ-TS-26 · La cifra anclada del maestro dice 31 / 35 / 20 en el mismo commit que el código

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

### RQ-TS-27 · Los guardianes numéricos llevan las cifras nuevas

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

### RQ-TS-28 · Existe un script de migración de los tickets de servicio en `Pendiente`

Existirá `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`, verificable por una prueba sobre pg-mem
(si pg-mem no admite una sentencia, el diseño declara qué parte se revisa por lectura). El script **SHALL**:
(1) calificar por esquema toda tabla; (2) abrir con un recuento previo de sólo lectura en tres grupos:
servicio con `managed_by_app = true`, servicio con `managed_by_app = false` (listado por número) y soporte
remoto, donde «servicio» es toda clasificación normalizada distinta de «Soporte remoto» (criterio de
`packages/shared/src/flujos.ts:116-119`); (3) dentro de una transacción, insertar en `desk.ticket_transitions`
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

### RQ-TS-29 · La migración no se ejecuta sola; ejecutarla en producción es tarea de persona

Ni el arranque de la aplicación, ni `migrate.ts`, ni `schema.sql`, ni ninguna ruta **SHALL** ejecutar el
script de `RQ-TS-28`. Su ejecución en producción (recuento previo, migración, recuento posterior) es tarea de
Alfonso, fuera del recuento de tareas (regla del ciclo 1); **archivar el cambio no la da por hecha**.

#### Scenario: nada del código invoca el script
- GIVEN el árbol del repositorio
- WHEN se busca una referencia al fichero del script fuera de `docs/` y de su propia prueba
- THEN no hay ninguna

## Escenarios de RQ-TS-01 añadidos por F1C-09

Van al final, y no dentro del bloque de RQ-TS-01, para no desplazar las citas a este fichero (regla de mutación 4). Son escenarios de RQ-TS-01.

#### Scenario: el invariante 2 fija 31, 20 y 31 ids
- GIVEN `TRANSITIONS` y `ESTADOS_SERVICIO` tras el cambio
- WHEN corre el invariante 2
- THEN afirma 31 transiciones, 20 estados y 31 ids distintas

#### Scenario: los invariantes 5 y 6 no cambian
- GIVEN el catálogo sin las tres retiradas
- WHEN corren los invariantes 5 y 6
- THEN siguen en ocho compartidas y diez campos de fecha reentrantes (en F1C-09; RQ-TS-30 lleva las compartidas a siete en F1C-10, y el invariante 6 sigue en diez)

### RQ-TS-30 · `rechazo_cliente` es de área `Comercial`, y sólo las otras dos «Rechazo» comparten con Servicio Técnico

La transición `rechazo_cliente` (`from: Notificación cliente`, `to: Por Facturar`) **SHALL** tener
`area: 'Comercial'` en `packages/shared/src/transitions.ts`. `rechazo_comercial`
(`Notificación Comercial` → `Por Facturar`) y `rechazo_revision` (`Rev./Diagnostico` → `Por Facturar`)
**SHALL** conservar `Comercial / Servicio Técnico`. Origen, destino, campos y obligatorios de las tres
**MUST** quedar intactos.

- El servidor **SHALL** responder `403` por área (escalón B, `ticketService.ts:129-130`) cuando quien ejecuta
  `rechazo_cliente` no sea administrador ni tenga el área `Comercial`, sin cambiar estado ni insertar fila en
  `ticket_transitions`. **MUST NOT** hacer falta ningún cambio en el servidor: el área se lee de `t.area` del
  catálogo.
- El invariante 5 de `invariantesGrafo.test.ts` **SHALL** fijar **siete** transiciones compartidas,
  emparejadas por id, y **SHALL** fallar si `rechazo_cliente` vuelve a figurar entre ellas.
- Las filas históricas de `ticket_transitions` de `rechazo_cliente` **MUST** conservar su área original
  (`ticketService.ts:155` guarda el área vigente al ejecutar); no se reescriben ni se migran.
- El mapa del blueprint regenerado **SHALL** marcar las tres aristas de `rechazo_cliente` con `[C]` y no con
  `[C][ST]`; las aristas de `rechazo_comercial` y `rechazo_revision` **SHALL** conservar `[C][ST]`. Los
  cuatro `blueprint-*.md` **MUST** coincidir con el generador (anti-desfase, `mapaBlueprint.test.ts`).
- El barrido de cargo (744 combinaciones) y la única diferencia cargo/área (`liberacion_sin_factura` ×
  Comercial) **MUST** quedar sin cambio.
- Los guardianes del cambio (cifras 55/38 y 56/37, invariante 5 con siete, `403` nuevo) **SHALL** escribirse
  y verse en rojo antes de editar el catálogo (`strict_tdd`).

#### Scenario: el catálogo declara las tres Rechazo
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se buscan `rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`
- THEN sus áreas son `Comercial / Servicio Técnico`, `Comercial` y `Comercial / Servicio Técnico`, y los tres destinos siguen siendo `Por Facturar`

#### Scenario: Servicio Técnico no puede rechazar desde Notificación cliente
- GIVEN un ticket en `Notificación cliente` y un usuario cuyo rol sólo tiene `Servicio Técnico`
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `403`, el ticket sigue en `Notificación cliente` y no se inserta fila en `ticket_transitions`

#### Scenario: Comercial rechaza desde Notificación cliente
- GIVEN un ticket en `Notificación cliente` y un usuario del área `Comercial` con los obligatorios de la transición
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `200`, el ticket pasa a `Por Facturar` y la traza registra el área `Comercial`

#### Scenario: el invariante 5 fija siete compartidas
- GIVEN el catálogo tras el cambio
- WHEN corre el invariante 5
- THEN afirma siete compartidas emparejadas por id (cinco `Comercial / Compras`, `rechazo_comercial` y `rechazo_revision` como `Comercial / Servicio Técnico`) y `rechazo_cliente` no está entre ellas

#### Scenario: el invariante 6 no cambia
- GIVEN el catálogo tras el cambio
- WHEN corre el invariante 6
- THEN siguen siendo diez los campos de fecha reentrantes

#### Scenario: el barrido de cargo sigue en 744
- GIVEN el barrido cargo × área × transición
- WHEN se cuenta tras el cambio
- THEN son 744 combinaciones y la única diferencia entre la matriz HTTP con cargo y la de área sigue siendo Comercial sin cargo × `liberacion_sin_factura`

#### Scenario: el mapa regenerado marca la arista en `[C]`
- GIVEN `npm run generar-mapa-blueprint` ejecutado tras el cambio
- WHEN se leen las aristas que salen de `Notificación cliente` hacia `Por Facturar` en `blueprint-completo.md`, `blueprint-fase-2-diagnostico.md` y `blueprint-fase-3-cierre.md`
- THEN las tres llevan `[C]` sin `[ST]`, las aristas de `Notificación Comercial` y `Rev./Diagnostico` conservan `[C][ST]` y la prueba anti-desfase pasa

#### Scenario: una traza histórica conserva su área
- GIVEN una fila de `ticket_transitions` de `rechazo_cliente` anterior al cambio, con área `Comercial / Servicio Técnico`
- WHEN se despliega el cambio
- THEN la fila conserva ese valor sin migración

#### Scenario: mutación — devolver `rechazo_cliente` a `Comercial / Servicio Técnico`
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la suite
- THEN fallan la matriz de área (54/39), la compuesta (55/38), el invariante 5 (ocho en lugar de siete), la prueba del `403`, la de áreas siguientes y la anti-desfase del mapa

#### Scenario: mutación — cambiar por error otra Rechazo
- GIVEN `rechazo_comercial` o `rechazo_revision` pasada a `Comercial`
- WHEN corre la suite
- THEN falla el invariante 5 (seis compartidas) y falla la prueba de que esa Rechazo admite a Servicio Técnico

### RQ-TS-31 · El aviso por área de `Notificación cliente` deja de incluir a Servicio Técnico (supuesto S-1)

`areasSiguientes('Notificación cliente')` (`packages/shared/src/transitions.ts:327-334`), que alimenta
`areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`), **SHALL** devolver exactamente `Comercial` y
`Compras`, sin `Servicio Técnico`, porque las tres salidas del estado (`aprobacion_y_repuestos`,
`aprobacion`, `rechazo_cliente`) ya no incluyen esa área. No cambia ningún requisito de `derivacion-avisos`
(RQ-AV-04 es genérico): es consecuencia del grafo, y se registra como **supuesto S-1** de la propuesta,
reversible con el mismo cambio de catálogo.
(Previously: `Comercial`, `Compras` y `Servicio Técnico`, sin prueba que lo fijara.)

- Una prueba nueva **SHALL** fijar el conjunto exacto de `areasSiguientes('Notificación cliente')`, para que
  el supuesto deje de ser implícito.
- **MUST NOT** emitirse aviso de área a Servicio Técnico al entrar un ticket en `Notificación cliente`; a
  Comercial y Compras sí, con la resta de las áreas de quien acaba de actuar tal como ya define RQ-AV-04.

#### Scenario: las áreas siguientes de Notificación cliente son Comercial y Compras
- GIVEN el catálogo tras el cambio
- WHEN se calcula `areasSiguientes('Notificación cliente')`
- THEN el conjunto es exactamente `Comercial` y `Compras`

#### Scenario: Servicio Técnico no recibe aviso al entrar en Notificación cliente
- GIVEN un ticket que entra en `Notificación cliente` ejecutado por un usuario sólo de `Servicio Técnico`
- WHEN se calculan las áreas a avisar
- THEN son `Comercial` y `Compras`, y `Servicio Técnico` no figura

#### Scenario: mutación — devolver la arista de Servicio Técnico
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la prueba de áreas siguientes
- THEN falla porque el conjunto incluye `Servicio Técnico`

---



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
este requisito —exigir `ok` u `ok_con_avisos`— queda **retirado** (revisión de la planificación, 2026-10-03): contradecía esa
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

**Posición exacta.** La guarda **SHALL** ser la undécima (décima hasta F1B-03) del orden de `executeTransition`: se llama en la misma línea que
`exigirAltaValidada` (`apps/desk/server/services/ticketService.ts:131`), **inmediatamente después** de ella, y **antes**
de los obligatorios, las fechas derivadas, la cuarentena y el certificado
(`apps/desk/server/services/ticketService.ts:132-134`) y antes de la OV ya asociada
(`apps/desk/server/services/ticketService.ts:148-152`). Queda **detrás** de: transición desconocida y ticket inexistente (A),
fuera de flujo (B), estado fuera del `from` (B), área (B), cargo (B), prioridad (B), cargo de la OVI que entra (B, RQ-TS-36), verificación (B) y alta validada (B, RQ-TS-32).
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

#### Supuestos que afectan a RQ-TS-33

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

### RQ-TS-34 · Desde cada origen de «Habilitar Servicio», un ticket sin remisión de entrada vigente tiene una acción que lo desbloquea

Para **cada** estado de `transitionById('habilitar_servicio').from` (hoy `OV asignada`, `Ticket creado` y
`Remisión creada`, `packages/shared/src/transitions.ts:178`), un ticket que no tenga una remisión de entrada vigente
(RQ-TS-33, RQ-RE-20) **SHALL** tener en la pantalla una acción que lo desbloquee: «Crear remisión». El predicado
compartido `puedeCrearRemisionDeEntrada` **SHALL** devolver `true` para cada uno de esos estados.

**Atado a los orígenes de la transición.** El conjunto de estados donde el predicado devuelve `true` **SHALL** ser un
**superconjunto** de `transitionById('habilitar_servicio').from`, recorrido desde el catálogo y no copiado a mano en la
prueba. Quitar cualquiera de esos tres estados del predicado, o añadir un cuarto origen a `habilitar_servicio` sin
tocar el predicado, **MUST** poner roja la prueba. Fuera de ese conjunto el predicado **SHALL** seguir devolviendo
`false` para el resto del blueprint; el predicado se mantiene como lista de lo PERMITIDO y no de lo prohibido.

**La guarda no cambia.** `exigirRemisionVigente` (RQ-TS-33) **SHALL** seguir respondiendo `422` en `habilitar_servicio`
sin una remisión de entrada vigente, desde los tres orígenes, con el mismo texto único; este requisito **MUST NOT**
introducir excepción alguna a ella ni un camino alternativo de habilitación.

**No hay transición nueva.** Ninguna transición se añade a `TRANSITIONS`, y `Remisión creada → Ticket creado` sigue sin
tener botón (RQ-TS-03): la salida del ticket atascado es **crear la remisión**, no volver de estado. Las cifras ancladas
y el mapa del blueprint **MUST NOT** cambiar.

**Regla invariable 13, decisión a decisión.**

- *Ofrecer «Crear remisión» en `Remisión creada`* (decisión del cliente, vía el predicado de `packages/shared`): la
  imposición del servidor es que el alta de remisión **acepta** el ticket en ese estado (RQ-RE-28, probado). El predicado
  es de `packages/shared` y el cliente lo consume sin reescribirlo.
- *Desactivar «Habilitar Servicio» sin vigente*: espejo de `exigirRemisionVigente`, con imposición probada (RQ-TS-33).
  Sin cambio.
- *No ofrecer «Crear remisión» fuera de los tres orígenes* (`false` del predicado): **el servidor no la impone**. Es un
  **hueco previo declarado** (H-1): el servidor no lee el estado del ticket en el alta (RQ-RE-28), así que el botón es la
  única guarda de «sólo se crea remisión en la fase inicial». **NO se corrige en este cambio**; queda como pregunta de
  Gerencia en la bandeja (E-184 en la propuesta; número a confirmar al escribirla). Es comportamiento actual sin decidir,
  no un requisito.

#### Scenario: El predicado admite cada origen de `habilitar_servicio` — ROJO
- GIVEN los estados de `transitionById('habilitar_servicio').from`, tomados del catálogo
- WHEN se evalúa `puedeCrearRemisionDeEntrada` sobre cada uno
- THEN devuelve `true` para los tres, y la prueba recorre el `from` del catálogo y no una lista escrita a mano (hoy falla para `Remisión creada`)

#### Scenario: El predicado sigue rechazando el resto del blueprint — CARACTERIZACIÓN
- GIVEN cada estado del blueprint que no está en el `from` de `habilitar_servicio` (incluido `Ingresado` y los posteriores)
- WHEN se evalúa `puedeCrearRemisionDeEntrada`
- THEN devuelve `false` en todos

#### Scenario: Quitar un origen del predicado pone roja la prueba (regla de mutación 2) — verificación por mutación
- GIVEN el fichero vigilado `packages/shared/src/transitions.ts` con el predicado ya admitiendo los tres orígenes
- WHEN se mutan tres veces, una por estado, quitando ese estado de la condición del predicado
- THEN la prueba del primer escenario se pone roja en cada una de las tres, y la mutación se anota en `apply-progress.md`

#### Scenario: Añadir un cuarto origen sin tocar el predicado pone roja la prueba — verificación por mutación
- GIVEN `habilitar_servicio` con un cuarto estado en su `from` y el predicado sin tocar
- WHEN corre la prueba del primer escenario
- THEN falla, porque el predicado no admite el estado nuevo

#### Scenario: Desde cada origen, sin vigente, hay una acción que desbloquea — ROJO para `Remisión creada`, CARACTERIZACIÓN para los otros dos
- GIVEN un ticket en cada uno de los tres orígenes, sin remisión de entrada vigente
- WHEN el cliente decide qué botón ofrecer (`botonRemision`, RQ-RE-28) y el usuario intenta `habilitar_servicio`
- THEN el servidor responde `422` con el texto único de RQ-TS-33 y el cliente ofrece «Crear remisión» en los tres (hoy no lo ofrece en `Remisión creada`)

#### Scenario: La guarda de RQ-TS-33 no cambia — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` sin remisión de entrada vigente
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` con el mismo texto, sin cambio de estado; las pruebas de la guarda, `invariantesGrafo`, `cifrasAncladas` y `mapaBlueprint` pasan **sin editarse**

#### Scenario: No se añade ninguna transición — CARACTERIZACIÓN
- GIVEN el catálogo `TRANSITIONS`, las dos constantes sin botón y las cifras ancladas
- WHEN termina el cambio
- THEN ninguno ha variado y no existe botón `Remisión creada` → `Ticket creado` (RQ-TS-03)

### RQ-TS-35 · «Liberación sin factura» deja de ser una casilla: exige Motivo de lista cerrada y Fecha prevista de facturación

**La letra de Gerencia** (`decision/anexo-33-checkbox`, `respuesta_textual`, 2026-09-24; el maestro vigente la recoge en
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5127-5129`, «M1.3.5 · nº 33»):

> «Deja de ser un checkbox. La transición «Liberación sin factura», que sólo ejecuta el Director Comercial, exige dos campos
> obligatorios en su lugar: (1) Motivo, de una lista cerrada: fecha de corte de facturación del cliente · servicio incluido
> en contrato con facturación periódica · autorización excepcional de Dirección Comercial, con texto obligatorio; y (2) Fecha
> prevista de facturación. Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa al Director
> Comercial. Las liberaciones registradas antes del arreglo del 09/09 conservan su casilla tal como se guardó y se marcan
> según el criterio ya decidido para el histórico (c2); no se reescriben.»

**Qué se construye y qué es letra frente a supuesto.**

| Pieza | Letra o supuesto | Contenido |
|---|---|---|
| La casilla desaparece | Letra («Deja de ser un checkbox») | `liberacion_sin_factura` **SHALL NOT** declarar ningún `checkbox`; la casilla no convive con los campos nuevos |
| Campo Motivo | Letra | `select`, **obligatorio**, clave `Motivo de liberación sin factura` y etiqueta visible «Motivo» (diseño D2) |
| Campo Fecha | Letra | `date`, **obligatorio**, etiqueta «Fecha prevista de facturación» |
| Lista cerrada de **tres** motivos | Letra (el texto) / **supuesto S-3** (la mayúscula inicial) | véase abajo |
| Texto de la autorización | Letra en que existe un texto obligatorio; **supuesto S-1** en que sólo lo exige el tercer motivo; **supuesto S-2** en la etiqueta | campo `text`, `required` en el catálogo **falso**; lo exige la guarda del servidor |
| Sólo el Director Comercial | Letra, **ya construida** | `RQ-PM-17` de `permissions`; este requisito no la toca |
| Motivo y fecha en columnas propias | **Supuesto S-4** | columnas anulables de `tickets`, sin relleno |
| La transición deja de escribir `liberacion_sin_facturar` | **Supuesto S-6** (consecuencia de «Deja de ser un checkbox») | véase «Persistencia» |

**La lista cerrada, a la letra.** Las opciones del campo Motivo **SHALL** ser exactamente tres, **en este orden**
(la tercera no puede ir delante: el arnés de pruebas toma la primera opción de todo `select`, `appHarness.ts:78`):

1. «Fecha de corte de facturación del cliente»
2. «Servicio incluido en contrato con facturación periódica»
3. «Autorización excepcional de Dirección Comercial»

El texto de cada opción es el de la decisión, **letra por letra**; sólo la mayúscula inicial es supuesto S-3.

**La guarda del servidor (escalón C).** El servidor **SHALL** imponer el contenido de la liberación; no basta con el
desplegable ni con `input type="date"` del cliente. Hoy el servidor no comprueba las opciones de ningún `select`
(`buildTransitionPlan` sólo mira presencia, `transitionExec.ts:76-77`), así que sin esta guarda el desplegable sería la
única guarda de la lista cerrada. La guarda **SHALL** vivir en `packages/shared`, **SHALL** ser una función pura sobre la
transición y los valores, y **SHALL** leer las opciones **del propio campo del catálogo** (una sola fuente de la lista).
Comprueba tres cosas, y sólo sobre lo que **llega**:

1. **Motivo en la lista.** Un motivo presente que **no** sea igual, carácter por carácter, a una de las tres opciones
   **SHALL** producir un error de la guarda. Un motivo ausente **MUST NOT** producir error de la guarda: lo dice el
   obligatorio de presencia (`Falta el campo obligatorio: Motivo`, `RQ-TS-08`).
2. **Fecha de calendario real.** Una fecha prevista presente que no sea un día real del calendario en formato
   `YYYY-MM-DD` (p. ej. `2026-02-30`, o una fecha en otra forma) **SHALL** producir un error de la guarda. La fecha se
   evalúa **tal como llega**: `AAAA-MM-DD` estricto, y un ISO con hora (`2026-10-04T10:00:00Z`) se rechaza (diseño D8; el
   motor recortaría sin validar, `transitionExec.ts:33`). Una fecha ausente la dice el obligatorio de presencia.
3. **Texto con la autorización excepcional (supuesto S-1).** Con el motivo «Autorización excepcional de Dirección
   Comercial», un texto ausente, vacío o **de sólo espacios** **SHALL** producir un error de la guarda que nombre el campo
   («Texto de la autorización», supuesto S-2). Con el primer o el segundo motivo el texto **MUST NOT** ser obligatorio.

Los errores de la guarda **SHALL** salir en el **mismo** `422 { errors }` agregado que los de presencia y los de las fechas
derivadas (`ticketService.ts:134`), **detrás** de ellos y en una sola respuesta; el mensaje **SHALL** nombrar qué campo
falla y por qué, de modo accionable. El texto exacto de cada mensaje lo decide el diseño.

**La fecha puede ser pasada (supuesto SP-1).** La letra no exige que la fecha sea futura; el servidor **MUST NOT** rechazar
una fecha por ser pasada. Es la pregunta abierta E-nueva-1 de la propuesta (con fecha pasada, la alarma de F1C-02 saltaría
nada más liberar); si Gerencia contesta que debe ser futura, es un cambio posterior.

**Posición exacta (escalón C).** La guarda **SHALL** ir **dentro** del `422` agregado, en la misma sentencia que los
obligatorios, las fechas derivadas, la cuarentena y el certificado, **detrás** de ellos. Queda **detrás** del `403` de
área y del `403` de cargo (escalón B, `RQ-PM-17`, `RQ-PM-18`) y del `409` de estado, y **delante** del `422` de la persona
derivada (`ticketService.ts:138-142`). El `409` de orden de venta (`ticketService.ts:148-152`) **no** se puede activar a la
vez que esta guarda, porque `liberacion_sin_factura` no declara ningún campo de orden de venta: ese par no admite prueba de
posición y no se finge una.

**Persistencia.** Con `200`:

- el motivo **SHALL** quedar en una columna propia de `tickets` y la fecha prevista en otra, ambas anulables y fuera de
  `TICKET_COLS` (supuesto S-4: nombres `liberacion_motivo` y `fecha_prevista_facturacion`, `text` y `date`);
- el texto **SHALL** escribirse **siempre** en `tickets.custom_fields` —el de esta liberación o `null` (diseño D7)— y los
  **tres** valores en `ticket_transitions.values` (`packages/zoho-sync/src/db/repo.ts:314-318` guarda todos los valores).
  `custom_fields` se fusiona (`custom_fields || …`, `repo.ts:307-310`), pero como el texto se escribe siempre, una
  liberación sin texto deja `null` y no hereda la autorización de una anterior. **La fuente de verdad de cada liberación
  sigue siendo su fila de traza**: el texto que cuenta para una liberación es el de **su** fila de traza;
- `liberacion_sin_facturar` **SHALL** quedar sin tocar por la transición (supuesto S-6);
- las filas de `tickets` y de `ticket_transitions` que ya existen **MUST NOT** modificarse, marcarse ni rellenarse al
  aplicar el esquema o el cambio (el marcado del histórico es de `p64-historico-c1`).

El esquema **SHALL** añadir las dos columnas con `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS` **sin calificar** (`tickets`
es de `DESK_TABLES`), al final de `schema.sql`; el recuento de sentencias `ALTER` pasa de 53 / 29 / 24 a 55 / 29 / 26 (remedido el 2026-10-04 contra `8c182fb`).

**La sincronización no pisa motivo ni fecha.** Las dos columnas **MUST NOT** estar en `TICKET_COLS`: `upsertTicket`
construye su `SET` sólo con esa lista (`repo.ts:44-54`, `:76-91`), así que el sincronizador nunca las reescribe; y además
sale entero si la fila es `managed_by_app` (`repo.ts:71`), que `writeTransition` marca (`repo.ts:298`). Molde:
`fecha_aviso_cliente` (`repo.test.ts`, guarda propia).

**Re-liberación.** El ciclo `Por Facturar` → `Por Entregar / Sin facturar` → `Por Facturar` puede recorrerse más de una vez
(`entrega_sin_factura` vuelve a `Por Facturar`). En cada liberación el servidor **SHALL** exigir motivo y fecha de nuevo,
leyendo **sólo el cuerpo** de la petición, y **SHALL** escribir los valores de esa liberación; la traza conserva **todas**
las liberaciones. Los campos de esta transición **MUST NOT** quedar bloqueados ni prellenados con el valor de la liberación
anterior en el cliente: `yaLoTraeElTicket` deja de aplicar a ellos.

**Reentrancia.** `Fecha prevista de facturación` es un campo de fecha de una transición del ciclo `Por Facturar` ⇄
`Por Entregar / Sin facturar`, así que la tabla de reentrancia **SHALL** declararla: pasan a ser **once** los campos de
fecha reentrantes (nueve obligatorios) y **diez** los casos. La columna guarda el **último** valor y la traza **todos**
(`reentrancia.ts:16-24`): es un hecho del grafo, no un defecto, y se anota para quien lea la tabla.

**Regla invariable 13, decisión a decisión.**

| # | Lo que decide el cliente | Qué impone el servidor | Estado |
|---|---|---|---|
| 1 | Motivo obligatorio (asterisco) | `buildTransitionPlan` (`transitionExec.ts:77`), traducido a `422` en `ticketService.ts:134` | Espejo legítimo: imposición probada |
| 2 | Fecha obligatoria | la misma | Espejo legítimo |
| 3 | El motivo sólo puede ser uno de tres (desplegable) | **La guarda nueva** (lista cerrada) | Espejo legítimo **sólo cuando** sus escenarios estén en verde; hoy no existe y el desplegable sería la única guarda |
| 4 | La fecha es una fecha (`input type="date"`) | **La guarda nueva** (día real) | Ídem; hoy el servidor sólo recorta (`transitionExec.ts:33`) |
| 5 | Texto exigido con el tercer motivo | **La guarda nueva** | El cliente **no decide nada**: pinta siempre el campo, sin asterisco, y el `422` nombra lo que falta |
| 6 | El botón sólo lo ve quien puede | `403` de área y de cargo (`ticketService.ts:129-131`) | Espejo legítimo, ya probado (`RQ-PM-17`, `RQ-PM-18`) |
| 7 | No bloquear ni prellenar en una segunda liberación | No necesita contrapartida: el servidor exige los obligatorios en cada ejecución y lee sólo el cuerpo | Comodidad |

Además, el cliente **SHALL** mostrar el motivo y la fecha en la ficha del ticket (supuesto S-5); es presentación, no decide
ni impide nada.

**Fuera de este requisito, a propósito.** (a) La **alarma por fecha vencida** y el estado «Pendiente de facturar» (F1C-02,
después del corte, E-102). (b) El **marcado del histórico** de liberaciones con casilla (`p64-historico-c1`): este cambio
no toca filas viejas. (c) **Decisionales** y propietario del registro (resto de F1C-05). (d) Exigir que la fecha sea futura
(SP-1). (e) Borrar la columna `liberacion_sin_facturar` o su entrada en `PROMOTED_COLUMNS`. (f) Cualquier cambio de las
demás guardas de `executeTransition` (IV-12 incluido).

#### Scenario: El catálogo declara motivo, fecha y texto, y ninguna casilla — ROJO
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se lee `liberacion_sin_factura`
- THEN declara el comentario, «Motivo» (clave `Motivo de liberación sin factura`, `select`, obligatorio), «Fecha prevista de facturación» (`date`, obligatoria) y el
  texto de la autorización (`text`, no obligatorio en el catálogo), y **no** declara ningún campo `checkbox`

#### Scenario: Las tres opciones, a la letra y en orden — ROJO
- GIVEN el campo «Motivo» de `liberacion_sin_factura`
- WHEN se leen sus opciones
- THEN son exactamente «Fecha de corte de facturación del cliente», «Servicio incluido en contrato con facturación
  periódica» y «Autorización excepcional de Dirección Comercial», en ese orden

#### Scenario: `transitions.ts` conserva su número de líneas — COMPROBACIÓN DE CIERRE
- GIVEN `packages/shared/src/transitions.ts` en `2a74fdc` y tras el cambio
- WHEN se comparan
- THEN tienen el mismo número de líneas y sólo difiere la declaración de `liberacion_sin_factura`; se comprueba en el
  `verify`, no con una prueba de ejecución

#### Scenario: Sin motivo, el obligatorio de presencia responde 422 y el ticket no se mueve — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida y sin motivo
- THEN `422` con «Falta el campo obligatorio: Motivo», el ticket sigue en `Por Facturar` y no se escribe fila de traza

#### Scenario: Sin fecha, el obligatorio de presencia responde 422 — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y sin fecha
- THEN `422` con «Falta el campo obligatorio: Fecha prevista de facturación» y el ticket sigue en `Por Facturar`

#### Scenario: Un motivo fuera de la lista se rechaza aunque lo envíe el cliente — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con una fecha válida y un motivo que no es ninguna de las tres opciones
- THEN `422` con el error `El motivo debe ser uno de: …` (diseño §4, que lista las tres opciones y no contiene la palabra
  «Motivo» con mayúscula), sin cambio de estado ni fila de traza

#### Scenario: La igualdad con la lista es exacta — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con una fecha válida y un motivo que sólo difiere de una opción en las mayúsculas
- THEN `422` por motivo fuera de la lista

#### Scenario: Una fecha que no es un día real se rechaza — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y la fecha `2026-02-30`
- THEN `422` con un error que nombra «Fecha prevista de facturación» y el ticket sigue en `Por Facturar`

#### Scenario: Una fecha en otra forma se rechaza — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y la fecha `04/10/2026`
- THEN `422` por fecha

#### Scenario: Una fecha pasada se acepta (supuesto SP-1) — ROJO
- GIVEN un Director Comercial, un ticket en `Por Facturar` y una fecha de calendario real anterior a hoy
- WHEN ejecuta `liberacion_sin_factura` con motivo válido
- THEN responde `200`

#### Scenario: La autorización excepcional sin texto se rechaza (supuesto S-1) — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida, el motivo «Autorización excepcional de Dirección Comercial» y sin texto
- THEN `422` con un error que nombra «Texto de la autorización»

#### Scenario: La autorización excepcional con texto de sólo espacios se rechaza — ROJO
- GIVEN el mismo caso, con el texto `"   "`
- WHEN se ejecuta
- THEN `422`; el texto se comprueba **tras recortar espacios**

#### Scenario: La autorización excepcional con texto se acepta — ROJO
- GIVEN el mismo caso, con un texto no vacío
- WHEN se ejecuta
- THEN responde `200` y el ticket pasa a `Por Entregar / Sin facturar`

#### Scenario: Los otros dos motivos no exigen texto (supuesto S-1) — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida y el primer motivo, y en otro ticket con el segundo, ambos sin texto
- THEN ambos responden `200`

#### Scenario: Los errores de contenido salen juntos y detrás de los de presencia — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con el tercer motivo, sin texto y sin fecha
- THEN la respuesta es un solo `422 { errors }` con el error de presencia de la fecha antes que el error de texto

#### Scenario: Con 200 se escriben las columnas, el texto y la traza, y no la casilla — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar` con `liberacion_sin_facturar` en un valor conocido
- WHEN ejecuta `liberacion_sin_factura` con el tercer motivo, una fecha válida y un texto
- THEN `liberacion_motivo` y `fecha_prevista_facturacion` quedan escritas, el texto queda en `custom_fields`, los tres valores
  quedan en `ticket_transitions.values` y `liberacion_sin_facturar` conserva el valor que tenía

#### Scenario: El texto no se guarda en columna — ROJO
- GIVEN `PROMOTED_COLUMNS` tras el cambio
- WHEN se busca la etiqueta del texto de la autorización
- THEN no está, y el plan de la transición lo lleva a `customFields`

#### Scenario: Las dos columnas están fuera de `TICKET_COLS` — GUARDIÁN
- GIVEN `TICKET_COLS` tras el cambio
- WHEN se comprueba su contenido
- THEN no contiene ni `liberacion_motivo` ni `fecha_prevista_facturacion`; meter una de las dos en la lista debe poner en
  rojo la guarda de `repo.test.ts` (mutación)

#### Scenario: El sincronizador no pisa motivo ni fecha — ROJO
- GIVEN un ticket cuyo motivo y fecha ya se escribieron por la transición
- WHEN `upsertTicket` procesa ese ticket con una fila de Zoho distinta
- THEN motivo y fecha conservan el valor escrito por la aplicación

#### Scenario: El esquema añade las dos columnas sin calificar y el recuento es 55 / 29 / 26 — GUARDIÁN
- GIVEN `schema.sql` tras el cambio
- WHEN el guardián de `migrate.test.ts` recorre las sentencias `ALTER TABLE`
- THEN hay 55 en total, 29 calificadas y 26 sin calificar, y las dos nuevas van sin calificar al final del fichero;
  escribir en el fichero vigilado la misma sentencia calificada como `public.tickets` debe poner en rojo el guardián
  (regla de mutación 2)

#### Scenario: Aplicar el esquema no toca filas existentes — CARACTERIZACIÓN
- GIVEN filas de `tickets` y de `ticket_transitions` anteriores al cambio, algunas con la casilla
- WHEN se aplica el esquema nuevo
- THEN ninguna fila cambia y las dos columnas nuevas quedan en `NULL`

#### Scenario: PL-1 — el 403 de cargo gana a la lista cerrada — CARACTERIZACIÓN (el control con administrador, ROJO)
- GIVEN un Comercial sin cargo, un ticket en `Por Facturar` y un cuerpo con fecha válida y un motivo fuera de la lista
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403` de cargo, no `422`; con un administrador y el mismo cuerpo responde el `422` de la lista

#### Scenario: PL-1 bis — el 403 de área gana a la lista cerrada — CARACTERIZACIÓN
- GIVEN un usuario de `Compras` sin cargo, un ticket en `Por Facturar` y el mismo cuerpo
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` nombra el área, no la lista

#### Scenario: PL-2 — el 409 de estado gana a la lista cerrada — CARACTERIZACIÓN
- GIVEN un ticket fuera de `Por Facturar` y un cuerpo con un motivo fuera de la lista
- WHEN un administrador ejecuta `liberacion_sin_factura`
- THEN responde `409`, no `422`

#### Scenario: PL-3 — la lista cerrada gana a la persona derivada inexistente — ROJO
- GIVEN un administrador, un ticket en `Por Facturar` y un cuerpo con un motivo fuera de la lista **y** una persona derivada
  que no existe
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde el `422` de la lista y su cuerpo **no** contiene el mensaje de la persona derivada

#### Scenario: PL-4 — la presencia va delante del contenido, en un solo 422 — ROJO
- GIVEN un administrador y un cuerpo sin fecha y con un motivo fuera de la lista
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde un solo `422 { errors }` en el que el error de presencia de la fecha aparece **antes** que el de la lista

#### Scenario: Una segunda liberación exige de nuevo motivo y fecha, y no hereda los anteriores — ROJO
- GIVEN un ticket liberado con unos valores, devuelto a `Por Facturar` por `entrega_sin_factura`
- WHEN un Director Comercial ejecuta otra vez `liberacion_sin_factura` sin motivo ni fecha
- THEN `422` de presencia; y con valores nuevos válidos responde `200`, las columnas pasan a los valores nuevos y la traza
  tiene dos filas de `liberacion_sin_factura` con sus valores distintos

#### Scenario: Una segunda liberación por otro motivo y sin texto deja el texto en null — ROJO
- GIVEN un ticket liberado con el tercer motivo y un texto, devuelto a `Por Facturar` por `entrega_sin_factura`
- WHEN un Director Comercial ejecuta otra vez `liberacion_sin_factura` con el primer motivo, una fecha válida y sin texto
- THEN responde `200` y `tickets.custom_fields` lleva `null` en «Texto de la autorización», no el de la primera liberación;
  la fila de traza de la primera conserva su texto (diseño D7)

#### Scenario: El cliente no bloquea ni prellena los campos de la liberación en una segunda vez — PERSONA
- GIVEN un ticket que ya trae motivo y fecha de una liberación anterior y vuelve a estar en `Por Facturar`
- WHEN el Director Comercial abre el panel de «Liberación sin factura»
- THEN motivo, fecha y texto aparecen vacíos y editables, sin casilla y con el texto siempre pintado y sin asterisco

#### Scenario: La ficha enseña motivo y fecha (supuesto S-5) — PERSONA
- GIVEN un ticket liberado con los campos nuevos
- WHEN se abre su ficha
- THEN muestra el motivo y la fecha prevista de facturación junto a la casilla histórica

#### Scenario: El cargo sigue siendo Director Comercial — CARACTERIZACIÓN
- GIVEN valores válidos de los campos nuevos (el arnés usa la primera opción del `select` y `2026-01-15`)
- WHEN los ejecutan un Director Comercial y un Comercial sin cargo
- THEN el primero recibe `200` y el segundo `403`; el barrido de cargo sigue en 744 combinaciones con la misma única
  diferencia (`RQ-TS-30`)

#### Scenario: La tabla de reentrancia declara once campos — ROJO (prueba editada a propósito)
- GIVEN el catálogo tras el cambio
- WHEN corren la tabla de reentrancia y el invariante 6
- THEN la tabla declara diez casos y once campos de fecha reentrantes, nueve obligatorios, con «Fecha prevista de
  facturación» entre ellos, derivados del grafo y no de una lista escrita a mano

#### Scenario: Lo que queda fuera no se construye — CARACTERIZACIÓN
- GIVEN el cambio completo
- WHEN se busca una alarma por fecha vencida, el estado «Pendiente de facturar» o una regla de Decisionales
- THEN no existen: son de F1C-02 y del resto de F1C-05, y archivar este cambio no los da por hechos

### RQ-TS-36 · Las transiciones con campo de orden exigen el cargo cuando entra una OVI (escalón B)

Para cada una de las tres transiciones, una orden OVI que **entra** (RQ-PM-25) SHALL exigir el cargo (RQ-PM-24); sin él
responde `403` con el texto de cargo. La guarda cae **después** de los `403`/`409` de existencia, flujo, estado y área, y
del `403` de prioridad, y **antes** de los demás escalones B (verificación `409`, alta validada `422`, remisión vigente
`422`) y de todo escalón C y D. Ninguna transición con campo de orden activa a la vez el `403` de cargo de excepción ni el
de prioridad (HIPÓTESIS para `liberacion_sin_factura`, cuyos campos no se leyeron): ese par **no es observable** y no
lleva escenario.

#### Scenario: OVI nueva sin cargo, en cada transición — ROJO
- GIVEN un usuario de área Comercial sin cargo y un ticket sin esa orden
- WHEN envía `OVI-2026-001` en «Habilitar Servicio», en la «OV adicional» de `aprobacion` y en la de `aprobacion_y_repuestos`
- THEN las tres responden `403` de cargo

#### Scenario: con cargo y administrador sin cargo pasan la guarda; Director Técnico sin área Servicio Técnico también
- GIVEN un Director Técnico con sólo el área Comercial; y un administrador sin cargo
- WHEN envían una OVI nueva en «Habilitar Servicio»
- THEN la guarda de cargo no los detiene

#### Scenario: OVI en un ticket que no es de Garantía, con el cargo, se admite — CARACTERIZACIÓN
- GIVEN un Director Técnico y un ticket con otro `tipo_servicio`
- WHEN envía una OVI nueva en una de las tres transiciones
- THEN se admite

#### Scenario: posición, B estado `409` < cargo — CARACTERIZACIÓN
- GIVEN un ticket en un estado desde el que la transición no aplica, y una OVI de un usuario sin cargo
- WHEN la ejecuta
- THEN responde el `409` «no aplica desde el estado», no el `403` de cargo

#### Scenario: posición, B área `403` < cargo — CARACTERIZACIÓN
- GIVEN un usuario de Servicio Técnico sin cargo y «Habilitar Servicio» con una OVI nueva
- WHEN la ejecuta
- THEN responde el `403` de área («Tu rol no tiene permiso…»), no el de cargo

#### Scenario: posición, cargo < B remisión vigente — ROJO
- GIVEN un ticket sin remisión de entrada vigente y una OVI nueva, de un usuario de Comercial sin cargo
- WHEN ejecuta «Habilitar Servicio»
- THEN responde el `403` de cargo, no el `422` de remisión vigente

#### Scenario: posición, cargo < C obligatorios (`aprobacion_y_repuestos`) — ROJO
- GIVEN una OVI adicional nueva de un usuario sin cargo y falta una fecha obligatoria
- WHEN ejecuta la transición
- THEN responde el `403`, no el `422` agregado de obligatorios

#### Scenario: posición, cargo < D orden ya asociada — ROJO
- GIVEN una OVI que ya tiene otro ticket, de un usuario sin cargo
- WHEN la envía en cualquiera de las tres transiciones
- THEN responde el `403`, no el `409` de «ya está asociada»

### RQ-TS-37 · Un ticket de «Garantía» sólo admite órdenes `OVI-` en las transiciones (escalón C)

Para las tres transiciones, si `tipo_servicio` es exactamente «Garantía» (SUPUESTO S-7) y entra una orden que no es OVI,
SHALL responder `422` con el texto de garantía de `tickets-core` RQ-TC-43. Alcanza también a la «OV adicional»: un ticket
de garantía no admite una orden de cobro adicional (SUPUESTO S-5). Es escalón **C**: va dentro del `422` agregado, tras
las guardas B y **antes** del contrato vencido y de la unicidad (**D**). Sólo juzga las órdenes que entran (SUPUESTO S-1).
Cargo frente a garantía **no es observable** (una OVI activa la primera y una orden que no lo es la segunda, y cada
transición trae una sola orden): sin escenario inventado.

#### Scenario: Garantía con una orden `OV-` en cada transición — ROJO
- GIVEN un ticket de «Garantía» y un usuario con el cargo
- WHEN envía `OV-2026-001` en «Habilitar Servicio», o como «OV adicional» en las dos aprobaciones
- THEN responde `422` de garantía

#### Scenario: Garantía con OVI y cargo se admite — ROJO
- GIVEN un ticket de «Garantía» y un Director Técnico
- WHEN envía `OVI-2026-001` como orden nueva
- THEN se admite

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» y una `OV-` ya asociada a otro ticket
- WHEN la envía un usuario con el cargo
- THEN responde el `422` de garantía, no el `409`

### RQ-TS-38 · Reconfirmar la orden del ticket en una transición no pide el cargo ni la garantía

Cuando la orden enviada es la que el ticket ya tiene (RQ-PM-25), las guardas de OVI (cargo y garantía) **MUST NOT**
actuar, en tickets de Zoho y de la aplicación. El panel reenvía siempre la orden que el ticket ya trae
(`apps/desk/src/components/TransitionPanel.tsx:76-80`), así que ése es el camino normal de «Habilitar Servicio», que es
de área Comercial.

#### Scenario: Zoho con OVI reconfirmada en «Habilitar Servicio» pasa sin cargo — ROJO
- GIVEN un ticket de id numérico con `orden_venta` `OVI-2026-001`, y un usuario de Comercial sin cargo que no es administrador
- WHEN ejecuta «Habilitar Servicio» enviando `OVI-2026-001`
- THEN no recibe el `403` de cargo

#### Scenario: ticket de la aplicación con la OVI que asoció el Director Técnico — ROJO
- GIVEN un ticket con `PREFIJO_TICKET_APP` cuya OVI ya está asociada
- WHEN un usuario de Comercial sin cargo la reenvía
- THEN no recibe el `403` de cargo

#### Scenario: un ticket de Garantía ya asociado a una orden que no es OVI reconfirma sin `422` (S-1) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» con `orden_venta` `OV-2026-001` desde antes de este cambio
- WHEN se reenvía esa misma orden
- THEN no recibe el `422` de garantía

#### Scenario: la asociación vigente también cuenta como «ya la tiene»
- GIVEN un ticket con `orden_venta` vacía y una asociación vigente de `OVI-2026-001`
- WHEN un usuario sin cargo envía esa orden
- THEN no recibe el `403` de cargo
