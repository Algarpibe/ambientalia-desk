# Capacidad `tickets-core` — el ticket: nacimiento, identidad y campos

| Dato | Valor |
|---|---|
| Capacidad | `tickets-core` (`openspec/config.yaml:83-85`) |
| Estado | **as-built parcial** (`status_at_start` de `config.yaml`), contrastado contra el código |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas |
| Tanda que la escribe | F0-02 |
| Contenido | **16** requisitos (`RQ-TC-01`…`RQ-TC-16`, §§1–3; RQ-TC-15/RQ-TC-16 añadidos por `alta-equipo-nuevo-en-ticket`, F1B-14) · **5** entradas de comportamiento actual (§4.1–§4.5) · **7** discrepancias diseño↔código (D-1…D-7) y **6** maestro↔código (M-1…M-6), más el hallazgo de esquema cerrado en F1B-01 como **IV-6** (§5.3) |
| Diseños de procedencia | `docs/superpowers/specs/2026-06-04-subsistema-c-creacion-tickets-design.md` (142 líneas) · `…-2026-06-04-subsistema-a-modelo-datos-design.md` (174 líneas). Los dos «Aprobados para planificación», **histórico congelado** (plan R01.1:382) |
| Apartados del maestro | M1.1 (`R08.1.md:1042-1068`) · M1.2 (`:1069-1096`) · M1.3.2 (`:1145-1149`) · **Anexo G** (`:4289-4476`), con G.1 (`:4292`), G.2 (`:4314`), G.7 (`:4470-4472`) y G.8 (`:4473-4476`) · M1.4 (`R08.2.md:1491-1492`, «Flujo equipo-nuevo») |
| Tandas que la tocan | **F1A-04 → F1C (C9)** · **F1B** (paridad de alta) · **F1B-14** (alta con equipo nuevo, `alta-equipo-nuevo-en-ticket`) · **F1D** (hojas de vida y catálogo, que reclaman el serial como llave) |
| Depende de | `transitions-st` (el estado inicial y el grafo) · `zoho-sync` (lo que llega de fuera) · `permissions` (quién puede crear) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, y la palabra **hipótesis** delante
de lo demás. El diseño de junio no es autoridad; cuando discrepa del código, manda el código y la
discrepancia se escribe (§4).

### Las tres fuentes, enfrentadas

| Concepto | Diseño (04/06) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Estado inicial del ticket nacido en la app | «**"OV asignada"** (transición #1 del Blueprint)» (`design C:12`, `:24`, `:72`) | M1.3.2: «`OV asignada` y `Ticket creado` son la misma fase con dos nombres» (`:1146`) | **`Ticket creado`**, salvo `Soporte remoto`, que nace en **`Solicitud Soporte`** (`estadoInicialDelAlta`, `packages/zoho-sync/src/db/repo.ts:418`, `:422`, `:435`; `blueprint-soporte-remoto`) |
| Equipo | «Texto libre (**sin registro de equipos**; eso es Remisiones)» (`design C:26`, `:140`) | M1.1 `[DECIDIDO 21/08]`: el serial «pasa a ser la llave de entrada de todo el registro» (`:1048`) | **Obligatorio y por id de catálogo** (`apps/desk/server/services/ticketService.ts:22-25`) |
| Numeración | «Continuar desde el máximo de Zoho (numeración continua)» (`design A:22`, `:107-113`) | — | **Espacio separado** con base 10.000 (`packages/zoho-sync/src/db/migrate.ts:38-43`) |
| Almacenamiento de campos | «Híbrido: columnas tipadas + `custom_fields jsonb` para la cola larga» (`design A:21`) | Anexo G, 59 columnas (`:4291`) | Híbrido, tal cual (`packages/zoho-sync/src/db/schema.sql`, `db/rows.ts`) |
| Quién puede crear | «Cualquier usuario autenticado (**sin gate por área**)» (`design C:20`) | — | Cualquier sesión válida (`apps/desk/server/routes/tickets.ts:35`, `:124-126`); con una orden `OVI-` exige además el cargo (`RQ-TC-42`) |
| Prefijos del Código Servicio | Cinco: MT · CG · HV · SR · PRO (`design C:33-34`) | M1.1 `[DECIDIDO]`: «se elimina la nomenclatura CG / MT» (`:1043`), **cerrado en R08**: el prefijo «puede derivarse automáticamente» (`:1067`) | Los cinco, y **derivados** del tipo de servicio (`packages/shared/src/ticketCreate.ts:1`, `:47-49`) |

---

## 1 · Identidad del ticket

### RQ-TC-01 · Dos espacios de identidad, y ninguno se solapa

Un ticket **SHALL** llevar dos identificadores, y los dos **SHALL** distinguir su origen:

| Identificador | Nacido en la app | Venido de Zoho |
|---|---|---|
| `id` | `app-` + UUID (`repo.ts:413`, con `PREFIJO_TICKET_APP` en `packages/shared/src/transitions.ts:124`) | numérico, el de Zoho |
| `number` | desde **10.000** (`migrate.ts:43`) | ~1.000, el de Zoho |

- El prefijo `app-` **SHALL** ser el único guardia fiable de «nació en la app»: `managed_by_app` y
  `source` **MUST NOT** usarse para eso, porque `writeTransition` las pone en `true` en **cualquier**
  transición hecha desde Desk, también sobre un ticket venido de Zoho
  (`transitions.ts:112-124`; el discriminador está implementado en
  `apps/desk/server/db/ticketFuentes.ts:29-42`, `nacidoEnLaApp`).
- El `id` **MUST** ser inmutable: `createTicket` es el único sitio que lo acuña y ningún `UPDATE` lo
  toca (`transitions.ts:115-122`).

> **Given** un ticket venido de Zoho sobre el que alguien ejecuta una transición en Desk
> **When** se pregunta si nació en la app
> **Then** la respuesta es **no**, aunque `managed_by_app` y `source` digan lo contrario.

### RQ-TC-02 · La numeración de la app vive en su propio espacio

`nextTicketNumber` **SHALL** tomar el número de la secuencia `ticket_number_seq`
(`repo.ts:229-232`), y la re-siembra **MUST** mirar **sólo** los tickets de la app, con piso en la
base (`migrate.ts:45-50`).

- La base **SHALL** ser `APP_TICKET_NUMBER_BASE = 10_000` (`migrate.ts:43`).
- La razón **SHALL** quedar escrita: compartir espacio hacía que Zoho alcanzara la numeración de la
  app y chocara con `UNIQUE(number)` — **bug #954** (`migrate.ts:38-42`).
- `previewTicketNumber` **SHALL** ser una **previsión, no una reserva**: el número real lo asigna
  `nextval` de forma atómica al crear, así que puede diferir si otro usuario crea entremedias o si un
  número se quemó en un `ROLLBACK` (`repo.ts:234-247`; expuesto en `routes/tickets.ts:39-41`).

### RQ-TC-03 · El Código Servicio y el asunto se construyen, no se teclean

Los dos **SHALL** derivarse de sus componentes con funciones puras de
`packages/shared/src/ticketCreate.ts`:

| Función | Forma | Línea |
|---|---|---|
| `buildCodigoServicio` | `PREFIJO_serie_modelo_AAMMDD`, omitiendo los componentes vacíos | `:12-14` |
| `buildSubject` | `Servicio Técnico {cliente} {tipoEquipo} {codigo}`, colapsando espacios | `:16-18` |
| `defaultPrefijoFor` | `Calibración` → `CG`; el resto → `MT` | `:47-49` |

- Los prefijos válidos **SHALL** ser cinco: `MT`, `CG`, `HV`, `SR`, `PRO`
  (`ticketCreate.ts:1`).
- El alta **MAY** recibir `codigoServicio` y `subject` ya construidos; si no vienen, el servidor los
  construye (`ticketService.ts:61-62`). Es la «vista previa editable» del diseño (`design C:25`).
- `extractServiceCode` **SHALL** tolerar **espacios pegados a los guiones bajos**
  (`ticketCreate.ts:38-44`), y **SHALL** reconstruir el código desde los grupos y no devolver la
  coincidencia entera: un lote del histórico de Zoho viene así, y el patrón anterior los rechazaba en
  silencio, dejando esos tickets sin serial y por tanto sin poder enlazarse nunca con su equipo
  (`ticketCreate.ts:26-37`).

### RQ-TC-04 · El serial es la llave, y viene del catálogo

El alta **SHALL** exigir un `equipoId` del catálogo, y **MUST NOT** aceptar el equipo como texto
libre (`ticketService.ts:23-27`: `422 'Falta el equipo'` en `:24` y `422 'Equipo no registrado'` en
`:27`). **Excepción:**
con `clasificaciones = 'Equipo nuevo'`, el alta **SHALL** admitir en su lugar los datos del equipo y
registrarlo o reutilizarlo en el mismo paso, según `RQ-TC-15` y `RQ-TC-16`
(`decision/equipo-nuevo-alta-en-ticket`). Tampoco en esa rama se acepta el equipo como texto libre: el
modelo **SHALL** venir del catálogo.

- La marca, el modelo, el tipo y el serial **SHALL** salir del equipo, no del formulario
  (`ticketService.ts:104-105`, leyendo `getEquipo` de `apps/desk/server/db/equipos.ts:77-80`).
- El catálogo **SHALL** poder buscarse por serial, y también por nombre de cliente
  (`equipos.ts:59-71`), y sólo devuelve los activos (`:67`).
- El serial **SHALL** exigirse además en `habilitar_servicio`, porque los tickets sincronizados desde
  Zoho llegan sin él (`transitions.ts:189`; maestro M1.1 `[AS-BUILT]`, `:1046`). La razón está en
  `transitions.ts:174-177`.

(Previously: el alta exigía siempre un `equipoId` ya registrado, sin excepción por clasificación, y la
lectura de marca, modelo, tipo y serial se citaba en `ticketService.ts:64-66`, desfasada respecto del
código.)

#### Scenario: Mantenimiento sin equipo sigue rechazándose

- GIVEN un alta con `clasificaciones = 'Equipo para servicio de mantenimiento'` y sin `equipoId`
- WHEN se envía
- THEN responde `422 'Falta el equipo'`, como antes de este cambio

---

## 2 · El nacimiento del ticket

### RQ-TC-05 · Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:21-111`) **en este orden**, el que exige el
orden total de precedencia (`transitions-st` §3.8; entre la 3 y la 4 corre desde F1B-03 la guarda de cargo de la OVI, escalón B, `RQ-TC-42`, y antes de la 7 «Garantía sólo con OVI», escalón C, `RQ-TC-43`):

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | Falta el equipo (salvo rama «Equipo nuevo», RQ-TC-15) | A | `422 'Falta el equipo'` | `ticketService.ts:23-24` |
| 2 | El equipo no está en el catálogo | A | `422 'Equipo no registrado'` | `:26-27` |
| 3 | La orden de venta no existe en Books | A | `422 'Orden de venta no encontrada'` | `:37-39` |
| 4 | Discrepancia equipo↔cliente | C | `422`, nombrando al cliente del equipo | `:61-79` |
| 5 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones, prefijo) | C | `422`, con **todos** en una lista | `:83-88` |
| 6 | El cliente no existe en Books | C | `422 'Cliente no encontrado'` | `:89-90` |
| 7 | La orden de venta ya está asociada a otro ticket | D | `409` | `:96-100` |

**Rama «Equipo nuevo» — dos guardas nuevas, mismo escalón.** Cuando la guarda 1 no aplica por
`clasificaciones === 'Equipo nuevo'` (RQ-TC-15), el alta exige en su lugar:

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| Falta `serial`, `modeloId` o `fechaFacturaCompra` | A | `422` |
| Un campo opcional (fecha, Drive, mantenedor) es inválido | C | `422`, mensaje de F1B-02 |

**Modalidad — una guarda nueva, escalón C.** El alta valida `modalidad` (`transitions-soporte-remoto`
RQ-SR-07 y RQ-SR-09): un valor fuera de `remoto` / `en sitio` con clasificación `Soporte remoto`, o
cualquier `modalidad` enviada con otra clasificación, responde `422` nombrando el campo. Es contenido, así
que gana al `409` de unicidad de la OV (guarda 7, escalón D).

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| `modalidad` inválida, o enviada fuera de `Soporte remoto` | C | `422`, nombrando `modalidad` |

El orden relativo de estas guardas frente a las guardas 3-7 de la tabla de arriba, y entre sí, lo
fija `design.md`; esta spec sólo impone el escalón: existencia (A) antes que contenido (C), igual que
el resto de la tabla.

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno (probado en
  `services/ticketService.test.ts:273` en `ad65161`).
- El prefijo **SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:87`).
- El `409` de unicidad de la OV **SHALL** ser la **última** guarda antes de la primera escritura, sea
  el equipo o el ticket (`crearTicketConEquipo`, `:103`): cumple el orden total A/B/C/D de
  `transitions-st` §3.8.
- La guarda equipo↔cliente **SHALL** ejecutarse inmediatamente después de la existencia de la orden de
  venta en Books (`:39`) —que puede completar `clientId` cuando el cuerpo no lo trae (`:41`)— y antes
  de los obligatorios, del cliente y del `409` de unicidad.

(Previously: dos correcciones de citas por el desplazamiento de `9ed5635`, y las filas 4/5 —OV ya usada
antes que la discrepancia equipo↔cliente— en el orden que el código todavía ejecutaba.
`orden-precedencia-guardas` mueve el `409` de la OV al final: deja de ser la guarda 4 y pasa a ser la
7.)

(Previously, tras `orden-precedencia-guardas`: la columna de evidencia de las filas 4-7 apuntaba a
`:65-83`, `:87-92`, `:93-94` y `:45-49`; el rango de la función a `:20-105`; la nota del prefijo a
`:91`; y la del `createTicket` a `:97` — las siete desfasadas por el propio desplazamiento de líneas
de esa tanda, caso A de la regla de mutación 4 de `CLAUDE.md`. `alta-equipo-nuevo-en-ticket` repara
las siete contra el árbol de hoy y añade la subtabla de la rama «Equipo nuevo».)

#### Scenario: El alta sin discrepancia no cambia
- GIVEN un alta sin equipo con `clientId` propio, o con `clientId` igual al del equipo
- WHEN se crea el ticket
- THEN responde `201` y el comportamiento es idéntico al de hoy

#### Scenario: La orden de venta ya usada deja de ganar a los obligatorios que faltan
- GIVEN un alta con los obligatorios sin completar y una orden de venta ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (obligatorios, escalón C) y no `409` (OV, escalón D)

#### Scenario: La orden de venta ya usada deja de ganar al cliente no encontrado
- GIVEN un alta cuyo `clientId` no existe en Books y cuya orden de venta ya está asociada a otro
  ticket
- WHEN se crea el ticket
- THEN responde `422` (`'Cliente no encontrado'`, escalón C) y no `409` (OV, escalón D)

#### Scenario: La discrepancia equipo↔cliente gana a la orden de venta ya usada
- GIVEN un alta cuyo equipo es de un cliente distinto del solicitado, y cuya orden de venta ya está
  asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (equipo↔cliente, escalón C) y no `409` (OV, escalón D)

#### Scenario: Dentro del escalón C, la discrepancia equipo↔cliente se resuelve antes de contar los obligatorios
- GIVEN un alta sin `clientId` propio, con un equipo cuyo `clientId` sí resuelve al cliente correcto,
  y con los demás obligatorios sin completar
- WHEN se crea el ticket
- THEN responde `422` listando los obligatorios que faltan, sin incluir «cliente» entre ellos

#### Scenario: Rama «Equipo nuevo», datos obligatorios ausentes
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, y sin `serial` (o sin `modeloId`, o sin
  `fechaFacturaCompra`)
- WHEN se crea el ticket
- THEN responde `422` (escalón A) y no se escribe nada

#### Scenario: Rama «Equipo nuevo», dato opcional inválido
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, datos obligatorios completos, y un campo
  opcional con formato inválido (fecha o Drive)
- WHEN se crea el ticket
- THEN responde `422` con el mensaje de F1B-02 (`hojas-vida` RQ-HV-03/RQ-HV-04) y no se escribe nada

#### Scenario: Las otras dos clasificaciones no cambian
- GIVEN clasificaciones = 'Equipo para servicio de mantenimiento' o 'Soporte remoto', sin `equipoId`
- WHEN se crea el ticket
- THEN responde `422 'Falta el equipo'`, igual que hoy — la guarda 1 no cambia para estas dos ramas

#### Scenario: Modalidad inválida en un alta de soporte remoto
- GIVEN un alta `Soporte remoto` con equipo existente y `modalidad = 'presencial'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` (escalón C) y no se escribe nada

#### Scenario: Modalidad enviada con otra clasificación
- GIVEN un alta `Equipo nuevo` (datos válidos) con `modalidad = 'remoto'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` y no se escribe nada

#### Scenario: La guarda de modalidad gana a la orden de venta ya usada
- GIVEN un alta `Soporte remoto` con `modalidad` inválida y una OV ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (escalón C) y no `409` (escalón D)

**Bajo `strict_tdd`:** la prueba de «equipo↔cliente gana a la OV ya usada» nace **roja de forma
natural** —hoy el código contesta `409`—; la de «equipo↔cliente gana a los obligatorios» nace
**verde** —el código ya la cumple— y su rojo se obtiene **por mutación**: invertir el orden de las dos
guardas, correr la suite, confirmar el rojo, revertir. Las pruebas de la rama «Equipo nuevo» nacen
**rojas de forma natural**: la rama no existe hoy. Las de `modalidad` también: el campo no existe hoy;
su posición frente al `409` se fija por mutación (regla de mutación 1 de `CLAUDE.md`).

### RQ-TC-06 · El alta es atómica y deja dos filas

`createTicket` **SHALL** escribir el ticket y la fila de su creación en **una transacción** cuando el
pool lo permita, con `ROLLBACK` ante cualquier fallo (`repo.ts:412-452`, `:438-450`).

1. **La fila del ticket** (`repo.ts:420-423`): estado inicial `Ticket creado` —o `Solicitud Soporte` si
   `clasificaciones = 'Soporte remoto'` (`transitions-soporte-remoto` RQ-SR-04)—, `status_type='Open'`,
   `managed_by_app=true`, `source='app'`, `created_time`, `modified_time` y `updated_at` a `now()`, y
   `modalidad` según `transitions-soporte-remoto` RQ-SR-07 a RQ-SR-09 (`NULL` fuera de `Soporte remoto`).
2. **La foto de la creación** en `ticket_transitions` (`repo.ts:428-436`): `transition_id='enviar'`,
   `transition_name='Enviar'`, `from_status='(creación)'`, `to_status` igual al estado inicial de la fila
   del ticket (`Ticket creado` o `Solicitud Soporte`), `area='Comercial'`, `performed_by` = actor,
   `comment_id=null`.

`values` de esa segunda fila **SHALL** guardar el payload completo con el que nació el ticket —orden
de venta, marca, modelo, serial, equipo, tipo de servicio, clasificación, prioridad, código de
servicio y `client_id`— y **MUST NOT** limitarse a `{ orden_venta }` (`repo.ts:431-435`). Cuando la
clasificación es `Soporte remoto`, el payload **SHALL** incluir también `modalidad` (supuesto de esta
spec, reversible: la historia no puede reconstruir la modalidad de creación desde la columna). La razón
está escrita: las columnas de `tickets` son **estado actual**, así que la historia no puede apoyarse
en ellas para contar la creación (`repo.ts:424-427`).

(Previously: el estado inicial y el `to_status` de la foto eran siempre `Ticket creado`.)

> **Given** un ticket creado en la app antes de que `createTicket` guardara el payload completo
> **When** se compone su historia
> **Then** la foto no existe y la historia cae a la fila del ticket, sin forma de reconstruirla
> (`repo.ts:425-427`; el discriminador está en `ticketFuentes.ts:63-75`).

#### Scenario: Alta de soporte remoto deja las dos filas con `Solicitud Soporte`
- GIVEN un alta válida `Soporte remoto` con `modalidad = 'en sitio'`
- WHEN se crea el ticket
- THEN la fila del ticket tiene `status = 'Solicitud Soporte'` y `modalidad = 'en sitio'`, y la foto
  tiene `to_status = 'Solicitud Soporte'` y `values.modalidad = 'en sitio'`

#### Scenario: Alta de otra clasificación no cambia
- GIVEN un alta `Equipo para servicio de mantenimiento`
- WHEN se crea el ticket
- THEN el estado y el `to_status` son `Ticket creado` y `modalidad` es `NULL`

#### Scenario: Un fallo posterior revierte las dos filas
- GIVEN un alta `Soporte remoto` cuyo segundo `INSERT` falla
- WHEN se ejecuta `createTicket`
- THEN hay `ROLLBACK` y no queda ninguna de las dos filas

### RQ-TC-15 · Alta con «Equipo nuevo»: el equipo se crea o se reutiliza en el mismo paso

Cuando `clasificaciones === 'Equipo nuevo'` y el cuerpo no trae `equipoId`, el sistema **SHALL**
aceptar los datos del equipo nuevo en el mismo cuerpo del alta — obligatorios: `serial`, `modeloId`
del catálogo y `fechaFacturaCompra` (la fecha de **compra** del equipo, no `tickets.fecha_factura`);
opcionales: fecha de adquisición, fin de garantía, código interno, Drive y mantenedor, con la
validación de F1B-02 (`hojas-vida` RQ-HV-03, RQ-HV-04, RQ-HV-05). Esta guarda **sustituye**, sólo para
esta clasificación, la exigencia de `equipoId` de RQ-TC-04; `Equipo para servicio de mantenimiento` y
`Soporte remoto` siguen exigiéndolo sin cambios.

- Si ya existe un equipo cuyo `serial` normalizado (recortado y en minúsculas) coincide con el
  `serial` recibido, el sistema **SHALL** reutilizar ese equipo y **MUST NOT** crear uno nuevo.
- El `clientId` del equipo, creado o reutilizado, **SHALL** ser el `clientId` ya resuelto del ticket
  (cuerpo o `salesOrderId`, RQ-TC-13).
- El ticket **SHALL** quedar enlazado al equipo —creado o reutilizado— igual que queda enlazado hoy a
  un equipo ya existente (RQ-TC-04).

#### Scenario: Alta con datos válidos crea un equipo nuevo
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, con `serial`, `modeloId` y
  `fechaFacturaCompra` válidos
- WHEN se crea el ticket
- THEN responde `201`, existe un equipo nuevo con `clientId` igual al del ticket, y el ticket queda
  enlazado a él

#### Scenario: Serial ya existente se reutiliza, sin duplicar
- GIVEN un equipo existente con serial `"SN-1"`, y un alta con serial `" Sn-1 "` (espacios y
  mayúsculas distintos)
- WHEN se crea el ticket
- THEN responde `201`, no se crea un segundo equipo, y el ticket queda enlazado al equipo existente

### RQ-TC-16 · La creación del equipo nuevo es atómica con la del ticket

El sistema **SHALL** crear el equipo nuevo sólo después de que todas las guardas del alta hayan
pasado, y **SHALL** escribirlo en la misma transacción que el `INSERT` del ticket (RQ-TC-06), de modo
que **MUST NOT** quede un equipo huérfano cuando una guarda posterior al punto de creación falla.

#### Scenario: Una guarda posterior falla y no queda equipo creado
- GIVEN clasificaciones = 'Equipo nuevo', datos del equipo válidos, y una orden de venta ya asociada a
  otro ticket
- WHEN se crea el ticket
- THEN responde `409` (o el `422` de la guarda que falle) y no queda ningún equipo nuevo escrito

**Bajo `strict_tdd`:** el rojo de esta guarda se obtiene también por mutación — mover la creación del
equipo antes de la última guarda del alta debe poner la suite en rojo (regla de mutación 1 de
`CLAUDE.md`).

### RQ-TC-07 · La fase inicial tiene dos nombres, y no se cruzan

El ticket nacido en la app **SHALL** nacer en `Ticket creado` y **MUST NOT** nacer en `OV asignada`,
que es el nombre que esa misma fase tiene en Zoho (`repo.ts:405-410`, `:422`). **Excepción:** un ticket
`Soporte remoto` **SHALL** nacer en `Solicitud Soporte` (`transitions-soporte-remoto` RQ-SR-04), y
tampoco **MUST** nacer en `OV asignada`.

La regla completa —que ningún camino lleva de una a la otra, y por qué— es de `transitions-st`
RQ-TS-02. Aquí sólo se fija de dónde arranca el ticket.

(Previously: todo ticket nacido en la app nacía en `Ticket creado`, sin excepción.)

#### Scenario: Ningún ticket de la app nace en `OV asignada`
- GIVEN un alta de cada una de las tres clasificaciones
- WHEN se crean los tres tickets
- THEN ninguno tiene `status = 'OV asignada'`

#### Scenario: El estado inicial depende de la clasificación
- GIVEN un alta `Soporte remoto` y una `Equipo nuevo`
- WHEN se crean
- THEN la primera nace en `Solicitud Soporte` y la segunda en `Ticket creado`

### RQ-TC-08 · Una orden de venta, un ticket — en la puerta del alta

Ésta es la **primera** de las tres puertas. El alta **SHALL** rechazar con `409` una orden ya asociada
a otro ticket, mirando **tres vías** —`salesorder_id`, `orden_venta` y la asociación vigente de
`public.ov_asociaciones` (`RQ-TC-17`)— (`ticketService.ts:96-100`, con `ticketConOrdenVenta` en
`repo.ts:362-379`, ampliado con la tercera vía).

- La razón **SHALL** quedar escrita: el buscador ya sólo ofrece las libres, «pero una lista no es una
  frontera» — basta mandar el id a mano o llegar con la lista cacheada para duplicar la orden
  (`ticketService.ts:92-95`).
- La **fecha** de la orden **SHALL** viajar con su número y guardarse en el alta
  (`ticketService.ts:32-36`, `:43`; `repo.ts:391-397`): sin ella, `habilitar_servicio` pide una fecha
  que nadie puede rellenar.
- Antes de esta comprobación de unicidad (escalón D), el alta **SHALL** aplicar la guarda de
  cuarentena de `RQ-TC-18` (escalón C) cuando la OV recibida lleve sufijo: una subOV en cuarentena se
  rechaza con `422` sin llegar a comprobar unicidad.
- Inmediatamente **después** de la cuarentena y **antes** de la unicidad, el alta **SHALL** aplicar la
  guarda de contrato vencido de `RQ-TC-25` (escalón C; **última** guarda de contenido de la puerta hasta F1B-03: desde `ovi-garantia-por-cargo` la sigue «Garantía sólo con OVI», `RQ-TC-43`): una
  subOV de un lote cuyo contrato venció se rechaza con `422` sin llegar a comprobar unicidad. Las guardas
  de contenido anteriores del alta —faltantes (`ticketService.ts:88`), cliente no encontrado (`:90`),
  campos del equipo nuevo (`:91`)— **SHALL** seguir ganándole.
- El alta **SHALL** escribir la asociación (`RQ-TC-17`) en la misma transacción que crea el ticket.

La segunda puerta es de `transitions-st` RQ-TS-14; la tercera es de `remisiones` RQ-RE-16. Las tres
comparten la vía de la asociación vigente y la guarda de vencido. Las pruebas de posición existentes —
`ordenVentaUnTicket.test.ts` y `apps/desk/server/remisiones.test.ts:988`— **MUST NOT** cambiar sus
aserciones actuales.

(Previously: tres vías, cuarentena en C y escritura de asociación, pero sin guarda de contrato vencido;
la última guarda de contenido de la puerta era la cuarentena.)

#### Scenario: El alta sin cambios sigue igual

- GIVEN un alta sin ninguna OV en cuarentena, sin asociación previa y sin contrato registrado para su lote
- WHEN se crea el ticket
- THEN responde `201`, igual que hoy

#### Scenario: La asociación vigente por la tercera vía bloquea el alta

- GIVEN una OV con asociación vigente a otro ticket, sin coincidir por `salesorder_id` ni por
  `orden_venta` en columna
- WHEN se crea un ticket con esa OV
- THEN responde `409`, igual que si coincidiera por columna

#### Scenario: Las pruebas de posición existentes no cambian

- GIVEN `ordenVentaUnTicket.test.ts` y `remisiones.test.ts:988` tal como existen hoy
- WHEN se ejecutan tras este cambio
- THEN pasan sin modificar sus aserciones

#### Scenario: Una subOV de contrato vencido bloquea el alta

- GIVEN una subOV canónica `OV-2026-170-01` de un lote con contrato cuya fecha de fin es anterior a hoy,
  y sin asociación vigente
- WHEN se crea un ticket con esa OV
- THEN responde `422` con el motivo de contrato vencido y no se crea ticket ni asociación

#### Scenario: El vencido gana al 409 de unicidad — posición fijada por prueba

- GIVEN una subOV de un lote vencido que además tiene asociación vigente a otro ticket
- WHEN se crea un ticket con esa OV
- THEN responde `422` de contrato vencido, no `409` de unicidad; invertir el orden de las dos guardas
  debe poner esta prueba en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: Los faltantes ganan al vencido

- GIVEN una subOV de un lote vencido y un cuerpo al que le falta el tipo de servicio
- WHEN se crea el ticket
- THEN responde `422` «Faltan campos obligatorios: tipo de servicio», no el motivo de contrato vencido

### RQ-TC-17 · Modelo de asociación ticket↔OV: tabla propia, 1:N, nunca se borra

El sistema **SHALL** persistir la relación ticket↔orden de venta en una tabla propia del esquema
`public` (`public.ov_asociaciones`, supuesto S-1), con una fila por asociación: ticket, OV
(`salesorder_id` y número congelado), la vía que la creó, fecha, hora y persona, y —al liberarse—
fecha, hora, persona y motivo de liberación. El sistema **MUST NOT** ejecutar `DELETE` sobre esta
tabla en ningún flujo: liberar es una actualización de la misma fila (`RQ-TC-19`), nunca un borrado.

Una OV **SHALL** tener como máximo una asociación **vigente** (no liberada) a la vez, impuesto por un
índice único parcial de base de datos sobre las filas no liberadas. La condición **SHALL** aplicarse
por igual a una OV simple y a una subOV (`RQ-TC-18`): cada subOV **SHALL** poder asociarse a
exactamente un ticket vigente.

Los tres escritores actuales de `orden_venta` —el alta (`RQ-TC-08`), `habilitar_servicio`
(`transitions-st` RQ-TS-14) y la remisión de entrada (`remisiones` RQ-RE-16)— **SHALL** escribir
también la fila de asociación, en la misma transacción que su escritura de columna.

#### Scenario: Escribir la OV crea la asociación en la misma transacción

- GIVEN un alta de ticket con orden de venta libre
- WHEN se crea el ticket
- THEN existe una fila de `ov_asociaciones` vigente para ese ticket y esa OV, con persona y fecha de
  la creación

#### Scenario: Segunda asociación vigente sobre la misma OV es rechazada por la base

- GIVEN una OV ya asociada vigente a un ticket
- WHEN otra escritura intenta insertar una segunda fila vigente para la misma OV
- THEN el índice único parcial rechaza la segunda fila, y la aplicación traduce el conflicto a la
  misma respuesta que hoy dan las guardas de columna

### RQ-TC-18 · Clasificador de subOV y cuarentena (S-2)

`packages/shared` **SHALL** exportar un clasificador puro que decida si un número de OV es una subOV
en cuarentena: **cuarentena** es exactamente un número con sufijo que **no** casa
`^OV-(\d{4})-(\d{3,4})-(\d{2})$` (`decision/subov-lote-convencion`, 2026-09-10,
`Decisiones_Gerencia_2026-09-10.md:459-461`). Una OV simple `OV-AAAA-NNN` y una `OVI-` **MUST NOT**
clasificarse en cuarentena. «Sufijo» es un resto que EMPIEZA por un no-dígito tras la base
`OV(I)-AAAA-NNN…`: una secuencia de cinco o más dígitos sin sufijo (`OV-2026-00123`) no es cuarentena.

Una OV en cuarentena **MUST NOT** poder asociarse a ningún ticket por ninguna de las tres puertas: el
alta la rechaza con `422` en el **escalón C** —contenido—, evaluado **antes** de la comprobación de
unicidad del **escalón D** (`RQ-TC-08`; `transitions-st` §3.8 / F1B-10). Una OV en cuarentena **SHALL**
quedar fuera del desplegable (`soloLibres`, `zoho-sync` RQ-ZS-14) y del saldo por lote, y **SHALL**
listarse aparte, visible para Comercial.

#### Scenario: subOV con sufijo no canónico es rechazada antes de comprobar unicidad

- GIVEN una OV con número `OV-2026-001-X9` (sufijo no canónico) sin asociación vigente
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de cuarentena (escalón C), no el `409` de unicidad (escalón D)

#### Scenario: OV simple y OVI no entran en cuarentena

- GIVEN los números `OV-2026-001` y `OVI-2026-001`
- WHEN se evalúan con el clasificador
- THEN ninguno se clasifica en cuarentena

### RQ-TC-19 · Liberar una asociación: sólo Comercial, con motivo, sin borrar

El sistema **SHALL** exponer una acción de liberación manual (el diseño fija método y URL exactos) que
**MUST** exigir rol Comercial en el servidor y **SHALL** exigir un motivo no vacío. Liberar **SHALL**
poner fecha, hora, persona y motivo de liberación sobre la fila existente y **MUST NOT** borrarla
(`RQ-TC-17`). Tras liberarse, la OV **SHALL** quedar libre para las tres puertas y para el desplegable,
y **SHALL** poder reasociarse a un ticket distinto.

Esta acción **SHALL** ser transitoria: se retira el día en que exista una vía C2 de anulación formal
(`Decisiones_Gerencia_2026-09-10.md:484-486`).

#### Scenario: Liberar conserva la fila con su motivo

- GIVEN una asociación vigente
- WHEN Comercial la libera con un motivo
- THEN la fila sigue existiendo, con fecha, hora, persona y motivo de liberación, y deja de contar
  como vigente

#### Scenario: Sin rol Comercial, la liberación se rechaza

- GIVEN un usuario sin rol Comercial
- WHEN intenta liberar una asociación
- THEN responde `403` y la fila no cambia

#### Scenario: Tras liberar, la OV es reasociable

- GIVEN una OV recién liberada
- WHEN se crea un ticket nuevo con esa misma OV
- THEN la asociación se crea sin que el índice único parcial la rechace, y ninguna de las tres vías de
  las puertas la encuentra ya en el ticket que la liberó (S-7: liberar limpia sus columnas)

### RQ-TC-20 · La ficha del ticket lista sus OV, vigentes y liberadas

La lectura del ticket **SHALL** exponer la lista completa de sus asociaciones —vigentes y liberadas—,
cada una con su OV, la vía que la creó, la fecha y, si aplica, la fecha de OC (`transitions-st`
RQ-TS-18). `cf_n_ticket` **SHALL** seguir siendo sólo una sugerencia de precarga y **MUST NOT**
sustituir esta lista como fuente de verdad.

#### Scenario: La ficha devuelve las dos listas

- GIVEN un ticket con una asociación vigente y otra liberada
- WHEN se consulta su detalle
- THEN la respuesta incluye las dos, distinguibles por su estado de liberación

---

## 3 · Campos, borrado y lectura

### RQ-TC-09 · Almacenamiento híbrido: columna tipada o cajón

Un campo **SHALL** ir a **columna tipada** si su etiqueta está en `PROMOTED_COLUMNS`
(`packages/zoho-sync/src/db/rows.ts`, **39** etiquetas) y **SHALL** caer a `custom_fields jsonb` si
no (`apps/desk/server/transitionExec.ts:90-92`).

**Verificado en esta tanda:** las **27** etiquetas de campo que declaran las 34 transiciones están
todas en `PROMOTED_COLUMNS`; **ninguna** cae al cajón. *(F1A-04 movió la cifra a **28** al añadir «Fecha
de aviso al cliente» a `habilitado_para_entrega`; la afirmación sigue siendo cierta.)* Confirma el maestro M1.3.8 (`:1415`) y M1.1
(`:1046`).

La cola larga **SHALL** fusionarse, no reemplazarse: `custom_fields = custom_fields || $n::jsonb`
(`packages/zoho-sync/src/db/repo.ts:307-310`).

### RQ-TC-10 · Las clasificaciones son el disparador de rama

`CLASIFICACIONES` **SHALL** ser exactamente tres, y **SHALL** ser obligatoria en el alta
(`packages/shared/src/ticketCreate.ts:5`; obligatoriedad en `ticketService.ts:56`):

`Equipo para servicio de mantenimiento` · `Equipo nuevo` · `Soporte remoto`

Es el campo que activa los distintos flujos de trabajo (maestro Anexo G col. 11, `:4325-4326`; M1.2
`[AS-IS — R05]`, `:1096`). El **tipo de servicio** es una segunda dimensión, distinta de la rama
(Anexo G col. 27, `:4337-4338`), y `TIPOS_SERVICIO` **SHALL** declararlo aparte
(`ticketCreate.ts:4`).

**Las tres ramas tienen grafo tras este cambio.** `Equipo para servicio de mantenimiento` usa el grafo de
servicio (`transitions-st`); `Equipo nuevo` tiene su propio catálogo, capacidad `transitions-equipo-nuevo`
(F1B-06, primer cambio, `blueprint-equipo-nuevo`); y `Soporte remoto` tiene el suyo, capacidad
`transitions-soporte-remoto` (F1B-06, segundo cambio, `blueprint-soporte-remoto`). El flujo aplicable de un
ticket lo decide su clasificación y su estado actual (`transitions-equipo-nuevo` RQ-EN-04); un ticket
heredado en un estado ajeno a su catálogo sigue en el grafo de servicio.

(Previously: «Dos de las tres ramas tienen grafo… `Soporte remoto` sigue sin grafo… y sus tickets siguen
cayendo en el grafo de servicio técnico.»)

#### Scenario: Un ticket `Equipo nuevo` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Equipo nuevo'` recién creado y llevado a `Ingresado`
- WHEN se listan las transiciones que puede ejecutar
- THEN son las del catálogo `transitions-equipo-nuevo`, nunca las de `TRANSITIONS`

