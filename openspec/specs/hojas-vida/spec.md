# Capacidad `hojas-vida` — datos comerciales del equipo y enlace a Drive

| Dato | Valor |
|---|---|
| Capacidad | `hojas-vida` (`openspec/config.yaml:149-151`) |
| Estado | **nueva** (`status_at_start: "nuevo"`, `config.yaml:151`) — sin código construido a la fecha de esta spec |
| Tanda que la escribe | F1B-02 |
| Procedencia | ítem 9 del §3.2 del maestro (`R08.2.md:3012-3013`), apartado `[EN REVISIÓN — R08]`: vale como procedencia, no como alcance acordado. Justificación operativa: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:157` |
| Decisiones de Gerencia | `decision/p8-p54-drive` (`openspec/config.yaml:1712-1733`) — el enlace a Drive es la solución definitiva, no fase 0 de una migración · `decision/titularidad-mantenedor` (`:1667-1689`) — el mantenedor se apunta en la hoja de vida |
| Depende de | `catalogo-equipos` (marca/modelo/tipo del equipo) · el propio `equipo` como entidad (`apps/desk/server/db/equipos.ts`) y el cliente de Books (`getClient`, `packages/zoho-sync/src/books/repo.ts:129-132`) |
| La usa | **F1B-11**, que depende de esta tanda: construye la guarda que compara el cliente de la orden de venta contra el mantenedor. **IV-8 no se cierra aquí** (`openspec/config.yaml:863`) |

---

## 0 · Procedencia y método

Rigen las reglas de `CLAUDE.md`: **ruta y línea** en toda afirmación sobre código existente, **línea del
`.md`** en toda afirmación sobre el maestro, **hipótesis** delante de lo demás. Esta spec describe una
capacidad **nueva**: las citas de código son los **puntos de extensión** ya construidos, no evidencia de
que el comportamiento nuevo ya exista.

Los seis campos son datos comerciales del equipo, no del ticket. `tickets.codigo_interno`,
`tickets.fecha_factura` y `tickets.doc_almacenada_drive` (`packages/zoho-sync/src/db/repo.ts:47`, `:50`,
`:53`) permanecen intactos y son nociones distintas: la fecha de factura del ticket es la del servicio,
no la de compra del equipo, y la casilla de Drive del ticket es por transición
(`packages/shared/src/transitions.ts:223`), no del equipo.

---

## 1 · Los seis campos, todos opcionales

### Requirement: RQ-HV-01 · Los seis campos son opcionales y no alteran el comportamiento existente

El sistema **SHALL** permitir guardar, por equipo, seis campos nuevos, todos opcionales: fecha de
adquisición, fecha de factura de compra, fin de garantía, código interno, mantenedor (referencia a un
cliente de Books) y enlace a la carpeta de Drive. Ninguno **SHALL** ser obligatorio para crear o para
seguir operando un equipo: hoy el alta sólo exige `serial`, `clientId` y `modeloId`
(`apps/desk/server/routes/equipos.ts:48-71`), y los seis campos nuevos **MUST NOT** ampliar esa lista.

#### Scenario: Alta de equipo sin los cinco campos comerciales
- GIVEN un alta que trae sólo `serial`, `modeloId` y `clientId` (los tres exigidos hoy)
- WHEN se envía el `POST /api/equipos`
- THEN el equipo se crea con `201`
- AND los seis campos nuevos quedan vacíos, y el equipo se busca, edita y desactiva igual que hoy

#### Scenario: Alta de equipo con los seis campos comerciales
- GIVEN un alta que además trae los seis campos comerciales, todos válidos
- WHEN se envía el `POST /api/equipos`
- THEN el equipo se crea con `201` y la respuesta devuelve los seis valores

### Requirement: RQ-HV-02 · Se extiende el POST y el PATCH existentes; no hay endpoint nuevo

El sistema **SHALL** aceptar los seis campos en el mismo `POST /api/equipos` y `PATCH /api/equipos/:id`
que ya existen (`apps/desk/server/routes/equipos.ts:48`, `:73`; escritura en `db/equipos.ts:119`
`createEquipo` y `:133` `updateEquipo`), y **MUST NOT** crear una ruta nueva. Un `PATCH` **SHALL** seguir
el patrón ya construido de campos opcionales (`if (b.X !== undefined) …`, `routes/equipos.ts:79-96`): sólo
se escribe lo que llega.

#### Scenario: PATCH parcial que sólo toca uno de los campos nuevos
- GIVEN un equipo existente sin ninguno de los seis campos comerciales
- WHEN se manda un `PATCH` con sólo el código interno
- THEN responde `200` y sólo ese campo queda escrito
- AND los otros cinco siguen vacíos, y el resto del equipo (serial, modelo, cliente, `active`) no cambia

### Requirement: RQ-HV-03 · Toda fecha se valida en servidor, y el rechazo precede a cualquier escritura

El sistema **SHALL** validar el formato de las tres fechas (adquisición, factura de compra, fin de
garantía) en el servidor y **MUST NOT** escribir nada del `POST` o `PATCH` cuando una de ellas es
inválida — el mismo principio que ya aplican `clientId` y `modeloId`, cuyo `422` se devuelve **antes** de
construir el `patch` que se escribe (`routes/equipos.ts:80-96`, escritura recién en `:113-119`). Precedente de
formato en este mismo repositorio: `apps/desk/server/routes/remision.ts:127` valida fecha contra
`^\d{4}-\d{2}-\d{2}$`.

#### Scenario: Fecha inválida → 422 sin escritura
- GIVEN un alta o un `PATCH` cuya fecha de adquisición no cumple el formato `AAAA-MM-DD`
- WHEN se envía la petición
- THEN responde `422`
- AND ninguno de los seis campos nuevos, ni el resto del equipo, queda escrito

### Requirement: RQ-HV-04 · El enlace de Drive se valida con `urlSegura`, sólo `https://`

