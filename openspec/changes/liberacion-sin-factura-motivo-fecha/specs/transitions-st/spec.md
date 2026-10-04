# Delta de `transitions-st` — `liberacion-sin-factura-motivo-fecha` (F1C-05, parte de paridad, `cierra: no`)

Contrato: `proposal.md` de esta carpeta (sus 14 criterios de aceptación). Letra que manda:
`openspec/config.yaml` → `decisiones_de_gerencia` → `decision/anexo-33-checkbox` → `respuesta_textual`. Lo que NO es
letra de Gerencia va marcado **supuesto** (S-1 a S-6 de la propuesta; SP-1 a SP-3 de esta especificación).

Marcas de los escenarios: **ROJO** = nace rojo contra el árbol de `2a74fdc` (strict_tdd: se escribe y se ve rojo antes de
tocar producción) · **CARACTERIZACIÓN** = ya es verde hoy y fija lo que no debe moverse · **GUARDIÁN** = nace verde por
construcción y sólo se valida por mutación (reglas de mutación 1 y 2 de `CLAUDE.md`) · **PERSONA** = vive en un `.tsx`, fuera
de la red de pruebas por decisión de Gerencia (F0-00), y su comprobación es de persona.

## MODIFIED Requirements

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

#### Scenario: `transitionExec.ts` no cambia
- GIVEN esta tanda completa
- WHEN se compara `apps/desk/server/transitionExec.ts` antes y después
- THEN no hay diferencia: la validación de contenido de las tres fechas vive en `ticketService.ts`

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
`custom_fields`, a propósito. Las otras dos etiquetas nuevas, «Motivo» y «Fecha prevista de facturación», **SÍ** están en
`PROMOTED_COLUMNS` (dos entradas añadidas **al final** del mapa, que pasa de 40 a **42** sin mover las anteriores).
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

## ADDED Requirements

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
| Campo Motivo | Letra | `select`, **obligatorio**, etiqueta «Motivo» |
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
   `YYYY-MM-DD` (p. ej. `2026-02-30`, o una fecha en otra forma) **SHALL** producir un error de la guarda. Una fecha
   ausente la dice el obligatorio de presencia.
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
- el texto **SHALL** quedar en `tickets.custom_fields` y los **tres** valores en `ticket_transitions.values`
  (`packages/zoho-sync/src/db/repo.ts:314-318` guarda todos los valores). **La fuente de verdad de cada liberación es su
  fila de traza**: `custom_fields` se fusiona (`custom_fields || …`, `repo.ts:307-310`), de modo que una liberación sin
  texto no borra el de una anterior. El texto que cuenta para una liberación es el de **su** fila de traza, nunca el de
  `custom_fields`;
- `liberacion_sin_facturar` **SHALL** quedar sin tocar por la transición (supuesto S-6);
- las filas de `tickets` y de `ticket_transitions` que ya existen **MUST NOT** modificarse, marcarse ni rellenarse al
  aplicar el esquema o el cambio (el marcado del histórico es de `p64-historico-c1`).

El esquema **SHALL** añadir las dos columnas con `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS` **sin calificar** (`tickets`
es de `DESK_TABLES`), al final de `schema.sql`; el recuento de sentencias `ALTER` pasa de 50 / 27 / 23 a 52 / 27 / 25.

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
- THEN declara el comentario, «Motivo» (`select`, obligatorio), «Fecha prevista de facturación» (`date`, obligatoria) y el
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
- THEN `422` con un error que nombra el campo «Motivo», sin cambio de estado ni fila de traza

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

#### Scenario: El esquema añade las dos columnas sin calificar y el recuento es 52 / 27 / 25 — GUARDIÁN
- GIVEN `schema.sql` tras el cambio
- WHEN el guardián de `migrate.test.ts` recorre las sentencias `ALTER TABLE`
- THEN hay 52 en total, 27 de `DESK_TABLES` y 25 de `public`, y las dos nuevas van sin calificar al final del fichero;
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