#### Scenario: Un ticket `Soporte remoto` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Soporte remoto'` recién creado, en `Solicitud Soporte`
- WHEN se listan sus transiciones
- THEN son las del catálogo `transitions-soporte-remoto` (`Asignación`), nunca las de `TRANSITIONS`

#### Scenario: La prueba que fijaba «soporte remoto siempre enruta a servicio» se invierte
- GIVEN la prueba de `packages/shared/src/flujos.test.ts:42-45` en `66ab783` («SIEMPRE servicio»)
- WHEN se calcula `flujoDelTicket` para `Soporte remoto` en `Solicitud Soporte`
- THEN devuelve `soporte-remoto`; y para `Soporte remoto` en `Ticket creado` devuelve `servicio`

### RQ-TC-11 · Un ticket sólo se borra si nació aquí

`eliminarTicket` **SHALL** rechazar con `409` cualquier ticket que no haya nacido en la app o que no
esté `managed_by_app` (`apps/desk/server/db/eliminarTicket.ts:116`, con `TicketNoBorrable` en
`:24-29`), y el mensaje **SHALL** decir por qué: borrarlo aquí sólo lo haría volver en la siguiente
sincronización (`routes/tickets.ts:97`).

Las dos puertas —`404` y `409`— **SHALL** vivir en la función y no en la ruta, «para que ningún
llamador futuro pueda saltárselas y para que el simulacro las evalúe igual»
(`eliminarTicket.ts:96-98`). El borrado **SHALL** ser en orden explícito de diez tablas hijas más la
cabecera (`eliminarTicket.ts:31-33`).

### RQ-TC-12 · La empresa se resuelve por dos vías

La lectura **SHALL** devolver el nombre de la empresa igual para los tickets de Zoho —que traen
`account_id`— y los de la app —que traen `client_id`—, resolviendo por `COALESCE`
(`design A` lo prescribe en `design C:49-52`; implementado en las consultas de
`packages/zoho-sync/src/db/repo.ts`). `account_id` **SHALL** quedar `null` en los tickets creados por
la app (`design C:47`; el `INSERT` de `repo.ts:420-421` no lo escribe).

### RQ-TC-13 · La guarda equipo↔cliente impone integridad de datos, no autorización

Tras resolver el `clientId` final del bloque de la orden de venta (`ticketService.ts:29`, `:41`) y
antes de crear el ticket (`:99`), el sistema **SHALL** comparar ese `clientId` final contra
`equipo.clientId` (`db/equipos.ts:42`):

1. Si el `clientId` final es nulo y `equipo.clientId` existe, el sistema **SHALL** usar
   `equipo.clientId` como valor de escritura.
2. Si los dos existen y difieren, el sistema **SHALL** responder `422` con el nombre y el id de los
   **dos** clientes — el del equipo y el solicitado —, siempre, nunca sólo uno ni sólo cuando los
   nombres difieren: dos filas de `books.contacts` pueden compartir nombre con ids distintos
   (`getClient` no filtra por `contact_type`, a propósito — `packages/zoho-sync/src/books/repo.ts:111-116`),
   y ocultar el id ahí ocultaría justo el caso que hace falta distinguir.
   - Si `equipo.clienteNombre` es nulo, el lado del equipo **SHALL** mostrar sólo el id, con la nota
     «sin nombre en el equipo».
   - Si `getClient(db, clientId)` devuelve `null` —alcanzable, porque «Cliente no encontrado» es
     guarda posterior (`:94`)— el lado solicitado **SHALL** mostrar sólo el id, con la nota «sin
     ficha en Books» (`books/repo.ts:129-131`).
3. Si `equipo.clientId` es `NULL`, el sistema **MUST NOT** alterar comportamiento existente (protege
   al ~3,4 % de equipos sin enlazar); esta rama **SHALL** quedar fuera de la comparación del punto 2.

La posición de la guarda —tras la existencia de la orden de venta en Books (`:39`) y antes de los
obligatorios (`:87-92`)— y el `422` **SHALL** seguir igual. El `409` de unicidad de la orden de
venta —antes en `:45-49`, inmediatamente antes de esta guarda— pasa a evaluarse **después** de los
obligatorios y del cliente, como última guarda del alta (`transitions-st` §3.8; `RQ-TC-05`): la
posición RELATIVA de esta guarda frente al `409` de unicidad se invierte; frente a los obligatorios no
cambia.

La severidad es de **integridad de datos, no de autorización**: `tickets.client_id` no autoriza nada,
sólo resuelve el nombre a mostrar (`tickets-core` RQ-TC-12).

**Consecuencia declarada.** El `clientId` final puede venir de la orden de venta y no sólo del cuerpo
(`:41`): un ticket cuya OV es de un cliente distinto del equipo pasa a dar `422` donde antes creaba el
ticket en silencio. Toca el punto abierto nº 52 del maestro (`R08.1.md:2071-2079`).

(Previously: «tras el `409` de la OV (`:45-49`) y antes de los obligatorios (`:87-92`)».
`orden-precedencia-guardas` mueve el `409` de la OV al final del alta, así que esta guarda deja de ir
después de él y pasa a ir antes.)

#### Scenario: El equipo manda cuando el cuerpo no trae cliente
- GIVEN un alta sin `clientId`, con equipo `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `201` y `tickets.client_id = "cli-A"`

#### Scenario: Discrepancia entre el cuerpo y el equipo
- GIVEN un alta con `clientId = "cli-B"`, equipo `equipo.clientId = "cli-A"` y
  `clienteNombre = "ACME"`, y `"cli-B"` en Books con nombre `"Beta"`
- WHEN se crea el ticket
- THEN responde `422` y el mensaje contiene `"ACME"`, `"cli-A"`, `"Beta"` y `"cli-B"`
- AND no se crea ticket

#### Scenario: Mismo nombre, dos ids
- GIVEN equipo `equipo.clientId = "cli-A"` con `clienteNombre = "Gecelca S.A. E.S.P."`, y `"cli-B"`
  en Books con el MISMO nombre —el helper `cliente(id)` (`ticketService.test.ts:246-248`) inserta ese
  nombre literal para cualquier id
- WHEN se crea el ticket con `clientId = "cli-B"`
- THEN responde `422` y el mensaje contiene `"cli-A"` **y** `"cli-B"`, distinguibles pese al nombre
  repetido

#### Scenario: Respaldo — el equipo no tiene nombre de cliente
- GIVEN equipo `equipo.clientId = "cli-A"`, `clienteNombre` nulo, y `"cli-B"` en Books con nombre
  `"Beta"`
- WHEN se crea el ticket con `clientId = "cli-B"`
- THEN responde `422` y el mensaje muestra `"cli-A"` con la nota «sin nombre en el equipo», y nombre
  e id del lado solicitado

#### Scenario: Respaldo — el cliente solicitado no tiene ficha en Books
- GIVEN equipo `equipo.clientId = "cli-A"` con `clienteNombre = "ACME"`, y un `clientId` del cuerpo
  que **no** existe en `books.contacts`
- WHEN se crea el ticket
- THEN responde `422` y el mensaje muestra el id con la nota «sin ficha en Books», no «Cliente no
  encontrado»

#### Scenario: El 3,4 % sin cliente enlazado no se bloquea
- GIVEN un equipo con `equipo.clientId` `NULL`
- WHEN se crea el ticket con cualquier `clientId` del cuerpo o de la orden de venta
- THEN sigue la vía actual, sin ningún `422` nuevo

#### Scenario: La orden de venta manda sobre el equipo cuando el cuerpo calla
- GIVEN sin `clientId` en el cuerpo, OV cuyo cliente es `"cli-B"`, y equipo `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `422` (regla 2), aunque antes de la guarda equipo↔cliente el ticket se creaba en
  silencio con `client_id = "cli-B"`

### RQ-TC-14 · Resolución de cliente por identidad

`GET /api/clients/:id` **SHALL** requerir sesión (`requireAuth`, mismo patrón que
`apps/desk/server/routes/directory.ts:74-79`) y **SHALL** resolver contra `getClient(db, id)`
(`packages/zoho-sync/src/books/repo.ts:129`), respondiendo `404` cuando no exista la fila.

#### Scenario: Cliente encontrado
- GIVEN un `id` de cliente existente en `clients`
- WHEN se pide `GET /api/clients/:id` con sesión válida
- THEN responde `200` con los datos del cliente

#### Scenario: Cliente no encontrado
- GIVEN un `id` que no existe en `clients`
- WHEN se pide `GET /api/clients/:id` con sesión válida
- THEN responde `404`

#### Scenario: Sin sesión
- GIVEN ninguna cookie de sesión válida
- WHEN se pide `GET /api/clients/:id`
- THEN responde `401` y no se consulta la base

### RQ-TC-21 · Registro de contrato: cliente, lote, inicio y fin; uno por lote; lo crea Comercial

El sistema **SHALL** persistir el contrato en una tabla propia del esquema `public` (`public.contratos`,
supuesto S-1), con una fila por contrato: cliente (id de `public.clients`, sin clave foránea porque es
réplica de Books), lote (`OV-AAAA-NNN`, mismo formato que acepta `apps/desk/server/routes/ovAsociaciones.ts:21` en `285ecf4`),
fecha de inicio, fecha de fin, y —como traza— persona y fecha de alta. **Ningún** campo del contrato es
opcional. El sistema **SHALL** admitir a lo sumo **un** contrato por lote, impuesto por una restricción de
unicidad de base de datos sobre el lote. El lote **MAY** no existir aún en Books (supuesto S-1): registrar
el contrato no exige que haya subOV creadas.

Crear un contrato **SHALL** exigir en el **servidor** el área Comercial o ser administrador
(supuesto S-2), consumiendo `canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` de
`@ambientalia/shared`, el mismo patrón de `routes/ovAsociaciones.ts:47` (regla invariable 13: el botón
del cliente es comodidad, la imposición es la del servidor). Leer contratos y su ficha **SHALL** estar
abierto a cualquier usuario con sesión (supuesto reversible, como las lecturas de
`routes/ovAsociaciones.ts:13-14`). La fecha de fin sólo cambia por la ampliación de `RQ-TC-53`; no hay otra edición del contrato.

El alta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8: permiso (`403`, escalón B) antes
de contenido (`422`: campo ausente, lote con formato inválido, fecha inválida, cliente inexistente, fecha
de fin anterior a la de inicio; escalón C) antes de unicidad (`409` por lote ya registrado; escalón D).

Ningún flujo **SHALL** ejecutar `DELETE` sobre `public.contratos` (supuesto: la baja queda fuera; la
ampliación de `RQ-TC-53` cambia la fecha de fin y no borra nada).

#### Scenario: Comercial registra un contrato

- GIVEN un usuario del área Comercial y un cliente existente
- WHEN crea un contrato con lote `OV-2026-170`, inicio `2026-01-15` y fin `2026-12-31`
- THEN responde éxito y el contrato queda guardado con su persona y fecha de alta

#### Scenario: Sin área Comercial ni administración, el alta se rechaza con 403

- GIVEN un usuario con sesión cuya área no incluye Comercial y que no es administrador
- WHEN intenta crear un contrato con datos válidos
- THEN responde `403` y no se crea ninguna fila, aunque el cliente web no le muestre el botón

#### Scenario: Un administrador puede crear

- GIVEN un administrador sin el área Comercial
- WHEN crea un contrato con datos válidos
- THEN responde éxito

#### Scenario: Un segundo contrato para el mismo lote responde 409

- GIVEN un contrato ya registrado para el lote `OV-2026-170`
- WHEN Comercial intenta registrar otro contrato con ese lote, aunque sea de otro cliente
- THEN responde `409` y la fila existente no cambia

#### Scenario: Contenido inválido responde 422

- GIVEN un usuario Comercial
- WHEN crea un contrato con lote `OV-2026-170-01` (formato de subOV), o con fin anterior al inicio, o sin
  fecha de fin, o con un cliente que no existe
- THEN cada caso responde `422` y no se crea ninguna fila

#### Scenario: El permiso gana al contenido, y el contenido a la unicidad — posición fijada por prueba

- GIVEN un lote ya registrado
- WHEN un usuario sin Comercial manda un alta con contenido inválido para ese lote
- THEN responde `403`; y cuando un usuario Comercial manda un alta con contenido inválido para ese mismo
  lote ya registrado, responde `422`, no `409`

#### Scenario: Cualquier usuario con sesión lee, sin sesión no

- GIVEN un contrato registrado
- WHEN lo consulta un usuario con sesión sin área Comercial, y luego una petición sin sesión
- THEN la primera devuelve el contrato y la segunda responde `401`

### RQ-TC-22 · Vigencia del contrato: por fecha, extremos incluidos

Un contrato **SHALL** estar **vigente** en una fecha cuando esa fecha es mayor o igual que su fecha de
inicio y menor o igual que su fecha de fin: **ambos extremos incluidos** (supuesto S-4). Un contrato
**SHALL** estar **vencido** cuando su fecha de fin es **anterior** a hoy (supuesto S-5), y **aún no
iniciado** cuando su fecha de inicio es posterior a hoy. Un contrato aún no iniciado **MUST NOT** bloquear
nada (`RQ-TC-25`) ni dar prioridad (`RQ-TC-24`). La regla **SHALL** vivir como función pura de dominio en
`packages/shared` —sin base de datos— y todas las puertas la **SHALL** consumir, sin reescribirla
(regla invariable 13). «Hoy» **SHALL** ser la fecha civil del servidor en una única zona horaria, que fija
el diseño (hipótesis: `America/Bogota`, la de `calendario-laboral` RQ-CL-01).

#### Scenario: El día del fin, el contrato sigue vigente

- GIVEN un contrato con fin `2026-12-31`
- WHEN se evalúa con hoy = `2026-12-31`
- THEN está vigente y no vencido

#### Scenario: El día siguiente al fin, está vencido

- GIVEN el mismo contrato
- WHEN se evalúa con hoy = `2027-01-01`
- THEN está vencido y no vigente

#### Scenario: El día del inicio ya está vigente; el anterior, aún no iniciado

- GIVEN un contrato con inicio `2026-10-01`
- WHEN se evalúa con hoy = `2026-10-01` y con hoy = `2026-09-30`
- THEN el primero está vigente y el segundo está aún no iniciado, ni vigente ni vencido

### RQ-TC-23 · Ticket de contrato: derivado al leer, nunca guardado

Un ticket **SHALL** ser **de contrato** cuando tiene al menos una asociación **vigente** en
`public.ov_asociaciones` (`RQ-TC-17`) a una subOV canónica (`packages/shared/src/subOV.ts:32-36`) cuyo lote
tiene un contrato **vigente** hoy (`RQ-TC-22`). Nadie lo marca a mano. El sistema **SHALL** calcularlo al
leer y **MUST NOT** guardarlo como columna de `tickets` (supuesto S-3): así, si el contrato vence o la
asociación se libera (`RQ-TC-19`), el ticket deja de serlo sin ninguna escritura. La lectura del ticket
(`RQ-TC-20`) **SHALL** exponer si es de contrato y, en ese caso, el lote y el contrato que lo hacen serlo.

Este requisito **MUST NOT** comparar el cliente del contrato con el del ticket: pueden diferir (mantenedor,
IV-8; supuesto S-9).

#### Scenario: Asociación vigente a subOV de contrato vigente → es de contrato

- GIVEN un ticket con asociación vigente a `OV-2026-170-01` y un contrato vigente para `OV-2026-170`
- WHEN se consulta su detalle
- THEN se marca como de contrato, con el lote `OV-2026-170`

#### Scenario: Con el contrato vencido, deja de serlo sin escribir nada

- GIVEN el ticket anterior y el contrato con fin anterior a hoy
- WHEN se consulta su detalle
- THEN no se marca como de contrato, y ninguna columna de `tickets` ni fila de `ov_asociaciones` ha cambiado

#### Scenario: Una asociación liberada no cuenta

- GIVEN un ticket cuya única asociación a la subOV fue liberada
- WHEN se consulta su detalle
- THEN no se marca como de contrato

#### Scenario: Una OV ordinaria o un lote sin contrato no lo convierten en de contrato

- GIVEN un ticket con asociación vigente a `OV-2026-170` (ordinaria), y otro a `OV-2026-180-01` cuyo lote
  no tiene contrato
- WHEN se consulta el detalle de cada uno
- THEN ninguno se marca como de contrato

#### Scenario: Contrato y ticket de clientes distintos: sigue siendo de contrato

- GIVEN un contrato del cliente A y un ticket del cliente B con asociación vigente a una subOV de ese lote
- WHEN se consulta el detalle del ticket
- THEN se marca como de contrato y no se rechaza ninguna operación por la diferencia de clientes

### RQ-TC-24 · Prioridad `High` al nacer, por el contrato del cliente, impuesta por el servidor