El sistema **SHALL** validar el enlace de Drive con `urlSegura`
(`packages/shared/src/remision.ts:100-102`), la función ya compartida que usan el cliente (paneles de
remisión) y el servidor (historia del ticket) para este mismo propósito, hoy en 20 sitios fuera de su
fichero (`remision.test.ts`, `eliminarTicket.ts`, `historial.ts`, `remisionAdjuntos.ts`,
`PanelRemisiones.tsx`, `ResultadoRemision.tsx`) — regla 13.1, se consume, no se reescribe. `urlSegura`
acepta **sólo** `https://` y rechaza cualquier valor que contenga una comilla doble
(`remision.ts:100-102`): su comentario (`:94-99`) explica que el valor se interpola en `href="…"` y se
devuelve como HTML por la API, así que una comilla sin filtrar abriría una inyección de atributo. Un
validador nuevo que sólo mirara el esquema dejaría pasar esa vía en silencio. El sistema **SHALL**
rechazar con `422` todo enlace de Drive para el que `urlSegura` devuelva `null`, y **MUST NOT**
escribirlo.

#### Scenario: URL de Drive con esquema `http://` → 422
- GIVEN un alta o un `PATCH` cuyo enlace de Drive empieza por `http://` (no `https://`)
- WHEN se envía la petición
- THEN responde `422`
- AND el enlace no queda escrito

#### Scenario: URL de Drive con comilla doble → 422
- GIVEN un alta o un `PATCH` cuyo enlace de Drive es `https://` válido pero contiene una comilla doble
  (p. ej. `https://drive.google.com/x" onmouseover="alert(1)`)
- WHEN se envía la petición
- THEN responde `422`
- AND el enlace no queda escrito
- AND este escenario es el que distingue usar `urlSegura` de un `startsWith('https://')` desnudo: sólo
  `urlSegura` lo rechaza

### Requirement: RQ-HV-05 · El mantenedor se valida contra Books, igual que el cliente

El sistema **SHALL** validar el mantenedor contra `getClient` (`packages/zoho-sync/src/books/repo.ts:129-132`),
con el mismo patrón `422` que ya usa `clientId` en el alta y el `PATCH`
(`routes/equipos.ts:56-57` y `:81-82`, «Cliente no encontrado»).

