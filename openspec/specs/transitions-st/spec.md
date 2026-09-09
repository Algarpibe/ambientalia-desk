# Capacidad `transitions-st` — el motor de transiciones del servicio técnico

| Dato | Valor |
|---|---|
| Capacidad | `transitions-st` (`openspec/config.yaml:87-89`) |
| Estado | **as-built completo**, contrastado contra el código. **§3.1 (C1) cerrada por F1A-01** y **C11 cerrada en su regla y en su destinatario de escalado por F1A-02** (RQ-TS-15 y RQ-TS-16), las dos el 2026-09-09; el resto del §3 sigue abierto, y §3.10 dice qué falta de C11 |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 109 ficheros y 929 pruebas en verde, 1 fichero y 2 pruebas saltados, 29,44 s. **Re-verificada en F1A-01** sobre `3aaa0f1`: las mismas cifras. **Ampliada en F1A-02** sobre `ec0ed1f`: 112 ficheros / 953 pruebas, 951 en verde y 2 saltadas |
| Tanda que la escribe | F0-02 |
| Contenido | **16** requisitos (`RQ-TS-01`…`RQ-TS-16`) · **10** entradas de comportamiento actual (§3.1–§3.10), de ellas **§3.1 ya CERRADA** por F1A-01 · **9** discrepancias maestro↔código (M-1…M-9) y **8** diseño↔código (D-1…D-8) |
| Diseño de procedencia | `docs/superpowers/specs/2026-06-04-subsistema-b-transiciones-postgres-design.md` (124 líneas, «Aprobado para planificación»). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | M1.3 (`R08.1.md:1106-1443`) · M1.9.1 (`:1614-1650`) · M1.9.2 (`:1651-1666`) · M1.9.3 (`:1667-1674`) · M1.10 (`:1675-1677`) · Anexo H.2 (`:4488-4496`) |
| Tandas que la tocan | **F1A-01** (C1 — **hecha**, 2026-09-09) · **F1A-02** (C11: la regla y el destinatario del escalado, **hechos**; el disparo, §3.10) · **F1B-06** (dos grafos nuevos) · **F1C-02** (C4) · **F1C-03** (C3) · **F1C-04** (C7) · **F1C-05** (permisos finos) · **F1C-06** y **C9** (tiempos). Origen: `openspec/changes/F0-04/proposal.md:20-26` |
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
| Catálogo de transiciones | «`shared/transitions.ts` (34 transiciones + campos obligatorios)» (`design:27`) | «34 transiciones y 21 estados» (`:360`, `:889`) | 34 entradas en `TRANSICIONES_BASE` (`packages/shared/src/transitions.ts:171-256`), fijadas por prueba (`invariantesGrafo.test.ts:50-54`) |
| Registro de estados | No existe en el diseño | «21 estados» (`:391`) | `estados.ts:59-103`. **No existía hasta F0-04**: se derivaban de los `from`/`to` (`estados.ts:3-4`) |
| Destino de escritura | «**Postgres** (no Zoho)» (`design:19`) | — | `packages/zoho-sync/src/db/repo.ts:249-287`. Ninguna llamada a Zoho |
| Actor | Constante `'Equipo Técnico'`, «el login/roles reales son el Subsistema H» (`design:20`) | M1.10: «toda etapa y toda transición deben registrar fecha, hora y persona» (`:1677`) | Usuario de la sesión, con la constante como respaldo (`ticketService.ts:111`, `transitionActor.ts:3`) |
| Permisos | «Mientras tanto **cualquiera puede ejecutar cualquier transición**» (`design:121`) | M1.9.1: «los permisos por área viven en `packages/shared/src/permissions.ts`» (`:1636`) | Impuesto en servidor (`ticketService.ts:89-91`) y probado en las 34 × 3 áreas (`permisos.test.ts:41-110`) |
| Endpoint | «Rewrite endpoint … en `server/app.ts`» (`design:88`) | — | `apps/desk/server/routes/tickets.ts:192-194` |

---

## 1 · El grafo

### RQ-TS-01 · El catálogo de transiciones es la única fuente

El catálogo de transiciones del flujo de servicio técnico **SHALL** vivir en
`packages/shared/src/transitions.ts` y **SHALL** ser exactamente **34** entradas sobre **21** estados
(`transitions.ts:171-256`; recuento fijado en `invariantesGrafo.test.ts:50-54`).

- El cliente **MUST** consumir ese catálogo; **MUST NOT** reescribirlo. Es la regla invariable 1 de
  `CLAUDE.md`.
- Lo que la aplicación ejecuta **SHALL** ser `TRANSITIONS` (`transitions.ts:288-291`), no
  `TRANSICIONES_BASE`: la segunda no se exporta, y la primera es la que añade la casilla de derivación
  a todas. Los invariantes **MUST** afirmarse sobre `TRANSITIONS`
  (`invariantesGrafo.test.ts:15-21`).
- Las transiciones aplicables a un estado se obtienen por `transitionsForStatus`
  (`transitions.ts:294-296`) y una transición por su id con `transitionById`
  (`transitions.ts:298-300`).

**Los siete invariantes del grafo** (F0-04) **SHALL** permanecer en verde:

| # | Invariante | Prueba |
|---|---|---|
| 1 | Los estados declarados son exactamente los derivados de los `from`/`to` | `invariantesGrafo.test.ts:35-42` |
| 2 | 34 transiciones, 21 estados, 34 ids distintos | `:50-54` |
| 3 | `Finalizado` es el único estado sin transición de salida | `:62-66` |
| 4 | Ningún `from` ni `to` apunta fuera del registro | `:76-82` |
| 5 | Las ocho transiciones compartidas son ésas, cada una con su pareja de áreas | `:91-106` |
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
  (`repo.ts:271`) y lo saca del sincronismo sin que nadie lo haya pedido
  (`estadoPorRemision.ts:32-34`).

> **Given** un ticket con estado `OV asignada`
> **When** se crea y confirma una remisión de entrada para ese ticket
> **Then** el estado del ticket NO cambia, y el ticket sigue en el ciclo de sincronización con Zoho.

