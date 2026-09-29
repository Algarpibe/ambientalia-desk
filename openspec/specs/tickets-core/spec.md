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
| Quién puede crear | «Cualquier usuario autenticado (**sin gate por área**)» (`design C:20`) | — | Cualquier sesión válida (`apps/desk/server/routes/tickets.ts:35`, `:124-126`) |
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
orden total de precedencia (`transitions-st` §3.8):

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
  guarda de contrato vencido de `RQ-TC-25` (escalón C, **última** guarda de contenido de la puerta): una
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
(`eliminarTicket.ts:96-98`). El borrado **SHALL** ser en orden explícito de nueve tablas hijas más la
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
`routes/ovAsociaciones.ts:13-14`). Editar la fecha de fin es la ampliación: queda fuera por E-086 (`docs/sdd/ENTRADA.md`).

El alta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8: permiso (`403`, escalón B) antes
de contenido (`422`: campo ausente, lote con formato inválido, fecha inválida, cliente inexistente, fecha
de fin anterior a la de inicio; escalón C) antes de unicidad (`409` por lote ya registrado; escalón D).

Ningún flujo **SHALL** ejecutar `DELETE` sobre `public.contratos` en este cambio (supuesto: la baja y la
ampliación quedan fuera; ver «Fuera de alcance»).

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

Cuando el **cliente del ticket** —ya resuelto en el alta (`ticketService.ts:89`)— tenga un contrato
**vigente** hoy (`RQ-TC-22`), `createManagedTicket` **SHALL** crear el ticket con prioridad `High`
(supuesto S-4: «Alta» del maestro ≡ el literal `High` de `packages/shared/src/transitions.ts:84`), **aunque
el cuerpo traiga otra prioridad** y también para correctivos cotizados aparte. Si el cliente no tiene
ningún contrato vigente, la prioridad **SHALL** ser la que hoy resulte del cuerpo, o ninguna
(`ticketService.ts:106` en `9288779`). La imposición **SHALL** ser del servidor (regla invariable 13): que el formulario
la muestre o no es comodidad.

La prioridad se toma del cliente del **ticket**, no de la subOV ni del cliente del contrato (supuesto S-9).
Este requisito **SHALL** aplicar sólo **al nacer**: no reevalúa tickets existentes ni cambia lo que una
transición escriba después en `priority`. Queda fuera «manda la más alta de las dos» con Top 5 (F1B-07).

#### Scenario: Cliente con contrato vigente → el ticket nace `High` aunque el cuerpo traiga `Low`

- GIVEN un cliente con un contrato vigente y un alta cuyo cuerpo trae `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Cliente con contrato vigente y cuerpo sin prioridad → `High`

- GIVEN un cliente con contrato vigente y un alta sin prioridad
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Sin contrato, todo queda como hoy

- GIVEN un cliente sin ningún contrato, y dos altas: una con `prioridad: 'Low'` y otra sin prioridad
- WHEN se crean los tickets
- THEN el primero queda `Low` y el segundo sin prioridad, igual que antes de este cambio

#### Scenario: Un contrato vencido o aún no iniciado no da prioridad

- GIVEN un cliente cuyo único contrato tiene fin anterior a hoy, y otro cuyo único contrato empieza mañana
- WHEN se crea un ticket con `prioridad: 'Low'` para cada uno
- THEN ambos quedan `Low`

#### Scenario: El día del fin todavía cuenta

- GIVEN un contrato con fin igual a hoy
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `High`

#### Scenario: Manda el cliente del ticket, no el del contrato

- GIVEN un contrato vigente del cliente A y un alta para el cliente B, que no tiene contrato, con una subOV del lote de A
- WHEN se crea el ticket
- THEN la prioridad no se fuerza a `High` por el contrato de A

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
existe pero está de baja. Dentro del escalón C es la **última** guarda de cada puerta —después de la
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