La prioridad con la que nace un ticket **SHALL** ser de tres niveles y la impone el servidor. Cuando el **cliente del
ticket** —ya resuelto en el alta (`ticketService.ts:89`)— tenga un contrato **vigente** hoy (`RQ-TC-22`) **o** sea
**Top 5** (`RQ-TC-26`) con una prioridad de la lista asignable, `createManagedTicket` **SHALL** crear el ticket con
**la más alta** de las prioridades que apliquen, con el orden `Urgent > High > Medium > Low`: `High` por el contrato
(supuesto S-4: «Alta» del maestro ≡ el literal `High` de `packages/shared/src/transitions.ts:84`) y la `prioridad` de
`public.cliente_prioridad` por el Top 5. Si el cliente no tiene contrato vigente ni es Top 5, el ticket **SHALL**
nacer `Medium` («media el resto»). **La prioridad pedida en el cuerpo del alta MUST NOT intervenir nunca**, valga
`High`, `Medium`, `Low`, `Urgent`, un valor desconocido o nada, también para correctivos cotizados aparte
(`decision/anexo-53-contratos`, regla `:2456`: «manda la prioridad más alta de las dos»). La imposición **SHALL** ser
del servidor (regla invariable 13): el formulario no ofrece prioridad en el alta, y si el cuerpo la trae, se ignora.
(Previously: sin contrato ni Top 5 la prioridad era «la que hoy resulte del cuerpo, o ninguna», y el cuerpo sólo se
ignoraba cuando aplicaba contrato o Top 5.)

La vigencia es la de `RQ-TC-22`, evaluada en la zona horaria de la aplicación: el día del vencimiento el contrato
sigue vigente y el ticket nace `High`; el día siguiente, `Medium`. Si el contrato se ha ampliado (`RQ-TC-53`), cuenta la
fecha ampliada.

La prioridad se toma del cliente del **ticket**, no de la subOV ni del cliente del contrato ni del de la OV (supuesto
S-9 de F1B-06). Este requisito gobierna el **nacimiento**; lo que ocurre con los tickets **ya existentes** cuando
cambia el Top 5 del cliente lo fijan `RQ-TC-35` (marcar o cambiar), `RQ-TC-36` (desmarcar) y `RQ-TC-37` (los
exentos), y un ticket que nace bajo Top 5 deja la traza de `RQ-TC-38` para poder volver a su base, que es `Medium`
(supuesto S-I de la propuesta). Lo que una transición escriba después en `priority` no lo reevalúa este requisito
(supuesto S-1 de F1B-07) ni lo trata la propagación como ajuste manual (supuesto S-4 de
`propagar-top5-lista-remision-creada`). Un ticket sin `client_id` (sólo llega por Zoho: el alta de la aplicación sin cliente responde `422`) no hereda de ningún cliente. Los
tickets existentes con otro valor no se reescriben (`RQ-TC-56`).

#### Scenario: Cliente con contrato vigente → el ticket nace `High` aunque el cuerpo traiga `Low`

- GIVEN un cliente con un contrato vigente, no Top 5, y un alta cuyo cuerpo trae `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Cliente con contrato vigente y cuerpo sin prioridad → `High`

- GIVEN un cliente con un contrato vigente, no Top 5, y un alta sin prioridad
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Combinación 1 · sin contrato y sin Top 5, nace `Medium` pida lo que pida el cuerpo

- GIVEN un cliente sin contrato vigente y no Top 5, y tres altas: una con `prioridad: 'Low'`, una con `prioridad: 'High'` y otra sin prioridad
- WHEN se crean los tickets
- THEN los tres quedan `Medium`

#### Scenario: Combinación 2 · contrato vigente y sin Top 5 → `High`

- GIVEN un cliente con contrato vigente y sin fila Top 5, y un alta con `prioridad: 'Medium'`
- WHEN se crea el ticket
- THEN el ticket queda `High`

#### Scenario: Combinación 3 · Top 5 sin contrato → la del Top 5

- GIVEN un cliente Top 5 con `prioridad: 'High'`, sin contrato vigente, y un alta con `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda `High`
- AND con `prioridad: 'Medium'` en el Top 5 queda `Medium`, también con un cuerpo que pida `High`

#### Scenario: Combinación 4 · contrato y Top 5 a la vez → manda la más alta

- GIVEN un cliente con contrato vigente y Top 5 con `prioridad: 'Medium'`
- WHEN se crea el ticket
- THEN el ticket queda `High`
- AND con `prioridad: 'High'` en el Top 5 también queda `High`

#### Scenario: la función pura combina por orden, no por posición

- GIVEN la función pura que combina las prioridades y las entradas `High` (contrato) y `Medium` (Top 5)
- WHEN se evalúa, y luego con las entradas intercambiadas
- THEN el resultado es `High` en ambos órdenes

#### Scenario: `Urgent` del cuerpo pierde frente al contrato y al Top 5 (S-3)

- GIVEN un alta con `prioridad: 'Urgent'` para un cliente Top 5 con `prioridad: 'Medium'` sin contrato, y otra para un cliente con contrato vigente
- WHEN se crean los tickets
- THEN el primero queda `Medium` y el segundo `High`

#### Scenario: `Urgent` del cuerpo sin contrato ni Top 5 ya no se conserva

- GIVEN un cliente sin contrato vigente ni Top 5 y un alta con `prioridad: 'Urgent'`
- WHEN se crea el ticket
- THEN el ticket queda `Medium`

#### Scenario: Un contrato vencido o aún no iniciado no da prioridad

- GIVEN un cliente cuyo único contrato tiene fin anterior a hoy, y otro cuyo único contrato empieza mañana, ninguno Top 5
- WHEN se crea un ticket con `prioridad: 'High'` para cada uno
- THEN ambos quedan `Medium`

#### Scenario: El día del fin todavía cuenta

- GIVEN un contrato con fin igual a hoy
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `High`

#### Scenario: El día siguiente al fin ya no cuenta

- GIVEN un contrato cuyo fin fue ayer
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `Medium`

#### Scenario: la vigencia se mide en la zona de la aplicación, no en UTC

- GIVEN un contrato cuyo fin es el día D, y un instante que en UTC ya es el día D+1 pero en la zona de la aplicación sigue siendo el día D
- WHEN se crea un ticket en ese instante
- THEN el ticket nace `High`

#### Scenario: un contrato ampliado sigue dando `High` pasado el fin original

- GIVEN un contrato ampliado (`RQ-TC-53`) cuya fecha de fin original fue ayer y cuya fecha ampliada es posterior a hoy
- WHEN se crea un ticket para su cliente
- THEN el ticket nace `High`

#### Scenario: Manda el cliente del ticket, no el del contrato

- GIVEN un contrato vigente del cliente A y un alta para el cliente B, que no tiene contrato ni es Top 5, con una subOV del lote de A
- WHEN se crea el ticket
- THEN la prioridad no se fuerza a `High` por el contrato de A y el ticket nace `Medium`

#### Scenario: El Top 5 se toma del cliente del ticket, no del de la OV

- GIVEN un cliente A Top 5 y un alta para el cliente B, no Top 5, con una orden de venta de A
- WHEN se crea el ticket
- THEN la prioridad no hereda el Top 5 de A

#### Scenario: S-1 (invertido) · marcar Top 5 cambia los tickets abiertos existentes

- GIVEN un cliente con dos tickets abiertos de prioridad `Medium` y un usuario con permiso
- WHEN marca al cliente como Top 5 con `prioridad: 'High'`
- THEN los dos tickets abiertos quedan `High`, cada uno con su traza (`RQ-TC-35`)
- AND un ticket creado después nace `High`

#### Scenario: S-9 (invertido) · desmarcar el Top 5 devuelve los tickets a su base

- GIVEN un ticket nacido `High` por el Top 5 de su cliente y sin contrato, con su traza de alta de `Medium` a `High`
- WHEN se quita el Top 5 del cliente
- THEN el ticket vuelve a `Medium`, con su traza (`RQ-TC-36`)
- AND un ticket nuevo de ese cliente, sin contrato, nace `Medium`

#### Scenario: ticket sin `client_id` no hereda

- GIVEN un ticket de Zoho sin `client_id`
- WHEN se evalúa su prioridad
- THEN ningún Top 5 ni contrato se le aplica

### RQ-TC-25 · Guarda de contrato vencido: una subOV de un contrato vencido no se consume

Una subOV canónica cuyo lote tenga un contrato **vencido** (`RQ-TC-22`) **MUST NOT** poder asociarse a
ningún ticket por ninguna de las tres puertas —alta (`RQ-TC-08`), transición (`transitions-st` RQ-TS-14
y RQ-TS-18) y remisión de entrada (`remisiones` RQ-RE-16)—: cada una **SHALL** rechazarla con `422` que
nombre el lote, el contrato y su fecha de fin (supuesto S-5: se rechaza, no se avisa). La guarda **SHALL**
evaluarse sobre el **mismo número** de OV que la cuarentena y la unicidad de esa puerta, y **SHALL**
comprobar sólo lotes con contrato registrado:

- Una subOV cuyo lote **no tiene contrato** **SHALL** consumirse como hoy.
- Una subOV de un contrato **aún no iniciado** **SHALL** consumirse como hoy (`RQ-TC-22`).
- Una OV ordinaria u `OVI-` (`clasificarOV` → `ordinaria`) **MUST NOT** ser afectada.

**Precedencia (F1B-10).** La guarda es **escalón C** (contenido): se juzga un **valor aportado**, la subOV,
no el estado del sujeto (`transitions-st` §3.8, escalón B); es el mismo caso que la persona derivada que
existe pero está de baja. Dentro del escalón C es la **última** guarda de la transición; en el alta y en la remisión la sigue desde F1B-03 «Garantía sólo con OVI» (`RQ-TC-43`, `RQ-RE-31`) —después de la
cuarentena y de cualquier otra guarda de contenido— y antes de la unicidad (D). Como una subOV en
cuarentena no tiene lote canónico (`packages/shared/src/subOV.ts:36`), la cuarentena y el vencido **son
excluyentes para un mismo número**: el orden entre ambas queda fijado por dependencia de datos, no
por prueba de posición sobre un solo número.

#### Scenario: Un lote vencido se rechaza en cada puerta

- GIVEN una subOV libre de un lote con contrato vencido
- WHEN se intenta asociar por el alta, por una transición y por una remisión de entrada
- THEN las tres responden `422` con el motivo de contrato vencido y no escriben asociación

#### Scenario: Un lote sin contrato se consume como hoy

- GIVEN una subOV libre de un lote sin contrato registrado
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia igual que hoy

#### Scenario: Un contrato aún no iniciado no bloquea

- GIVEN una subOV libre de un lote cuyo contrato empieza mañana
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia igual que hoy

#### Scenario: El último día de vigencia todavía se consume

- GIVEN una subOV libre de un lote con contrato cuyo fin es hoy
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia sin `422`

#### Scenario: Una OV ordinaria o `OVI-` no la activa

- GIVEN el lote `OV-2026-170` con contrato vencido y una OV ordinaria `OV-2026-170` (la madre) sin asociación
- WHEN se asocia por el alta
- THEN la guarda de vencido no interviene

#### Scenario: Vencido y unicidad a la vez — el vencido gana

- GIVEN una subOV de un lote vencido con asociación vigente a otro ticket
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de vencido y no `409`

#### Scenario: Cuarentena y vencido son excluyentes para un mismo número

- GIVEN el número `OV-2026-170-X9` (sufijo no canónico) y un contrato vencido para el lote `OV-2026-170`
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de **cuarentena**, y el motivo no menciona contrato vencido (hipótesis: no hay
  petición de las tres puertas que aporte a la vez un número en cuarentena y otro de lote vencido, porque
  ninguna transición del catálogo trae `Orden de Venta` y `OV adicional` juntas, `transitions.ts:189`,
  `:199`, `:203`)

---

### RQ-TC-26 · Prioridad del cliente en tabla propia `public.cliente_prioridad`

El sistema SHALL guardar la prioridad del cliente y su pertenencia al Top 5 en la tabla `public.cliente_prioridad`, con
estas columnas: `client_id` (texto, clave primaria, sin clave foránea), `top5` (booleano), `prioridad` (texto),
`actualizado_por` y `actualizado_at`. La sentencia `CREATE TABLE` SHALL llevar el esquema calificado y SHALL ir **al
final** de `packages/zoho-sync/src/db/schema.sql`, sin mover ninguna línea anterior. La tabla MUST NOT modificar
`public.clients` (vista sobre `books.contacts`, que no admite columnas) ni `books.contacts`. `client_id` es el
`contact_id` de Books, el mismo valor que `tickets.client_id`.

#### Scenario: la tabla está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `CREATE TABLE`
- THEN la de `cliente_prioridad` es `public.cliente_prioridad`, va detrás de todas las sentencias de `29f65d1` y sólo la sigue la de `public.prioridad_ajustes` (C-2)
- AND el guardián de calificación de `migrate.test.ts` sigue en verde

#### Scenario: una sentencia sin calificar se rechaza
- GIVEN `schema.sql` ensuciado con un `CREATE TABLE cliente_prioridad` sin esquema
- WHEN corre el guardián de `migrate.test.ts`
- THEN el guardián se pone rojo (regla de mutación 2)

### RQ-TC-27 · Fijar o quitar el Top 5 y su prioridad sólo con `puedeFijarPrioridadTop5`

El servidor SHALL exponer la lectura y la escritura de `top5` y `prioridad` de un cliente. La escritura SHALL exigir
`puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`), que se CONSUME y MUST NOT reescribirse en el cliente
ni en el servidor (regla invariable 13). Sin el permiso, el servidor SHALL responder `403` y no escribir nada. El
Director Técnico no queda dentro de este permiso: la excepción del ajuste por ticket (`RQ-TC-29`) no alcanza a la
prioridad del cliente (supuesto S-E de la propuesta). Un único predicado SHALL cubrir fijar la prioridad y mantener la
lista (supuesto S-5). `prioridad` SHALL pertenecer a la lista blanca `High | Medium`, la misma lista asignable de
`packages/shared` que usan las opciones del campo `priority` de las transiciones; cualquier otro valor, incluidos `Low`
y `Urgent`, SHALL responder `422` (supuesto S-3). Cuando `top5` sea verdadero, `prioridad` SHALL ser obligatoria
(hipótesis de esta especificación, ver riesgos). `top5` MUST ser booleano; otro tipo SHALL responder `422`. Cada
escritura SHALL registrar `actualizado_por` y `actualizado_at`. La lectura SHALL estar disponible para cualquier
usuario autenticado.
(Previously: la lista blanca era `High | Medium | Low`.)

La escritura SHALL respetar el orden de precedencia: `403` (B) antes de todo `422` (C).

Una escritura aceptada SHALL escribir la fila del cliente y propagar o revertir (`RQ-TC-35`, `RQ-TC-36`) en la MISMA
transacción: o se escribe todo o nada. Un `404`, un `403` o un `422` MUST NOT propagar ni revertir nada. La
respuesta SHALL incluir, además de la fila, cuántos tickets cambiaron de prioridad. El cuerpo MUST NOT poder dirigir la
propagación: el cliente no envía lista de tickets ni prioridades por ticket, y lo que envíe de más se ignora (regla
invariable 13: qué tickets se tocan lo decide el servidor; el recuento que la pantalla muestra es comodidad).

#### Scenario: Director Comercial fija un Top 5
- GIVEN un usuario del área `Comercial` con cargo `Director Comercial` y un cliente sin fila
- WHEN marca `top5: true` con `prioridad: 'Medium'`
- THEN responde `200` y `public.cliente_prioridad` guarda la fila con `actualizado_por` y `actualizado_at`

#### Scenario: administrador fija un Top 5
- GIVEN un administrador sin `cargo_permiso`
- WHEN marca `top5: true` con `prioridad: 'High'` sobre un cliente
- THEN responde `200` y la fila queda escrita

#### Scenario: sin permiso, 403 y sin escritura
- GIVEN un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403` y no existe fila nueva ni cambiada

#### Scenario: técnico sin permiso
- GIVEN un usuario del área `Servicio Técnico` con cargo `Director Técnico`
- WHEN intenta fijar la prioridad de un cliente
- THEN responde `403`

#### Scenario: valor fuera de la lista blanca
- GIVEN un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` o `prioridad: 'Alta'` para un Top 5
- THEN responde `422` y no se escribe la fila

#### Scenario: `Low` ya no es asignable
- GIVEN un usuario con permiso
- WHEN envía `top5: true` con `prioridad: 'Low'`
- THEN responde `422` y no se escribe la fila ni se propaga nada

#### Scenario: Top 5 sin prioridad
- GIVEN un usuario con permiso
- WHEN envía `top5: true` sin `prioridad`
- THEN responde `422`

#### Scenario: 403 antes que 422
- GIVEN un usuario sin permiso y un cuerpo con `prioridad` inválida
- WHEN envía la escritura
- THEN responde `403`, no `422`

#### Scenario: quitar el Top 5
- GIVEN un cliente Top 5 y un usuario con permiso
- WHEN envía `top5: false`
- THEN responde `200` y el cliente deja de ser Top 5

#### Scenario: lectura abierta al autenticado
- GIVEN un usuario autenticado sin cargo de permiso y un cliente Top 5
- WHEN consulta la prioridad del cliente
- THEN ve `top5` y `prioridad`

#### Scenario: el 403 y el 422 no propagan nada
- GIVEN un cliente con tickets abiertos `Low`, un usuario sin permiso y otro con permiso que envía un cuerpo inválido
- WHEN cada uno intenta marcar al cliente
- THEN responden `403` y `422` y ningún ticket cambia ni gana traza

#### Scenario: la respuesta dice cuántos tickets cambiaron
- GIVEN un cliente con dos tickets abiertos `Low` y uno ya `High`
- WHEN se marca Top 5 `High`
- THEN responde `200` con la fila y el recuento 2

#### Scenario: el cuerpo no dirige la propagación
- GIVEN un cuerpo válido con campos de más, como una lista de tickets o una prioridad por ticket
- WHEN se envía la escritura
- THEN los tickets tocados son los del cliente que corresponde, con la prioridad que calcula el servidor

#### Scenario: la fila y los tickets se escriben juntos
- GIVEN una escritura aceptada cuya propagación falla
- WHEN se ejecuta
- THEN la fila de `cliente_prioridad` conserva su valor anterior

### RQ-TC-28 · Sin nadie con cargo, sólo el administrador fija y ajusta (S-1 de F1C-05)

Mientras ningún usuario tenga `cargo_permiso`, sólo un administrador SHALL poder fijar la prioridad de un cliente,
mantener la lista Top 5 y ajustar la prioridad de un ticket. Sin lista, nadie es Top 5 y la prioridad al nacer SHALL
ser la de `RQ-TC-24` sin Top 5: `Medium`, o `High` con contrato vigente.
(Previously: «la que resulta hoy», que era la pedida en el cuerpo.)

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos y ningún cliente es Top 5
- WHEN un no admin de `Comercial` intenta marcar un Top 5, y luego un administrador lo marca
- THEN el primero recibe `403` y el administrador `200`

#### Scenario: nadie tiene cargo, tampoco ajusta un ticket
- GIVEN una base donde todos los `cargo_permiso` son nulos
- WHEN un no admin intenta ajustar la prioridad de un ticket, y luego un administrador lo hace
- THEN el primero recibe `403` y el administrador `200`

#### Scenario: sin lista, el alta nace `Medium`
- GIVEN una base sin ninguna fila en `cliente_prioridad`
- WHEN se crea un ticket de un cliente sin contrato con `prioridad: 'Low'`
- THEN el ticket queda `Medium`

### RQ-TC-29 · Ajuste de la prioridad de cualquier ticket por el Director Comercial o el Director Técnico, con motivo y traza

Un Director Comercial (con su área `Comercial`), un Director Técnico (por cargo, sin exigirle área) o un administrador
SHALL poder cambiar la prioridad de **cualquier** ticket, sea o no de un cliente Top 5 y tenga o no `client_id`,
aportando un **motivo escrito obligatorio**. El permiso lo decide el predicado de ajuste por ticket de
`packages/shared` (`permissions` RQ-PM-20 y RQ-PM-23), que se CONSUME y no se reescribe (regla invariable 13): es
`puedeAjustarPrioridadTicket`. Las respuestas SHALL seguir el orden de precedencia, sin solape de códigos: `404` si el
ticket no existe (A); `403` si el usuario no cumple el predicado (B), con el mensaje `Ajustar la prioridad de un ticket requiere el cargo Director Comercial con el área Comercial, o el cargo Director Técnico`; `422` si falta el motivo, si es sólo
espacios o si la prioridad no está en `High | Medium` (C), con el mensaje de lista `La prioridad debe ser una de: High, Medium`. Ya no hay `409` por «el cliente no es Top 5» ni por
«ticket sin cliente» (supuestos S-D, S-G y S-H de la propuesta). Cuando el ajuste se aplique, el servidor SHALL, en una
**misma transacción**: actualizar `tickets.priority`, insertar una fila en `public.prioridad_ajustes` (ticket,
prioridad anterior, prioridad nueva, motivo, autor, fecha) y poner en ese ticket la marca `prioridad_en_app_at` (`zoho-sync` RQ-ZS-01), que protege SÓLO
la prioridad frente al sincronizador. El ajuste MUST NOT cambiar `managed_by_app`, `source` ni `modified_time` (supuesto S-J, que sustituye al S-6): un ticket venido de Zoho sigue recibiendo de Zoho todo lo demás. El ajuste
MUST NOT escribir en `ticket_transitions`, ni cambiar el estado, ni reiniciar el reloj de SLA. La sentencia
`CREATE TABLE` de `public.prioridad_ajustes` SHALL llevar el esquema calificado y SHALL ir al final de `schema.sql`,
después de la de `cliente_prioridad`. Sólo la prioridad de ese ticket cambia; los demás tickets del cliente no.
(Previously: sólo un usuario con `puedeFijarPrioridadTop5` sobre tickets de clientes Top 5, con `409` para el cliente
que no lo es y para el ticket sin `client_id`, lista `High | Medium | Low`, y el ajuste fijaba `managed_by_app = true`, que congelaba la fila entera.)

La fila de traza de un ajuste manual SHALL llevar el origen vacío, que es lo que significa «manual» (`RQ-TC-38`), y
desde ese momento el ticket queda **exento** de la propagación y de la reversión del Top 5 (`RQ-TC-37`): conserva el
valor que se le ajustó.

#### Scenario: ajuste con motivo
- GIVEN un ticket de un cliente Top 5 con prioridad `Medium` y un Director Comercial
- WHEN ajusta a `High` con motivo «Parada de planta»
- THEN responde `200`, el ticket queda `High` y `public.prioridad_ajustes` tiene una fila con anterior `Medium`, nueva `High`, el motivo, el autor y la fecha

#### Scenario: el Director Técnico ajusta un ticket de un cliente que no es Top 5
- GIVEN un ticket de un cliente sin fila Top 5 y un usuario con cargo `Director Técnico`
- WHEN ajusta a `High` con motivo
- THEN responde `200`, el ticket queda `High` y hay una fila de traza con su motivo

#### Scenario: el Director Técnico no necesita el área Comercial
- GIVEN un usuario con cargo `Director Técnico` sin el área `Comercial`
- WHEN ajusta la prioridad de un ticket con motivo
- THEN responde `200`

#### Scenario: administrador ajusta
- GIVEN un administrador sin `cargo_permiso`
- WHEN ajusta la prioridad de un ticket con motivo
- THEN responde `200`

#### Scenario: ticket sin `client_id`, se ajusta
- GIVEN un ticket sin `client_id` y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `200` y el ticket cambia

#### Scenario: sin motivo, 422
- GIVEN un ticket de un cliente cualquiera y un usuario con permiso
- WHEN envía el ajuste sin motivo, o con motivo de sólo espacios
- THEN responde `422`, la prioridad no cambia y no se inserta traza