### RQ-TS-03 · Dos pasos sin botón, aplicados por el servidor

Dos pasos del mapa **SHALL** aplicarse sin que nadie pulse nada, y **MUST NOT** figurar en
`TRANSITIONS` (`transitions.ts:146-151`; prueba de la exclusión en `invariantesGrafo.test.ts:120-127`):

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

**Discrepancia de ubicación con el maestro.** M1.3.3 (`:1151`) dice que los dos pasos «viven en
`apps/desk/server/db/estadoPorRemision.ts`, **no en el archivo de transiciones**». Es exacto para la
*aplicación* del paso y **falso para su declaración**: las dos constantes con `id`, `name` y `area`
están en `transitions.ts:150-151`, y `estadoPorRemision.ts:9-12` las importa de `@ambientalia/shared`.
Lo que no está en el archivo de transiciones es el `from`/`to`, porque no son grafo.

### RQ-TS-04 · `Finalizado` es el único estado terminal

`Finalizado` **SHALL** ser el único estado sin transición de salida
(`invariantesGrafo.test.ts:62-66`; maestro M1.3.8, `:1414`), y **SHALL** ser el único estado que
produce `statusType: 'Closed'` (`transitionExec.ts:5`, `:39`). Todos los demás producen `'Open'`.

`areasSiguientes` **SHALL** devolver lista vacía para un estado terminal: no hay a quién pasarle el
testigo (`transitions.ts:318-327`).

### RQ-TS-05 · Alcanzabilidad de los 21 estados

**Verificado en esta tanda** por cierre transitivo sobre `TRANSITIONS` (`transitions.ts:171-256`):

| Desde | Estados alcanzados, contando el origen | No alcanzados |
|---|---|---|
| `OV asignada` | 19 | `Ticket creado`, `Remisión creada` |
| `Ticket creado`, sólo por botones | 19 | `OV asignada`, `Remisión creada` |
| `Ticket creado`, sumando el paso sin botón de RQ-TS-03 | 20 | `OV asignada` |

Es decir: `Remisión creada` **MUST NOT** ser alcanzable por ninguna transición con botón; su única
entrada es el paso sin botón de `estadoPorRemision.ts:52-60`. No hay estados huérfanos y no hay
callejones sin salida más allá de `Finalizado`.

**Discrepancia con el maestro.** M1.3.8 (`:1413`) dice «18 desde `OV asignada`, y desde
`Ticket creado` los otros 20 —todos menos `OV asignada`—». Las dos cifras son correctas pero **no
sobre la misma base**: la de 18 excluye el estado de origen (19 contándolo) y la de 20 lo incluye.
Además, la de 20 sólo se alcanza contando el paso sin botón; por botones y en la misma base que la
primera cifra son 18 también. La conclusión del maestro —«no hay estados huérfanos»— se sostiene; su
aritmética mezcla dos convenciones.

---

## 2 · La ejecución de una transición

### RQ-TS-06 · Orden de las guardas, y qué contesta cada una

`POST /api/tickets/:id/transition` (`routes/tickets.ts:192-194`) **SHALL** exigir sesión
(`routes/tickets.ts:35`) y **SHALL** aplicar las guardas de `executeTransition`
(`services/ticketService.ts:74-113`) **en este orden**, porque el orden es observable —una guarda
anterior se come la respuesta de la siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La transición existe | `400` | `ticketService.ts:82-83` |
| 2 | El ticket existe | `404` | `:84-85` |
| 3 | El estado actual está en el `from` de la transición | `409` | `:86-88` |
| 4 | El área del usuario cubre el área de la transición | `403` | `:89-91` |
| 5 | Los campos obligatorios están presentes | `422` | `:93-94` |
| 6 | La orden de venta no está ya asociada a otro ticket | `409` | `:98-102` |
| 7 | La persona a la que se deriva existe y está activa | `422` | `:106-110` |

El orden **MUST** tenerse en cuenta al probar: una matriz de permisos montada sobre un estado de
origen inválido comprueba el `409` de la guarda 3 y cree comprobar el `403` de la 4
(`permisos.test.ts:29-33`).

> **Given** un ticket en estado `En Proceso`
> **When** se ejecuta `aprobacion`, cuyo único `from` es `Notificación cliente`
> **Then** el servidor responde `409` y no escribe nada.

### RQ-TS-07 · Permisos por área

El permiso **SHALL** calcularse con `canExecuteTransition(userAreas, isAdmin, transitionArea)`
(`packages/shared/src/permissions.ts:4-6`), que es siete líneas y el único sitio de la regla.

- Las áreas base **SHALL** ser exactamente tres: `Comercial`, `Servicio Técnico`, `Compras`
  (`transitions.ts:303`).
- Un área compuesta se descompone por el separador `' / '` (`transitions.ts:306-308`).
- **Ocho** de las 34 transiciones **SHALL** ser compartidas por dos áreas: cinco
  `Comercial / Compras` y tres `Comercial / Servicio Técnico`. El emparejamiento id → área está
  fijado, no sólo el número (`invariantesGrafo.test.ts:91-106`).
- Un administrador **MAY** ejecutar las 34 sin que su área importe
  (`permissions.ts:5`; probado contra el servidor en `permisos.test.ts:89-109`).
- La matriz completa **SHALL** ser 34 × 3 = **102 casos: 60 prohibidos y 42 permitidos**
  (26 transiciones de área simple × 2 áreas prohibidas + 8 compartidas × 1)
  (`permisos.test.ts:77-82`, derivación en `:41-67`).

**El espejo del cliente es legítimo desde F0-04.** `TransitionPanel.tsx:56-58` filtra los botones por
área en el navegador. Con la matriz de `permisos.test.ts:41-110` probada contra el servidor, la
frontera **está** impuesta y probada donde se puede confiar en ella, y la pantalla sólo evita ofrecer
lo que iba a ser rechazado: cumple el punto 3 de la regla invariable 13
(`permisos.test.ts:35-39`). Antes de F0-04 no lo cumplía.