#### Scenario: Mantenedor inexistente → 422
- GIVEN un alta o un `PATCH` cuyo mantenedor no resuelve a ningún cliente de Books
- WHEN se envía la petición
- THEN responde `422`
- AND el mantenedor no queda escrito

**Fuera de esta spec:** la guarda que compara el mantenedor con el cliente de la orden de venta pertenece
a **F1B-11**; aquí sólo se guarda y valida el dato (`decision/titularidad-mantenedor`,
`openspec/config.yaml:1788-1790`).

### Requirement: RQ-HV-06 · El código interno es identificador secundario de búsqueda

`searchEquipos` (`apps/desk/server/db/equipos.ts:59-75`) **SHALL** encontrar un equipo por su código
interno con el mismo criterio —insensible a mayúsculas, por coincidencia parcial— con el que ya busca por
serial hoy (`LOWER(serial) LIKE $1`, `:67-68`).

#### Scenario: Buscar por código interno devuelve el mismo equipo que por serial
- GIVEN un equipo con serial `SN-1` y código interno `INT-001`
- WHEN se busca por `INT-001`
- THEN el resultado incluye ese equipo, igual que buscarlo por `SN-1`

### Requirement: RQ-HV-07 · La hoja de vida muestra los seis campos, vacíos o poblados

La cabecera de `HojaDeVida.tsx` (hoy marca, modelo, tipo, serie, cliente y estado, `:200-207`)
**SHALL** enseñar los seis campos nuevos, con un marcador explícito de vacío (p. ej. «—») cuando no
tengan valor, y **MUST NOT** lanzar error por su ausencia.

#### Comprobaciones de persona de RQ-HV-07 — NO son escenarios automáticos

> **Enmienda del 2026-09-23, en el delta y antes de fusionar.** Hasta esta fecha las dos comprobaciones
> de abajo estaban escritas como `Scenario`. Pasan a comprobación de persona por la regla del ciclo 1
> de `CLAUDE.md`, porque describen trabajo que **ninguna tanda puede hacer hoy en este repositorio**:
> son afirmaciones sobre el DOM de `HojaDeVida.tsx`, y los `.tsx` quedan fuera de la red de pruebas por
> **decisión de Gerencia F0-00** (`vitest.config.ts:16`, `environment: 'node'`, y `:17-20`, que sólo
> incluye `*.test.ts`). Automatizarlas exigiría jsdom, y proponerlo requiere que Gerencia reabra F0-00.
> Lo que sí es automatizable de RQ-HV-07 —que `/historial` entregue los seis campos— lo cubre
> `apps/desk/server/equipos.test.ts:343-359`.
>
> **Dueño:** Comercial/Gerencia, verificación manual en staging. **Dónde queda escrito:** esta sección,
> `apply-progress.md` («Comprobación de persona pendiente») y `verify-report.md` (aviso 4 y tabla de
> comprobaciones de persona). **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1 · Hoja de vida con los seis campos vacíos.** GIVEN un equipo sin ninguno de los seis
  campos comerciales · WHEN se abre su hoja de vida · THEN la cabecera enseña un marcador de vacío en
  cada uno de los seis, sin error.
- **Persona-2 · Hoja de vida con los seis campos poblados.** GIVEN un equipo con los seis campos
  escritos · WHEN se abre su hoja de vida · THEN la cabecera enseña los seis valores, y el enlace de
  Drive abre en una pestaña nueva.

### Requirement: RQ-HV-08 · El alta y la edición piden los seis campos

`EquipoForm` (`apps/desk/src/components/EquiposAdmin.tsx:97`, payload hoy en `:177-181`) **SHALL** pedir los
seis campos, en alta y en edición, y enviarlos en el mismo payload que ya manda `serial`, `modeloId` y
`clientId`.

### Requirement: RQ-HV-09 · Guarda de área en el servidor sobre los tres campos comerciales restringidos, medida contra el cambio real