#### Scenario: valor fuera de la lista blanca
- GIVEN un ticket y un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` o `prioridad: 'Low'` con motivo
- THEN responde `422`

#### Scenario: sin el predicado, 403
- GIVEN un ticket y un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN envía el ajuste con motivo
- THEN responde `403` y no cambia nada

#### Scenario: un Director Comercial sin el área Comercial, 403
- GIVEN un usuario con cargo `Director Comercial` y sólo el área `Servicio Técnico`
- WHEN envía el ajuste con motivo
- THEN responde `403` y no cambia nada

#### Scenario: un técnico sin cargo de dirección, 403
- GIVEN un usuario del área `Servicio Técnico` sin cargo, o con un cargo que no es de dirección
- WHEN envía el ajuste con motivo
- THEN responde `403`

#### Scenario: un cliente que no es Top 5 ya no da 409
- GIVEN un ticket de un cliente sin fila Top 5 (o con `top5: false`) y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `200`, no `409`

#### Scenario: 404 antes que 403 (A antes que B)
- GIVEN un identificador de ticket que no existe y un usuario sin permiso
- WHEN envía el ajuste
- THEN responde `404`, no `403`

#### Scenario: 403 antes que 422 (B antes que C)
- GIVEN un usuario `Coordinador Comercial` y un ticket existente, con un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `403`, no `422`

#### Scenario: con permiso y sin motivo sobre un cliente que no es Top 5, 422
- GIVEN un usuario con permiso, un ticket de un cliente que no es Top 5 y un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `422`, no `409`

#### Scenario: ticket inexistente
- GIVEN un identificador de ticket que no existe
- WHEN un usuario con permiso envía el ajuste
- THEN responde `404`

#### Scenario: el ajuste no toca `ticket_transitions` ni el SLA
- GIVEN un ticket con una última transición de entrada al estado actual
- WHEN se ajusta su prioridad
- THEN `ticket_transitions` no gana ninguna fila
- AND el instante de entrada al estado que lee el SLA es el mismo de antes

#### Scenario: S-J · el ajuste protege sólo la prioridad frente al sincronizador
- GIVEN un ticket de Zoho con `managed_by_app = false` de un cliente que NO es Top 5
- WHEN el Director Técnico ajusta su prioridad
- THEN `managed_by_app`, `source` y `modified_time` no cambian, y la marca `prioridad_en_app_at` queda puesta en la misma transacción
- AND una pasada posterior de `upsertTicket` con otro estado y otra prioridad actualiza el estado y no sobrescribe `priority`
- AND un ticket de control de Zoho sin ajuste sí recibe la prioridad nueva de la pasada

#### Scenario: un ticket que ya era de la aplicación lo sigue siendo
- GIVEN un ticket con `managed_by_app = true`
- WHEN se ajusta su prioridad
- THEN `managed_by_app` sigue `true` y la marca `prioridad_en_app_at` queda puesta

#### Scenario: atomicidad
- GIVEN un ajuste cuya inserción en `prioridad_ajustes` falla
- WHEN se ejecuta
- THEN `tickets.priority` y `prioridad_en_app_at` conservan su valor anterior

#### Scenario: sólo ese ticket cambia
- GIVEN un cliente Top 5 con dos tickets abiertos
- WHEN se ajusta uno
- THEN el otro conserva su prioridad

#### Scenario: la tabla de trazas está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `CREATE TABLE`
- THEN `public.prioridad_ajustes` es la última y está calificada

#### Scenario: la fila del ajuste manual lleva origen vacío
- GIVEN un ticket de un cliente Top 5 y un Director Comercial
- WHEN ajusta la prioridad con motivo
- THEN la fila de `prioridad_ajustes` tiene el origen vacío

#### Scenario: tras el ajuste manual, el ticket queda exento del Top 5
- GIVEN un ticket ajustado a mano de un cliente Top 5
- WHEN se cambia la prioridad del cliente o se le quita el Top 5
- THEN el ticket conserva la prioridad que se le ajustó

## 4 · Comportamiento actual, a corregir

*(La numeración de esta sección va aparte de la de requisitos: aquí se registra lo que hay, no lo que
debe haber.)*

### 4.1 · La precedencia del `409` de la OV frente al `422` de obligatorios — cerrada por `orden-precedencia-guardas`

**Cerrado.** El `409` de unicidad de la orden de venta deja de ganar en el alta: pasa a ser la
**última** guarda antes de la primera escritura (`ticketService.ts:99`), detrás de las guardas de
contenido — igual que en `habilitar_servicio`. Las dos puertas de la misma regla evalúan ahora en el
**mismo** orden (`transitions-st` §3.8(a)).

**Talla, contada de nuevo.** De las 12 pruebas de precedencia cambian **3**:
`ticketService.test.ts:327`, `:336` (el error doble ya no lo gana la OV) y `:205` (par distinto, la
OV frente a la derivación, cerrado en `executeTransition` por obs. #702). Las otras **9**, más
`remisiones.test.ts:988`, quedan intactas.

(Previously: «Sin tanda: falta una fila en el plan», con la talla contada en «6 de 12» bajo un orden
natural que nunca llegó a aplicarse. `orden-precedencia-guardas` es esa fila, y la cifra real,
verificada contra el cambio efectivamente aplicado, es 3.)

#### Scenario: El mismo error doble responde igual en las dos puertas del motor
- GIVEN un ticket con obligatorios sin completar y una orden de venta ya usada por otro ticket
- WHEN se manda por `POST /api/tickets`
- THEN responde `422` (los obligatorios ganan)
- WHEN el mismo error doble se manda por `habilitar_servicio`
- THEN responde también `422` — el mismo par de errores, el mismo resultado en las dos puertas

### 4.2 · La tercera puerta de la orden de venta: DECIDIDA, y se construye

> **✅ RESUELTO EL 2026-09-10 · `decision/n52-cardinalidad-ov`.** El punto abierto nº 52 está cerrado:
> **`1 ticket : N OV`, sin tabla puente**, y está en la tabla de decisiones del plan (`plan:364`).
>
> **Se CONSTRUYE la tercera puerta; las dos que ya existen SE QUEDAN** — `ticketService.ts:96-99` en el
> alta (RQ-TC-08) y `:150-151` en `habilitar_servicio` (RQ-TS-14). Una OV pertenece como mucho a un
> ticket, que es justo lo que comprueban. La variante que ponía la regla en duda, la OV global por
> lote, **desaparece por proceso**: se sustituye por subórdenes `OV-AAAA-NNN-SS`, una por ticket
> (`decision/subov-lote-convencion`). La regla completa vive en `remisiones` `RQ-RE-16`.
>
> *Lo medido no se pierde, y ya está cerrado:* `ordenVentaUnTicket.test.ts:141-159` en `b99d47a` fijó el
> modo de fallo exacto y el `it.fails` de `:161` en `b99d47a` dejaba esperando — cerrado por
> `tercera-puerta-orden-venta` (`79cf09b`): hoy verde con un `409`.

**Comportamiento actual. IV-4 CERRADO.** El alta de remisión ya llama a `ticketConOrdenVenta` por las
**dos vías** —`salesorder_id` y número—, excluyendo el propio ticket, dentro del bloque de la orden de
venta (`apps/desk/server/routes/remision.ts:218-244`), antes del `UPDATE` (`:239-243`). El `it.fails`
de `apps/desk/server/ordenVentaUnTicket.test.ts:161` deja de existir como tal: la prueba pasa a
afirmar el `409` en positivo. **La regla completa es de `remisiones`** (hoy `RQ-RE-16`).

(Previously: no nombraba explícitamente el enmarcado «retirar, no añadir» de `remisiones` §5.1 como
el mismo enmarcado adoptado aquí. Y encabezaba con «a corregir en F1A», épica cerrada, con la segunda
puerta citada en `:100` cuando vivía en `:128-129`. **Y sostuvo ese enmarcado en presente —«RETIRAR
las dos puertas», «nº 52 no está en la tabla de decisiones»— hasta que se barrió, el 2026-09-10, el
mismo día en que `decision/n52-cardinalidad-ov` lo invirtió.** La segunda puerta vive hoy en
`:134-135`.)

(Previously, tras `tercera-puerta-orden-venta`: decía «IV-4 pasa de bloqueado a CONSTRUIBLE», que el
alta de remisión escribía `salesorder_id` **sin** llamar a `ticketConOrdenVenta`, y que el `it.fails`
de `ordenVentaUnTicket.test.ts:161` seguía esperando.)

#### Scenario: La cardinalidad OV↔ticket, resuelta en la misma dirección en las dos specs

- GIVEN que `tickets-core` impone la regla en dos puertas (alta y `habilitar_servicio`)
- AND `remisiones` la deja abierta en la tercera (alta de remisión de entrada)
- WHEN Gerencia resuelve el punto abierto nº 52 como `1 ticket : N OV` (10/09,
      `decision/n52-cardinalidad-ov`)
- THEN las dos puertas de `tickets-core` **se quedan** —una OV pertenece como mucho a un ticket— y la
      tercera, la de `remisiones`, **se construye**
- AND la variante que ponía la regla en duda, la OV global por lote, deja de existir: se sustituye por
      subórdenes `OV-AAAA-NNN-SS`, una por ticket

### 4.3 · Dos ramas de `Clasificaciones` sin grafo · **CERRADA** (F1B-06)

**Previously**: El alta ofrece las tres clasificaciones (`ticketCreate.ts:5`) y sólo `Equipo para servicio de mantenimiento` tiene grafo. Un ticket creado como `Equipo nuevo` entra hoy en el flujo de servicio técnico, que no es el suyo. El maestro lo registra como no construido en el Anexo H.2 (`:4497-4504`). *Hipótesis:* no hay ninguna guarda que lo impida ni ningún aviso al usuario. No se ha localizado ninguna en el código, pero tampoco se ha barrido el cliente exhaustivamente.

**CERRADA**: `Equipo nuevo` por `blueprint-equipo-nuevo` (F1B-06, cambio 1, archivado en `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/`) y `Soporte remoto` por `blueprint-soporte-remoto` (F1B-06, cambio 2, archivado en `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/`). Las tres ramas tienen ahora grafo propio: `Equipo para servicio de mantenimiento` usa el grafo de servicio (`transitions-st`), `Equipo nuevo` tiene su catálogo (`transitions-equipo-nuevo`), y `Soporte remoto` tiene el suyo (`transitions-soporte-remoto`).

### 4.4 · La identificación física por QR no existe · **destino: sin tanda asignada**

**Comportamiento actual.** El maestro decide en R03 la «identificación física por QR adherido por
Ambientalia», y la sube a MVP «por su efecto directo sobre el riesgo de captura» (M1.1 `:1049`).
**Verificado en esta tanda: cero referencias a QR** en `apps/desk/src`, `apps/desk/server` y
`packages` (la única coincidencia textual es el alfabeto de `ClientesPage.tsx:8`). No está en ninguna
tanda del §5 del plan.

### 4.5 · Un comentario con la cifra vieja de la base de numeración · **destino F1B**

**Comportamiento actual, a corregir cuando alguien toque el fichero.**
`packages/zoho-sync/src/db/migrate.test.ts:33` lleva el comentario `// 1.000.000, no 959`, y la base
real es **10.000** (`migrate.ts:43`, afirmado en `packages/zoho-sync/src/db/repo.test.ts:95`). La aserción es correcta —usa la
constante—; lo que miente es el comentario. Es la misma clase de defecto que M-5 de
`transitions-st`: **una cuenta escrita a mano que envejeció**. F0-02 no lo corrige: es código.

---

## 5 · Discrepancias

### 5.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | El ticket nace en **`'OV asignada'`** (`design C:12`, `:24`, `:72`, `:114`, `:131`, `:136`) | Nace en **`Ticket creado`**, o en `Solicitud Soporte` si es `Soporte remoto` (`repo.ts:418`, `:422`, `:435`; razón en `:405-410`) | **Superado, y es la discrepancia de peso.** De aquí sale toda la regla de las «dos entradas que nunca se cruzan» (M1.3.2), que el diseño no contempla. Cualquier lectura del diseño C como inventario del estado inicial es falsa |
| D-2 | «Equipos: **texto libre** (sin registro de equipos; eso es Remisiones)» (`design C:26`), y el registro de equipos queda «fuera de alcance» (`:140`) | El `equipoId` es **obligatorio** y se valida contra el catálogo (`ticketService.ts:22-25`); marca, modelo, tipo y serial salen de él (`:64-66`) | **Superado.** El catálogo llegó (capacidad `catalogo-equipos`, sembrada el 2026-08-07) y el alta pasó a depender de él |
| D-3 | «Continuar desde el máximo de Zoho (numeración continua, misma lógica actual)» (`design A:22`, `:107-113`) | **Dos espacios separados**, con base 10.000 para la app (`migrate.ts:38-43`, `:45-50`) | **Revertido por un bug de producción (#954).** El propio diseño anticipaba el «caveat de transición» (`design A:111-113`) y su mitigación no bastó |
| D-4 | `createTicket(db, input): Promise<TicketDetail>` (`design C:69`) | `Promise<string>` — devuelve el `id` (`repo.ts:412`); el `TicketDetail` lo compone el llamador (`ticketService.ts:69-70`) | Cambio de contrato. El diseño ponía la composición dentro del repo |
| D-5 | La fila de la creación lleva `values = { orden_venta }` (`design C:78`) | Lleva el **payload completo**: diez claves, y `modalidad` como undécima en `Soporte remoto` (`repo.ts:431-435`) | **Ampliado a propósito.** Lo pidió la historia unificada (`docs/superpowers/specs/2026-08-05-historia-unificada-ticket-design.md:36-40`), que documenta el caveat original |
| D-6 | Endpoint en `server/app.ts` (`design C:84`) | En `apps/desk/server/routes/tickets.ts:124-126` | Movido, igual que el de transición (D-2 de `transitions-st`) |
| D-7 | Validar `tipoEquipo`, `marca`, `modelo`, `serie` como obligatorios del cuerpo (`design C:92-93`) | Ninguno de los cuatro es obligatorio del cuerpo: **salen del equipo** (`ticketService.ts:64-66`). Los obligatorios son cliente, tipo de servicio, clasificaciones y prefijo (`:53-58`) | Consecuencia de D-2. El cuerpo del alta cambió de forma |

> **Nota sobre el propio diseño de agosto.** El diseño de la historia unificada cita `createTicket` en
> `repo.ts:326` en `3675f81` (`historia-unificada:38`) y hoy está en `:412`. Es la clase de cita que envejece: por
> eso las specs de este repositorio se verifican en cada tanda contra el commit que declaran.

### 5.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | Anexo G col. 27 (`:4337-4338`): «Tipo de Servicio: Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro» — **seis** | **Siete**: añade `Reparación` (`ticketCreate.ts:4`) | El código lo declara y lo razona: `Reparación` viene del formulario de remisiones, y al heredar la remisión el tipo de servicio del ticket las dos listas se unificaron (`ticketCreate.ts:2-3`). **Corrección para el maestro**: el Anexo G va con seis valores y la lista real tiene siete |
| M-2 | Anexo G col. 11 (`:4325-4326`): «Mantenimiento · equipo nuevo · soporte remoto» | `Equipo para servicio de mantenimiento` · `Equipo nuevo` · `Soporte remoto` (`ticketCreate.ts:5`) | Mismos tres valores; la etiqueta del primero es más larga en el código. Discrepancia de etiqueta, no de dominio. **Corrección menor para el maestro**, para que un `WHERE classification = 'Mantenimiento'` no se escriba con la etiqueta corta |
| M-3 | M1.1 `[DECIDIDO]` (`:1043`): «Se elimina la nomenclatura CG (calibración) / MT (mantenimiento)» | Los cinco prefijos siguen (`ticketCreate.ts:1`), y `defaultPrefijoFor` **deriva** CG para Calibración y MT para el resto (`:47-49`) | **El código implementa el cierre de la R08, no el `[DECIDIDO]` original.** R08 resolvió el punto nº 37: el prefijo es formalidad, «puede derivarse automáticamente de la clasificación y del tipo de servicio en lugar de teclearse» (`:1067`). Eso es exactamente `defaultPrefijoFor`. Sin discrepancia real, pero el `[DECIDIDO]` de `:1043` sigue en el maestro contradiciendo su propio cierre — **conviene marcarlo como superado ahí mismo** |
| M-4 | M1.1 `[DECIDIDO 21/08]` (`:1048`): «Autocompletado por serial: al introducir el número de serie, el sistema trae automáticamente la información de cliente y modelo, **y asocia el ticket a las órdenes de venta activas**» | **CERRADO en F1B-01.** `EquipoLite` lleva `clientId` (`packages/shared/src/types.ts:329-350`, servido por `db/equipos.ts:42`, `:66`, `:78`); `pickEquipo` resuelve el cliente **por identidad** (`CreateTicket.tsx:139-174`), y con el cliente puesto el efecto de las órdenes de venta (`CreateTicket.tsx:83-93`) ofrece las **activas y libres** de ese cliente (`books/repo.ts:145`, `routes/directory.ts:41-47`) | **Ya no está a medias — y la mitad que faltaba no necesitaba un endpoint, sino un campo.** El diagnóstico anterior («la orden de venta se elige en un buscador aparte») era cierto pero no daba con la causa: sin `client_id` en el equipo, el formulario resolvía el cliente **por NOMBRE**, que es exactamente el apaño que el servidor había abandonado el 2026-08-09 (`db/equipos.ts:46-54`). Probado de punta a punta en `db/equipos.test.ts`, «del serial al client_id, y del client_id a las órdenes de venta activas y libres». La vía por nombre sobrevive **sólo** como respaldo para el ~3,4 % de equipos que el backfill no enlazó |
| M-5 | M1.1 `[DECIDIDO — R03]` (`:1049`): identificación física por **QR**, subida a MVP | **No existe.** Cero referencias en el árbol | Registrado en §4.4. **No tiene tanda en el §5 del plan**, así que hoy no está previsto que se construya. Punto a decidir |
| M-6 | M1.3.8 (`:1415`) y M1.1 (`:1046`): «las 27 etiquetas de campo mapean a columnas reales; ninguna cae al cajón `custom_fields`» | **Verificado cierto**: 27 etiquetas distintas, las 27 en `PROMOTED_COLUMNS` (de 39). **F1A-04: ahora 28 de 40** — el campo de aviso de C9. La afirmación resiste | Sin discrepancia. Se anota porque es una de las afirmaciones as-built del maestro que sí resiste, y porque conviene que su verificación quede reproducible |

### 5.3 · Las `ALTER TABLE` sin calificar: el hueco del guardián · **CERRADO en F1B-01 (IV-6)**

**No es discrepancia con nadie: es un hallazgo nuevo de esta tanda.** `CLAUDE.md` fija como regla dura
que «toda sentencia de creación de tabla califica el esquema explícitamente», porque un `CREATE` sin
calificar ya aterrizó `catalogo_articulos` en el esquema equivocado en producción
(`packages/zoho-sync/src/db/migrate.ts:55-56`).

El recuento sobre `packages/zoho-sync/src/db/schema.sql` **sale de comandos, no de la lectura**, y
parte el fichero en dos mitades que **no tienen el mismo estatus**:

| Sentencia | Total | Calificadas | Sin calificar | Comando |
|---|---|---|---|---|
| `CREATE TABLE` | **29** | **19** | **10** | `grep -cE '^CREATE TABLE' schema.sql` · `grep -cE '^CREATE TABLE (IF NOT EXISTS )?[a-z_]+\.' schema.sql` |
| `ALTER TABLE` | **28** | **5** (`:154-158`, las cinco de `books.contacts`) | **23** | `grep -cE '^ALTER TABLE' schema.sql` · `grep -nE '^ALTER TABLE [a-z_]+\.' schema.sql` |

#### Las 10 `CREATE` sin calificar son deliberadas — **no se anotan como desvío**

Son **exactamente** las diez de `DESK_TABLES` (`migrate.ts:63-64`): `accounts`, `contacts`, `agents`,
`tickets`, `conversations`, `attachments`, `ticket_transitions`, `ticket_history`, `activities`,
`equipos`. Verificado por diferencia de conjuntos entre la lista extraída del `.sql` y la constante:
**idénticas, sin sobrantes por ningún lado**.

Están sin calificar **a propósito**, y el motivo está escrito: en producción la app conecta con
`search_path=desk,public`, así que un `CREATE` sin calificar cae en `desk`, «que es exactamente lo que
se quiere de las de Zoho Desk y exactamente lo que NO se quiere del resto»
(`packages/zoho-sync/src/db/migrate.test.ts:229-232`; el comentario hermano en `migrate.ts:58-59`).

Y están **probadas**: el guardián que F0-04 dejó escrito compara la identidad **calificada** de cada
tabla del esquema contra las tres listas (`migrate.test.ts:266`), y una segunda prueba fija el reparto
10 + 16 + 3 = 29 (`:282`). Si una de las diez cambiara de esquema, el guardián se pone rojo. Es
**condición conocida, documentada y probada**, no incumplimiento.

*Corrección de una cita de la propia spec:* el `search_path` no se configura en `migrate.ts:58-59`
—ahí sólo se documenta—; se configura en `packages/zoho-sync/src/db/pool.ts:5`, y sólo cuando
`config.dbSchema === 'desk'` (fijado en `pool.test.ts:17`).

#### Las `ALTER` sin calificar sí eran hueco — **y el arreglo fue el guardián, más 13 sentencias**

> **✅ CERRADO EN F1B-01 (2026-09-09).** Lo que sigue describe el hallazgo tal como se registró; el
> cierre está al final del apartado. **Y las cifras de arriba quedaron caducas antes de cerrarse**:
> eran 28 / 5 / 23 al escribirlas y eran **29 / 5 / 24** tres días después. La que entró es
> `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_aviso_cliente` (`schema.sql:448`), de F1A-04
> (`e8c5e90`). Está **bien** sin calificar —`tickets` es de `DESK_TABLES`—; el hallazgo es que **nadie
> lo comprobó**, que es precisamente lo que el hueco permitía.


El guardián **no las ve**, y no por olvido de alcance sino por su implementación: su extractor ancla en
`^CREATE TABLE` (`migrate.test.ts:245`), así que **ninguna** `ALTER TABLE` entra en su red. Las 23
tocan **ocho** tablas distintas:

| Esquema donde vive la tabla | Tablas | `ALTER` | Líneas |
|---|---|---|---|
| `public` (`PUBLIC_TABLES`, `packages/zoho-sync/src/db/migrate.ts:70-73`) | `remisiones` (7) · `users` (3) · `roles` (1) · `avisos` (1) · `catalogo_modelos` (1) | **13** | `:291`, `:306`, `:309-310`, `:313`, `:316-317` · `:112`, `:115-116` · `:143` · `:145` · `:374` |
| `desk` (`DESK_TABLES`, `migrate.ts:63-64`) | `tickets` (7) · `equipos` (2) · `contacts` (1) | **10** | `:123`, `:185`, `:187`, `:206`, `:228-230` · `:208`, `:354` · `:256` |

Las **13 de `public`** son el hueco de verdad. Hoy resuelven bien porque el nombre no existe en `desk`
y el `search_path` cae a `public`. **Basta una homónima en `desk` para que cambien de destino en
silencio** —`ALTER TABLE users ADD COLUMN role_id` (`:112`) dejaría de tocar `public.users`— y ése es
exactamente el modo de fallo de `catalogo_articulos`, con la misma mecánica y una sentencia de otra
clase.

La más afilada es `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS modified_time` (`:256`): `contacts`
existe **en los dos esquemas** —`desk.contacts` por `DESK_TABLES` y `books.contacts` por
`BOOKS_TABLES` (`migrate.ts:80`)—, y el propio guardián declara esa colisión como el motivo de tener
tres listas y no dos (`migrate.test.ts:220-222`). Resuelve a `desk.contacts` porque `books` no está en
el `search_path`, que es lo que se quiere; pero lo que lo decide es una omisión, no una declaración.

**Matiz de alcance, para no acusar de más:** la regla dura de `CLAUDE.md` habla de «sentencia de
creación de tabla», y una `ALTER` no lo es. Lo que este hallazgo dice no es que las 23 violen la letra
de la regla, sino que **heredan su modo de fallo y quedan fuera de su única red de contención**.

*Destino: se anota como **IV-6** en `openspec/config.yaml` (`incumplimientos_vivos`) y en la tabla de
`CLAUDE.md`, con alcance **23** —nunca 28, nunca las 10 `CREATE`—.* F0-02 no lo corrige: es código. El
arreglo que la entrada propone **no es reescribir 23 sentencias a mano**, sino extender el extractor
del guardián a `^ALTER TABLE`, para que las 23 dejen de poder volver.

#### Cómo se cerró · **F1B-01**

**El guardián se extendió, y esa parte de la entrada era exacta.** `migrate.test.ts` añade
`altersDelEsquema()` —el mismo troceo, el mismo saneado de comentarios y las **mismas tres listas**
que el de `CREATE`, a propósito: si los dos guardianes no leyeran de la misma fuente podrían discrepar
sobre dónde vive una tabla, que es justo el error a cazar— y tres pruebas:

| Prueba | Qué fija |
|---|---|
| «toda ALTER TABLE apunta a una tabla clasificada…» | La identidad calificada de cada `ALTER` está en `DESK_TABLES`, `public.*` o `books.*` |
| «las ALTER sin calificar son exactamente las de DESK_TABLES…» | Una `ALTER` sin calificar sobre una tabla que **no** es de Desk se pone roja |
| «son 29 ALTER: 18 calificadas… y 11 sin calificar» | El recuento, que es lo que delata el crecimiento silencioso |

**Y además hubo que calificar 13 sentencias, no 23 — y la diferencia es la entrada del hallazgo.**
Extender el guardián sin tocar el `.sql` lo habría dejado rojo para siempre. Se calificaron **las 13
de `public`** —`users` (3), `roles` (1), `avisos` (1), `remisiones` (7), `catalogo_modelos` (1)—, que
son el hueco de verdad; las **11 de `DESK_TABLES`** siguen sin calificar, que es lo correcto y lo que
la segunda prueba fija en positivo. **Calificar las 23 habría roto la migración**: el esquema `desk`
sólo existe tras `reorgToDesk`, que no corre en los tests, y `migrate` es tolerante por sentencia, así
que las diez habrían fallado en silencio.

Que las 13 de `public` se puedan calificar sin riesgo **no era una suposición**: `public` sí existe en
pg-mem —`schema.sql:271` ya crea `public.remisiones` así— y la suite entera pasó sin un solo cambio
tras hacerlo.

*Mutaciones ejercitadas y muertas:* quitarle el `public.` a una `ALTER` de `remisiones`; ponerle
`desk.` a una de `tickets`; y añadir una `ALTER` nueva sin calificar sobre `public.users`, que es
literalmente el caso que dejó pasar `e8c5e90`.

## ADDED Requirements

### RQ-TC-30 · Cliente provisional: tabla propia `public.clientes_provisionales`, cinco datos obligatorios

El alta del ticket **SHALL** admitir un modo manual de cliente: en lugar de un `clientId` de Books, el cuerpo trae
razón social, NIT, contacto, teléfono y correo, y el servidor crea una fila en `public.clientes_provisionales`
(sentencia `CREATE TABLE` con el esquema calificado, al final de `schema.sql`) con la marca «pendiente de validar»,
quién la creó, cuándo y el **motivo escrito obligatorio** de por qué no se usó el cliente de Books. El ticket
**SHALL** quedar con el identificador del provisional como `client_id`, y ese identificador **MUST NOT** poder
coincidir con el de ningún contacto de Books. Los cinco datos y el motivo son obligatorios (supuesto Q2); si falta
alguno el alta responde `422` listando **todos** los que faltan (**escalón A**) sin escribir nada. Es A y no C por la
misma razón que `exigirEquipoNuevo` (`apps/desk/server/services/equipoNuevo.ts:32-44`, A, en `ticketService.ts:25`):
faltan datos del **sujeto que el alta va a crear**, no contenido del ticket. La **validez** de esos datos —provisional
junto con `clientId` u orden de venta— sigue en C. No son los «obligatorios» de C del cuadro de `transitions-st` §3.8
(`:88`), que son los del cuerpo del ticket. Puede hacer el alta manual quien hoy puede crear tickets (supuesto Q1). El
alta manual **MUST NOT** escribir en `books.*` ni hacia Zoho.
Si el NIT del provisional ya pertenece a uno o más clientes de Books (comparado sin puntos, espacios ni dígito de
verificación), el alta **SHALL** responder `409` (escalón D, unicidad) con el cuerpo
`{ error, candidatos: [{ id, name }] }`: **uno o más** candidatos, ordenados por nombre y después por id, para que se
use uno de ellos, sin escribir nada (P-B, decidido por el usuario el 2026-10-02). Que se devuelvan todos y que ningún
NIT genérico quede exento es un supuesto reversible (`design.md` §4.6); la lista de exentos, si la hay, la decide
Gerencia (E-154).

#### Scenario: Alta con cliente provisional
- GIVEN una sesión que puede crear tickets y los cinco datos y el motivo completos
- WHEN se envía `POST /api/tickets` en modo manual de cliente
- THEN responde `201`, existe una fila en `public.clientes_provisionales` marcada pendiente con autor, fecha y motivo, y el ticket tiene ese id como `client_id`

#### Scenario: Faltan datos del cliente
- GIVEN un cuerpo manual sin NIT ni correo
- WHEN se envía el alta
- THEN responde `422` nombrando NIT y correo en la misma lista y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: Motivo vacío
- GIVEN un cuerpo manual con los cinco datos y un motivo de sólo espacios
- WHEN se envía el alta
- THEN responde `422` y no se escribe nada

#### Scenario: El NIT ya está en Books
- GIVEN un cliente de Books con NIT «900.123.456-7» y un alta manual con NIT «900123456»
- WHEN se envía el alta
- THEN responde `409` con `candidatos: [{ id, name }]` del cliente de Books (uno), y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: Dos contactos de Books comparten el NIT
- GIVEN dos contactos de Books cuyo NIT normalizado es «900123456» (p. ej. dos sucursales), insertados en orden inverso al alfabético
- WHEN se envía un alta manual con NIT «900123456»
- THEN responde `409` con los dos en `candidatos`, ordenados por nombre y después por id, y no queda nada escrito

#### Scenario: El id provisional no se confunde con uno de Books
- GIVEN un cliente provisional creado
- WHEN se compara su identificador con el conjunto de ids de `books.contacts`
- THEN no coincide con ninguno

### RQ-TC-31 · El alta manual conserva el orden de guardas y es atómica con el ticket

El alta manual de cliente y/o equipo **SHALL** crear el provisional, el equipo manual (si lo hay) y el ticket en
**una sola transacción**: un fallo en cualquiera no deja ninguna de las tres filas. Las guardas nuevas **SHALL**
respetar el orden total A < B < C < D de `transitions-st` §3.8: la existencia (A) precede al contenido (C) y éste a
la unicidad (D); en particular el `409` de unicidad de la OV sigue siendo la última guarda antes de la primera
escritura (RQ-TC-05). La guarda equipo↔cliente (RQ-TC-13) **SHALL** seguir coherente: el equipo manual nace con el
mismo `client_id` que el ticket. El ticket **SHALL** nacer en la fase inicial de su flujo: `Ticket creado`, o
`Solicitud Soporte` si la clasificación es `Soporte remoto` (RQ-TC-07).

#### Scenario: Ticket con las dos marcas
- GIVEN un alta manual de cliente y de equipo, clasificación distinta de `Soporte remoto`
- WHEN se envía `POST /api/tickets`
- THEN responde `201`, el ticket queda en `Ticket creado`, y cliente y equipo llevan la marca de pendiente

#### Scenario: Soporte remoto nace en su fase
- GIVEN un alta manual con clasificación `Soporte remoto`
- WHEN se envía `POST /api/tickets`
- THEN el ticket queda en `Solicitud Soporte` con las dos marcas

#### Scenario: Un fallo no deja nada a medias
- GIVEN un alta manual cuyo `INSERT` del ticket falla tras crear el provisional y el equipo
- WHEN la transacción termina
- THEN no existe ninguna fila nueva en `clientes_provisionales`, `equipos` ni `tickets`

#### Scenario: Posición de la unicidad de la OV
- GIVEN un alta manual con una OV ya asociada a otro ticket y, a la vez, un serial que no coincide con su confirmación
- WHEN se envía el alta
- THEN responde `422` (contenido, C) y no `409` (unicidad, D)

### RQ-TC-32 · Enlazar el cliente provisional con Books: sólo Comercial o administrador, en una transacción

Un endpoint de enlace **SHALL** reasignar un cliente provisional a un contacto de Books ya existente. Sólo un usuario
del área Comercial o un administrador **SHALL** poder usarlo; cualquier otro recibe `403` sin escribir nada. Las
respuestas siguen el orden de precedencia: `404` si el provisional no existe o el contacto de Books no existe (A);
`403` por permiso (B); `409` si el provisional ya está enlazado (B); `422` si falta el contacto destino (C). Al
aplicarse, el servidor **SHALL**, en **una transacción**, reescribir el `client_id` de todos los tickets y todos los
equipos del provisional al id de Books, marcar el provisional como enlazado (quién, cuándo) y quitar la marca de
cliente pendiente. Un fallo en cualquier escritura **MUST NOT** dejar nada reescrito. Tras el enlace, los tickets
y equipos se resuelven por el contacto de Books (RQ-TC-14) y el enlace **MUST NOT** escribir hacia Zoho: el contacto
lo crea Comercial a mano en Books.

#### Scenario: Enlace correcto
- GIVEN un provisional con dos tickets y un equipo, un contacto de Books existente y una sesión de Comercial
- WHEN se enlaza
- THEN responde `200`, los dos tickets y el equipo tienen `client_id` de Books, y el provisional queda enlazado con autor y fecha

#### Scenario: Sin permiso
- GIVEN una sesión que no es de Comercial ni administradora
- WHEN intenta enlazar
- THEN responde `403` y ningún `client_id` cambia

#### Scenario: Fallo a mitad
- GIVEN un enlace cuya reescritura de equipos falla tras reescribir los tickets
- WHEN la transacción termina
- THEN los tickets conservan el id provisional y el provisional sigue pendiente

#### Scenario: Contacto de Books inexistente
- GIVEN un contacto destino que no existe en Books
- WHEN se enlaza
- THEN responde `404` y no se escribe nada

#### Scenario: Doble enlace
- GIVEN un provisional ya enlazado
- WHEN se vuelve a enlazar a otro contacto
- THEN responde `409` y nada cambia

### RQ-TC-33 · Nada del alta manual se escribe en Zoho

Ni el alta manual, ni el enlace, ni la validación **SHALL** escribir en Zoho ni en `books.*` (`decision/p44-escritura-zoho`).
El único destino de escritura **SHALL** ser `public.clientes_provisionales`, `desk.equipos`, `desk.tickets` y sus trazas.

#### Scenario: Ninguna salida hacia Zoho
- GIVEN un alta manual, un enlace y una validación ejecutados con los clientes de escritura de Zoho y de `books.*` sustituidos por espías
- WHEN terminan los tres flujos
- THEN los espías registran cero llamadas

### RQ-TC-34 · El servidor de la app resuelve también los clientes provisionales, sin tocar la vista `public.clients`

La capa de servicio de `apps/desk/server` **SHALL** consultar `public.clientes_provisionales` con una **segunda
consulta**, además de la de Books (`public.clients`, que no cambia: RQ-ZS-16), en tres puntos: (1) la **búsqueda de
clientes**, (2) la **ficha de cliente** y (3) el **nombre del cliente en los listados** de tickets. En los tres, los
provisionales **no enlazados** **SHALL** aparecer **marcados como provisionales** (campo `provisional: true`); los
clientes de Books **SHALL** resolverse **exactamente igual que antes**, con `provisional: false`. Un provisional ya
enlazado **MUST NOT** aparecer como provisional: sus tickets y equipos llevan ya el `client_id` de Books y se
resuelven por el contacto (RQ-TC-32). Un identificador que exista en Books **MUST** tener prioridad y resolverse por
Books (los ids de ambos orígenes no coinciden: RQ-TC-30). Esta resolución **MUST NOT** modificar
`packages/zoho-sync/src/books/repo.ts`, la vista ni el worker del hub, y **MUST NOT** escribir en `books.*`.

#### Scenario: La búsqueda devuelve provisionales marcados
- GIVEN un provisional no enlazado con razón social «Acme Provisional» y un cliente de Books «Acme SAS»
- WHEN se busca «Acme»
- THEN la respuesta incluye ambos, el de Books con `provisional: false` y el provisional con `provisional: true`

#### Scenario: Un provisional enlazado no se lista como provisional
- GIVEN un provisional ya enlazado a un contacto de Books
- WHEN se busca por su razón social provisional
- THEN no aparece como provisional, y el cliente se resuelve únicamente por el contacto de Books

#### Scenario: La ficha de un provisional
- GIVEN un provisional no enlazado
- WHEN se pide la ficha de cliente con su id
- THEN responde `200` con razón social, NIT, contacto, teléfono, correo y `provisional: true`

#### Scenario: La ficha de un id de Books no cambia
- GIVEN un contacto de Books existente
- WHEN se pide su ficha de cliente
- THEN devuelve los mismos valores que antes del cambio y `provisional: false`

#### Scenario: Un id inexistente sigue siendo 404
- GIVEN un id que no está en Books ni en `clientes_provisionales`
- WHEN se pide la ficha de cliente
- THEN responde `404`, como antes

#### Scenario: El listado de tickets muestra el nombre del provisional
- GIVEN un ticket con `client_id` de un provisional no enlazado y otro con `client_id` de Books
- WHEN se consulta el listado de tickets
- THEN ambos muestran el nombre de su cliente, y el del provisional va marcado como provisional

#### Scenario: Prioridad de Books
- GIVEN un id presente en Books
- WHEN el servicio resuelve el nombre del cliente

## 6 · Fuera de alcance de esta spec

- **El grafo de estados, las 34 transiciones y las dos entradas que no se cruzan** → `transitions-st`.
  Aquí sólo está de dónde arranca el ticket (RQ-TC-07).
- **Quién puede crear, el modelo de roles, sesiones y contraseñas** → `permissions`. Aquí sólo está
  que el alta exige sesión y no gatea por área (RQ-TC-05).
- **El historial del ticket, su composición y la foto de la creación como evento** → `trazas`. Aquí
  sólo está que la fila se escribe y con qué contenido (RQ-TC-06).
- **El alta, envío y anulación de remisiones, y la tercera puerta de la OV** → `remisiones`.
- **Lo que llega de Zoho, la cadencia del sync y `managed_by_app` como cutover** → `zoho-sync`.
- **El catálogo de tipos, marcas, modelos y equipos** → `catalogo-equipos` (no es de F0-02). Aquí sólo
  está que el alta lo consume (RQ-TC-04).
- **Las hojas de vida y el árbol de inspección** → `hojas-vida` y `diagnostico-checklist` (no son de
  F0-02).
- **Los indicadores del Anexo G.6 y las 12 columnas descartadas de G.7** (`:4470-4472`) → `kpis` (no
  es de F0-02).
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). Todo requisito que
  cite un `.tsx` describe código **no cubierto por pruebas**.