> **Given** un usuario cuyo rol sólo tiene el área `Servicio Técnico`
> **When** intenta ejecutar `facturado`, de área `Comercial`, desde un estado de origen válido
> **Then** el servidor responde `403` y el ticket no se mueve.

### RQ-TS-08 · Campos y validación de obligatorios

`buildTransitionPlan(transition, values)` (`apps/desk/server/transitionExec.ts:37-99`) **SHALL** ser
la única validación de campos, **SHALL** ser puro y **SHALL** devolver la lista de errores en
`plan.errors` en lugar de lanzar.

- Un campo `required` que llega vacío **SHALL** producir
  `Falta el campo obligatorio: <label>` (`transitionExec.ts:77`), y el llamador **SHALL** traducirlo a
  `422` (`ticketService.ts:93-94`).
- El **comentario NUNCA MAY declararse obligatorio**: el ayudante `comment()` no admite parámetro
  (`transitions.ts:65-74`), y por eso el motor se quedó sin la guarda aparte que lo comprobaba
  (`transitionExec.ts:95-99`). Es el principio de diseño nº 4 del maestro cumplido en el código
  (`:1416`).
- Un `checkbox` **required SHALL** exigir que llegue **marcado**: la condición es `asBool(raw) !== true`,
  no `empty` (`transitionExec.ts:76`). Ausente y presente-en-`false` **SHALL** producir el mismo
  `Falta el campo obligatorio: <label>`. Era el defecto **C1**, cerrado en **F1A-01** — ver §3.1.
- Un `checkbox` **opcional** ausente **SHALL** seguir escribiéndose como `false`: el chequeo de
  obligatorio va antes del bloque del checkbox, y éste antes del `if (empty) continue`
  (`transitionExec.ts:76-86`, fijado en `transitionExec.test.ts:89-111`).
- Las etiquetas de campo son las **etiquetas exactas de Zoho** (`transitions.ts:20-21`).

### RQ-TS-09 · Mapeo de campos a columnas

El destino de cada valor **SHALL** derivarse de su `target` (`transitions.ts:17`):

| `target` | Destino | Evidencia |
|---|---|---|
| `comment` | El comentario de la transición | `transitionExec.ts:46` |
| `priority` | La columna `priority` | `transitionExec.ts:88` |
| `derivacion` | La columna `derivado_a` | `transitionExec.ts:13`, `:58-61` |
| `customField` | Columna promovida si la etiqueta está en `PROMOTED_COLUMNS`; si no, a `custom_fields` | `transitionExec.ts:4`, `:90-92` |

**Verificado en esta tanda:** las **27** etiquetas de campo distintas que declaran las 34 transiciones
—contando el `campoFecha` que arrastra el buscador de órdenes de venta— están **todas** en
`PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts`), de las 39 que ese mapa declara. **Ninguna
cae al cajón `custom_fields`.** Confirma M1.3.8 del maestro (`:1415`).

El campo `ordenVenta` **SHALL** comportarse como texto para el motor pero **SHALL** pintarse como
buscador contra las órdenes de venta de Books, y **SHALL** arrastrar la fecha declarada en su
`campoFecha` (`transitions.ts:8-14`, `:85-87`).

### RQ-TS-10 · Las tres escrituras, atómicas

Una transición **SHALL** producir exactamente tres escrituras, y **SHALL** aplicarlas en una
transacción cuando el pool lo permita, con `ROLLBACK` ante cualquier fallo
(`packages/zoho-sync/src/db/repo.ts:290-315`):

1. **Comentario** en `conversations`, sólo si hay comentario: `kind='comment'`, `author_type='agent'`,
   `is_public=false`, `content_type='plainText'`, `commented_time=now()`, `source='app'`
   (`repo.ts:258-267`). El id se acuña con el prefijo `app-` (`:261`).
2. **Update del ticket**: `status`, `status_type`, las columnas tipadas, la fusión en `custom_fields`,
   y **SHALL** fijar `managed_by_app=true`, `source='app'`, `modified_time=now()` y `updated_at=now()`
   (`repo.ts:271-279`).
3. **Historial** en `ticket_transitions`: `transition_id`, `transition_name`, `from_status`,
   `to_status`, `area`, `performed_by`, `values` y `comment_id` (`repo.ts:282-286`).

Los nombres de columna del `SET` **MUST** proceder de `PROMOTED_COLUMNS` y **MUST NOT** poder llegar
de fuera (`repo.ts:269-270`; la columna de derivación es constante del código, `transitionExec.ts:8-13`).

### RQ-TS-11 · La traza: fecha, hora y persona, sin excepciones

Toda transición **SHALL** dejar fila en `ticket_transitions` con su origen, su destino, su área y
**quién la ejecutó** (`repo.ts:282-286`). Es M1.10 del maestro, `[DECIDIDO — R08]`, «no admite
excepciones» (`:1677`).

- El actor **SHALL** ser el usuario de la sesión, y **MAY** caer a la constante `TRANSITION_ACTOR`
  sólo si la sesión no trae nombre (`ticketService.ts:111`, `transitionActor.ts:3`).
- La cobertura **SHALL** ser de las 34: el barrido ejercita **todos** los `from` de cada transición
  —`habilitar_servicio` tiene tres—, o sea **36 ejecuciones**, y comprueba en cada una el estado
  destino y la fila del historial (`transicionesEjecucion.test.ts:105-117`, `:272-285`).
- La fila de la creación del ticket **SHALL** llevar `from_status = '(creación)'`
  (`transitions.ts:100-110`), que no es un estado de Zoho sino la marca de que esa fila es la foto del
  nacimiento (maestro M1.3.8, `:1417`).

### RQ-TS-12 · Derivación: de quién es el trabajo a partir de aquí

Las **34** transiciones **SHALL** terminar en una casilla «Derivado a», y **ninguna MAY** exigirla:
derivar no puede frenar un ticket (`transitions.ts:96-98`, `:277-291`; maestro M1.9.2, `:1653`).

- La clave y el nombre de columna **SHALL** ser `derivado_a` (`transitions.ts:89-94`).
- **Tres** etapas proponen destinatario y **31** heredan el que el ticket ya traía
  (`transitions.ts:267-275`):