El sistema **SHALL** exigir área Comercial o `isAdmin` (`apps/desk/server/auth/users.ts:27`, el
administrador recibe las tres áreas) para que un `PATCH /api/equipos/:id`
(`apps/desk/server/routes/equipos.ts:73`) escriba `fechaFacturaCompra`, `finGarantia` o `mantenedorId`.
«Cambiar» **SHALL** medirse contra el valor ya guardado (`getEquipoFull`, `apps/desk/server/db/equipos.ts:169-172`).
La clave **AUSENTE** del cuerpo **MUST NOT** contar como cambio ni tocar el campo — mismo criterio que ya
sigue `camposHojaDeVida` (`routes/equipos.ts:155-157`: `undefined` no entra en `campos`) y el resto del
`PATCH` (`if (b.X !== undefined) …`). La clave PRESENTE vacía o `null` normaliza a `null`, y cuenta como
cambio cuando el valor guardado no era ya `null`. Si al menos uno de los tres restringidos cambia de verdad
y la sesión no califica, el sistema **SHALL** responder `403` y **MUST NOT** escribir nada del cuerpo, ni
siquiera los tres campos libres (`fechaAdquisicion`, `codigoInterno`, `driveUrl`) que vinieran en el mismo
`PATCH`. Si ninguno de los tres restringidos cambia, la sesión **SHALL** poder escribir los tres campos
libres sin calificar por área.

**Orden**, contra la tabla canónica de escalones (`openspec/specs/transitions-st/spec.md:755-760`): esta
guarda ocupa el escalón **B** (estado y permiso). `clientId`, `modeloId` y `mantenedorId` llegan al `PATCH`
como identificadores tal cual —no resueltos previamente—, así que sus `422` (`Cliente no encontrado`,
`:79-83`; `El modelo es obligatorio`/`Modelo no encontrado`, `:89-95`; `Mantenedor no encontrado`, dentro de
`camposHojaDeVida`, `:167-177`) son escalón **A**, igual que `:24`/`:27` equipo y `:39` OV no encontrada en
la propia tabla canónica; la excepción A/C de `transitions-st/spec.md:763-765` (un `clientId` YA RESUELTO)
no aplica aquí, porque estos tres llegan sin resolver. El `403` de esta guarda **SHALL** ejecutarse después
del `404` de equipo inexistente (`:76`) y de esos `422` de escalón A, y **antes** de cualquier `422` de
contenido de escalón C: formato de las tres fechas (RQ-HV-03) y `urlSegura` de Drive (RQ-HV-04). El orden
exacto de implementación, con prueba de posición, lo fija `design.md` (regla de mutación 1 de
`CLAUDE.md`).

> **Hipótesis, no se corrige en este cambio.** El comentario de
> `apps/desk/server/services/equipoNuevo.ts:63` llama «Validación C» al bloque entero de
> `camposHojaDeVida` (mantenedor + tres fechas + Drive) en la vía del ticket. Contra la tabla canónica de
> arriba, la parte de mantenedor de ese bloque es A, no C — incoherencia preexistente en el comentario,
> ajena a este cambio.

#### Scenario: Técnico sin Comercial no cambia ningún campo restringido, sólo Drive
- GIVEN un equipo con los tres campos restringidos ya guardados, y una sesión sin área Comercial ni admin
- WHEN se envía un `PATCH` con los seis campos, los tres restringidos IGUALES a los guardados y `driveUrl`
  distinto
- THEN responde `200` y sólo `driveUrl` queda escrito

#### Scenario: Técnico sin Comercial cambia un campo restringido → 403, nada escrito
- GIVEN la misma sesión sin Comercial
- WHEN el mismo `PATCH` trae además `fechaFacturaCompra` distinta de la guardada
- THEN responde `403`
- AND ni `fechaFacturaCompra` ni `driveUrl` quedan escritos

#### Scenario: Comercial o administrador cambia los tres restringidos
- GIVEN una sesión con área Comercial (o `isAdmin`)
- WHEN se envía un `PATCH` que cambia `fechaFacturaCompra`, `finGarantia` y `mantenedorId`
- THEN responde `200` y los tres quedan escritos