### RQ-TC-35 · Marcar un cliente como Top 5, o cambiar su prioridad, propaga esa prioridad a sus tickets abiertos, cada uno con su traza

Gerencia, `decision/cola-del-taller-los-tres-cabos`, punto 3 (`openspec/config.yaml` → `decisiones_de_gerencia`):
«Al marcar un cliente como Top 5, sus tickets abiertos toman la nueva prioridad, cada uno con su traza […]. En
ningún caso se tocan los tickets con un ajuste manual con motivo, que mantienen el suyo.»

Cuando la escritura de `RQ-TC-27` se acepta con `top5` verdadero, el servidor **SHALL**, en la MISMA transacción que
escribe `public.cliente_prioridad`, hacer que cada ticket del cliente (`tickets.client_id`) que sea **abierto** y no
esté **exento** (`RQ-TC-37`) tome la prioridad que resulta de la fórmula del alta (`RQ-TC-24`): la más alta entre
`High` por contrato vigente hoy y la prioridad del Top 5; sin contrato vigente, la del Top 5. La prioridad del Top 5
es `High` o `Medium` (`RQ-TC-27`).

- **Abierto** (supuesto S-3): `status_type <> 'Closed' OR status_type IS NULL` (el predicado de `repo.ts:151`). Los
  tickets en espera cuentan como abiertos. No es la noción de la vista «abiertos» del cliente, que excluye además las
  esperas.
- Por cada ticket cuya prioridad **cambia**, el servidor **SHALL** actualizar `tickets.priority`, poner la marca
  `prioridad_en_app_at` (`zoho-sync` RQ-ZS-01) e insertar UNA fila en `public.prioridad_ajustes` con ticket,
  prioridad anterior (`de`), prioridad nueva (`a`), un motivo de texto fijo generado por el servidor, no vacío
  (supuesto S-11), el autor que marcó, la fecha y el origen de propagación (`RQ-TC-38`).
- Si la prioridad resultante es igual a la actual, el servidor **MUST NOT** escribir el ticket ni dejar traza.
- Si la del Top 5 es más baja que la actual y no hay contrato, el ticket **SHALL** bajar (supuesto S-5; es lo que hace
  el alta). Cambiar la prioridad de un cliente que ya es Top 5 **SHALL** propagar igual (supuesto S-6).
- La propagación **SHALL** incluir los tickets venidos de Zoho. Su `managed_by_app` **MUST NOT** cambiar.
- Las lecturas **SHALL** ser un número fijo de consultas, independiente del número de tickets del cliente.
- Si falla cualquier escritura, **ni** la fila del cliente **ni** ningún ticket ni ninguna traza **SHALL** cambiar.
- **Regla invariable 13.** Qué tickets se tocan, qué prioridad toma cada uno y que el sincronizador no la pise son
  decisiones del servidor; el cliente no envía lista de tickets. La fórmula es la de `packages/shared`
  (`prioridadAlNacer`), que el servidor consume. Lo que el cliente añade (decir cuántos tickets cambiaron) es
  comodidad.

#### Scenario: marcar Top 5 propaga a los abiertos, con una traza por ticket
- GIVEN un cliente con dos tickets abiertos `Low`, sin contrato, y un usuario con permiso
- WHEN marca al cliente como Top 5 con `prioridad: 'High'`
- THEN los dos tickets quedan `High`
- AND `public.prioridad_ajustes` tiene una fila por ticket con `de` `Low`, `a` `High`, motivo no vacío, autor, fecha y origen de propagación

#### Scenario: cambiar la prioridad de un Top 5 propaga la nueva (S-6)
- GIVEN un cliente Top 5 `High` cuyos tickets abiertos ya están `High` por propagación
- WHEN se cambia su prioridad a `Medium`
- THEN los tickets quedan `Medium`, cada uno con una fila nueva de traza `High` → `Medium`

#### Scenario: contrato vigente y Top 5 `Medium` dejan el ticket en `High`
- GIVEN un cliente con contrato vigente y un ticket abierto `Medium`
- WHEN se marca al cliente como Top 5 con `prioridad: 'Medium'`
- THEN el ticket queda `High`

#### Scenario: sin contrato, un Top 5 más bajo hace bajar al ticket (S-5)
- GIVEN un cliente sin contrato con un ticket abierto `High`
- WHEN se marca como Top 5 con `prioridad: 'Medium'`
- THEN el ticket queda `Medium`, con su traza

#### Scenario: si la prioridad ya es la resultante, no se escribe ni se traza
- GIVEN un ticket abierto `High` de un cliente que se marca Top 5 `High`
- WHEN se propaga
- THEN el ticket no se escribe y `prioridad_ajustes` no gana ninguna fila por él

#### Scenario: los cerrados no cambian
- GIVEN un cliente con un ticket cerrado `Low` y uno abierto `Low`
- WHEN se marca Top 5 `High`
- THEN el cerrado conserva `Low`, sin traza, y el abierto pasa a `High`

#### Scenario: las esperas y el `status_type` nulo cuentan como abiertos (S-3)
- GIVEN un ticket del cliente en `En Espera de Repuestos` y otro con `status_type` nulo, ambos `Low`
- WHEN se marca Top 5 `High`
- THEN los dos quedan `High`

#### Scenario: otro cliente y un ticket sin cliente no cambian
- GIVEN un ticket de otro cliente y un ticket sin `client_id`, ambos `Low`
- WHEN se marca Top 5 `High` a un cliente distinto
- THEN ninguno cambia ni gana traza

#### Scenario: un ticket de Zoho conserva `managed_by_app = false` al propagarse
- GIVEN un ticket de Zoho con `managed_by_app = false` de un cliente que se marca Top 5
- WHEN se propaga
- THEN su prioridad cambia y `managed_by_app` sigue `false`

#### Scenario: si falla una escritura, no cambia nada
- GIVEN una propagación a dos tickets cuya inserción de traza del segundo falla
- WHEN se ejecuta el `PUT`
- THEN no cambian la fila de `cliente_prioridad`, ni la prioridad de ningún ticket, ni la traza

#### Scenario: sin N+1
- GIVEN un cliente con N tickets abiertos y otro con 2N
- WHEN se marca cada uno como Top 5
- THEN el número de consultas de lectura es el mismo en los dos

### RQ-TC-36 · Desmarcar un cliente devuelve sus tickets abiertos a la prioridad calculada, con traza

Gerencia, punto 3: «al desmarcarlo, vuelven a la prioridad calculada».

Cuando la escritura de `RQ-TC-27` se acepta con `top5` falso, el servidor **SHALL**, en la MISMA transacción, devolver
cada ticket del cliente que sea abierto, no esté exento (`RQ-TC-37`) y **tenga base** a la prioridad calculada:
`prioridadAlNacer(base, contrato vigente hoy, null)`.

- **Base** (supuesto D-2 de la propuesta): la prioridad que el ticket tenía antes de que el Top 5 la tocara, es decir,
  el `de` de su primera fila de origen alta bajo Top 5 o propagación posterior a su última fila de reversión. Con
  varias propagaciones seguidas la base es la de la primera.
- **La reversión sigue devolviendo cada ticket a su base** (supuesto S-I de la propuesta). La regla de tres niveles
  gobierna sólo el nacimiento (`RQ-TC-24`): la reversión **MUST NOT** subir a `Medium` un ticket cuya base era `Low` ni
  bajar un `Urgent`. Un ticket que nace bajo Top 5 desde este cambio tiene base `Medium`.
- Un ticket **sin base** (sin ninguna fila de esos orígenes) **MUST NOT** tocarse (supuesto S-10: los nacidos bajo
  Top 5 antes de este cambio).
- Cada ticket cuya prioridad cambia **SHALL** quedar con una fila de traza de origen reversión (`de` la actual, `a` la
  calculada, que puede ser vacía si la base lo era), `tickets.priority` actualizada y la marca `prioridad_en_app_at`
  **conservada** (supuesto S-2).
- Si la calculada es igual a la actual, ni escritura ni traza.
- Una prioridad que una transición haya escrito después de la propagación (`repo.ts:300`) **no** es ajuste manual
  (supuesto S-4): no exime, y la reversión la sustituye por la calculada.
- Desmarcar a un cliente que nunca fue Top 5 **SHALL** responder `200` sin cambiar ningún ticket.
- Un cliente que se vuelve a marcar tras desmarcarlo **SHALL** tomar como base la prioridad que tenían sus tickets
  tras la reversión.
- **Regla invariable 13.** Todo lo anterior lo decide y lo impone el servidor con la fórmula de `shared`; el cliente
  no calcula ni la base ni la prioridad calculada.

#### Scenario: desmarcar devuelve a la prioridad anterior, con traza
- GIVEN un cliente sin contrato con dos tickets abiertos `Low` propagados a `High`
- WHEN se desmarca
- THEN los dos vuelven a `Low`, cada uno con una fila de traza `High` → `Low` de origen reversión

#### Scenario: la reversión no sube a `Medium` un ticket cuya base era `Low` (S-I)
- GIVEN un cliente sin contrato con un ticket `Urgent` propagado a `High` y otro `Low` propagado a `High`
- WHEN se desmarca
- THEN el primero vuelve a `Urgent` y el segundo a `Low`, no a `Medium`

#### Scenario: con contrato vigente, la calculada es `High`
- GIVEN un cliente con contrato vigente, un ticket `Low` propagado por un Top 5 `Medium`, ahora `High`
- WHEN se desmarca
- THEN el ticket queda `High`, sin escritura ni traza si ya lo estaba

#### Scenario: un ticket nacido bajo Top 5 vuelve a su base `Medium`
- GIVEN un ticket nacido `High` por el Top 5 de su cliente, con su traza de alta de `Medium` a `High` (`RQ-TC-38`)
- WHEN se desmarca al cliente
- THEN el ticket vuelve a `Medium`, con traza

#### Scenario: un ticket que no tenía prioridad vuelve a no tenerla
- GIVEN un ticket abierto sin prioridad al que el Top 5 asignó `High`
- WHEN se desmarca
- THEN su prioridad queda vacía y la fila de traza tiene `a` vacío

#### Scenario: varias propagaciones, una sola reversión
- GIVEN un ticket `Low` propagado a `High` y luego a `Medium`
- WHEN se desmarca
- THEN vuelve a `Low`, la base de la primera propagación

#### Scenario: ciclo marcar, desmarcar, marcar
- GIVEN un ticket `Low` marcado `High`, desmarcado y marcado de nuevo `Medium`
- WHEN se desmarca por segunda vez
- THEN la base es `Low` (el `de` de la primera fila posterior a la reversión)

#### Scenario: un ticket sin base no se toca (S-10)
- GIVEN un ticket abierto `High` sin ninguna fila de traza del Top 5
- WHEN se desmarca al cliente
- THEN conserva `High`, sin escritura ni traza

#### Scenario: una prioridad escrita por una transición no exime (S-4)
- GIVEN un ticket propagado a `High` al que una transición cambió luego la prioridad a `Medium`, sin fila manual
- WHEN se desmarca
- THEN el ticket vuelve a la calculada de su base

#### Scenario: tras revertir se conserva la marca (S-2)
- GIVEN un ticket revertido
- WHEN se consulta `prioridad_en_app_at`
- THEN sigue puesta

#### Scenario: desmarcar a quien nunca fue Top 5
- GIVEN un cliente sin fila en `cliente_prioridad` y un ticket abierto
- WHEN un usuario con permiso envía `top5: false`
- THEN responde `200` y el ticket no cambia

### RQ-TC-37 · Un ajuste manual con motivo exime al ticket de la propagación y de la reversión

Gerencia, punto 3: «En ningún caso se tocan los tickets con un ajuste manual con motivo, que mantienen el suyo.»

Un ticket está **exento** cuando tiene **al menos una fila manual** en `public.prioridad_ajustes`, es decir, de origen
vacío (`RQ-TC-38`), **antes o después** de cualquier propagación. Un ticket exento **MUST NOT** cambiar de prioridad,
ganar traza ni ver escrita su marca `prioridad_en_app_at` por la propagación al marcar al cliente, al cambiar su prioridad ni al
desmarcarlo: la marca que tenga es la de su propio ajuste (`RQ-TC-29`). Las filas que existen hoy son todas manuales y **SHALL** contar. La exención **SHALL** evaluarse dentro
de la transacción de la propagación. El ajuste manual puede venir ahora del Director Comercial o del Director Técnico
(`RQ-TC-29`), y la exención es la misma.

- **Regla invariable 13.** La exención la impone el servidor; el cliente no la conoce ni la espeja.

#### Scenario: ajuste manual antes de marcar
- GIVEN un ticket `High` ajustado a mano a `Medium` con motivo, y otro ticket `Medium` del mismo cliente sin ajuste
- WHEN se marca Top 5 `High`
- THEN el ajustado conserva `Medium`, sin traza nueva; el otro pasa a `High`

#### Scenario: ajuste manual después de propagar
- GIVEN un ticket propagado a `High` y luego ajustado a mano a `Medium` con motivo
- WHEN se desmarca al cliente
- THEN conserva `Medium`

#### Scenario: cambiar la prioridad del Top 5 tampoco toca al exento
- GIVEN un ticket con ajuste manual y un cliente Top 5 `High`
- WHEN se cambia su prioridad a `Medium`
- THEN el ticket conserva su prioridad

#### Scenario: el ajuste del Director Técnico también exime
- GIVEN un ticket ajustado a mano por un Director Técnico, de un cliente que luego se marca Top 5 `High`
- WHEN se propaga
- THEN el ticket conserva la prioridad que se le ajustó

#### Scenario: las filas anteriores al despliegue cuentan como manuales
- GIVEN una fila de `prioridad_ajustes` creada antes de añadir la columna de origen, que quedó con origen vacío
- WHEN se marca al cliente
- THEN su ticket queda exento

#### Scenario: posición de la exención frente al filtro de abiertos
- GIVEN tres tickets del cliente: uno cerrado con ajuste manual, uno abierto con ajuste manual y uno abierto sin ajuste
- WHEN se marca Top 5 `High`
- THEN sólo el abierto sin ajuste cambia

#### Scenario: un ticket con trazas del Top 5 y sin ajuste manual no está exento
- GIVEN un ticket con sólo filas de origen propagación
- WHEN se cambia la prioridad del cliente
- THEN el ticket cambia

#### Scenario: la propagación no escribe la marca del exento
- GIVEN un ticket de Zoho exento
- WHEN se propaga o revierte
- THEN su `prioridad_en_app_at` queda como estaba: vacía si la exención viene de una traza anterior a la marca, o con el instante de su ajuste

### RQ-TC-38 · La traza gana origen; un ticket nacido bajo Top 5 deja traza; el esquema

`public.prioridad_ajustes` **SHALL** ganar la columna `origen` (texto, admite NULL; NULL significa **manual**, que es
lo que son todas las filas de hoy) y su columna `a` **SHALL** admitir NULL, para poder revertir a «sin prioridad». La
lista de orígenes **SHALL** vivir en `packages/shared` y **SHALL** distinguir tres valores distintos de NULL:
propagación, reversión y alta bajo Top 5. Un `origen` fuera de la lista **SHALL** tratarse como manual, esto es,
protegiendo al ticket (supuesto SP-4 de la especificación, reversible).

- **Alta bajo Top 5.** Cuando un ticket nace con un cliente Top 5 y la prioridad con la que nace difiere de la
  **base de nacimiento**, que es `Medium` porque la prioridad pedida en el cuerpo ya no interviene (`RQ-TC-24`), el
  alta **SHALL** dejar, en la misma transacción que el ticket, una fila de origen alta con `de` = `Medium` (la que
  nacería sin contrato ni Top 5), `a` = la que nació, y el autor del alta (supuesto SP-2: si nace `Medium`, no hay
  fila). Un fallo posterior del alta **MUST NOT** dejar la fila. La base es la de nacimiento sin contrato ni Top 5, y
  no el resultado con contrato, porque volver a «la calculada» recalcula con el contrato vigente el día de la
  reversión; si la base llevara dentro el contrato del día del alta, un contrato vencido entre medias dejaría el
  ticket más alto de lo que le corresponde (supuesto D-1 de `propagar-top5-lista-remision-creada`, vigente, y S-I de
  la propuesta de `prioridad-tres-niveles`). Las filas de alta ya escritas con otra `de` no se reescriben
  (`RQ-TC-56`).
- La lectura de la traza de un ticket (`GET /api/tickets/:id/prioridad`) **SHALL** devolver todas sus filas con su
  `origen` (supuesto SP-1 de la especificación).
- Esquema: `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` y
  `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;`, **calificadas**, al **final** de
  `packages/zoho-sync/src/db/schema.sql`, sin relleno y sin mover ninguna línea anterior. Hipótesis: `pg-mem` admite
  `DROP NOT NULL`; la comprueba el diseño.
- **Regla invariable 13.** El origen y la traza los escribe el servidor.
(Previously: la fila de alta se dejaba cuando el ticket nacía con una prioridad distinta de la PEDIDA en el cuerpo, con
`de` = la pedida.)

#### Scenario: la columna nueva y las filas anteriores
- GIVEN `schema.sql` aplicado sobre una base con filas previas en `prioridad_ajustes`
- WHEN se leen
- THEN las anteriores tienen origen vacío y se puede insertar una fila con `a` vacío

#### Scenario: las sentencias están calificadas y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `ALTER TABLE`
- THEN las dos de `prioridad_ajustes` van calificadas con `public.`, detrás de todas las anteriores

#### Scenario: una sentencia sin calificar se rechaza (regla de mutación 2)
- GIVEN `schema.sql` ensuciado con `ALTER TABLE prioridad_ajustes ADD COLUMN origen text` sin esquema
- WHEN corre el guardián de `migrate.test.ts`
- THEN se pone rojo

#### Scenario: un ticket que nace bajo Top 5 deja traza
- GIVEN un cliente Top 5 `High` sin contrato y un alta con cuerpo `Low`
- WHEN se crea el ticket
- THEN nace `High` y hay una fila de origen alta con `de` `Medium` y `a` `High`

#### Scenario: si nace `Medium`, no hay fila
- GIVEN un cliente Top 5 `Medium` sin contrato
- WHEN se crea un ticket con cuerpo `High`
- THEN nace `Medium` y no se inserta ninguna fila

#### Scenario: la base es `Medium` aunque el salto lo cause el contrato
- GIVEN un cliente con contrato vigente y Top 5 `Medium`
- WHEN se crea un ticket con cuerpo `Low`
- THEN nace `High` y hay una fila de origen alta con `de` `Medium` y `a` `High`

#### Scenario: sin Top 5, el alta no deja traza
- GIVEN un cliente que no es Top 5
- WHEN se crea un ticket
- THEN `prioridad_ajustes` no gana ninguna fila

#### Scenario: un fallo posterior no deja la fila de alta
- GIVEN un alta bajo Top 5 cuya guarda posterior falla
- WHEN se ejecuta
- THEN no queda ticket ni traza

#### Scenario: la lectura muestra el origen
- GIVEN un ticket con una fila manual y una de propagación
- WHEN se consulta su prioridad
- THEN ve ambas con su origen

#### Scenario: un origen desconocido protege al ticket
- GIVEN una fila con un origen que no está en la lista
- WHEN se marca al cliente
- THEN el ticket queda exento