| Etapa | Propone | Por qué |
|---|---|---|
| `escalado_a_revision` | Cargo · `Director Técnico` | Escalar una revisión es subirla al inmediato superior |
| `escalado_a_comercial` | Cargo · `Coordinador Comercial` | El ticket sale de Servicio Técnico y pasa a Comercial |
| `aprobacion` | `primerDerivado` | El trabajo vuelve al taller: hay que devolvérselo a quien lo diagnosticó |

- Las dos primeras **SHALL** nombrar un **cargo y no una persona**: un id ataría el blueprint a que ese
  empleado siga en la empresa (`transitions.ts:44-46`; maestro `:1666`).
- El motor **SHALL** distinguir dos silencios que ningún otro campo distingue
  (`transitionExec.ts:48-61`): la clave **ausente** no toca lo que hubiera; la clave **vacía** borra
  la derivación. Sin esa distinción, vaciar la casilla no haría nada.
- Un id de persona recibido **MUST** comprobarse: inexistente o dada de baja produce `422`
  (`ticketService.ts:106-110`).

### RQ-TS-13 · Avisos: se calculan desde el estado de llegada

El destinatario **SHALL** calcularse desde el **estado de llegada** y **MUST NOT** calcularse desde el
área que ejecutó la transición (`transitions.ts:310-327`; maestro M1.9.3, `:1670-1671`).

- `areasAAvisar(estado, areasActor)` **SHALL** ser `areasSiguientes(estado)` **menos** las áreas de
  quien pulsó (`services/avisoArea.ts:15-17`). Sin la resta, `facturado` avisaría a Comercial de que
  le toca a Comercial.
- Un administrador tiene las tres áreas, así que **MUST NOT** disparar ningún aviso de área
  (`avisoArea.ts:11-13`; maestro `:1672`).
- Los avisos **SHALL** escribirse **después** de la transición y **fuera de su transacción**, porque
  `avisos` es tabla de la aplicación y `applyTransition` vive en el paquete de sincronización
  (`ticketService.ts:115-122`; maestro `:1673`).
- La contrapartida **SHALL** quedar escrita y aceptada: una caída entre las dos escrituras pierde el
  aviso (`ticketService.ts:119-121`; maestro `:1674`, punto abierto nº 36).
- Los avisos de una misma transición **SHALL** deduplicarse por persona antes de escribir
  (`ticketService.ts:151-152`, `:156-159`) y **SHALL** mandarse en **una** sola llamada a n8n
  (`:123-125`).
- El correo **MUST NOT** poder tumbar la transición; lo que no se sella queda en `NULL`, que es la cola
  de reintento (`ticketService.ts:167-177`).

### RQ-TS-14 · Una orden de venta, un ticket — en la puerta de la transición

`habilitar_servicio` es la segunda de las tres puertas por las que una OV entra en un ticket. Al
escribir `orden_venta`, la transición **SHALL** rechazar con `409` una orden ya asociada a otro
ticket, excluyendo el propio (`ticketService.ts:95-102`, con `ticketConOrdenVenta` en
`packages/zoho-sync/src/db/repo.ts:330-347`).

La tercera puerta —el alta de remisión— **NO** la comprueba. Ver §3.4. Las otras dos puertas y la
regla completa pertenecen a las specs `tickets-core` y `remisiones`.

---


### RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** declararse como **dato**, no derivarse del grafo
(`packages/shared/src/sla.ts`, `SLA_HORAS_POR_ESTADO`). De las 34 transiciones no se deduce que
`Notificado` merezca un día y `Pendiente` no: es una decisión de negocio, igual que
`ESTADOS_SIN_SALIDA`.

- Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h. Es el único que el maestro decidió
  (M1.7, `R08.1.md:1570`; punto abierto nº 40), y venía del blueprint de Zoho, que sí lo tiene.
- La unidad **SHALL** ser la **hora**, no el día: el maestro deja abierto en «24/48 h» el plazo de la
  otra regla por tiempo que tiene pensada (`:1586`), y declarar días obligaría a cambiar la unidad el
  día que Gerencia elija 48.