#### Scenario: El escalón A (mantenedor inexistente) gana a la guarda de área
- GIVEN una sesión sin Comercial ni admin
- WHEN envía un `PATCH` cuyo `mantenedorId` no resuelve a ningún cliente de Books, y además distinto del
  guardado
- THEN responde `422` (`'Mantenedor no encontrado'`, escalón A) y no `403` (área, escalón B)

#### Scenario: El escalón B gana al 422 de contenido cuando compiten
- GIVEN una sesión sin Comercial ni admin
- WHEN envía `fechaFacturaCompra` con formato inválido (incumple `AAAA-MM-DD`) y además distinta de la
  guardada
- THEN responde `403` (área, escalón B) y **no** `422` (formato, escalón C, RQ-HV-03)

### Requirement: RQ-HV-10 · Registro de cambios de los seis campos: sólo inserción, uno por campo que cambia de verdad, legible desde la hoja de vida

El sistema **SHALL**, en la misma transacción que el `UPDATE` del `PATCH` (`routes/equipos.ts:113-119`),
insertar una fila de registro por cada uno de los seis campos cuyo valor normalizado cambie de verdad
(mismo criterio de RQ-HV-09, extendido a los tres campos libres), con persona (usuario de la sesión), fecha
y hora, valor anterior y valor nuevo. **MUST NOT** insertar fila para un campo que no cambia. El registro
**SHALL** ser de sólo inserción (M11.4, «tabla inmutable de auditoría») y **SHALL** sobrevivir al borrado
físico del equipo (`DELETE /api/equipos/:id`, `:125-130` → `deleteEquipo`, `db/equipos.ts:158-160`): sin
`ON DELETE CASCADE` hacia el registro. El sistema **SHALL** exponer ese registro a la hoja de vida mediante
un endpoint autenticado — ampliar `GET /api/equipos/:id/historial` (`:38-42`) o uno propio, lo decide
`design.md` —, ordenado del cambio más reciente al más antiguo.

#### Scenario: Un PATCH que cambia dos de los seis campos deja dos filas
- GIVEN un equipo existente
- WHEN un `PATCH` autorizado cambia `codigoInterno` y `driveUrl`, y no toca los otros cuatro
- THEN quedan exactamente dos filas nuevas de registro, una por cada campo cambiado
- AND los otros cuatro campos no generan fila

#### Scenario: Un PATCH que no cambia nada no genera registro
- GIVEN un equipo cuyos seis campos ya tienen valor
- WHEN se envía un `PATCH` con los seis campos IGUALES a los guardados
- THEN responde `200` y no se inserta ninguna fila de registro

#### Scenario: El registro sobrevive al borrado del equipo
- GIVEN un equipo con filas de registro ya escritas
- WHEN un administrador lo borra (`DELETE /api/equipos/:id`)
- THEN las filas del registro siguen existiendo tras el borrado

#### Scenario: La hoja de vida lee el registro, más reciente primero
- GIVEN un equipo con tres cambios registrados en momentos distintos
- WHEN se pide el registro desde la hoja de vida
- THEN se devuelven las tres filas, ordenadas del cambio más reciente al más antiguo

### Requirement: RQ-HV-11 · El alta —por sus dos vías— no aplica la guarda de área ni genera registro de cambios

El sistema **SHALL** eximir el alta de la guarda de RQ-HV-09 y **MUST NOT** generar filas de registro
(RQ-HV-10) para los campos con los que se crea un equipo (supuestos a1, c5 de `edicion-comercial-equipo`):
el registro documenta sólo cambios sobre un equipo YA existente. Esto cubre las DOS vías de alta: `POST
/api/equipos` (`:48-71`) y la creación de equipo provisional dentro de `POST /api/tickets` con
`clasificaciones = 'Equipo nuevo'` (`tickets-core` RQ-TC-15/RQ-TC-16). Este requisito documenta, por
primera vez en `hojas-vida`, que esa segunda vía escribe los seis campos comerciales:
`crearTicketConEquipo` (`apps/desk/server/services/equipoNuevo.ts:80-92`) crea el equipo en transacción con
los datos recogidos por `exigirEquipoNuevo` (`:49-59`) y validados por `validarCamposEquipoNuevo`
(`:69-73`), que reutiliza `camposHojaDeVida` (`routes/equipos.ts:164-211`).