### RQ-TC-39 · Lo que la propagación y la reversión NO hacen

La propagación y la reversión **MUST NOT**: cambiar el estado ni escribir en `ticket_transitions` ni reiniciar el
reloj de SLA; cambiar `managed_by_app`; tocar tickets cerrados, de otros clientes o sin `client_id`; escribir hacia
Zoho; avisar de discrepancias de prioridad con Zoho; propagar solas los Top 5 marcados antes del despliegue (se
propaga al volver a guardarlos); calificar a clientes sin contrato ni Top 5 ni cambiar quién ajusta a mano fuera de
los Top 5 (pregunta 3.b de Gerencia, abierta, que mantiene `cierra: no`); ni migrar `ajustarPrioridad` a la marca
nueva.

#### Scenario: no tocan estado, transiciones ni reloj
- GIVEN un ticket abierto con una entrada al estado actual
- WHEN se propaga y se revierte
- THEN su estado, `ticket_transitions` y el instante que lee el SLA no cambian, pero su prioridad sí

#### Scenario: `managed_by_app` no cambia
- GIVEN un ticket con `managed_by_app = false`
- WHEN se propaga
- THEN sigue `false`

#### Scenario: un Top 5 marcado antes del despliegue no propaga solo
- GIVEN un cliente Top 5 con tickets `Low` y ningún `PUT` posterior
- WHEN corre la aplicación
- THEN los tickets siguen `Low`
- AND al volver a guardar el Top 5 se propaga

### RQ-TC-40 · Tabla de equivalencias Zoho → aplicación: identidad para los 23 estados, dos reglas propias y todo lo demás «sin equivalencia»

El núcleo puro de la migración de tickets abiertos (fichero nuevo en `packages/shared`, sin acceso a base de datos,
sin reloj y sin red) **SHALL** exponer una función que, dado el estado de Zoho de un ticket y su clasificación, devuelve
su estado equivalente en la aplicación o el resultado «sin equivalencia». El resultado lleva el estado `destino`, la
`regla` aplicada —una de `identidad`, `entregado-a-finalizado`, `pendiente-servicio-a-en-proceso` y
`pendiente-soporte-se-conserva`— y `statusTypeDestino` (`null` = no se cambia el `status_type`). «Pendiente» y
«Entregado» se deciden **antes** que la identidad. Las reglas son exactamente estas, y ninguna otra:

1. **Identidad.** Un estado que es uno de los 23 de `ESTADOS` (`packages/shared/src/estados.ts:112`, clasificados en
   `packages/shared/src/estados.ts:59-106`) **SHALL** devolverse tal cual, con `statusTypeDestino` nulo, **salvo
   «Pendiente»**, que está en `ESTADOS` y se decide por las reglas 3 y 4. La tabla **MUST** consumir `ESTADOS`
   y **MUST NOT** duplicar la lista de nombres (regla invariable 13, punto 1).
2. **`Entregado` → `Finalizado`.** `Entregado` no es uno de los 23. Su equivalente **SHALL** ser `Finalizado`
   (`docs/sdd/ENTRADA.md:1349`, `docs/sdd/ENTRADA.md:1385`), y la regla **SHALL** declarar que el `status_type`
   destino es `Closed` y que `closed_time` no se toca (supuesto S-2, reversible: una línea del plan por ticket).
3. **`Pendiente` de servicio técnico → `En Proceso`.** Un ticket en `Pendiente` cuya clasificación **no** es
   «Soporte remoto» **SHALL** pasar a `En Proceso` con `statusTypeDestino = 'Open'` (D-10; supuesto S-3, el mismo que ya escribió
   `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/proposal.md:116-121`). Una clasificación
   `null`, vacía o ausente cuenta como servicio, no como soporte remoto.
4. **`Pendiente` de soporte remoto se conserva.** Un ticket en `Pendiente` cuya clasificación **es** «Soporte remoto»
   **SHALL** devolver `Pendiente`, con la regla `pendiente-soporte-se-conserva` y `statusTypeDestino` nulo.
5. **Todo lo demás es «sin equivalencia».** Un estado que no es uno de los 23, que no es `Entregado` y que no es
   `Pendiente` **SHALL** devolver «sin equivalencia», con el estado de origen nombrado. La tabla **MUST NOT**
   adivinar un destino.

La comparación del estado **SHALL** ser por igualdad exacta con el registro: Zoho copia el estado verbatim
(`packages/zoho-sync/src/db/mappers.ts:47`) y la normalización de mayúsculas o espacios sería una segunda
implementación de la misma noción. Un `entregado` en minúsculas o con un espacio final es «sin equivalencia».