- En el instante **exacto** del vencimiento el SLA **MUST NOT** estar vencido: un plazo de «un día»
  que saltara a las 23:59:59.999 no sería un día. La comparación es estricta
  (`sla.ts`, `slaVencido`; probado en `packages/shared/src/sla.test.ts`).
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). No la primera: `Notificado` está en un ciclo
  con `Rev./Diagnostico` —componente C3 de la tabla de reentrancia— y con la primera, un ticket que
  acaba de volver saldría vencido por una espera que ya terminó.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** reportarse como vencido: no se
  sabe cuándo entró en su estado, y un SLA sobre una fecha desconocida no es un SLA.
  `tickets.created_time` dice cuándo nació el ticket, que es otra cosa. **Esto acota la regla a los
  tickets que la aplicación ha movido**, y en producción los replicados de Zoho no lo están.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA`. Es la regla que §3.7 dejaba escrita sin un caso que
  la demostrara, y ya lo hay: el único estado con SLA está clasificado `ninguna` (`estados.ts:79`),
  así que no es ninguno de los ocho de la vista ni de los cuatro sin salida. Probado.

**Lo que este requisito NO incluye, y sigue abierto — ver §3.10.** Nada de esto **dispara**: no hay
planificador. El destinatario del escalado sí está resuelto, y es `RQ-TS-16`.

### RQ-TS-16 · A quién se escala — la segunda pieza de C11, cerrada en F1A-02

El destinatario del escalado **SHALL** derivarse de la tabla de derivación por cargo que ya existe,
**no** de una jerarquía aparte. Lo manda el maestro en la línea siguiente a pedir el escalado:
«Encaja con la derivación de M1.9.2, que ya sabe a qué cargo corresponde cada etapa: el escalado
puede apoyarse en esa misma tabla en lugar de mantener una jerarquía aparte» (`R08.1.md:1575`). Y esa
tabla ya traía el concepto con las mismas palabras: `DERIVACION_POR_DEFECTO` abre con «escalar una
revisión es **subirla al inmediato superior**» (`transitions.ts:268`).

`destinatarioDelEscalado(estado)` (`packages/shared/src/sla.ts`) **SHALL** devolver **el cargo que
proponen las transiciones salientes de ese estado**, con estos tres casos y ninguno resuelto
inventando:

| Caso | Devuelve | Por qué |
|---|---|---|
| Un cargo, por una o varias vías | `{ hay: true, cargo, via[] }` | Dos caminos al mismo puesto no son ambigüedad: el destinatario es uno, y se dicen las dos vías |
| Ninguna saliente propone cargo | `{ hay: false, motivo: 'ningun_cargo' }` | La función **MUST NOT** mentir sobre los estados que no tienen a quién escalar |
| Dos cargos distintos | `{ hay: false, motivo: 'ambiguo' }` | Elegir el primero sería inventar un orden entre dos puestos — la misma clase de regla que `DerivacionPorDefecto` evita al ser una unión (`transitions.ts:38-43`) |

- `primerDerivado` **MUST NOT** contar como destinatario de escalado, aunque esté en la misma tabla:
  devuelve el trabajo a quien tomó el ticket, que es lo **contrario** de escalar. Es lo que hace
  `Notificación cliente` con `aprobacion`, y sin la comprobación del `tipo` colaría como cargo.
- Hoy **SHALL** haber exactamente **dos** estados con destinatario: `Rev./Diagnostico` → Director
  Técnico (`escalado_a_revision`) y `Notificado` → Coordinador Comercial (`escalado_a_comercial`,
  `transitions.ts:220`, `:271`). Y **ninguno ambiguo**: hay una prueba que lo vigila para cuando
  F1B-06 añada dos grafos enteros.
- Todo estado con SLA declarado **SHALL** tener destinatario. Si mañana se declara un SLA sobre un
  estado sin escalado saliente, el reloj mediría un retraso que no se le puede comunicar a nadie, y
  la prueba lo dice antes.
- `ticketsConSlaVencido` (`apps/desk/server/db/sla.ts`) **SHALL** devolverlo junto al ticket y al
  «desde»: un retraso sin destinatario no es accionable, y es justo lo que la R08 pedía arreglar.

---

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
`cfCheck('Liberación del ticket sin facturar', true)` (`transitions.ts:246-247`).

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
cuatro **SHALL** estar declarados como dato, no derivados (`estados.ts:140-149`):

| Estado | Única salida | De qué depende |
|---|---|---|
| `En Espera de Repuestos` | `llegada_repuestos` | Que el proveedor entregue |
| `Solicitado` | `entrega_repuestos` | Que almacén entregue la pieza |
| `Servicio externo` | `retorno_servicio_externo` | Que el laboratorio externo devuelva el sensor |
| `En espera de SKU inventario` | `notif_cliente_sku` | Que se cree el SKU en inventario |

El discriminador **SHALL** ir escrito, no sobreentendido: «el suceso del que depende la única salida
ocurre **fuera** de la aplicación» (`estados.ts:120-124`).

**La lección de método, que vale más que la lista:** «salida única» no es proxy de nada. Hay **doce**
estados con una sola salida, entre ellos `Ingresado` y `Ticket creado`, que son trabajo corriente; y
cruzarlo con `en_espera` da **cinco**, con `Liberación Comercial` dentro. Por eso los cuatro se
declaran y no se derivan (`estados.ts:132-136`). `Liberación Comercial` queda fuera porque su única
salida **es un acto que se ejecuta en la aplicación** (`estados.ts:126-130`).

### 3.3 · C4 y la reentrancia — diez campos de fecha que una segunda pasada reescribe · **destino F1C-02, F1C-06, C9**

**Comportamiento actual, a corregir en C4.** El grafo tiene ciclos, y las transiciones internas a un
ciclo reescriben sus campos de fecha al recorrerlo otra vez. Los campos afectados **SHALL** ser
exactamente **diez**, derivados del grafo y no de una tabla escrita a mano
(`packages/shared/src/reentrancia.ts:218`, conjunto fijado en `invariantesGrafo.test.ts:137-150`).

El más visible es el ciclo entre `Por Facturar` y `Por Entregar / Sin facturar`, que puede recorrerse
indefinidamente y pisa `Fecha Remisión de Salida` (maestro M1.3.5, `:1190-1192`).

**Lo que salva el caso, y por qué esto no obliga a rediseñar aquí:** `ticket_transitions.values` es
`jsonb` y guarda **todos** los valores de cada transición (`repo.ts:282-286`). Las columnas de
`tickets` guardan el **último** valor; el historial guarda **todos**. De ahí la regla que esta spec
deja escrita para `kpis` y F1C-06:

> **Los KPIs de G.6 SHALL calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`.**

Cuatro indicadores de G.6 —columnas 50, 53, 57 y 58— quedan rotos y **sin dueño** asignado
(`reentrancia.ts:71-83`). Elegir entre las dos soluciones de P34 es F1C-02; esta spec sólo registra
que se puede (`reentrancia.ts:32`).

### 3.4 · La tercera puerta de la orden de venta · **destino F1A**

**Comportamiento actual, a corregir en F1A** (`config.yaml`, `incumplimientos_vivos`, IV-4). La regla «una OV, un ticket»
tiene **tres** puertas y sólo **dos** la comprueban:

| Puerta | Comprueba | Precedencia del `409` frente al `422` de obligatorios | Evidencia |
|---|---|---|---|
| Creación de ticket | Sí, `409` | El `409` de la OV **gana** | `ticketService.ts:45-49` |
| Transición `habilitar_servicio` | Sí, `409` | El `422` de obligatorios **gana** | `ticketService.ts:98-102` |
| **Alta de remisión** | **No** | — | `apps/desk/server/routes/remision.ts:189-197` |

**Las dos primeras no son equivalentes**: comprueban la misma regla en órdenes opuestos. Es una
inversión de precedencia, y va aparte en §3.8.

La tercera confía en `WHERE COALESCE(orden_venta,'') = ''`, que impide pisar la OV del propio ticket
pero **no** que dos tickets distintos acaben con la misma. Hay un `it.fails` esperando
(`apps/desk/server/ordenVentaUnTicket.test.ts:161`), y una prueba que fija el daño observable: la
orden queda en los dos tickets, por sus dos vías (`:156-158`).

