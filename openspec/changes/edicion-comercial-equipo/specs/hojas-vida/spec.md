# Delta for hojas-vida

Segundo y último cambio de F1B-14 «Alta y edición del equipo» (`decision/edicion-datos-comerciales-equipo`,
`openspec/config.yaml:2775-2790`). Añade la guarda de área sobre tres de los seis campos comerciales del
equipo, su registro de cambios, la lectura de ese registro y el botón «Editar» de la hoja de vida.
Documenta además, por primera vez en esta capacidad, la vía de escritura abierta por el primer cambio de
la fila (W2, `archive/2026-09-24-alta-equipo-nuevo-en-ticket/archive-report.md:128-134`).

## ADDED Requirements

### Requirement: RQ-HV-09 · Guarda de área en el servidor sobre los tres campos comerciales restringidos, medida contra el cambio real

El sistema **SHALL** exigir área Comercial o `isAdmin` (`apps/desk/server/auth/users.ts:27`, el
administrador recibe las tres áreas) para que un `PATCH /api/equipos/:id`
(`apps/desk/server/routes/equipos.ts:73`) escriba `fechaFacturaCompra`, `finGarantia` o `mantenedorId`.
«Cambiar» **SHALL** medirse contra el valor ya guardado (`getEquipoFull`, `apps/desk/server/db/equipos.ts:169-172`).
La clave **AUSENTE** del cuerpo **MUST NOT** contar como cambio ni tocar el campo — mismo criterio que ya
sigue `camposHojaDeVida` (`routes/equipos.ts:135-137`: `undefined` no entra en `campos`) y el resto del
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
`camposHojaDeVida`, `:147-155`) son escalón **A**, igual que `:24`/`:27` equipo y `:39` OV no encontrada en
la propia tabla canónica; la excepción A/C de `transitions-st/spec.md:763-765` (un `clientId` YA RESUELTO)
no aplica aquí, porque estos tres llegan sin resolver. El `403` de esta guarda **SHALL** ejecutarse después
del `404` de equipo inexistente (`:75`) y de esos `422` de escalón A, y **antes** de cualquier `422` de
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

El sistema **SHALL**, en la misma transacción que el `UPDATE` del `PATCH` (`routes/equipos.ts:99`),
insertar una fila de registro por cada uno de los seis campos cuyo valor normalizado cambie de verdad
(mismo criterio de RQ-HV-09, extendido a los tres campos libres), con persona (usuario de la sesión), fecha
y hora, valor anterior y valor nuevo. **MUST NOT** insertar fila para un campo que no cambia. El registro
**SHALL** ser de sólo inserción (M11.4, «tabla inmutable de auditoría») y **SHALL** sobrevivir al borrado
físico del equipo (`DELETE /api/equipos/:id`, `:105-110` → `deleteEquipo`, `db/equipos.ts:158-160`): sin
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
(`:69-73`), que reutiliza `camposHojaDeVida` (`routes/equipos.ts:144-189`).

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
(`EquipoForm`, `apps/desk/src/components/EquiposAdmin.tsx:95`), y los tres campos restringidos
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

## Nota de fusión — §2 «Fuera de alcance» de la spec viva (no es un `Requirement`)

`openspec/specs/hojas-vida/spec.md:180-181` dice hoy:

> - **Permisos por área** para escribir equipos: hoy basta `requireAuth`
>   (`routes/equipos.ts:48`, `:73`); esta spec no lo cambia.

Deja de ser cierto desde este cambio. En la fusión (`sdd-archive`), sustitúyase por:

> - **Restringir el ALTA** (`POST /api/equipos` y el alta de equipo provisional desde `POST /api/tickets`,
>   RQ-HV-11) por área — sigue sin filtro, a propósito (supuesto a1 de `edicion-comercial-equipo`). Cambiar
>   los tres campos comerciales restringidos de un equipo YA existente sí está sujeto a guarda de área
>   desde RQ-HV-09.

El resto de §2 (líneas 174-179, 182-183) no cambia.