**Nota — divergencia con el script de F1C-09, declarada y no resuelta en silencio.** Soporte remoto se reconoce con
`esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:116-119`), que es igualdad normalizada, y **MUST NOT**
reescribirse como el `LIKE '%soporte%remoto%'` del script
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:17-19`), más tolerante. Una clasificación como
«Soporte remoto urgente» cae por tanto como servicio aquí y como soporte remoto allí. Por eso el informe de la
herramienta (RQ-ZS-17) lista los `Pendiente` por ticket, con su clasificación y su destino, para que una persona vea
si alguno cae mal. Confirmado por el orquestador: se usa el predicado compartido.

#### Scenario: Los 23 estados de la aplicación son identidad
- GIVEN cada uno de los 23 nombres de `ESTADOS`, con cualquier clasificación que no afecte a `Pendiente`
- WHEN se pide su equivalente
- THEN el resultado es ese mismo estado

#### Scenario: La tabla no duplica el registro
- GIVEN un nombre de estado añadido a `CLASIFICACION_EN_ESPERA` (`packages/shared/src/estados.ts:59`)
- WHEN se pide el equivalente de ese nombre sin tocar el fichero nuevo
- THEN el resultado es identidad

#### Scenario: `Entregado` va a `Finalizado` y cierra el ticket
- GIVEN un ticket de Zoho en `Entregado`
- WHEN se pide su equivalente
- THEN el estado destino es `Finalizado`
- AND `statusTypeDestino` es `'Closed'` y la regla es `entregado-a-finalizado`
- AND `closed_time` no se toca (lo respeta el ejecutor, RQ-ZS-17)

#### Scenario: `Pendiente` de servicio va a `En Proceso`
- GIVEN un ticket en `Pendiente` con clasificación «Reparación»
- WHEN se pide su equivalente
- THEN el estado destino es `En Proceso` y `statusTypeDestino` es `'Open'`

#### Scenario: `Pendiente` sin clasificación cuenta como servicio
- GIVEN un ticket en `Pendiente` con clasificación `null`, y otro con clasificación vacía
- WHEN se pide su equivalente
- THEN los dos van a `En Proceso`

#### Scenario: `Pendiente` de soporte remoto se conserva
- GIVEN un ticket en `Pendiente` con clasificación «Soporte remoto»
- WHEN se pide su equivalente
- THEN el estado destino es `Pendiente`

#### Scenario: La mayúscula variable de Zoho no cambia el reconocimiento de soporte remoto
- GIVEN un ticket en `Pendiente` con clasificación «soporte REMOTO»
- WHEN se pide su equivalente
- THEN el estado destino es `Pendiente`, porque `esClasificacionSoporteRemoto` normaliza

#### Scenario: Una clasificación tolerada por el `LIKE` pero no por el predicado cae como servicio
- GIVEN un ticket en `Pendiente` con clasificación «Soporte remoto urgente»
- WHEN se pide su equivalente
- THEN el estado destino es `En Proceso`
- AND no se reescribe ningún `LIKE` en el núcleo

#### Scenario: Un estado desconocido es «sin equivalencia» y se nombra
- GIVEN un ticket cuyo estado de Zoho es «En revisión externa», que no está en `ESTADOS`
- WHEN se pide su equivalente
- THEN el resultado es «sin equivalencia» con el estado de origen «En revisión externa»

#### Scenario: Una variante de mayúsculas de `Entregado` es «sin equivalencia»
- GIVEN un ticket con estado `entregado`, y otro con `Entregado ` (espacio final)
- WHEN se pide su equivalente
- THEN los dos son «sin equivalencia»

#### Scenario: El núcleo es puro
- GIVEN el fichero nuevo del núcleo en `packages/shared`
- WHEN se inspeccionan sus importaciones
- THEN no importa acceso a base de datos, red, sistema de ficheros ni reloj

### RQ-TC-41 · Plan por ticket: qué es «abierto», la fecha de corte como parámetro y lo que sólo se lista

El mismo núcleo **SHALL** exponer `planDeTicket(t, corte)`, que dado un ticket (con `status`, `status_type`,
`classification`, `managed_by_app`, `created_time` y `number`) y una **fecha de corte** devuelve su acción
(`migrar`, `ya-gobernado`, `tras-el-corte` o `sin-equivalencia`) y su equivalencia; `resumenDeMigracion(planes)`, que
agrega los planes en el informe; y `esperaRemisionDeEntrada(estado)`. La vigencia de la remisión **no** entra en el
núcleo: la decide el ejecutor con `vigenciaDeRemisiones` y `motivoSinRemisionVigente`, y el núcleo sólo dice qué
estados destino la esperan. Ninguna función **MUST** escribir nada. **Precedencia fija (D-8):** ya-gobernado →
tras-el-corte → sin-equivalencia → migrar.

- **«Abierto».** Un ticket es abierto cuando su `status_type` es distinto de `Closed`; `On Hold` cuenta como abierto
  (supuesto S-4, como la aplicación: `apps/desk/src/lib/boardView.ts:47-48`). Un ticket con `status_type` `Closed`
  **MUST NOT** aparecer en el plan de cambios.
- **La fecha de corte es un parámetro obligatorio.** Rechazar un `corte` ausente o sin forma de fecha es de la ruta
  (`400`, D-11). El núcleo recibe un `Date` y, como **supuesto reversible no escrito en el diseño**, lanza
  `RangeError` si es inválido (sin él, una fecha inválida volvería todo «migrar»). **MUST NOT** llevar ninguna fecha
  fija en el código (el plan A puede moverla al 01/02/2027: `openspec/config.yaml:3613`).
- **Nacidos tras el corte.** Un ticket abierto cuyo `created_time` es posterior a la fecha de corte **SHALL** quedar
  fuera de los cambios y **SHALL** listarse aparte (supuesto S-5). Un `created_time` `null` **SHALL** tratarse como
  anterior al corte. La fecha de corte es un instante; la zona horaria la fija quien llama (hipótesis, sin medir).
- **Ya gobernados por la aplicación.** Un ticket abierto con `managed_by_app = true` **SHALL** quedar fuera de los
  cambios y **SHALL** listarse aparte: es la frontera de escritura
  (`packages/zoho-sync/src/db/repo.ts:71`) y la razón de la idempotencia.
- **Qué se cambia.** Un ticket abierto, no nacido tras el corte, con `managed_by_app = false` y con equivalencia
  (RQ-TC-40) **SHALL** entrar en el plan con: estado de origen y de destino, `status_type` previo y destino, y
  `managed_by_app` previo. El destino de `managed_by_app` es siempre `true`. El `status_type` destino es el de la
  equivalencia: `null` (no se toca) en la identidad, `'Closed'` para «Entregado» y `'Open'` para «Pendiente» de
  servicio (D-10).
- **Sin equivalencia.** Un ticket abierto con estado sin equivalencia que se migraría (no gobernado y no nacido tras
  el corte) **SHALL** listarse aparte con su número y su estado de origen, agrupado por estado, y su sola presencia
  **SHALL** marcar el plan como «bloqueado» (D-8; ya está en el escenario «no bloquea»).
- **Sin remisión de entrada vigente.** Un ticket a migrar cuyo destino cumple `esperaRemisionDeEntrada` (`OV asignada`
  o `Ticket creado`) sin remisión de entrada vigente **SHALL** contarse y listarse, con el número del ticket. No se le
  crea remisión (supuesto S-6): quedará bloqueado en «Habilitar Servicio»
  (`apps/desk/server/services/ticketService.ts:273-277`). La vigencia **SHALL** decidirla el ejecutor con el mismo
  predicado compartido que usa esa guarda, no una reimplementación.
- **El número más alto.** El plan **SHALL** dar el número (`number`) más alto entre los tickets que se marcarían,
  o `null` si no hay ninguno. Es el dato para la hipótesis de que un número de Zoho muy alto arrastre la numeración
  propia, que lee el máximo de las filas gobernadas
  (`packages/zoho-sync/src/db/repo.ts:245`, `packages/zoho-sync/src/db/migrate.ts:47`).
- **Ya gobernados.** `resumenDeMigracion` **SHALL** darlos como dos recuentos, `nacidosEnLaApp` (id con
  `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`) y `deZoho`, no como lista de números.
- **Totales por estado.** El resumen **SHALL** contar por pareja (estado de origen, estado de destino), con
  `cambiaEstado`, y **SHALL** listar los `pendientes` por ticket (número, clasificación y destino).

La regla **MUST NOT** añadir ninguna decisión al cliente (`apps/desk/src`): todo lo anterior vive en `packages/shared`
y lo impone el servidor (regla invariable 13).

#### Scenario: Un ticket cerrado no entra en el plan
- GIVEN un ticket con `status_type = 'Closed'` y estado `Finalizado`
- WHEN se calcula el plan
- THEN no figura entre los cambios ni entre las listas de sin equivalencia o sin remisión

#### Scenario: `On Hold` cuenta como abierto
- GIVEN un ticket con `status_type = 'On Hold'`, estado `En Espera de Repuestos` y `managed_by_app = false`
- WHEN se calcula el plan
- THEN figura entre los cambios con destino `En Espera de Repuestos` y `managed_by_app` destino `true`

#### Scenario: Un corte inválido lanza `RangeError`
- GIVEN una llamada a `planDeTicket` con un `Date` inválido (el rechazo de un `corte` ausente o sin forma de fecha es de la ruta, `400`)
- WHEN se calcula el plan
- THEN se lanza `RangeError` y no se devuelve plan

#### Scenario: La precedencia es ya-gobernado, tras-el-corte, sin-equivalencia, migrar
- GIVEN un ticket gobernado y sin equivalencia, y otro nacido tras el corte y sin equivalencia
- WHEN se calcula el plan
- THEN el primero es `ya-gobernado` y el segundo `tras-el-corte`

#### Scenario: La fecha de corte manda, no una constante
- GIVEN un ticket abierto con `created_time` 2027-01-20 y dos llamadas, una con corte 2027-01-15 y otra con 2027-02-01
- WHEN se calcula el plan en cada una
- THEN con el primer corte el ticket se lista como nacido tras el corte y no se cambia
- AND con el segundo entra en los cambios

#### Scenario: Un nacido tras el corte sólo se lista
- GIVEN un ticket abierto, con equivalencia, `managed_by_app = false` y `created_time` posterior al corte
- WHEN se calcula el plan
- THEN figura en la lista de nacidos tras el corte y no entre los cambios

#### Scenario: `created_time` nulo se trata como anterior al corte
- GIVEN un ticket abierto con `created_time = null`
- WHEN se calcula el plan
- THEN entra en los cambios y no en la lista de nacidos tras el corte

#### Scenario: Un ticket ya gobernado por la aplicación sólo se lista
- GIVEN un ticket abierto con `managed_by_app = true`
- WHEN se calcula el plan
- THEN figura en la lista de ya gobernados y no entre los cambios

#### Scenario: Un estado sin equivalencia bloquea el plan
- GIVEN un ticket abierto con un estado sin equivalencia, entre otros tickets con equivalencia
- WHEN se calcula el plan
- THEN el plan está bloqueado
- AND el ticket figura agrupado por su estado de origen, con recuento y número, en `sinEquivalencia`

#### Scenario: Un sin equivalencia ya gobernado o nacido tras el corte no bloquea
- GIVEN un ticket abierto con estado sin equivalencia pero `managed_by_app = true`, y otro con estado sin equivalencia nacido tras el corte
- WHEN se calcula el plan
- THEN el plan no está bloqueado, porque ninguno de los dos se cambiaría
- AND ambos figuran en su lista de «sólo listados»

#### Scenario: Sólo `OV asignada` y `Ticket creado` esperan remisión de entrada
- GIVEN los estados `OV asignada`, `Ticket creado` y `En Proceso`
- WHEN se llama a `esperaRemisionDeEntrada`
- THEN es verdadero para los dos primeros y falso para `En Proceso`
- AND la vigencia de cada ticket la decide el ejecutor, no el núcleo

#### Scenario: El número más alto a marcar excluye lo que no se marca
- GIVEN tickets a marcar con números 4100 y 4300, un ticket ya gobernado con 9000 y otro nacido tras el corte con 9500
- WHEN se calcula el plan
- THEN el número más alto a marcar es 4300

#### Scenario: Sin nada que marcar, el número más alto es nulo
- GIVEN una lista en la que ningún ticket entra en los cambios
- WHEN se calcula el plan
- THEN el número más alto a marcar es `null`

#### Scenario: Totales, pendientes y ya gobernados
- GIVEN tres tickets `Pendiente` (dos «Reparación», uno «Soporte remoto»), uno `Entregado`, un gobernado de la app (id `app-…`) y otro de Zoho
- WHEN se resume el plan
- THEN los totales dicen: `Pendiente → En Proceso` 2, `Pendiente → Pendiente` 1, `Entregado → Finalizado` 1, cada pareja con su `cambiaEstado`
- AND `pendientes` lista los tres por ticket con número, clasificación y destino
- AND `yaGobernados` dice `nacidosEnLaApp` 1 y `deZoho` 1

#### Scenario: Calcular el plan no escribe
- GIVEN una lista de tickets
- WHEN se calcula el plan
- THEN la lista de entrada no se muta

### RQ-TC-42 · El alta exige el cargo cuando la orden es OVI (escalón B)

El alta SHALL juzgar con RQ-PM-24 y RQ-PM-25 las órdenes que traiga: el número final (`ordenVenta` tecleada, que gana al
de Books) **y** el número de la orden resuelta desde `salesOrderId`. En el alta el ticket nace: toda orden entra. Sin
cargo y sin ser administrador, responde `403`. La guarda cae **después** de «Orden de venta no encontrada» (A) y
**antes** de la discrepancia equipo↔cliente y de los obligatorios (C): ante dos defectos se ve el del escalón anterior.
Si el servicio no recibe al sujeto, se trata como «sin cargo» (SUPUESTO S-10).

#### Scenario: OVI sin cargo — ROJO
- GIVEN un usuario sin cargo ni admin y un cuerpo válido con `salesOrderId` de una orden `OVI-2026-001`
- WHEN crea el ticket
- THEN responde `403` y no se escribe el ticket

#### Scenario: OVI tecleada sin id, y número tecleado distinto del de la orden resuelta — ROJO
- GIVEN un usuario sin cargo y un cuerpo con `ordenVenta: 'OVI-2026-001'` y sin `salesOrderId`; y otro con `salesOrderId` de una orden `OV-` y `ordenVenta: 'ovi-2026-001'`
- WHEN crea el ticket
- THEN en los dos casos responde `403`

#### Scenario: con cargo, y administrador sin cargo
- GIVEN un Director Técnico sin el área Servicio Técnico; y un administrador sin cargo
- WHEN cada uno crea un ticket con una OVI
- THEN el alta no se detiene por el cargo

#### Scenario: sujeto ausente falla cerrado (S-10) — ROJO
- GIVEN una llamada al servicio de alta sin sujeto y con una OVI
- WHEN se ejecuta
- THEN responde `403`

#### Scenario: posición, A «Equipo no registrado» < cargo — CARACTERIZACIÓN
- GIVEN un cuerpo con equipo inexistente y una OVI, de un usuario sin cargo
- WHEN crea el ticket
- THEN responde el `422` «Equipo no registrado», no el `403`

#### Scenario: posición, A «Orden de venta no encontrada» < cargo — CARACTERIZACIÓN
- GIVEN `ordenVenta: 'OVI-2026-001'` tecleada, un `salesOrderId` inexistente y un usuario sin cargo
- WHEN crea el ticket
- THEN responde el `422` «Orden de venta no encontrada», no el `403`

#### Scenario: posición, cargo < C equipo↔cliente — ROJO
- GIVEN una OVI, un usuario sin cargo y un `clientId` que no es el del equipo
- WHEN crea el ticket
- THEN responde el `403` de cargo, no el `422` de la discrepancia

#### Scenario: posición, cargo < C obligatorios — ROJO
- GIVEN una OVI, un usuario sin cargo y faltan campos obligatorios
- WHEN crea el ticket
- THEN responde el `403`, no el `422` de «Faltan campos obligatorios»

### RQ-TC-43 · Un ticket de «Garantía» sólo admite una orden `OVI-` en el alta (escalón C)

Si `tipo_servicio` es exactamente «Garantía» (literal de `TIPOS_SERVICIO`, `packages/shared/src/ticketCreate.ts:4`;
SUPUESTO S-7), el alta SHALL responder `422` cuando entre una orden que no es OVI, con el texto «El ticket es de tipo de
servicio Garantía y sólo admite una orden OVI-: la orden {n} no lo es». Es escalón **C** (combina dos datos del
contenido, como RQ-TC-05): va **después** de la cuarentena y del contrato vencido (SUPUESTO S-9) y **antes** de las
guardas de unicidad (**D**, NIT y orden ya asociada). La guarda actúa cuando la orden ENTRA: un ticket de Garantía sin
ninguna orden **nace** (SUPUESTO S-2) y no se revisan tickets ya asociados (SUPUESTO S-1). Una OVI en un ticket que **no**
es de Garantía **se admite** con el cargo: «una OVI sólo va en garantía» está pendiente del Director Técnico y no se
impone.

**Pares no observables, dichos para que nadie los dé por probados:** cargo frente a garantía. La primera guarda salta con
una OVI y la segunda con una orden que no lo es, y el alta trae una sola orden; ninguna prueba puede activar las dos.

#### Scenario: Garantía con una orden `OV-` — ROJO
- GIVEN un ticket con `tipo_servicio` «Garantía» y la orden `OV-2026-001`
- WHEN se crea
- THEN responde `422` con el texto de garantía y no se escribe

#### Scenario: Garantía con OVI y cargo — ROJO
- GIVEN un Director Técnico y un ticket de «Garantía» con `OVI-2026-001`
- WHEN se crea
- THEN se crea con la orden

#### Scenario: Garantía sin orden nace (S-2) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» sin ninguna orden
- WHEN se crea
- THEN se crea

#### Scenario: OVI en un ticket que no es de Garantía, con el cargo, se admite — CARACTERIZACIÓN
- GIVEN un Director Técnico y un ticket con otro `tipo_servicio` y `OVI-2026-001`
- WHEN se crea
- THEN se crea con la orden

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» con una `OV-` ya asociada a otro ticket
- WHEN se crea
- THEN responde el `422` de garantía, no el `409` de «ya está asociada»

### RQ-TC-44 · Responder «¿Se reclama al fabricante?» sobre una asociación OVI vigente

Cada asociación de `public.ov_asociaciones` (`tickets-core` RQ-TC-19) cuya orden es OVI **SHALL** poder recibir **una**
respuesta a «¿Se reclama al fabricante?», como acto propio sobre `ov_asociaciones.id` y no como campo de las cuatro
puertas de entrada de una orden (SUPUESTO S-1, reversible). La respuesta es «sí» o «no». Un «sí» **SHALL** abrir una
ficha en estado «abierta» (RQ-TC-45) con el fabricante dado; un «no» **SHALL** guardar uno de los tres motivos de la
lista cerrada de RQ-TC-45 y no abre ficha. Se guardan quién respondió y cuándo (la sesión y el reloj del servidor,
SUPUESTO S-2), el `ticket_id` de la asociación y el número de la OVI, copiado y congelado (SUPUESTO S-8). Una segunda
respuesta **MUST NOT** cambiar la primera (SUPUESTO S-10): da `409`. Mientras una asociación OVI vigente no tiene
respuesta, está «pendiente de respuesta» (RQ-TC-48).

La ruta **SHALL** juzgar en este orden, donde cada línea gana a las siguientes:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G1 | La asociación no existe | `404` | A |
| G2 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G3 | La asociación está liberada | `409` | B |
| G4 | La orden de la asociación no es OVI (`esOVI` de `shared`, la misma noción de RQ-PM-24; no se escribe por segunda vez) | `422` | C |
| G5 | Respuesta ausente, motivo fuera de la lista cerrada, o fabricante vacío tras recortar en un «sí» | `422` | C |
| G6 | La asociación ya tiene respuesta | `409` | D |

G4 es C y no A porque la asociación existe y quien actúa tiene permiso: lo que no vale es la clase de su número, la misma
razón por la que la cuarentena es C. G6 es D porque pregunta por otra fila; la respalda un índice único por
`asociacion_id` (SUPUESTO S-3, una ficha por asociación) y la carrera entre dos respuestas simultáneas **SHALL**
traducirse del error de unicidad (`23505`) a `409`, y no a `500`. Como en la liberación
(`apps/desk/server/routes/ovAsociaciones.ts:44-48`), el `404` va delante y el permiso antes del estado.

**Pares no observables, dichos para que nadie los dé por probados:** G1 frente a G3–G6 (sin fila no hay nada más que
juzgar). G3 frente a G6 comparten código `409`: liberada y ya respondida da el `409` de «liberada» y se distingue sólo por
el texto, así que se prueba por el texto. G4 frente a G6: una orden que no es OVI nunca llega a tener respuesta.

#### Scenario: «sí» sobre una OVI vigente abre la ficha — ROJO
- GIVEN un Director Técnico y una asociación vigente de `OVI-2026-001` sin respuesta
- WHEN responde «sí» con fabricante «Acme»
- THEN responde éxito, la ficha queda en «abierta» con la OVI, el `ticket_id` y quién y cuándo respondió

#### Scenario: «no» guarda uno de los tres motivos — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «no» con uno de los tres motivos de la lista cerrada
- THEN se guarda la respuesta con el motivo, no se abre ficha y la OVI deja de estar «pendiente de respuesta»

#### Scenario: «no» sin motivo, o con un motivo fuera de la lista — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «no» sin motivo, o con un texto que no es de la lista
- THEN responde `422` (G5) y no se escribe nada

#### Scenario: «sí» sin fabricante, o con fabricante de sólo espacios — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «sí» con fabricante vacío o `   `
- THEN responde `422` (G5) y no se abre ficha

#### Scenario: segunda respuesta rechazada (S-10) — ROJO
- GIVEN una asociación ya respondida «no»
- WHEN el Director Técnico responde «sí»
- THEN responde `409` (G6), y la respuesta guardada sigue siendo la primera

#### Scenario: carrera de dos respuestas — ROJO
- GIVEN dos respuestas simultáneas sobre la misma asociación, y el índice único rechaza la segunda con `23505`
- WHEN se procesan
- THEN una tiene éxito y la otra responde `409`, nunca `500`

#### Scenario: la asociación no es OVI — ROJO
- GIVEN un Director Técnico y una asociación vigente de `OV-2026-001`
- WHEN responde la pregunta
- THEN responde `422` (G4) y no se escribe nada

#### Scenario: la asociación no existe, o el id no es numérico — ROJO
- GIVEN un Director Técnico
- WHEN responde sobre un id inexistente, y sobre `abc`
- THEN en los dos casos responde `404` (G1)

#### Scenario: la asociación está liberada — ROJO
- GIVEN un Director Técnico y una asociación OVI liberada, sin respuesta
- WHEN responde la pregunta
- THEN responde `409` (G3) y no se escribe nada

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo Director Técnico que no es administrador
- WHEN responde la pregunta sobre una asociación OVI vigente
- THEN responde `403` (G2) y no se escribe nada

#### Scenario: posición G1 < G2, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de asociación inexistente
- WHEN responde la pregunta
- THEN responde el `404` de G1, no el `403`

#### Scenario: posición G2 < G3, liberada y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una asociación OVI liberada
- WHEN responde la pregunta
- THEN responde el `403` de G2, no el `409` de G3

#### Scenario: posición G2 < G6, ya respondida y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una asociación OVI ya respondida
- WHEN responde la pregunta
- THEN responde el `403` de G2, no el `409` de G6

#### Scenario: posición G3 < G4, liberada y que no es OVI — CARACTERIZACIÓN
- GIVEN un Director Técnico y una asociación liberada de `OV-2026-001`
- WHEN responde la pregunta
- THEN responde el `409` de «liberada» (G3), no el `422` de «no es OVI»

#### Scenario: posición G3 < G5, liberada y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación OVI liberada y un cuerpo sin respuesta
- WHEN responde la pregunta
- THEN responde el `409` de G3, no el `422` de G5

#### Scenario: posición G4 < G5, no es OVI y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación vigente de `OV-2026-001` y un cuerpo con motivo fuera de la lista
- WHEN responde la pregunta
- THEN responde el `422` de «no es OVI» (G4), no el de contenido (G5)

#### Scenario: posición G5 < G6, ya respondida y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación OVI ya respondida y un cuerpo con motivo fuera de la lista
- WHEN responde la pregunta
- THEN responde el `422` de G5, no el `409` de G6

#### Scenario: liberada y ya respondida, distinguibles por el texto — CARACTERIZACIÓN
- GIVEN una asociación OVI respondida y después liberada
- WHEN el Director Técnico responde otra vez
- THEN responde `409` con el texto de «liberada», no con el de «ya respondida»

### RQ-TC-45 · Datos de la ficha y listas cerradas, en `public.garantia_proveedor`

La respuesta y su ficha **SHALL** vivir en una tabla `public.garantia_proveedor`, con **una fila por asociación
respondida** (SUPUESTO S-3), creada con el esquema **calificado** (`CREATE TABLE … public.garantia_proveedor`) al final de
`packages/zoho-sync/src/db/schema.sql` y listada en `PUBLIC_TABLES` de `packages/zoho-sync/src/db/migrate.ts`, de modo que
el guardián de tablas calificadas de `migrate.test.ts` la cuente (de 28 a 29 y de 41 a 42 en sus dos recuentos). La
tabla **MUST NOT** llevar `CHECK` de **listas**: las listas cerradas las impone el servidor desde `packages/shared`, como
`cargo_permiso`. Lo único que lleva es UN `CHECK` de coherencia sí/no entre columnas (`reclama` verdadero exige estado y
excluye motivo; falso exige motivo y excluye estado), que no es una lista. Respaldo si el motor de pruebas no lo acepta
(hipótesis H-1 del diseño): se quita y la guarda es el servidor. La tabla guarda:

- **Respuesta:** sí o no; motivo del «no»; quién y cuándo respondió (SUPUESTO S-2); `ticket_id` y número de la OVI,
  copiados (SUPUESTO S-8).
- **Ficha, sólo en un «sí»:** fabricante (texto; el panel propone la marca del ticket y es editable, SUPUESTO S-5);
  pieza: referencia y serial, texto libre (S-5); RMA, texto, vacío al abrir (S-5); valor reclamado, captura manual en
  pesos, con su origen constante `manual` (SUPUESTO S-4); estado; resultado y valor recuperado al resolver; fechas de
  apertura, envío y resolución, del reloj del servidor en cada paso (SUPUESTO S-7); y la marca del aviso de 60 días
  (SUPUESTO S-12; `derivacion-avisos` RQ-AV-19).

**Listas cerradas, definidas una sola vez en `packages/shared` y consumidas por el servidor y el cliente** (regla
invariable 13, sin segunda copia): los **tres** motivos del «no»; los **tres** estados (abierta, enviada al fabricante,
resuelta); los **tres** resultados (reposición, nota crédito, rechazada). La decisión de origen habla en una consecuencia
de «cuatro estados» y su respuesta textual enumera tres: se construyen tres. El nombre literal de cada valor lo fija el
diseño; el requisito exige que sean exactamente tres por lista y que el servidor rechace cualquier otro con `422`.

Esta tabla es la que ya anticipa que el valor reclamado automático y las mediciones se construirán después: los datos
que harán falta quedan guardados, y el cálculo no se construye aquí.

#### Scenario: la tabla está calificada y el guardián la cuenta — ROJO
- GIVEN `schema.sql` con la sentencia nueva y `PUBLIC_TABLES` con la tabla
- WHEN corre el guardián de `migrate.test.ts`
- THEN cuenta 29 tablas calificadas y 42 sentencias en sus dos recuentos, y la tabla está en `public`

#### Scenario: una sentencia sin calificar se rechaza (regla de mutación 2) — ROJO
- GIVEN el `.sql` vigilado con `CREATE TABLE garantia_proveedor` sin esquema añadido a propósito
- WHEN corre el guardián
- THEN se pone rojo

#### Scenario: las tres listas tienen exactamente tres valores — ROJO
- GIVEN las listas de `packages/shared`
- WHEN se cuentan los motivos, los estados y los resultados
- THEN cada lista tiene tres valores

#### Scenario: valor reclamado manual con su origen — ROJO
- GIVEN una ficha abierta con valor reclamado 1500000 tecleado
- WHEN se lee
- THEN el valor es 1500000 y su origen es `manual`

#### Scenario: el valor reclamado no es automático — CARACTERIZACIÓN
- GIVEN una OVI asociada con orden de Books que pudiera traer costo
- WHEN se abre la ficha sin teclear valor
- THEN el valor reclamado queda vacío, no se calcula de la orden

#### Scenario: RMA vacío al abrir (S-5) — ROJO
- GIVEN un «sí» con fabricante y sin RMA
- WHEN se abre la ficha
- THEN el RMA queda vacío y la ficha se abre

### RQ-TC-46 · La ficha avanza sólo hacia delante y cada paso exige lo suyo

El estado de la ficha **SHALL** avanzar sólo en el orden abierta → enviada al fabricante → resuelta, sin retrocesos
(SUPUESTO S-6); `siguienteEstado`, de `packages/shared`, es el único que dice cuál es el paso siguiente de un estado. Qué
exige cada paso (SUPUESTO S-6): **enviar** no exige nada más (la fuente no pide RMA); **resolver** exige un resultado de
la lista cerrada y un valor recuperado: en «reposición» y «nota crédito» es obligatorio, numérico y no negativo; en
«rechazada» se acepta ausente o `0` y se guarda `0`, y cualquier otro valor da `422` (SUPUESTO S-6, reversible: exigir el
`0` explícito). Cada paso guarda la fecha del reloj del servidor (SUPUESTO S-7). Una ficha resuelta no avanza más.

La ruta de avanzar **SHALL** juzgar en este orden:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G7 | La ficha no existe (una respuesta «no» no es ficha) | `404` | A |
| G8 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G9 | El paso no aplica desde el estado actual (salto, retroceso o ficha ya resuelta) | `409` | B |
| G10 | Contenido del paso: resultado fuera de la lista; en «reposición» y «nota crédito», valor recuperado ausente, no numérico o negativo; en «rechazada», valor recuperado distinto de `0` (ausente se acepta y se guarda `0`) | `422` | C |

**Pares no observables:** G7 frente a G9–G10, porque sin ficha no hay estado ni contenido que juzgar.

#### Scenario: abierta → enviada sin más datos — ROJO
- GIVEN una ficha «abierta» y un Director Técnico
- WHEN la avanza a «enviada» sin RMA ni otro dato
- THEN pasa a «enviada» y guarda la fecha de envío

#### Scenario: enviada → resuelta con resultado y valor — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «reposición» y valor recuperado 800000
- THEN pasa a «resuelta» y guarda resultado, valor y fecha de resolución

#### Scenario: «rechazada» resuelve con valor recuperado 0 — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «rechazada» y valor recuperado `0`
- THEN pasa a «resuelta»; y con valor recuperado distinto de `0` responde `422` (G10)

#### Scenario: «rechazada» sin valor recuperado se guarda como 0 (S-6) — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «rechazada» sin valor recuperado
- THEN pasa a «resuelta» y el valor recuperado guardado es `0`

#### Scenario: resolver sin resultado o sin valor recuperado — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve sin resultado, con resultado fuera de la lista, o con «reposición» o «nota crédito» sin valor recuperado, no numérico o negativo
- THEN responde `422` (G10) y la ficha sigue «enviada»

#### Scenario: saltar, retroceder o avanzar una ficha resuelta — ROJO
- GIVEN una ficha «abierta», y otra «enviada», y otra «resuelta»
- WHEN se intenta resolver la primera, volver a «abierta» la segunda y avanzar la tercera
- THEN en los tres casos responde `409` (G9) y el estado no cambia

#### Scenario: ficha inexistente, o una respuesta «no» — ROJO
- GIVEN un id de ficha inexistente, y la asociación con respuesta «no»
- WHEN se intenta avanzar cada una
- THEN en los dos casos responde `404` (G7)

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo que no es administrador y una ficha «abierta»
- WHEN la avanza
- THEN responde `403` (G8) y el estado no cambia

#### Scenario: posición G7 < G8, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de ficha inexistente
- WHEN intenta avanzar
- THEN responde el `404` de G7, no el `403`

#### Scenario: posición G8 < G9, sin cargo y paso no permitido — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una ficha «resuelta»
- WHEN intenta avanzarla
- THEN responde el `403` de G8, no el `409` de G9

#### Scenario: posición G9 < G10, paso no permitido y contenido inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una ficha «abierta» y un cuerpo de resolver con resultado fuera de la lista
- WHEN intenta resolverla saltando el envío
- THEN responde el `409` de G9, no el `422` de G10

### RQ-TC-47 · Editar los datos de la ficha, y la ficha resuelta no se edita

Los datos editables de una ficha (fabricante, referencia y serial de la pieza, RMA y valor reclamado) **SHALL** poder
corregirse mientras la ficha no esté resuelta. Una ficha **resuelta** **MUST NOT** editarse (SUPUESTO S-6): responde
`409`. El estado, la respuesta, el origen del valor reclamado y las fechas **MUST NOT** cambiar por esta ruta: sólo avanza
el estado la ruta de RQ-TC-46.

La ruta de editar **SHALL** juzgar en este orden:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G11 | La ficha no existe | `404` | A |
| G12 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G13 | La ficha está resuelta | `409` | B |
| G14 | Contenido: fabricante vacío tras recortar, o valor reclamado no numérico o negativo | `422` | C |

**Pares no observables:** G11 frente a G13–G14, porque sin ficha no hay estado ni contenido que juzgar.

#### Scenario: editar el RMA de una ficha enviada — ROJO
- GIVEN una ficha «enviada» y un Director Técnico
- WHEN edita el RMA y el valor reclamado
- THEN los datos cambian y el estado y las fechas siguen iguales

#### Scenario: fabricante vacío, o valor negativo o no numérico — ROJO
- GIVEN una ficha «abierta»
- WHEN se edita con fabricante `   `, con valor reclamado `-1` o con valor `abc`
- THEN en los tres casos responde `422` (G14) y la ficha no cambia

#### Scenario: ficha resuelta no se edita — ROJO
- GIVEN una ficha «resuelta»
- WHEN el Director Técnico intenta editarla con datos válidos
- THEN responde `409` (G13) y la ficha no cambia

#### Scenario: la ruta de editar no cambia el estado — ROJO
- GIVEN una ficha «abierta»
- WHEN se edita enviando además un campo de estado «resuelta»
- THEN el estado sigue «abierta»

#### Scenario: ficha inexistente — ROJO
- GIVEN un id de ficha inexistente
- WHEN un Director Técnico intenta editar
- THEN responde `404` (G11)

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo que no es administrador y una ficha «abierta»
- WHEN intenta editarla
- THEN responde `403` (G12)

#### Scenario: posición G11 < G12, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de ficha inexistente
- WHEN intenta editar
- THEN responde el `404` de G11, no el `403`

#### Scenario: posición G12 < G13, resuelta y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una ficha «resuelta»
- WHEN intenta editarla
- THEN responde el `403` de G12, no el `409` de G13

#### Scenario: posición G13 < G14, resuelta y contenido inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una ficha «resuelta» y un cuerpo con fabricante vacío
- WHEN intenta editarla
- THEN responde el `409` de G13, no el `422` de G14

### RQ-TC-48 · Lectura por ticket, «pendiente de respuesta», y liberar la asociación no borra la ficha

La lectura de las respuestas y fichas de un ticket **SHALL** estar disponible para **cualquier usuario con sesión**
(SUPUESTO S-2): leer no decide nada, como las lecturas de asociaciones
(`apps/desk/server/routes/ovAsociaciones.ts:26`). La respuesta del servidor **SHALL** traer, para cada asociación OVI del
ticket, su respuesta y su ficha si la hay, y **SHALL** indicar cuáles asociaciones OVI vigentes están «pendientes de
respuesta» (OVI vigente sin respuesta). Una asociación liberada sin respuesta **MUST NOT** salir pendiente ni aparecer
en la lista (SUPUESTO S-11); una liberada CON respuesta sí aparece, con su ficha intacta. Las OVI asociadas antes de este cambio salen «pendiente de respuesta», **sin relleno retroactivo**
(SUPUESTO S-11): no se inventan respuestas.

**Liberar la asociación no cierra ni borra la ficha** (SUPUESTO S-8): la liberación de `tickets-core` RQ-TC-17 y RQ-TC-20
**MUST NOT** tocar `garantia_proveedor`, que conserva el número de la OVI copiado y sigue su curso (se edita, avanza y
avisa) aparte del ticket. La fila de la asociación nunca se borra, así que la referencia por `asociacion_id` sigue
siendo estable.

#### Scenario: cualquier sesión lee — ROJO
- GIVEN un usuario sin cargo que no es administrador
- WHEN lee las respuestas y fichas de un ticket
- THEN recibe la lista, con éxito

#### Scenario: sin sesión no lee — CARACTERIZACIÓN
- GIVEN una petición sin sesión
- WHEN lee las fichas de un ticket
- THEN responde `401`

#### Scenario: OVI vigente sin respuesta sale «pendiente de respuesta» — ROJO
- GIVEN un ticket con una asociación vigente de `OVI-2026-001` sin respuesta, y otra con respuesta «no»
- WHEN se lee
- THEN sólo la primera sale «pendiente de respuesta»

#### Scenario: una orden `OV-` nunca sale pendiente — ROJO
- GIVEN un ticket con una asociación vigente de `OV-2026-001`
- WHEN se lee
- THEN no sale «pendiente de respuesta»

#### Scenario: liberada sin respuesta no sale pendiente (S-11) — ROJO
- GIVEN una asociación OVI liberada sin respuesta
- WHEN se lee
- THEN no sale «pendiente de respuesta» y no aparece en la lista

#### Scenario: asociaciones anteriores al cambio salen pendientes sin relleno (S-11) — CARACTERIZACIÓN
- GIVEN una asociación OVI vigente creada antes de que existiera la tabla
- WHEN se lee
- THEN sale «pendiente de respuesta» y no existe fila en `garantia_proveedor`

#### Scenario: liberar no borra ni cierra la ficha (S-8) — ROJO
- GIVEN una ficha «abierta» sobre una asociación OVI
- WHEN un usuario de Comercial libera la asociación con motivo
- THEN la ficha sigue «abierta», con el número de la OVI y sin cambio alguno, y sigue pudiendo editarse y avanzar

### RQ-TC-49 · El cliente no decide nada que el servidor no imponga (regla invariable 13)

El panel de la ficha, junto al de asociaciones del detalle del ticket, **SHALL** limitarse a mostrar y a ofrecer las
acciones; **toda decisión que toma tiene contrapartida en el servidor** y el cliente **MUST NOT** ser la única guarda.
Las nueve decisiones y quien las impone (las líneas del servidor las nombra el cierre del lote, regla de mutación 3):

| # | Decisión del cliente | Regla que consume | La impone |
|---|---|---|---|
| 1 | Enseña la pregunta, el formulario y los botones sólo a quien tiene el cargo | `puedeGestionarReclamacion` (envoltorio de `shared` sobre `puedeCrearOVIGarantia`) | G2, G8, G12 |
| 2 | Ofrece la pregunta sólo en las filas `pendiente` | la lectura del servidor | G3, G4, G6 |
| 3 | Las tres opciones del «no» | `MOTIVOS_NO_RECLAMA` y sus etiquetas, de `shared` | G5 |
| 4 | Ofrece sólo el paso siguiente del estado | `siguienteEstado` | G9 |
| 5 | Rellena el fabricante con la marca del ticket (`fabricantePropuesto`, de la lectura) | la lectura del servidor | nada que imponer: es relleno; el servidor sólo exige fabricante no vacío (G5, G14) |
| 6 | Pinta «pendiente de respuesta» | la lectura del servidor | no decide nada |
| 7 | Oculta el formulario de edición en una ficha resuelta | `estado` de la lectura | G13 |
| 8 | Al resolver como «rechazada» no pide valor recuperado | `RESULTADOS_RECLAMACION` | G10 |
| 9 | No pinta el panel si el ticket no tiene ninguna OVI | la lectura del servidor (lista vacía) | no decide nada |

El cliente **SHALL** consumir las listas y los predicados de `packages/shared` y **MUST NOT** reescribirlos (molde H5).
Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00), así que estos requisitos del cliente no
llevan rojo previo: lo que lo respalda es la prueba del servidor de RQ-TC-44, RQ-TC-46 y RQ-TC-47.

#### Scenario: el servidor rechaza lo que el cliente ocultaría — ROJO
- GIVEN un usuario sin cargo que llama a las rutas de responder, editar y avanzar saltándose el panel
- WHEN las invoca
- THEN responden `403`, de modo que el panel es comodidad y no guarda

#### Scenario: el servidor rechaza el paso que el cliente no ofrecería — ROJO
- GIVEN un Director Técnico que llama a avanzar con un paso no permitido
- WHEN lo invoca
- THEN responde `409`

#### Scenario: «pendiente de respuesta» no es dato del cliente — CARACTERIZACIÓN
- GIVEN la respuesta del servidor de RQ-TC-48
- WHEN el panel la pinta
- THEN no deriva por su cuenta qué asociación está pendiente

### RQ-TC-50 · `POST /api/tickets/:id/reasignar`: cambiar la persona a cargo sin cambiar de estado, con la escalera A < B < C < D

El servidor **SHALL** exponer `POST /api/tickets/:id/reasignar`, en módulo propio, que cambia `tickets.derivado_a` al
usuario `destino` del cuerpo, con un `motivo` escrito, **sin cambiar `status`** ni ninguna otra columna del ticket. En
caso de éxito responde `200`. **MUST NOT** vaciar la persona a cargo (no hay camino a «sin derivar» por esta ruta), ni
reasignar en bloque. Las guardas **SHALL** evaluarse en este orden total, sin solape de códigos:

1. **A · existencia (`404`):** el ticket no existe. **SHALL** responder `404` aunque el cuerpo sea inválido y el usuario no
   tenga permiso.
2. **B · permiso (`403`):** el usuario no cumple el predicado de `permissions` RQ-PM-27. **SHALL** responder `403` aunque
   el cuerpo sea inválido.
3. **C · contenido (`422`)**, en este orden:
   1. **Motivo**: obligatorio; vacío o de sólo espacios da `422`. Se guarda **recortado**. Un validador único de
      `packages/shared` lo decide.
   2. **Destino ausente**: sin `destino` da `422`.
   3. **Destino igual a la persona a cargo actual** (SUPUESTO S-4, reversible): `422`, porque no es una reasignación.
   4. **Destino inexistente o inactivo**: `422`, con el mismo criterio con que la derivación de una transición rechaza un
      destino que no es un usuario activo.
4. **D · carrera (`409`):** si entre la lectura del ticket y la escritura otra reasignación cambió la persona a cargo, el
   `UPDATE`, condicionado a la persona a cargo leída, no toca ninguna fila. La ruta **SHALL** responder `409`, **MUST NOT**
   insertar fila en `public.reasignaciones` y **MUST NOT** crear aviso; `derivado_a` queda como lo dejó la otra
   reasignación. D **SHALL** evaluarse después de C: un cuerpo inválido da `422` aunque la persona a cargo ya haya cambiado.

El **motivo va antes que el destino**: un cuerpo sin motivo y con destino inválido da el `422` del motivo. **El destino**
puede ser cualquier persona activa, sin exigir que sea del área (SUPUESTO S-6, reversible: el maestro habla de «técnicos de
la misma área», pero la derivación de hoy tampoco lo exige). **Reasignarse a uno mismo se permite** (SUPUESTO S-5,
reversible) y no genera aviso (`derivacion-avisos` RQ-AV-20). Un ticket sin persona a cargo (origen nulo) **SHALL**
poder reasignarse; su `de` queda nulo en la traza.

La ruta recibe la configuración del correo para el aviso, y se registra en `apps/desk/server/app.ts` sobre las líneas que
ya existen. **No** se tocan `apps/desk/server/services/ticketService.ts` ni `packages/zoho-sync/src/db/repo.ts`.

#### Scenario: un usuario del área reasigna, el estado no cambia — ROJO
- GIVEN un ticket en un estado con área de salida Servicio Técnico a cargo de «Ana», y un usuario con esa área
- WHEN reasigna a «Beto» con motivo «Ana sale de vacaciones»
- THEN responde `200`, `derivado_a` es el id de Beto y `status` es el mismo que antes

#### Scenario: ticket inexistente, 404 antes que 403 y que 422 — ROJO
- GIVEN un identificador de ticket que no existe, un usuario sin permiso y un cuerpo inválido (sin motivo y sin destino)
- WHEN reasigna
- THEN responde `404`, no `403` ni `422`

#### Scenario: 403 antes que 422 — ROJO
- GIVEN un ticket que existe, un usuario sin permiso y un cuerpo sin motivo
- WHEN reasigna
- THEN responde `403`, no `422`, y no cambia nada

#### Scenario: el permiso se evalúa aunque el cuerpo sea válido — ROJO
- GIVEN un ticket que existe, un usuario sin permiso y un cuerpo válido
- WHEN reasigna
- THEN responde `403` y `derivado_a` no cambia

#### Scenario: sin motivo, 422 — ROJO
- GIVEN un usuario con permiso y un destino válido
- WHEN envía el motivo vacío, ausente o de sólo espacios
- THEN responde `422`, `derivado_a` no cambia y no se inserta traza

#### Scenario: el motivo va antes que el destino — ROJO
- GIVEN un usuario con permiso, un motivo vacío y un destino ausente
- WHEN reasigna
- THEN el `422` es el del motivo

#### Scenario: el motivo va antes que cada falla del destino — ROJO
- GIVEN un usuario con permiso, un motivo vacío y, por separado, un destino igual al actual, un destino inexistente y un destino inactivo
- WHEN reasigna en cada caso
- THEN en los tres el `422` es el del motivo

#### Scenario: destino ausente, 422 — ROJO
- GIVEN un usuario con permiso y un motivo válido
- WHEN no envía `destino`, o lo envía vacío
- THEN responde `422` y no cambia nada

#### Scenario: destino igual a la persona a cargo actual, 422 (S-4) — ROJO
- GIVEN un ticket a cargo de «Ana», un usuario con permiso y un motivo válido
- WHEN envía como destino a Ana
- THEN responde `422`, no se inserta traza y no se crea aviso

#### Scenario: destino inexistente o inactivo, 422 — ROJO
- GIVEN un usuario con permiso, un motivo válido y un destino que no existe, o que está inactivo
- WHEN reasigna
- THEN responde `422` y no cambia nada

#### Scenario: destino igual al actual antes que destino inexistente — CARACTERIZACIÓN
- GIVEN un destino que a la vez es la persona a cargo actual e inactivo
- WHEN se reasigna
- THEN el `422` que se contesta es el de destino igual al actual, que precede al de inexistente o inactivo

#### Scenario: la persona a cargo cambió entre la lectura y la escritura, 409 — ROJO
- GIVEN un ticket a cargo de «Ana», un usuario con permiso y un cuerpo válido hacia «Beto», y que entre la lectura del ticket y la escritura otra reasignación lo deja a cargo de «Carla»
- WHEN se aplica la escritura
- THEN responde `409`, no queda ninguna fila nueva en `public.reasignaciones`, no se crea aviso y `derivado_a` sigue siendo «Carla»

#### Scenario: posición, el 422 de contenido antes que el 409 de carrera — ROJO
- GIVEN un ticket cuya persona a cargo cambió entre la lectura y la escritura, un usuario con permiso y un motivo vacío
- WHEN reasigna
- THEN responde `422` del motivo, no `409`, y no cambia nada

#### Scenario: el motivo se guarda recortado — ROJO
- GIVEN un motivo «  cambio de turno  »
- WHEN se reasigna
- THEN la traza guarda «cambio de turno» (`trazas` RQ-TZ-20)

#### Scenario: origen nulo se puede reasignar — ROJO
- GIVEN un ticket sin persona a cargo
- WHEN un usuario con permiso lo reasigna a «Beto» con motivo
- THEN responde `200` y la traza guarda `de` nulo

#### Scenario: reasignarse a uno mismo se permite (S-5) — ROJO
- GIVEN un usuario con permiso, que no es la persona a cargo
- WHEN se reasigna el ticket a sí mismo con motivo
- THEN responde `200` y `derivado_a` es su propio id

#### Scenario: el destino puede ser de otra área (S-6) — ROJO
- GIVEN un destino activo cuyas áreas no incluyen ninguna de las de salida del estado
- WHEN se reasigna
- THEN responde `200`

#### Scenario: no se puede vaciar por esta ruta — ROJO
- GIVEN un ticket con persona a cargo
- WHEN se envía `destino` nulo o cadena vacía
- THEN responde `422` y `derivado_a` no cambia

### RQ-TC-51 · La reasignación es atómica, no mueve el estado ni el reloj, sobrevive a la sincronización y se borra con su ticket

Al aplicarse, el servidor **SHALL**, en una **misma transacción**: actualizar `tickets.derivado_a` e insertar la fila de
traza en `public.reasignaciones` (`trazas` RQ-TZ-20). Si el alta de la traza falla, `derivado_a` **MUST NOT** cambiar, y si
falla la actualización no queda traza. La actualización **MUST NOT** tocar `status` ni ninguna otra columna del ticket más
allá de `derivado_a`.

- **Nada en `ticket_transitions`.** La reasignación **MUST NOT** escribir en `ticket_transitions`: el inventario exacto de
  escritores de `trazas` RQ-TZ-16 no cambia, la entrada vigente del estado que lee el reloj de la alarma
  (`derivacion-avisos` RQ-AV-16) es la misma antes y después, y `primerDerivado` (RQ-AV-03) devuelve lo mismo.
- **No pone `managed_by_app`.** La reasignación **MUST NOT** fijar `managed_by_app = true`: si lo hiciera, el sincronizador
  dejaría de refrescar la fila entera. `derivado_a` está fuera de las columnas que reescribe el sincronizador, así que la
  reasignación **SHALL** sobrevivir a una pasada de sincronización: tras `upsertTicket` con un estado nuevo de Zoho,
  `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` sigue `false`. No hay delta en `zoho-sync`: es
  comportamiento que ya existe, que esta prueba de extremo a extremo fija.
- **Aviso fuera de la transacción:** `derivacion-avisos` RQ-AV-20. Que el correo falle **MUST NOT** deshacer lo escrito.
- **Carrera:** el `de` de la traza **SHALL** ser el `derivado_a` que el ticket tenía cuando se aplicó la reasignación; el
  `UPDATE` condicionado de RQ-TC-50 (D, `409`) impide que dos reasignaciones simultáneas dejen un `de` que ya no es
  cierto. **Límite declarado:** pg-mem no ejercita el bloqueo de fila real de PostgreSQL ni dos conexiones concurrentes;
  la suite prueba la condición del `UPDATE` de forma determinista, y que el motor serialice las escrituras reales es
  hipótesis no probada aquí.
- **Se borra con su ticket (SUPUESTO S-8, reversible):** eliminar un ticket **SHALL** borrar también sus filas de
  `public.reasignaciones`. Hoy la lista de tablas que barre el borrado (`apps/desk/server/db/eliminarTicket.ts:45-56`) no
  la incluye; sin ello las filas huérfanas seguirían contando en «en uso» (`permissions` RQ-PM-11) y la persona que
  figura en ellas no podría borrarse nunca.

#### Scenario: la actualización y la traza van juntas — ROJO
- GIVEN una reasignación válida
- WHEN se aplica
- THEN `derivado_a` y la fila de `public.reasignaciones` existen juntos

#### Scenario: si falla la traza, `derivado_a` no cambia — ROJO
- GIVEN una reasignación válida y un fallo forzado en el alta de la traza
- WHEN se aplica
- THEN `derivado_a` conserva su valor anterior y no queda traza; sacar el alta de la traza de la transacción pone esta prueba en rojo

#### Scenario: eliminar el ticket borra sus reasignaciones y libera a la persona (S-8) — ROJO
- GIVEN un ticket con una reasignación hacia «Beto», que no tiene otro uso
- WHEN se elimina el ticket
- THEN no queda ninguna fila suya en `public.reasignaciones` y «Beto» vuelve a poder borrarse

#### Scenario: `ticket_transitions` no cambia — ROJO
- GIVEN un ticket con N filas en `ticket_transitions`
- WHEN se reasigna
- THEN siguen siendo N y el inventario de escritores no cambia

#### Scenario: la entrada vigente del estado es la misma — ROJO
- GIVEN un ticket cuya entrada más reciente del estado actual es E
- WHEN se reasigna
- THEN la entrada que lee la alarma sigue siendo E

#### Scenario: `primerDerivado` no cambia — ROJO
- GIVEN un ticket cuyo `primerDerivado` es P, o ninguno
- WHEN se reasigna
- THEN `primerDerivado` devuelve P, o ninguno, tras reasignar

#### Scenario: el estado no se mueve — ROJO
- GIVEN un ticket en un estado S
- WHEN se reasigna
- THEN `status` sigue siendo S y ninguna otra columna cambia salvo `derivado_a`

#### Scenario: la reasignación sobrevive al sincronizador — ROJO
- GIVEN un ticket venido de Zoho, reasignado por la ruta, y luego un `upsertTicket` con un estado nuevo de Zoho
- WHEN termina la pasada
- THEN `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` es `false`

#### Scenario: la reasignación no fija `managed_by_app` — ROJO
- GIVEN un ticket con `managed_by_app` en `false`
- WHEN se reasigna
- THEN sigue en `false`; añadir `managed_by_app = true` al `UPDATE` pone la prueba del sincronizador en rojo

#### Scenario: el `de` de la traza es el valor vigente al aplicar — ROJO
- GIVEN un ticket a cargo de «Ana» reasignado a «Beto» y luego de «Beto» a «Carla»
- WHEN se leen las dos filas de traza
- THEN la primera tiene `de` Ana y `a` Beto, y la segunda `de` Beto y `a` Carla

### RQ-TC-52 · El cliente consume el predicado y el validador de `shared`, y no decide nada que el servidor no imponga (regla invariable 13)

El panel «Reasignar» del detalle del ticket (`apps/desk/src/components/`, con la lógica decidible en `apps/desk/src/lib/`
y su prueba) **SHALL** consumir **el mismo** predicado de permiso (`permissions` RQ-PM-27) y **el mismo** validador de motivo
de `packages/shared` que usa el servidor, y **MUST NOT** reescribirlos. Los `.tsx` quedan fuera de la red de pruebas por
decisión de Gerencia; la lógica decidible va en `lib/` y se prueba allí, sin `jsdom` ni `testing-library`. Cada decisión del
cliente nombra su contrapartida en el servidor (regla de mutación 3):

| Decisión del cliente | Qué la impone en el servidor |
|---|---|
| Muestra el panel sólo a quien puede reasignar | Guarda B (`403`) con el mismo predicado de `shared` (RQ-PM-27) |
| No ofrece a la persona a cargo actual | `422` de destino igual al actual (RQ-TC-50) |
| Ofrece sólo personas activas | `422` de destino inexistente o inactivo (RQ-TC-50) |
| No ofrece «Sin derivar» | `422` de destino obligatorio (RQ-TC-50) |
| Desactiva el botón con motivo vacío o de sólo espacios | `422` de motivo, con el mismo validador de `shared` (RQ-TC-50) |
| Recarga ticket e historial al terminar | No decide nada |

El cliente **SHALL** enseñar el mensaje de error que dice el servidor, no uno propio. Una decisión del cliente sin línea en
esta tabla sería la guarda, y el cierre de la tanda **SHALL** rellenar la columna con ruta y línea. Que el servidor y el
cliente usan la misma función lo fija el barrido de estados por áreas (`permissions` RQ-PM-27).

#### Scenario: un solo predicado, sin segunda copia — CARACTERIZACIÓN
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan las comprobaciones de quién puede reasignar
- THEN cliente y servidor pasan por el predicado de `shared` y ninguno lo reescribe

#### Scenario: un solo validador del motivo — CARACTERIZACIÓN
- GIVEN el validador del motivo de `shared`
- WHEN se evalúan el motivo vacío, el de sólo espacios y uno con texto
- THEN rechaza los dos primeros y acepta el tercero, y la ruta y la lógica de `lib/` llaman a esa misma función

#### Scenario: la lógica de `lib/` no ofrece la persona a cargo ni «Sin derivar» — ROJO
- GIVEN la lista de personas activas y un ticket a cargo de «Ana»
- WHEN la lógica de `lib/` construye las opciones del desplegable
- THEN «Ana» y «Sin derivar» no están entre ellas

### RQ-TC-53 · La ampliación del contrato: hasta el 31/12 del año natural del vencimiento, sólo alarga, varias veces, con el plazo abierto hasta ese día

El **tope** de una ampliación **SHALL** ser el **31/12 del año natural de la fecha de fin original del contrato**. El año
**SHALL** leerse de los cuatro primeros dígitos de la fecha civil `AAAA-MM-DD`, sin pasarla por un instante UTC (un
vencimiento el 01/01 **MUST NOT** contar en el año anterior). Como el tope cae en el mismo año que el vencimiento, la
fecha original y la vigente tienen siempre el mismo año: ampliar varias veces no mueve el tope.

Una ampliación **SHALL** fijar una nueva fecha de fin que cumpla las **cuatro** condiciones siguientes, y la regla
**SHALL** vivir como función pura de dominio en `packages/shared` —sin base de datos— consumida por la ruta, sin
reescribirse (regla invariable 13; mismo lugar que `estadoContrato`, `packages/shared/src/contratos.ts:41`):

1. la fecha nueva es un día real `AAAA-MM-DD` (mismo criterio que `fechaCalendario`, `packages/shared/src/contratos.ts:34`);
2. la fecha nueva es **estrictamente posterior** a la fecha de fin **vigente** (una ampliación sólo alarga: no acorta, no
   corrige, no repite la misma fecha; supuesto S-3);
3. la fecha nueva **no pasa** del tope (el propio 31/12 es válido);
4. el plazo sigue abierto: **hoy** no es posterior al tope. Hoy es el día civil en la **zona de negocio** de `RQ-TC-22`
   (`hoyEnZona`, `packages/shared/src/contratos.ts:61`), **nunca** el día UTC. El plazo se cierra por el **día** de
   negocio, no por la hora: el 31/12 entero se puede ampliar (supuesto S-10).

Se **PUEDE** ampliar el mismo contrato más de una vez, mientras cada fecha nueva sea posterior a la vigente y no pase del
tope (supuesto S-2). Un contrato **no iniciado**, **vigente** o **vencido** es ampliable por igual: la regla no mira la
fecha de inicio (supuesto S-7). Cuando la regla rechaza, devuelve el mensaje del rechazo; cuando la ampliación cabe, no
devuelve ninguno. Los motivos se evalúan **en este orden**: fecha inválida, no posterior a la vigente, pasa del tope,
plazo cerrado. La fecha de fin vigente es la columna del contrato; la **original** no se pierde (`RQ-TC-54`).

#### Scenario: El vencimiento el 31/12 no admite ampliación

- GIVEN un contrato cuya fecha de fin vigente es `2026-12-31` y un hoy de `2026-12-15`
- WHEN se pide ampliarlo a `2027-01-01`, y luego a `2026-12-31`
- THEN las dos peticiones se rechazan: la primera por pasar del tope (`2026-12-31`), la segunda por no ser posterior a la
  vigente; el tope es el propio día y no cabe ninguna fecha entre ambas condiciones

#### Scenario: El vencimiento el 01/01 tiene tope el 31/12 de ese mismo año

- GIVEN un contrato cuya fecha de fin vigente es `2026-01-01` y un hoy de `2026-01-05`
- WHEN se pide ampliarlo a `2026-12-31`
- THEN la ampliación se acepta, porque el año es `2026` y no `2025`; y una petición a `2027-01-01` se rechaza por pasar del tope

#### Scenario: Una fecha el 01/01 del año siguiente al vencimiento se rechaza

- GIVEN un contrato con fecha de fin `2026-06-30` y un hoy de `2026-07-02`
- WHEN se pide ampliarlo a `2027-01-01`
- THEN se rechaza por pasar del tope, y `2026-12-31` sí se acepta

#### Scenario: Un instante que en UTC ya es 01/01 y en la zona de negocio sigue siendo 31/12 todavía permite ampliar

- GIVEN un contrato con fecha de fin `2026-12-20` y el reloj en el instante `2027-01-01T03:00:00Z`, que en la zona de
  negocio (UTC-5) es el `2026-12-31` a las 22:00
- WHEN se pide ampliarlo a `2026-12-31`
- THEN la ampliación se acepta, porque hoy en la zona de negocio es `2026-12-31` y no es posterior al tope; y con el reloj
  en `2027-01-01T05:00:00Z` (ya `2027-01-01` en la zona de negocio) la misma petición se rechaza por plazo cerrado

#### Scenario: Una ampliación sólo alarga

- GIVEN un contrato con fecha de fin vigente `2026-06-30` y un hoy anterior al tope
- WHEN se pide fijar la fecha de fin a `2026-06-30` (la misma), a `2026-06-01` (anterior), y luego a `2026-07-31`
- THEN las dos primeras se rechazan por no ser posteriores a la vigente y la tercera se acepta

#### Scenario: Se puede ampliar varias veces dentro del tope, y el tope no se mueve

- GIVEN un contrato con fecha de fin original `2026-03-31` ya ampliado a `2026-06-30`
- WHEN se pide una segunda ampliación a `2026-12-31`, y después otra a `2027-01-01`
- THEN la segunda se acepta, la tercera se rechaza por pasar del tope (`2026-12-31`, el mismo de la original), y la
  fecha de fin vigente queda en `2026-12-31`

#### Scenario: Con el plazo vencido no se amplía, aunque la fecha pedida cupiera

- GIVEN un contrato con fecha de fin `2026-06-30` y un hoy de `2027-01-02` en la zona de negocio
- WHEN se pide ampliarlo a `2026-09-30`, que es posterior a la vigente y no pasa del tope
- THEN se rechaza por plazo cerrado

#### Scenario: Una fecha que no es un día real se rechaza

- GIVEN un contrato ampliable
- WHEN se pide ampliarlo a `2026-02-30`, a un texto libre, o sin fecha
- THEN cada caso se rechaza como fecha inválida

#### Scenario: El orden de los motivos está fijado por prueba

- GIVEN una petición que cumple a la vez dos motivos de rechazo
- WHEN se evalúa
- THEN gana el que va antes en el orden de la regla: una fecha inválida antes que cualquier otro; «no posterior» antes que
  «pasa del tope»; y «pasa del tope» antes que «plazo cerrado»

#### Scenario: Un contrato no iniciado o ya vencido también se amplía

- GIVEN un contrato aún no iniciado y otro vencido hace un mes, ambos con tope en el futuro
- WHEN se pide una fecha nueva válida para cada uno
- THEN las dos ampliaciones se aceptan

### RQ-TC-54 · `POST /api/contratos/:id/ampliar`: lo registra Comercial, con la escalera A < B < C < D, y deja traza sin borrar la fecha original

El sistema **SHALL** exponer `POST /api/contratos/:id/ampliar` con cuerpo `{ fechaFin, motivo }`. Se **SHALL** registrar
en el **servidor** únicamente por el área Comercial o un administrador, consumiendo el mismo predicado
`canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` de `@ambientalia/shared` que ya usa el alta del contrato
(`apps/desk/server/routes/contratos.ts:43`; regla invariable 13: el botón del cliente es comodidad, la imposición es la del
servidor). La ruta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8, **fijado por prueba para cada par
vecino con las dos guardas activas a la vez**:

| Escalón | Guarda | Respuesta |
|---|---|---|
| A · existencia | el id no es numérico o el contrato no existe (mismo criterio que `apps/desk/server/routes/contratos.ts:31`) | `404` |
| B · permiso | sin área Comercial ni administrador | `403` |
| C · contenido | el rechazo de la regla de `RQ-TC-53`, en su orden; y después el motivo vacío | `422` |
| D · unicidad | la fecha de fin vigente cambió entre la lectura y la escritura | `409` |

El **motivo SHALL ser obligatorio**: un motivo ausente o de sólo espacios se rechaza con `422`, y se guarda recortado y sin
límite de longitud (supuestos S-1 y S-9; **la fuente no lo exige**, se pide por coherencia con liberar y reasignar). Es
la última guarda de C: una fecha inválida y un motivo vacío a la vez dan el mensaje de la fecha. El permiso **SHALL**
decidirse antes de leer el cuerpo.

Aceptada la petición, el sistema **SHALL** escribir, en **una sola transacción** (`enTransaccion`,
`apps/desk/server/db/transaccion.ts:13`), dos cosas: la nueva fecha de fin **condicionada a la fecha leída** (si otra
ampliación cambió la fecha entre la lectura y la escritura, no se escribe nada y responde `409`) y una **fila de traza** en una
tabla propia del esquema `public` (`public.contrato_ampliaciones`, creada con `CREATE` calificado), con: quién (la
persona de la **sesión**, nunca la del cuerpo), cuándo, fecha anterior, fecha nueva y motivo. La traza **MUST NOT** tener
`DELETE` ni clave foránea hacia el contrato, como `public.reasignaciones`. La fecha de fin del contrato **SHALL**
pasar a ser la **vigente**; la **original no se borra**: es la fecha anterior de la primera fila de traza del contrato.

`GET /api/contratos/:id` **SHALL** devolver, además de `contrato`, `estado` y `saldo` —que **MUST NOT** cambiar—, dos
campos aditivos: `ampliaciones` (la traza del contrato, en el orden en que ocurrieron, con quién, cuándo, fecha
anterior, fecha nueva y motivo) y `fechaFinOriginal`. Sin ampliaciones, `fechaFinOriginal` es igual a la fecha de fin
y **nunca** es nulo (supuesto S-8). La traza la lee cualquier usuario con sesión, como la ficha (supuesto S-6;
`apps/desk/server/routes/contratos.ts:28`).

#### Scenario: Comercial amplía un contrato y queda la traza

- GIVEN un usuario del área Comercial y un contrato con fecha de fin `2026-06-30`, con un hoy anterior al tope
- WHEN pide ampliarlo a `2026-09-30` con el motivo «Prórroga acordada con el cliente»
- THEN responde éxito, la fecha de fin vigente pasa a `2026-09-30` y queda una fila de traza con la persona de la
  sesión, la hora, fecha anterior `2026-06-30`, fecha nueva `2026-09-30` y ese motivo

#### Scenario: Un administrador puede ampliar sin ser de Comercial

- GIVEN un administrador sin el área Comercial
- WHEN pide una ampliación válida
- THEN responde éxito

#### Scenario: Sin área Comercial ni administración se rechaza con 403 y no se escribe nada

- GIVEN un usuario con sesión sin Comercial y que no es administrador, sobre un contrato existente
- WHEN pide una ampliación válida
- THEN responde `403`, la fecha de fin no cambia y no se crea ninguna fila de traza, aunque el cliente web no le muestre el botón

#### Scenario: El 404 gana al 403 — posición fijada por prueba

- GIVEN un id de contrato que no existe, y un usuario sin Comercial ni administración
- WHEN manda una petición de ampliación
- THEN responde `404`, no `403`; un id no numérico responde `404` sin llegar a la base

#### Scenario: El 403 gana al 422 — posición fijada por prueba

- GIVEN un contrato existente
- WHEN un usuario sin Comercial manda una ampliación con cuerpo inválido (fecha mala y motivo vacío)
- THEN responde `403`; y cuando un usuario Comercial manda ese mismo cuerpo, responde `422`

#### Scenario: El 422 gana al 409 — posición fijada por prueba

- GIVEN un contrato al que otra ampliación cambia la fecha de fin entre la lectura y la escritura
- WHEN un usuario Comercial manda un cuerpo de contenido inválido
- THEN responde `422`, no `409`; y con un cuerpo válido sobre esa misma carrera responde `409`

#### Scenario: Dos ampliaciones simultáneas — la segunda responde 409 y la traza no miente

- GIVEN dos peticiones válidas leídas contra la misma fecha de fin vigente
- WHEN la primera escribe y la segunda intenta escribir con la fecha que leyó
- THEN la segunda responde `409`, no pisa la fecha de la primera y no deja fila de traza

#### Scenario: Un motivo vacío o sólo de espacios se rechaza con 422

- GIVEN un usuario Comercial y una fecha válida
- WHEN manda el motivo ausente, vacío o de espacios
- THEN responde `422` y no se escribe nada; con una fecha inválida y el motivo vacío, el mensaje es el de la fecha

#### Scenario: El motivo se guarda recortado, sin límite de longitud

- GIVEN una ampliación válida con el motivo `  Prórroga  ` seguido de un texto de varios miles de caracteres
- WHEN se acepta
- THEN la traza guarda el motivo sin espacios en los extremos y sin truncar su longitud

#### Scenario: Quién amplía es la sesión, no el cuerpo

- GIVEN un cuerpo que además de `fechaFin` y `motivo` trae un campo con otro nombre de persona
- WHEN se acepta la ampliación
- THEN la traza guarda el nombre de la persona de la sesión

#### Scenario: Lo que falla no deja a medias fecha y traza

- GIVEN una ampliación cuya escritura de la traza falla, o cuya escritura de la fecha no cambia ninguna fila
- WHEN se procesa
- THEN no queda ni la fecha nueva sin traza ni la traza sin fecha nueva

#### Scenario: La ficha enseña la traza y la fecha original

- GIVEN un contrato con fecha de fin original `2026-03-31`, ampliado a `2026-06-30` y después a `2026-09-30`
- WHEN un usuario con sesión pide `GET /api/contratos/:id`
- THEN `ampliaciones` trae dos filas en orden, con quién, cuándo, fecha anterior, fecha nueva y motivo; `fechaFinOriginal`
  es `2026-03-31` (la fecha anterior de la **primera** fila, no de la última); y `contrato`, `estado` y `saldo` son los de hoy

#### Scenario: Sin ampliaciones, la fecha original es la de fin

- GIVEN un contrato nunca ampliado
- WHEN un usuario sin área Comercial pide su ficha
- THEN `ampliaciones` viene vacío y `fechaFinOriginal` es igual a la fecha de fin, nunca nulo; sin sesión responde `401`

#### Scenario: Ningún flujo borra una ampliación

- GIVEN el código de este cambio
- WHEN se busca una sentencia `DELETE` sobre `public.contrato_ampliaciones`
- THEN no existe ninguna

### RQ-TC-55 · Una ampliación desbloquea las tres puertas del contrato vencido hasta la fecha nueva, y al pasarla vuelven a bloquear, sin tocar las puertas

Las tres puertas de la guarda de contrato vencido de `RQ-TC-25` —el **alta** del ticket
(`apps/desk/server/services/ticketService.ts:96`), las **transiciones**
(`apps/desk/server/services/ticketService.ts:147`) y la **remisión** de entrada (`apps/desk/server/routes/remision.ts:220`)—
**SHALL** leer la fecha de fin **vigente**, de modo que un contrato vencido y después ampliado **MUST NOT** dar «contrato
vencido» en ninguna de las tres **hasta** la fecha nueva, y pasada esa fecha **SHALL** volver a bloquear en las tres. Ninguna
puerta cambia de código ni de escalón: el efecto es una consecuencia de que la fecha de fin vigente cambia. El informe
trimestral y el aviso de ritmo calculan desde esa misma fecha vigente y no se alteran.

La ampliación **MUST NOT** reiniciar la marca del aviso de ritmo del contrato: la marca sólo sube, y una ampliación
corta **alarga el trimestre ya avisado** en vez de abrir otro, así que en ese tramo no habrá aviso nuevo (supuesto S-4,
declarado, pregunta abierta de Gerencia). Ampliar **MUST NOT** generar un aviso (supuesto S-5). Las pruebas de posición
existentes —`apps/desk/server/remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts`— **MUST NOT** cambiar sus aserciones.

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en el alta

- GIVEN una subOV canónica de un lote con contrato vencido, y el contrato ampliado con la ruta real a una fecha futura
- WHEN se crea un ticket con esa OV antes de la fecha nueva
- THEN no responde `422` por contrato vencido y el alta sigue su curso

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en la transición

- GIVEN un ticket cuya OV adicional es una subOV de un lote con contrato vencido, ampliado con la ruta real
- WHEN se ejecuta la transición antes de la fecha nueva
- THEN no responde `422` por contrato vencido

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en la remisión

- GIVEN una remisión de entrada con una subOV de un lote con contrato vencido, ampliado con la ruta real
- WHEN se registra antes de la fecha nueva
- THEN no responde `422` por contrato vencido

#### Scenario: Pasada la fecha nueva, las tres puertas vuelven a bloquear

- GIVEN un contrato ampliado hasta `2026-09-30`
- WHEN el día de negocio es `2026-10-01` y se intenta el alta, la transición y la remisión con una subOV de ese lote
- THEN las tres responden `422` con el motivo de contrato vencido, que cita la fecha de fin vigente

#### Scenario: El día de la fecha nueva todavía no bloquea

- GIVEN un contrato ampliado hasta `2026-09-30`
- WHEN el día de negocio es `2026-09-30`
- THEN ninguna de las tres puertas lo da por vencido, porque la fecha de fin está incluida (`RQ-TC-22`)

#### Scenario: Las pruebas existentes de las puertas no cambian

- GIVEN `apps/desk/server/remisiones.test.ts:988` y las pruebas de contratos tal como existen hoy
- WHEN se ejecutan tras este cambio
- THEN pasan sin modificar sus casos

### RQ-TC-56 · Los valores ya guardados no se reescriben, y lo que la prioridad en tres niveles NO hace

Gerencia, `decision/p3b-prioridad-tres-niveles` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`): «Tres
niveles: alta con contrato, Top 5 los que fijo yo, media el resto; sin "baja" por ahora.»