### 3.5 · C5 — las transiciones no llevan tipo de evento · **destino: sin tanda asignada**

**Comportamiento actual, a corregir en C5** (maestro `:1439-1443`, punto abierto nº 35). Las 34
transiciones llevan `area` y `fields` y **no** llevan tipo de evento (operativa / decisional /
logística): el `interface Transition` sólo declara `id`, `name`, `from`, `to`, `area`, `fields`
(`transitions.ts:55-62`). Sin ese atributo, el análisis de tiempos por tipo de evento de M7.3 no es
calculable.

### 3.6 · IV-1 — la vista clasifica las esperas por el nombre del estado · **destino F1A**

**Comportamiento actual, a corregir en F1A** (`config.yaml`, `incumplimientos_vivos`, IV-1). `boardView.ts:35` clasifica
las esperas con `/espera/i` sobre el nombre del estado, y se usa en `:43` y `:44`. Diverge del
registro de `estados.ts`:

- El registro declara **ocho** estados en espera —tres `externa` y cinco `interna`—
  (`estados.ts:59-114`).
- La regex casa con **exactamente dos** de esos ocho: `En Espera de Repuestos` y
  `En espera de SKU inventario`. Los otros seis —`Servicio externo`, `Notificación cliente`,
  `Notificación a Compras`, `Notificación Comercial`, `Solicitado`, `Liberación Comercial`— no llevan
  la palabra en el nombre y **no** se cuentan.
- Y tiene **cero falsos positivos**: ninguno de los 13 estados restantes de los 21 lleva «espera» en
  el nombre.

**Es un defecto POR DEFECTO, no por exceso, y eso cambia cómo se arregla.** No hay que estrechar el
criterio para que deje de coger lo que no debe: hay que **sustituirlo por la lista**
(`ESTADOS_EN_ESPERA`, `estados.ts:111-114`). La redacción de F0-01 —«y uno que la lleve sin serlo
sí»— describía el riesgo del criterio, no un caso vivo; verificado en esta tanda que hoy no existe
ninguno.

F0-04 dejó el registro que lo cierra; consumirlo es F1A.

### 3.7 · La vista y el reloj no leen la misma lista

**No es un defecto: es la regla, y si no queda escrita F1C-06 la pierde** (`estados.ts:26-33`). Tres
criterios distintos usan la palabra «espera» y **MUST** nombrarse distinto:

| Nombre | Criterio | Fuente | Alcance |
|---|---|---|---|
| `sin_salida` | Su única salida depende de algo que la aplicación no controla | M1.3.4 (`:1162`) | **4 estados** |
| `en_espera` | El ticket está parado esperando el acto de un tercero y el área dueña no puede hacer nada por su cuenta | Vista del tablero | **8 estados** |
| `bodegaje` | El tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente | M1.10 `[DEFINIDO — R08]` (`:1686`) | **3 periodos entre fechas**, no estados |

> **La vista muestra las ocho. El reloj del SLA NO lee esta clasificación** (`estados.ts:28`).

El reloj para en los tres bodegajes, que son periodos entre fechas. Un estado **MAY** estar
`en_espera` sin parar ningún reloj, y un bodegaje **MAY** transcurrir sin pasar por ningún estado de
la lista.

**Y desde F1A-02 esa regla tiene un caso que la demuestra, no sólo una advertencia.** El único
estado con SLA declarado es `Notificado`, y está clasificado `ninguna` (`estados.ts:79`): no es
ninguno de los ocho de la vista ni de los cuatro sin salida. La primera regla por tiempo que el
código tiene lee una lista **distinta** de la que enseña el tablero, exactamente como §3.7 anticipaba
cuando todavía era hipótesis. Probado en `packages/shared/src/sla.test.ts` — si alguien «arreglara»
el reloj haciéndolo leer `ESTADOS_EN_ESPERA`, se pone rojo. Ver `RQ-TS-15`.

`Pendiente` **SHALL** quedar como `sin_clasificar`, que es valor válido y no un hueco: obligar a
clasificar forzaría a inventar la respuesta (`estados.ts:53-54`, `:92-96`). Lo decide Servicio
Técnico.

### 3.8 · Dos inversiones de precedencia entre guardas · **destino F1A**

**Comportamiento actual, a corregir en F1A.** Son dos, y son hermanas: las dos consisten en que el
orden en que se evalúan las guardas no es el orden que el contrato debería tener. Las fijó
`d24466e` («test(server): precedencia entre guardas de ticketService»), que las descubrió al probar
casos que rompen **dos** guardas a la vez — por HTTP el orden no se distingue
(`services/ticketService.test.ts:12-13`, `:18`).

#### a) Las dos puertas de la OV comprueban la misma regla en órdenes opuestos

| Puerta | Orden declarado | Quién gana ante el error doble |
|---|---|---|
| `createManagedTicket` (`ticketService.ts:22-60`) | 422 equipo → 422 OV inexistente → **409 OV ya usada** → 422 obligatorios → 422 cliente | el **`409`** de la OV (`ticketService.test.ts:295`) |
| `executeTransition` (`ticketService.ts:82-110`) | 400 → 404 → 409 estado → 403 área → **422 plan** → **409 OV** → 422 derivación | el **`422`** de obligatorios (`ticketService.test.ts:176`) |

El motor **SHALL** dar hoy respuestas distintas al mismo error doble según por dónde se entre
(`ticketService.test.ts:277-287`). La consecuencia es de usabilidad y de contrato: quien manda un
formulario a medias con una orden ya usada recibe en la creación la queja de la orden y en
`habilitar_servicio` la de los campos, y hacen falta **dos viajes para dos problemas que ya se
conocían en el primero** (`ticketService.test.ts:138-141`).

#### b) El `409` de estado contesta antes que el `403` de área

En `executeTransition`, la guarda 3 —el estado de origen— **SHALL** evaluarse antes que la guarda 4
—el área— (`ticketService.ts:86-88` antes de `:89-91`; fijado en `ticketService.test.ts:154`). A
quien no tiene el área se le responde por el **estado del ticket**.