#### Scenario: Alta directa con los tres campos restringidos, sesión sin Comercial
- GIVEN una sesión sin área Comercial ni admin
- WHEN se envía `POST /api/equipos` con `fechaFacturaCompra`, `finGarantia` y `mantenedorId`
- THEN responde `201`, sin `403`, y no se genera ninguna fila de registro

#### Scenario: Alta de ticket con «Equipo nuevo», sesión sin Comercial
- GIVEN `clasificaciones = 'Equipo nuevo'`, sin `equipoId`, datos comerciales completos, sesión sin área
  Comercial
- WHEN se crea el ticket
- THEN responde `201`, el equipo se crea con esos datos comerciales, y no se genera ninguna fila de
  registro

### Requirement: RQ-HV-12 · Botón «Editar» en la hoja de vida, con los tres campos restringidos en solo lectura sin Comercial

`HojaDeVida.tsx` **SHALL** ganar un botón «Editar» que reutilice el mismo formulario que la lista
(`EquipoForm`, `apps/desk/src/components/EquiposAdmin.tsx:97`), y los tres campos restringidos
(`fechaFacturaCompra`, `finGarantia`, `mantenedorId`) **SHALL** renderizarse en solo lectura para una
sesión sin área Comercial ni administrador — comodidad legítima bajo la regla 13.3 sólo porque el servidor
la impone y lo prueba (RQ-HV-09). La hoja de vida **SHALL** ganar una sección «Cambios» que muestre el
registro de RQ-HV-10.

#### Comprobaciones de persona de RQ-HV-12 — NO son escenarios automáticos

> Misma razón que RQ-HV-07: son afirmaciones sobre el DOM de `HojaDeVida.tsx`, y los `.tsx` quedan fuera de
> la red de pruebas por decisión de Gerencia F0-00 (`vitest.config.ts:16-20`). **Dueño:** Comercial/Gerencia,
> verificación manual en staging. **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1.** GIVEN la hoja de vida de un equipo · WHEN se abre · THEN hay un botón «Editar» que abre el
  formulario.
- **Persona-2.** GIVEN una sesión sin área Comercial ni admin · WHEN abre el formulario de edición · THEN
  los tres campos restringidos están en solo lectura.
- **Persona-3.** GIVEN un equipo con cambios registrados · WHEN se abre su hoja de vida · THEN la sección
  «Cambios» enseña esas filas.

---

## 2 · Fuera de alcance de esta spec

- **Carga retroactiva del parque ya sembrado** — comprobación de persona, no tarea de esta tanda
  (`openspec/changes/hojas-vida/proposal.md`, sección «Comprobaciones de persona»).
- **La guarda del mantenedor sobre la orden de venta** → F1B-11. **IV-8 no se cierra aquí**
  (`openspec/config.yaml:1788-1790`).
- **Cálculo automático de garantía y alertas**, **marca de visibilidad por campo** para el portal, y
  **almacenamiento propio de documentos** — gate cerrado a favor del enlace (`config.yaml:1721-1722`).
- **Restringir el ALTA** (`POST /api/equipos` y el alta de equipo provisional desde `POST /api/tickets`,
  RQ-HV-11) por área — sigue sin filtro, a propósito (supuesto a1 de `edicion-comercial-equipo`). Cambiar
  los tres campos comerciales restringidos de un equipo YA existente sí está sujeto a guarda de área
  desde RQ-HV-09.
- **`tickets.codigo_interno`, `tickets.fecha_factura`, `tickets.doc_almacenada_drive`** — nociones
  distintas del ticket, no se tocan (`packages/zoho-sync/src/db/repo.ts:47`, `:50`, `:53`).