El cambio **MUST NOT** escribir ni esquema ni datos al desplegarse: ningún relleno, ninguna reescritura.

- Un ticket que ya tiene `Low`, `Urgent`, otro valor o ninguna prioridad **SHALL** conservarlo (supuesto S-C de la
  propuesta). Que `Low` deje de ser asignable no lo cambia en los tickets que ya lo llevan.
- Una fila de `public.cliente_prioridad` guardada con `top5` verdadero y una prioridad fuera de `High | Medium`
  (en particular `Low`) **SHALL** dejar de imponer prioridad alguna: el cliente se trata, al nacer un ticket, como si
  no fuera Top 5 (falla cerrado). Sus tickets abiertos **SHALL** conservar la prioridad que ya recibieron. La fila
  vuelve a imponer cuando el Director Comercial la guarda de nuevo con `High` o `Medium`, y entonces se propaga
  (`RQ-TC-35`).
- Top 5 **MUST NOT** tener rango propio: es una marca del cliente cuyo valor elige el Director Comercial entre `High` y
  `Medium`. Un Top 5 `High` y un cliente con contrato vigente empatan en `High` (supuesto S-A de la propuesta).
- La regla **MUST NOT** depender de ninguna «valoración» del cliente: ese nivel queda pendiente de Gerencia y no se
  construye.
- La reversión del Top 5 sigue devolviendo cada ticket a su base (`RQ-TC-36`, supuesto S-I): no recalcula con la regla
  de tres niveles.
- **Regla invariable 13.** Que un valor guardado no se reescriba y que una fila fuera de la lista no imponga nada son
  decisiones del servidor sobre la lista de `packages/shared`; el cliente no las espeja.

#### Scenario: un ticket con `Low` conserva `Low`
- GIVEN un ticket abierto con prioridad `Low` y otro con `Urgent`, creados antes del cambio
- WHEN el cambio entra en vigor
- THEN los dos conservan su prioridad y `prioridad_ajustes` no gana ninguna fila

#### Scenario: un ticket sin prioridad sigue sin ella
- GIVEN un ticket abierto sin prioridad
- WHEN el cambio entra en vigor
- THEN su prioridad sigue vacía

#### Scenario: un Top 5 guardado con `Low` no impone nada al nacer
- GIVEN un cliente con fila `top5` verdadero y `prioridad: 'Low'`, sin contrato vigente
- WHEN se crea un ticket para él
- THEN el ticket nace `Medium`

#### Scenario: un Top 5 guardado con `Low` no quita el contrato
- GIVEN un cliente con fila `top5` verdadero y `prioridad: 'Low'`, con contrato vigente
- WHEN se crea un ticket para él
- THEN el ticket nace `High`

#### Scenario: los tickets abiertos de un Top 5 guardado con `Low` conservan lo que tenían
- GIVEN un cliente con fila `top5` verdadero y `prioridad: 'Low'` cuyos tickets abiertos ya están `Low`
- WHEN el cambio entra en vigor
- THEN los tickets siguen `Low` y no se escribe ninguna traza

#### Scenario: volver a guardar el Top 5 con una prioridad de la lista vuelve a imponer
- GIVEN el cliente anterior y un Director Comercial
- WHEN guarda `top5: true` con `prioridad: 'High'`
- THEN responde `200`, sus tickets abiertos pasan a `High` con su traza (`RQ-TC-35`) y los nuevos nacen `High`

#### Scenario: Top 5 `High` y contrato vigente empatan
- GIVEN un cliente Top 5 `High` con contrato vigente
- WHEN se crea un ticket
- THEN el ticket nace `High`, igual que con una sola de las dos condiciones

#### Scenario: nada depende de una valoración del cliente
- GIVEN dos clientes sin contrato ni Top 5, con datos de cliente distintos
- WHEN se crea un ticket para cada uno
- THEN los dos nacen `Medium`