**Alcance real, para no exagerarlo.** El middleware ya exige sesión antes de llegar aquí
(`routes/tickets.ts:35`), así que **no es exposición a un anónimo**. Y el `403` llegaría igual en
cuanto el ticket estuviera en el estado bueno, así que no oculta nada duradero
(`ticketService.test.ts:133-136`). Es **inconsistencia de contrato, no fuga**: el mismo endpoint
clasifica el mismo fallo de permiso de dos maneras según el estado en que pille el ticket.

#### Por qué van juntas

**Corregir una sin la otra deja el problema.** Las dos son decisiones sobre el mismo eje —qué guarda
gana cuando fallan varias— y arreglar sólo (a) deja `executeTransition` con su orden interno
coherente y su relación con el `403` incoherente; arreglar sólo (b) reordena `executeTransition` y
vuelve a separarlo de `createManagedTicket`. F1A **SHALL** fijar un orden único para las dos puertas
y aplicarlo en las dos.

### 3.9 · Dos cuentas mal en el docblock de la derivación · **destino F1B-06**

**Comportamiento actual, a corregir en F1B-06** (la tanda que toca el fichero). El docblock de
`DERIVACION_POR_DEFECTO` (`transitions.ts:258-266`) tiene **dos** recuentos incorrectos, y van
juntos:

| Línea | Dice | Es |
|---|---|---|
| `transitions.ts:262` | «lo que hacen las otras **32**» | **31** (34 − 3 que proponen) |
| `transitions.ts:265` | «en **35** declaraciones no» | **34** |

Es defecto de **comentario, no de comportamiento**: el mapa tiene tres entradas y `TRANSITIONS`
tiene 34, y las dos cosas están probadas (`invariantesGrafo.test.ts:50-54`). Aquí el maestro tiene
razón y el código no: M1.9.2 (`R08.1.md:1653`) dice «treinta y una», que es la cifra correcta. Ver
M-5 en §4.2.

F0-02 **MUST NOT** corregirlo: es código, y esta tanda no toca código.

---

### 3.10 · C11 — lo único que falta es el planificador · **destino: sesión de trabajo**

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
(`ticketService.ts:154-177`; spec `derivacion-avisos` RQ-AV-04 y RQ-AV-09), y **el propio maestro lo
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
| **El disparo** | **Falta.** Un planificador, un barrido al arrancar o una llamada desde el tablero | Diseño, no negocio |
| Si el SLA se extiende a otros estados | Abierto (`R08.1.md:4011` lo pregunta) | **Gerencia** |
| Qué hacer con los tickets replicados, que no tienen traza | Abierto (`RQ-TS-15`) | Diseño + Gerencia |

---

## 4 · Discrepancias

### 4.1 · Diseño ↔ código

El diseño es del 04/06/2026 y el código de septiembre. Manda el código.

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «Mientras tanto **cualquiera puede ejecutar cualquier transición**; el actor es la constante temporal» (`design:121`) | Permiso por área impuesto en servidor (`ticketService.ts:89-91`), matriz de 102 casos probada (`permisos.test.ts:77-82`), y el actor es el usuario de la sesión (`ticketService.ts:111`) | **Superado.** El Subsistema H llegó. El diseño describe un estado del proyecto que ya no existe |
| D-2 | «Rewrite endpoint `POST /api/tickets/:id/transition` en `server/app.ts`» (`design:88`) | Vive en `apps/desk/server/routes/tickets.ts:192-194` | Movido. Cualquier cita del diseño a `app.ts` apunta a un fichero que ya no lo contiene |
| D-3 | `applyTransition(db, ticketId, fromStatus, transition, plan, actor)` — seis parámetros (`design:85`) | Siete: añade `values` al final (`repo.ts:290-298`) | El séptimo es lo que hace posible RQ-TS-11 y la salida de C4: sin `values` en el historial, `ticket_transitions` no guardaría «todos» los valores |
| D-4 | «El mapeo usa el inverso de `PROMOTED_COLUMNS` (ya existe en `server/db/rows.ts`)» (`design:56`) | Vive en `packages/zoho-sync/src/db/rows.ts`, importado como `@ambientalia/zoho-sync/db/rows` (`transitionExec.ts:2`) | Movido al paquete al extraerse la sincronización |
| D-5 | «Guard `ENABLE_WRITES`: **se quita** del endpoint de transición» (`design:22`) | `guardWrites` sigue existiendo (`routes/tickets.ts:27-33`) pero **no** se aplica al endpoint de transición; sí a `reply` (`:196`). La razón está escrita: «`ENABLE_WRITES` protege las escrituras hacia **Zoho**, y esto es local» (`:86`) | **Cumplido en el fondo, no en la letra.** El guard no desapareció: se acotó a lo que escribe hacia fuera |
| D-6 | «Frontend: **sin cambios**» (`design:23`, `:93`) | `TransitionPanel.tsx` filtra por área (`:56-58`), pinta el buscador de OV, la casilla de derivación y las fechas que la OV arrastra (`:64-66`) | **Superado.** El diseño no previó ninguna de las tres piezas |
| D-7 | El diseño no menciona derivación, avisos, el estado `Remisión creada`, el registro de estados ni la guarda de la OV | Los cinco existen (RQ-TS-03, RQ-TS-12, RQ-TS-13, RQ-TS-14; `estados.ts`) | **Alcance añadido después del diseño.** No es discrepancia sino crecimiento; se anota para que nadie use el diseño como inventario |
| D-8 | «Elimina `server/cfApiNames.ts`» (`design:29`) | No existe en el árbol (`find apps packages -name 'cfApiNames*'` → vacío) | Cumplido |

### 4.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.9.1 (`:1636`): «**Diez** de las 34 transiciones son compartidas por dos áreas» | **Ocho**: cinco `Comercial / Compras` y tres `Comercial / Servicio Técnico` (`transitions.ts:171-256`, emparejamiento fijado en `invariantesGrafo.test.ts:91-106`, y el reparto 26 simples / 8 compartidas en `permisos.test.ts:72-73`) | **Ya registrada en F0-01, re-confirmada aquí.** Está en `docs/sdd/F0-01_Correcciones_para_el_maestro.md:128` (entrada 1 del Anexo I) y desarrollada en `:141-166`, commiteada en `3d44e1e`. F0-02 no la descubre: la re-confirma por otra ruta —el emparejamiento de los invariantes y el reparto 26/8 de la matriz de permisos, que F0-01 no usó—. No es cosmética: la matriz de F1C-05 se dimensiona con esa cifra, y con diez saldrían 58 prohibidos y 44 permitidos en vez de 60 y 42 |
| M-2 | M1.9.2 (`:1665`), fila `Aprobación`: «Quien tomó el ticket … **+ Director Técnico**» | `aprobacion: { tipo: 'primerDerivado' }` y nada más (`transitions.ts:274`) | El «+ Director Técnico» **no está implementado**. Por su posición al final de una celda de tabla parece resto de edición del `.docx`; si es una decisión, no llegó al código. **Punto a aclarar antes de F1C-05** |
| M-3 | M1.3.8 (`:1413`): «18 desde `OV asignada`, y desde `Ticket creado` los otros 20» | 19 y 19 contando el origen; 20 desde `Ticket creado` sólo sumando el paso sin botón (RQ-TS-05) | Las cifras mezclan dos convenciones de recuento. La conclusión —sin huérfanos— se sostiene. **Corrección menor para el maestro** |
| M-4 | M1.3.3 (`:1151`): los dos pasos sin botón «viven en `estadoPorRemision.ts`, **no en el archivo de transiciones**» | Sus constantes están en `transitions.ts:150-151`; `estadoPorRemision.ts:9-12` las importa | Exacto para la aplicación, falso para la declaración. **Corrección menor para el maestro** |
| M-5 | M1.9.2 (`:1653`): «Treinta y una heredan al responsable que el ticket ya traía» | 34 − 3 = **31** ✓. El docblock del código tiene **dos** cuentas mal, y van juntas: `transitions.ts:262` dice «las otras **32**» (son 31) y `:265` dice «en **35** declaraciones» (son 34) | **El maestro tiene razón y el comentario del código no, dos veces.** Defecto de comentario, no de comportamiento. Registrado como comportamiento actual en §3.9, destino F1B-06. F0-02 no lo corrige: es código |
| M-6 | M1.10 (`:1677`): «el as-built ya escribe la marca de tiempo de cada transición; **lo que falta por confirmar** es que registre siempre el usuario que la ejecutó» | Confirmado: `performed_by` se escribe en las tres escrituras (`repo.ts:282-286`) y se comprueba en las 36 ejecuciones del barrido (`transicionesEjecucion.test.ts:272-285`) | **El pendiente del maestro está cerrado.** F0-04 lo cerró. **Actualización para el Anexo H** |
| M-7 | M1.9.1 (`:1615`) `[DECIDIDO]`: «Cada usuario ve **solo los estados y transiciones** de su rol» | Las **transiciones** sí se filtran (`TransitionPanel.tsx:56-58`). Los **tickets** no: el servidor los devuelve todos a todo el mundo, por decisión escrita en `docs/modelo-autorizacion.md` (`boardView.ts:29-32`) | Las dos mitades de la decisión tienen destinos distintos. La de visibilidad se decidió en contra a propósito. **Punto a aclarar** |
| M-8 | M1.3.8 (`:1415`): «Las 27 etiquetas de campo mapean a columnas reales. Ninguna cae al cajón `custom_fields`» | **Verificado cierto** en esta tanda: 27 etiquetas distintas, las 27 en `PROMOTED_COLUMNS` | Sin discrepancia. Se anota porque es una de las afirmaciones as-built que sí resiste |
| M-9 | Anexo H.2 (`:1495`): servicio técnico «construido y verificado … coincide con el código en las 38 filas del mapa» | 34 transiciones + 2 pasos sin botón + las 2 salidas extra de `habilitar_servicio` = 38 (`transitions.ts:178`; maestro `:388` explica el recuento) | Sin discrepancia, pero el 38 **no** es un número de transiciones: son filas de mapa. Conviene no citarlo como tal |

### 4.3 · Lo que `config.yaml` dice y ya no es cierto

| Registro | Dice | Estado real | Lectura |
|---|---|---|---|
| IV-3 (`config.yaml`, `incumplimientos_vivos`) | «Hoy es un espejo **SIN COMPROBAR**: no hay prueba de que el servidor imponga la misma matriz» | La hay: `permisos.test.ts:41-110` prueba las 34 × 3 contra el servidor, y `:35-39` declara explícitamente el efecto | **F0-04 cerró IV-3.** El espejo de `TransitionPanel.tsx:56-58` pasó a comodidad legítima. `config.yaml` y la tabla de `CLAUDE.md` lo daban por vivo; **corregidos en esta tanda**, en commit aparte, porque un registro caduco sí es una corrección. Los vivos son **cuatro** |
| IV-3, ubicación | `TransitionPanel.tsx:56-57` | El filtro se cierra en `:58` | Cita corta por una línea, en **tres** sitios: `config.yaml` y `CLAUDE.md`, corregidos aquí, y **`permisos.test.ts:36`**, que es código y por tanto queda pendiente — destino **F1C-05** |
| IV-1 (`config.yaml`, `incumplimientos_vivos`) | «un estado de espera que no lleve "espera" en el nombre no se cuenta, **y uno que la lleve sin serlo sí**» | La segunda mitad no tiene ningún caso vivo: cero falsos positivos entre los 21 estados | Describía el riesgo del criterio, no un hecho. **Cuantificado en esta tanda**: 2 aciertos de 8, 0 falsos positivos. Ver §3.6 |
| `estado_al_baseline` (`config.yaml:72-77`) | 96 ficheros, 830 pruebas: 828 pasan / 2 saltadas (base `a3a8f03`) | 110 ficheros, 931 pruebas: 929 pasan / 2 saltadas (base `ad1875b`) | F0-04 añadió la red. Cifra de baseline, no error |

---

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
