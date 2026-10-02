# Capacidad `permissions` — quién puede hacer qué

| Dato | Valor |
|---|---|
| Capacidad | `permissions` (`openspec/config.yaml:133-135`) |
| Estado | **as-built por área** (`status_at_start` de `config.yaml`), contrastado contra el código |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas |
| Tanda que la escribe | F0-02 |
| Contenido | **11** requisitos (`RQ-PM-01`…`RQ-PM-11`, §§1–3) · **4** entradas de comportamiento actual (§4.1–§4.4) · **6** discrepancias diseño↔código (D-1…D-6) y **3** maestro↔código (M-1…M-3) |
| Diseños de procedencia | `docs/superpowers/specs/2026-06-04-subsistema-h2-roles-permisos-design.md` (133 líneas) · `…-h1-auth-usuarios-design.md`. Ampliados por `2026-08-12-rol-en-alta-usuario-design.md`, `…-cargo-empresa-en-alta-usuario-design.md`, `…-editar-usuario-design.md`, `…-eliminar-usuario-design.md`. **Histórico congelado** (plan R01.1:382) |
| Apartados del maestro | **M1.9.1** (`R08.1.md:1614-1650`), con el `[AS-BUILT]` en `:1636` y el `[ABIERTO — R05]` de los tres niveles en `:1637-1650` · M1.9.2 (`:1651-1666`) para el dato que C10 necesita |
| Tandas que la tocan | **F1C-05** (permisos finos: cargo y propietario, corrección **C10**, punto abierto nº 39) |
| Depende de | `transitions-st` (el `area` de cada transición y la matriz probada) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, **hipótesis** delante de lo demás.
El diseño de junio no es autoridad; cuando discrepa del código, manda el código y la discrepancia se
escribe (§5).

### Las tres fuentes, enfrentadas

| Concepto | Diseño (04/06) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Unidad de permiso | «**Área responsable** de la transición» (`design H2:19`) | M1.9.1 `[AS-BUILT]`: «Cada transición declara el área o áreas que pueden ejecutarla» (`:1636`) | `canExecuteTransition` (`packages/shared/src/permissions.ts:4-6`), siete líneas |
| Alcance | «**Solo transiciones**; visualización/edición/responder por rol → futuro» (`design H2:26`) | M1.9.1 `[DECIDIDO]`: «Cada usuario ve solo los estados y transiciones de su rol» (`:1615`) | Transiciones **y** responder **y** administración. La visibilidad de tickets **no**: decidida en contra (`apps/desk/src/lib/boardView.ts:29-32`) |
| Rol por usuario | «**Uno** (`users.role_id`, nullable)» (`design H2:23`) | — | Uno (`packages/zoho-sync/src/db/schema.sql:89`, `:112`) |
| Campos del rol | `id`, `name`, `areas`, `active` (`design H2:49-56`) | — | Los cuatro **más `recibe_avisos`** (`schema.sql:143`; `apps/desk/server/auth/roles.ts:5`) |
| Granularidad que el as-is pide | No la contempla | M1.9.1 `[ABIERTO — R05]`: tres niveles —área, **cargo**, **propietario del registro**— «hoy se aplanan en uno» (`:1637-1649`) | Sólo **área**. `cargo` existe como dato pero **no gobierna ningún permiso** |

---

## 1 · La regla de permiso

### RQ-PM-01 · Un solo sitio para la regla

El permiso para ejecutar una transición **SHALL** calcularse con
`canExecuteTransition(userAreas, isAdmin, transitionArea)` y **MUST NOT** existir en ningún otro
sitio (`packages/shared/src/permissions.ts:4-6`; maestro M1.9.1 `[AS-BUILT]`, `:1636`: «viven en
`packages/shared/src/permissions.ts`, en un solo sitio y no repartidos por la interfaz»).

Es una función **pura**, sin dependencias de base ni de red, y **SHALL** ser la misma en cliente y
servidor. El cliente la **consume**; **MUST NOT** reescribirla (regla invariable 1 de `CLAUDE.md`).

### RQ-PM-02 · Tres áreas base, y las compuestas se descomponen

Las áreas base **SHALL** ser exactamente tres: `Comercial`, `Servicio Técnico`, `Compras`
(`packages/shared/src/transitions.ts:310`).

- Un área compuesta **SHALL** descomponerse por el separador `' / '`
  (`packages/shared/src/transitions.ts:313-315`).
- Un usuario **MAY** ejecutar una transición compuesta si tiene **al menos una** de sus áreas
  (`permissions.ts:6`, el `.some(...)`).
- «Gerencia» / Director **MUST NOT** ser un área nueva: es un rol con las tres
  (`design H2:21`, y lo cumple `roles.ts:13-16`, que sólo admite áreas de `AREAS`).

### RQ-PM-03 · La matriz completa, probada contra el servidor

La matriz de área × transición **SHALL** ser **31 × 3 = 93 casos: 55 prohibidos y 38 permitidos**
(24 transiciones de área simple × 2 áreas prohibidas + 7 compartidas × 1)
(`apps/desk/server/permisos.test.ts`). La función pura de área conserva el mismo reparto 55/38.
(Previously, tras F1C-09 y hasta F1C-10: 31 × 3 = 93 casos, 54 prohibidos y 39 permitidos, con 23 de área
simple y 8 compartidas. Antes de F1C-09: 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área
simple; el barrido de cargo pasa de 816 a 744 combinaciones y **no** cambia en F1C-10.)

- La matriz **MUST** derivarse del grafo y no escribirse a mano: escrita a mano, la transición que añada una
  tanda futura no tendría fila y nadie se enteraría (`permisos.test.ts:24-27`).
- El **total** sí **SHALL** ir escrito a mano, porque una matriz derivada de un grafo vacío también daría
  verde (`permisos.test.ts:26-27`, `:70`).
- **MUST** probarse contra el servidor y no contra la función pura: el `403` lo lanza
  `ticketService.ts:129-130`, y hay tres guardas por delante que se comen la respuesta
  (`permisos.test.ts:29-33`). Cada ticket se coloca en `t.from[0]`, un estado válido.
- Un administrador **MAY** ejecutar las 31 sin que su área importe (`permissions.ts:5`; probado contra el
  servidor en `permisos.test.ts:89-109`, con un usuario cuyo rol **no** cubre ninguna transición).
  (Previously: las 34.)
- La matriz HTTP con cargo **SHALL** diferir de la matriz de área en **exactamente UN** caso: Comercial sin
  cargo × `liberacion_sin_factura` (200 en área, 403 con cargo). Esa diferencia **MUST** estar afirmada, para
  que el `esperado` no sea tautológico. El barrido cargo × área × transición **SHALL** seguir siendo de 744
  combinaciones.
- La matriz compuesta sin cargo (área y cargo a la vez) **SHALL** repartirse en **56 prohibidos y 37
  permitidos** sobre las mismas 93 celdas. (Previously: 55 prohibidos y 38 permitidos.)
- `rechazo_cliente` **SHALL** ser de área simple `Comercial`: un usuario cuyo rol sólo tenga `Servicio
  Técnico` **MUST** recibir `403` al ejecutarla. `rechazo_comercial` y `rechazo_revision` **SHALL**
  conservar `Comercial / Servicio Técnico`.

**Y de aquí sale la legitimidad del espejo del cliente.** Con esta matriz probada,
`apps/desk/src/components/TransitionPanel.tsx:56-58` es **comodidad legítima** bajo la regla invariable 13:
la frontera está impuesta y probada en el servidor (`permisos.test.ts:35-39`). F1C-10 no toca ningún `.tsx`:
el panel consume `puedeEjecutarTransicion` de `@ambientalia/shared` y el cambio de área le llega por el
catálogo.

#### Scenario: la matriz de área tiene 93 casos
- GIVEN la matriz de área sin cargo
- WHEN se cuenta
- THEN son 93 casos, 55 prohibidos y 38 permitidos

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Compras`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde `Por Facturar`
- THEN el servidor responde `403` y el mensaje nombra el área que hacía falta

#### Scenario: exactamente un caso difiere
- GIVEN la matriz HTTP con cargo y la matriz de área
- WHEN se comparan las 93 celdas
- THEN difiere una sola: Comercial sin cargo × `liberacion_sin_factura`, de 200 a 403

#### Scenario: el reparto por área simple tiene siete compartidas
- GIVEN las 31 transiciones
- WHEN se clasifican por área
- THEN 24 son de área simple y 7 compartidas, y 24×2 + 7 = 55 prohibidos
  (Previously: 23 de área simple y 8 compartidas, 23×2 + 8 = 54)

#### Scenario: la matriz compuesta sin cargo reparte 56 y 37
- GIVEN la matriz compuesta de área y cargo, con usuarios sin cargo
- WHEN se cuentan sus 93 celdas
- THEN son 56 prohibidos y 37 permitidos
  (Previously: 55 prohibidos y 38 permitidos)

#### Scenario: Servicio Técnico recibe 403 en rechazo_cliente
- GIVEN un ticket en `Notificación cliente` y un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `403`, el ticket no cambia de estado y no se inserta fila en `ticket_transitions`

#### Scenario: Comercial y administrador ejecutan rechazo_cliente
- GIVEN un ticket en `Notificación cliente`
- WHEN un usuario del área `Comercial`, y por separado un administrador, ejecutan `rechazo_cliente`
- THEN ambos reciben `200` y el ticket pasa a `Por Facturar`

#### Scenario: las otras dos Rechazo siguen admitiendo a Servicio Técnico
- GIVEN un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN ejecuta `rechazo_comercial` desde `Notificación Comercial` y `rechazo_revision` desde `Rev./Diagnostico`
- THEN las dos responden `200`

#### Scenario: una de las tres retiradas ya no tiene fila de matriz
- GIVEN la matriz derivada del grafo
- WHEN se busca una fila de `marcar_pendiente`
- THEN no existe, y la mutación de reponerla sube el total a 96 y pone el total escrito a mano en rojo

#### Scenario: mutación — devolver rechazo_cliente a Comercial / Servicio Técnico pone la matriz en rojo
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la suite
- THEN fallan el total de la matriz de área (54/39 en lugar de 55/38), el de la matriz compuesta (55/38 en lugar de 56/37) y la prueba del `403`


---

## 2 · Identidad: usuarios, roles y sesiones

### RQ-PM-04 · Las áreas efectivas se resuelven, no se guardan

Las áreas de un usuario **SHALL** derivarse en cada lectura y **MUST NOT** persistirse en la fila del
usuario ni en la sesión (`apps/desk/server/auth/users.ts:19-32`, `rowToPublicUser`):

| Caso | `areas` | `roleName` |
|---|---|---|
| `is_admin = true` | **las tres** (`[...AREAS]`) | el del rol, si lo tiene |
| Rol **activo** | las del rol | el del rol |
| Sin rol, o rol **inactivo** | **`[]`** | `null` |

Evidencia: `users.ts:27` para las áreas, `:26` para el nombre. El `LEFT JOIN roles` está en el
`USER_SELECT` (`users.ts:14-16`) y en `getSessionUser` (`auth/sessions.ts:16-23`).

- Consecuencia que **SHALL** quedar escrita: desactivar un rol deja a sus usuarios sin poder
  transicionar, sin tocar sus sesiones (`design H2:113`). Cambiar el rol **SHALL** aplicar al recargar
  (`design H2:72-73`).
- Un no-admin sin rol **MUST NOT** poder ejecutar transiciones, y **MAY** ver el tablero
  (`design H2:25`; `users.ts:27` devuelve `[]`, y `permissions.ts:6` no encuentra nada que casar).

> **Given** un usuario con un rol que cubre `Comercial`
> **When** un administrador desactiva ese rol
> **Then** su sesión sigue válida y sus áreas pasan a `[]` en la siguiente lectura, así que ninguna
> transición le queda permitida.

### RQ-PM-05 · Un rol sólo puede tener áreas que existan

`createRole` y `updateRole` **SHALL** filtrar las áreas recibidas contra `AREAS` y descartar lo demás
en silencio (`auth/roles.ts:13-16`, `validAreas`; usado en `:21` y `:44`).

- El nombre **SHALL** ser único (`schema.sql:105`, `name text UNIQUE NOT NULL`) y **SHALL**
  normalizarse con `trim()` (`roles.ts:21`, `:43`).
- `areas` **SHALL** guardarse como `jsonb` con `DEFAULT '[]'::jsonb` (`schema.sql:106`).

### RQ-PM-06 · El correo es la identidad de acceso, y se normaliza

El correo **SHALL** normalizarse a minúsculas y sin espacios **en el alta y en la edición**
(`auth/users.ts:11`, aplicado en `:42` y `:93`), y **SHALL** ser único
(`schema.sql:84`, `email text UNIQUE NOT NULL`).

La razón **SHALL** quedar escrita: dos grafías del mismo buzón serían dos usuarios distintos para
`getUserByEmail` (`users.ts:91-92`).

### RQ-PM-07 · Contraseñas y sesiones

- La contraseña **SHALL** guardarse como hash `bcrypt` con coste **10** y **MUST NOT** guardarse en
  claro (`auth/passwords.ts:3-5`; la columna es `password_hash text NOT NULL`, `schema.sql:86`).
- El hash **MUST NOT** salir al cliente: `UserWithHash` es el tipo interno de verificación y está
  marcado como tal (`users.ts:6-9`); lo que se devuelve es `UserPublic` (`users.ts:19-32`).
- El token de sesión **SHALL** ser 32 bytes aleatorios en hexadecimal (`auth/sessions.ts:9`) y
  **SHALL** caducar a los **30 días** (`sessions.ts:6`, `:10`).
- Una sesión **SHALL** ser válida sólo si no ha caducado **y** el usuario sigue activo:
  `WHERE s.token = $1 AND s.expires_at > now() AND u.active = true` (`sessions.ts:21`). Dar de baja a
  alguien le corta el acceso sin borrar su sesión.
- `deleteUserSessions` **SHALL** existir para cerrar todas las sesiones de una persona
  (`sessions.ts:31-33`).

### RQ-PM-08 · Las tres guardas de Express

| Guarda | Qué exige | Rechaza con | Evidencia |
|---|---|---|---|
| `requireAuth(db)` | cookie `sid` que resuelva a una sesión válida; adjunta `req.user` | `401` | `auth/middleware.ts:14-23` |
| `requireAdmin` | `req.user.isAdmin` | `403` | `:26-29` |
| `requireArea` | ser admin **o** tener al menos un área — **no mira cuál** | `403` | `:32-35` |

- Las tres **SHALL** probarse directamente y **SHALL** comprobarse **siempre** que `next` no se llamó
  al rechazar: «un middleware que responde 403 y además deja pasar la petición es exactamente el fallo
  que no se ve en una prueba de estado» (`permisos.test.ts:112-121`, pruebas en `:122-206`).
- `requireArea` **SHALL** dejar pasar al administrador aunque no tenga ningún área: es la excepción
  escrita en la guarda (`middleware.ts:33`; probado en `permisos.test.ts:199`).

---

## 3 · Administración

### RQ-PM-09 · La administración de usuarios y roles es sólo de administradores

Todas las rutas de administración **SHALL** ir detrás de `requireAuth` **y** `requireAdmin`
(`apps/desk/server/auth/routes.ts`):

| Ruta | Línea |
|---|---|
| `GET /api/users` | `:51` |
| `POST /api/users` | `:55` |
| `PATCH /api/users/:id` | `:74` |
| `DELETE /api/users/:id` | `:129` |
| `GET /api/roles` | `:150` |
| `POST /api/roles` | `:154` |
| `PATCH /api/roles/:id` | `:164` |

Las de sesión propia **SHALL** exigir sólo sesión: `POST /api/auth/logout` (`:29`),
`GET /api/auth/me` (`:36`), `POST /api/auth/change-password` (`:38`). `POST /api/auth/login` (`:17`)
**MUST NOT** exigir ninguna.

### RQ-PM-10 · No se puede quedar el sistema sin administrador

`countActiveAdmins` **SHALL** existir para impedirlo, y su razón va escrita en el propio nombre y
comentario (`auth/users.ts:111-115`).

### RQ-PM-11 · Una persona con historial no se borra

`borrarUsuario` **SHALL** rechazar el borrado si la persona tiene referencias **por id**, lanzando
`UsuarioEnUso` con el recuento delante (`users.ts:118-123`, `:151-153`), que la ruta traduce a `409`.

Las referencias que cuentan **SHALL** ser dos, y **la segunda es la que importa**
(`users.ts:125-140`):

1. `tickets.derivado_a` (`users.ts:137`).
2. `ticket_transitions.values->>'derivado_a'` (`users.ts:138`) — el rastro de auditoría que enseña el
   panel de Historia. Borrar a alguien derivado alguna vez dejaría ese panel mostrando un UUID crudo
   para siempre, «y reescribir el `values` para evitarlo sería falsificar la auditoría»
   (`users.ts:128-131`).

Lo que guarda el **nombre** —quién ejecutó la transición, quién firmó la remisión— **MUST NOT**
contarse: es texto y sobrevive al borrado (`users.ts:133-134`).

Cuando sí se borra, el orden **SHALL** ser: sesiones, avisos, lecturas, y **la fila del usuario la
última** (`users.ts:154-157`). La razón: el esquema no tiene claves foráneas, así que un fallo a
medias con este orden deja a la persona existiendo con menos estado personal —molesto, nunca
corrupto—, y al revés dejaría justo los huérfanos que esto viene a evitar (`users.ts:142-150`).

`listPersonas` **SHALL** ser una consulta aparte de `listUsers` y **MUST NOT** ser un filtro sobre
ella: `listUsers` alimenta la consola de administración y `listPersonas` lo pide cualquiera que
ejecute una transición; reutilizarla «publicaría el modelo de autorización entero a todo el mundo por
comodidad» (`users.ts:63-81`). Sólo devuelve los activos (`:75`).

## 3 bis · Cargo de permiso (F1C-05, `permisos-por-cargo`, archivado el 2026-09-30)

Nivel CARGO de C10. El cargo **sólo restringe** (`decision/c10-permisos-cargo`, `openspec/config.yaml:1927-1947`); los siete nombres son los de `decision/c10b-gerente-director` (`:2589`).

### RQ-PM-12 · Siete cargos, lista cerrada en `shared`

El sistema SHALL declarar en `packages/shared` una lista cerrada de exactamente siete cargos, con estos nombres
exactos: `Director Técnico`, `Coordinador Técnico`, `Técnico`, `Técnico de campo`, `Director Comercial`,
`Coordinador Comercial`, `Asistente Comercial`. «Gerente comercial» MUST NOT figurar: es el nombre informal de
Director Comercial. La lista SHALL existir en un solo sitio y el cliente la MUST consumir.

#### Scenario: la lista tiene siete entradas exactas
- GIVEN la lista de cargos de `shared`
- WHEN se enumera
- THEN tiene siete elementos, iguales y en ese orden a los de `decision/c10b-gerente-director`
- AND «Gerente comercial» no pertenece a ella

### RQ-PM-13 · Columna `cargo_permiso`, separada del cargo de firma

`public.users` SHALL tener una columna `cargo_permiso`, nullable y distinta de `users.cargo`. La migración SHALL ser
una sentencia `ALTER TABLE public.users` calificada, que se añadió al final de `schema.sql` en `29f65d1`; las tandas
posteriores añaden sus sentencias DETRÁS de ella y MUST NOT insertar ninguna por delante. `users.cargo` (texto libre
que firma la remisión) MUST NOT actuar como autoridad de permiso, ni siquiera si su texto coincide con un cargo de la
lista.
(Previously: la migración tenía que ser la última sentencia del fichero; `prioridad-top5-cliente` añade dos tablas y un
índice detrás, al final, para no desplazar ninguna cita.)

#### Scenario: el cargo de firma no da permiso
- GIVEN un usuario con `cargo = 'Director Comercial'` y `cargo_permiso` nulo
- WHEN ejecuta `liberacion_sin_factura`
- THEN recibe `403`

#### Scenario: la migración está calificada y detrás de todo lo que había en `29f65d1`
- GIVEN `schema.sql`
- WHEN se recorren sus `ALTER TABLE`
- THEN el de `cargo_permiso` es `public.users`, calificado y sin `CHECK`
- AND es la última de las sentencias que existían en `29f65d1`: nada se ha insertado por delante de ella
- AND lo que va detrás son sólo sentencias añadidas después de `29f65d1`
- AND el guardián de `migrate.test.ts` sigue en verde

### RQ-PM-14 · Valor fuera de lista se lee como sin cargo

Un `cargo_permiso` leído de la base que no pertenezca a la lista SHALL tratarse como «sin cargo» (falla cerrado). La
base MUST NOT llevar `CHECK` de la lista (S-3).

#### Scenario: valor desconocido en base
- GIVEN un usuario con `cargo_permiso = 'Gerente comercial'` escrito directamente en base
- WHEN el sistema construye su usuario público y evalúa un permiso de cargo
- THEN su cargo de permiso es «sin cargo» y no ejecuta la excepción

### RQ-PM-15 · Alta y edición validan el cargo en servidor; sólo admin lo cambia

`POST /api/users` y `PATCH /api/users/:id` SHALL aceptar `cargoPermiso` sólo si es un cargo de la lista, `null` o
cadena vacía (que se guarda como `null`); cualquier otro valor SHALL responder `422`. Un no administrador MUST
recibir `403` en ambas rutas.

#### Scenario: cargo inválido
- GIVEN un administrador autenticado
- WHEN envía alta o edición con `cargoPermiso: 'Gerente comercial'`
- THEN responde `422` y no se escribe la fila

#### Scenario: no admin
- GIVEN un usuario no administrador con cualquier cargo
- WHEN intenta cambiar `cargoPermiso` de alguien
- THEN responde `403`

#### Scenario: vaciar el cargo
- GIVEN un administrador y un usuario con cargo
- WHEN edita con `cargoPermiso: ''`
- THEN el usuario queda con `cargo_permiso` nulo

### RQ-PM-16 · La sesión trae el cargo de permiso

`getSessionUser`, `USER_SELECT` y `rowToPublicUser` SHALL devolver `cargoPermiso`, y `UserPublic` SHALL declararlo.
Una guarda sobre `req.user` MUST ver el cargo: la sesión actual no lo selecciona (`apps/desk/server/auth/sessions.ts:17`).

#### Scenario: la sesión real lleva el cargo
- GIVEN un usuario con `cargo_permiso = 'Director Comercial'` y una sesión válida
- WHEN `requireAuth` resuelve la cookie
- THEN `req.user.cargoPermiso` es `Director Comercial`

### RQ-PM-17 · `liberacion_sin_factura` exige Director Comercial

Además del área `Comercial`, ejecutar `liberacion_sin_factura` SHALL exigir el cargo `Director Comercial`. Sin él, el
servidor MUST responder `403` con mensaje que nombre ese cargo. Se impone en el servidor (`ticketService.ts:129-131`);
el cliente sólo lo espeja.

#### Scenario: Comercial sin cargo
- GIVEN un no admin del área `Comercial` sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN `403`, el mensaje nombra `Director Comercial` y el ticket no cambia

#### Scenario: Director Comercial
- GIVEN un usuario del área `Comercial` con cargo `Director Comercial`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `200`

#### Scenario: otro cargo comercial
- GIVEN un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN ejecuta `liberacion_sin_factura`
- THEN `403`

### RQ-PM-18 · Posición del 403 de cargo (escalón B)

El `403` de cargo SHALL evaluarse inmediatamente después del `403` de área y después de los `409` de flujo y de
estado, y antes de todo `422`. La suite MUST fallar si se mueve delante del `409` de estado o detrás del `422`
(regla de mutación 1).

#### Scenario: 409 antes que 403 de cargo
- GIVEN un ticket fuera de `Por Facturar` y un Comercial sin cargo
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `409`, no `403`

#### Scenario: 403 de área antes que el de cargo
- GIVEN un usuario de `Compras` sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` nombra el área, no el cargo

#### Scenario: 403 de cargo antes que 422
- GIVEN un Comercial sin cargo y valores que darían `422`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403`

### RQ-PM-19 · El administrador pasa las excepciones de cargo

Un administrador SHALL ejecutar `liberacion_sin_factura` sin tener cargo (`packages/shared/src/permissions.ts:5`,
sin cambio).

#### Scenario: admin sin cargo
- GIVEN un administrador sin `cargo_permiso`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `200`

### RQ-PM-20 · Primitivas sin llamador: OVI de garantía y Top 5

`shared` SHALL exportar `puedeCrearOVIGarantia` (Director Técnico o admin) y `puedeFijarPrioridadTop5` (Director
Comercial o admin). `puedeFijarPrioridadTop5` **tiene llamadores** desde F1B-07: las rutas de prioridad del cliente y
de ajuste por ticket (`tickets-core` RQ-TC-27 y RQ-TC-29) y la guarda de las transiciones (`transitions-st` RQ-TS-21).
`puedeCrearOVIGarantia` **sigue sin llamador**: el acto de crear OVI de garantía es de F1B-03 y no existe en el código.
La prueba de las primitivas SHALL decir cuál tiene llamador y cuál no. Este cambio MUST NOT construir el acto de la OVI
de garantía.
(Previously: «Hoy no las llama nadie», las dos sin llamador, con el Top 5 de F1B-07 aún sin construir.)

#### Scenario: por cargo y admin
- GIVEN cada uno de los siete cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

#### Scenario: sólo la del Top 5 tiene llamador
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las dos primitivas
- THEN `puedeFijarPrioridadTop5` tiene al menos uno en el servidor y `puedeCrearOVIGarantia` ninguno

### RQ-PM-21 · El cargo sólo restringe

El cargo MUST NOT conceder lo que el área niega. Un cargo SHALL únicamente añadir una condición a una transición que
el área ya permite.

#### Scenario: cargo sin área
- GIVEN un usuario de área `Servicio Técnico` con cargo `Director Comercial`
- WHEN ejecuta `liberacion_sin_factura`, de área `Comercial`
- THEN `403`

### RQ-PM-22 · Estricto mientras nadie tenga cargo (S-1)

Sin cargo asignado, nadie SHALL ejecutar una excepción salvo el administrador, sin respaldo al área. Desplegado antes
de asignar cargos, sólo los administradores liberan sin factura.

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos
- WHEN un no admin de `Comercial` ejecuta `liberacion_sin_factura`
- THEN `403` con el cargo necesario, y el admin obtiene `200`

---

### RQ-PM-23 · Un solo predicado para fijar prioridad, mantener la lista Top 5 y ajustar por ticket

Los tres actos del Top 5 —fijar la prioridad de un cliente, marcar o desmarcar el Top 5 y ajustar la prioridad de un
ticket— SHALL decidirse con `puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`) y con nada más (supuesto
S-5). Ninguna ruta del servidor MUST reescribir la regla por su cuenta. El cliente MAY ocultar esos controles con el
mismo predicado como comodidad, porque la imposición del servidor está probada (regla invariable 13, punto 3). El
predicado conserva el área `Comercial` (supuesto S-4): un Director Comercial sin área `Comercial` queda fuera.

#### Scenario: las tres rutas dan el mismo veredicto
- GIVEN cada uno de los siete cargos, «sin cargo» y admin, con área `Comercial`
- WHEN cada uno intenta fijar la prioridad de un cliente, marcar el Top 5 y ajustar un ticket
- THEN sólo Director Comercial y admin reciben `200` en las tres, y el resto `403` en las tres

#### Scenario: Director Comercial sin área Comercial
- GIVEN un usuario con cargo `Director Comercial` y sólo el área `Servicio Técnico`
- WHEN intenta cualquiera de los tres actos
- THEN responde `403`

#### Scenario: el cargo sin área no concede (RQ-PM-21)
- GIVEN un usuario de `Compras` con cargo `Director Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403`

## 4 · Comportamiento actual, a corregir

### 4.1 · C10 — dos ejes de permiso aplanados en uno · **destino F1C-05**

**Comportamiento actual, a corregir en C10** (maestro M1.9.1 `[ABIERTO — R05]`, `:1637-1650`, punto
abierto nº 39). El as-is exige tres niveles de permiso y el código sólo implementa uno:

| Nivel | Ejemplo del as-is (maestro) | Situación en el código |
|---|---|---|
| **Área** | la mayoría de transiciones (`:1642`) | Implementado (`permissions.ts:4-6`) |
| **Cargo** | `Liberación sin factura` — «sólo el gerente comercial» (`:1645`) | **Distinguido desde `permisos-por-cargo` (F1C-05, 2026-09-30), RQ-PM-17:** `liberacion_sin_factura` exige Director Comercial (`apps/desk/server/services/ticketService.ts:131`). **Antes de ese cambio — no distinguido.** Toda el área `Comercial` puede ejecutarla: `liberacion_sin_factura` declara `area: 'Comercial'` a secas (`transitions.ts:246`) |
| **Propietario del registro** | solicitud y entrega de repuestos, marcar como pendiente, finalización de servicio (`:1648`) | **No distinguido.** Cualquier técnico puede moverlo |

**El dato para el nivel de propietario ya existe** y el maestro lo dice (`:1650`): es la derivación de
M1.9.2. En el código son `tickets.derivado_a` (`schema.sql:123`) y `primerDerivado`
(`apps/desk/server/db/primerDerivado.ts:23-33`). Lo que falta no es el dato: es la regla que lo lea.

**Y el `cargo` también existe ya como dato**, sin gobernar nada: `users.cargo`
(`schema.sql:115`) se declara para el documento de remisión (`schema.sql:114`), se expone en
`UserPublic` (`users.ts:29`) y en `listPersonas` (`users.ts:79`). Ningún permiso lo consulta —
**verificado en esta tanda**: `canExecuteTransition` sólo recibe áreas e `isAdmin`
(`permissions.ts:4`).

### 4.2 · Las áreas inválidas se descartan en silencio · **destino F1C-05**

**Comportamiento actual.** `validAreas` filtra lo que no está en `AREAS` y **no informa**
(`roles.ts:13-16`). El diseño prescribía `422` para áreas inválidas (`design H2:111`, `:125`).

Un `PATCH /api/roles/:id` con `areas: ['Contabilidad']` deja el rol **sin ninguna área** y responde
como si hubiera funcionado. *Hipótesis:* la consola de administración sólo ofrece casillas de las tres
áreas, así que el caso no se alcanza por la interfaz; no se ha verificado leyendo `RolesAdmin.tsx`,
que además está fuera de la red de pruebas.

### 4.3 · La visibilidad por rol se decidió **en contra** del maestro · **destino: decisión, no código**

**Comportamiento actual, deliberado.** El maestro decide en M1.9.1 `[DECIDIDO]` que «cada usuario ve
solo los estados y transiciones de su rol» (`:1615`). Las **transiciones** sí se filtran
(`TransitionPanel.tsx:56-58`). Los **tickets** no: el servidor los devuelve todos a todo el mundo.

Y no es un olvido: está escrito y razonado en el código —«el servidor devuelve todos los tickets a
todo el mundo, y así tiene que seguir: `docs/modelo-autorizacion.md` decidió que no hay propiedad por
ticket ni segmentación de visibilidad; el equipo se cubre entre sí. La derivación dice de quién es el
trabajo, no quién puede verlo»— (`apps/desk/src/lib/boardView.ts:29-32`).

Las dos mitades de la decisión del maestro tienen destinos distintos, y la de visibilidad se decidió
al revés. **Punto a resolver por Gerencia**, no por una tanda.

### 4.4 · El filtro del tablero es de vista y vive en el cliente · **sin destino: es correcto**

Se registra para que nadie lo anote como incumplimiento de la regla 1. `applyBoardView`
(`boardView.ts:38-56`) filtra por vista en el navegador **a propósito**, y no es una guarda: no hay
nada que guardar, porque el servidor no segmenta la visibilidad (§4.3).

**La clasificación de esperas por regex ya no está en este fichero, y eso no significa que el desvío
haya desaparecido: se ha mudado.** IV-1 quedó **cerrado en `boardView.ts`** por F1B-08
(`vista-todos-y-estados-en-espera`, base `484c952`): `:2` importa `ESTADOS_EN_ESPERA` de
`@ambientalia/shared` y `:39` lo consume —`(ESTADOS_EN_ESPERA as readonly
string[]).includes(t.status ?? '')`—, de modo que la vista del tablero ya lee el registro. Lo que esa
tanda **no** tocó son las otras tres implementaciones del mismo predicado, que siguen sin leerlo:

- `apps/desk/src/components/ClienteDetalle.tsx:18` — `const esEspera = (t: TicketLite) => /espera/i.test(t.status)`
- `apps/desk/src/components/ClienteDetalle.tsx:22` — `if (/espera/i.test(t.status)) return 'bg-amber-50 …'`
- `apps/desk/src/components/TicketDetailView.tsx:245` — `/espera|hold/i.test(ticket.status)`, **tercera
  variante del predicado**: no es una copia de las otras dos, es otra noción de «está en espera».

Cerrar IV-1 sin escribir esto habría perdido a los tres supervivientes, que es exactamente el modo de
fallo que la regla de barrido de `CLAUDE.md` describe. El desvío tiene desde el 2026-09-10 **fila
propia** en `openspec/config.yaml` (`incumplimientos_vivos`, **IV-9**), y ahí es donde vive ahora; la
entrada histórica de IV-1 —cerrada— sigue en `transitions-st` §3.6 y en `config.yaml`.

---

## 5 · Discrepancias

### 5.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «Alcance: **solo transiciones**; visualización/edición/**responder** por rol → futuro» (`design H2:26`, `:130`) | `requireArea` gatea `POST /api/tickets/:id/reply` (`apps/desk/server/routes/tickets.ts:196`), y `requireAdmin` gatea usuarios, roles, anular y restaurar remisiones | **Superado.** «Responder por rol» dejó de ser futuro. La visualización sigue sin gatear, pero por decisión en contra (§4.3), no por pendiente |
| D-2 | La tabla `roles` tiene cuatro campos: `id`, `name`, `areas`, `active` (`design H2:49-56`) | Cinco: **`recibe_avisos boolean NOT NULL DEFAULT false`** (`schema.sql:143`; en el tipo, `roles.ts:5`; atajo en `:51-53`) | **Ampliado después.** Lo trajo el subsistema de avisos por correo; el rol pasó a ser también el canal de notificación. Pertenece a `derivacion-avisos` |
| D-3 | Áreas inválidas → **422**; nombre duplicado → 409; `roleId` inexistente → 422 (`design H2:111`, `:125`) | Las áreas inválidas se **descartan en silencio** (`roles.ts:13-16`). El nombre duplicado sí falla, por la restricción `UNIQUE` de la base (`schema.sql:105`) | **Parcialmente incumplido.** Registrado en §4.2 |
| D-4 | Enforcement del `403` en `server/app.ts` (`design H2:89-91`) | En `apps/desk/server/services/ticketService.ts:129-130`, llamado desde `routes/tickets.ts:192-194` | Movido, igual que el resto de la ruta de transición |
| D-5 | `users` gana sólo `role_id` (`design H2:57`) | Gana `role_id` **y** `cargo` **y** `empresa` (`schema.sql:112`, `:115-116`) | **Ampliado después** por el documento de remisión (`schema.sql:114`) y por el alta de usuario de agosto. `cargo` es además el dato que C10 necesitará (§4.1) |
| D-6 | El `403` de la transición llega «tras validar la transición y **ANTES** de aplicarla» (`design H2:89-90`) | Llega **después** del `409` de estado (`ticketService.ts:86-88` antes de `:89-91`) | El diseño no fija el orden frente al estado, y el código eligió uno que informa del estado a quien no tiene el área. Es una de las dos inversiones de precedencia: `transitions-st` §3.8 b) |

### 5.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.9.1 (`:1636`): «**Diez** de las 34 transiciones son compartidas por dos áreas» | **Ocho** (`transitions.ts:171-256` en `fd253aa`; emparejamiento en `invariantesGrafo.test.ts:91-106`; reparto 26/8 en `permisos.test.ts:72-73` en `fd253aa`) | **Ya registrada en F0-01** (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:129`, desarrollada en `:142-167`) y re-confirmada en F0-02. Aquí importa por su efecto directo: con diez, la matriz de F1C-05 sale 58/44 en vez de 60/42 |
| M-2 | M1.9.1 `[DECIDIDO]` (`:1615`): «Cada usuario ve solo **los estados y transiciones** de su rol» | Transiciones sí; tickets no, por decisión escrita en contra (`boardView.ts:29-32`) | Las dos mitades tienen destinos distintos. Registrado en §4.3. **Punto a resolver por Gerencia** |
| M-3 | M1.9.1 `[DECIDIDO]` (`:1617`): «Las prioridades las define Comercial al inicio…; **se bloquea su edición por los técnicos**» | **No hay bloqueo por cargo ni por área sobre la prioridad.** `priority` es un campo de transición con `target: 'priority'` (`transitions.ts:83-84`), presente en `escalado_a_revision` (`:193`) y `devolucion_a_correccion` (`:195`), **las dos de área `Servicio Técnico`** | **Incumplido, y es un caso concreto de C10.** Hoy un técnico cambia la prioridad en las dos etapas donde el campo aparece. El maestro añade en R08 que el resto de prioridades las asigna «sólo superadministrador o Director Técnico» (`:1631`), que es permiso por **cargo** — el eje que no existe. **Destino F1C-05**, y conviene que la corrección lo nombre explícitamente |

---

## 6 · Fuera de alcance de esta spec

- **El `area` de cada transición, las ocho compartidas y el grafo** → `transitions-st`. Aquí sólo está
  la regla que las lee (RQ-PM-01, RQ-PM-02) y la matriz (RQ-PM-03).
- **La casilla «Derivado a» y a quién propone cada etapa** → `transitions-st` RQ-TS-12. Aquí sólo está
  que su id es lo que impide borrar a una persona (RQ-PM-11).
- **`roles.recibe_avisos` y el cálculo de destinatarios** → `derivacion-avisos`. Aquí sólo está que la
  columna existe y que el diseño no la contemplaba (D-2).
- **El alta de tickets y quién puede crearlos** → `tickets-core` RQ-TC-05.
- **El historial y el panel de Historia** → `trazas`. Aquí sólo está que su `values` es el rastro que
  protege a una persona del borrado (RQ-PM-11).
- **La pantalla de administración de usuarios y roles** (`UsersAdmin.tsx`, `RolesAdmin.tsx`) queda
  descrita sólo por sus endpoints (RQ-PM-09).
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). Todo requisito que
  cite un `.tsx` describe código **no cubierto por pruebas**.
- **F1C-05 · fuera:** Regla de las transiciones Decisionales: depende de F1C-04 (plan `:177`; `openspec/config.yaml:1939`).
- **F1C-05 · fuera:** Propietario del registro (tercer nivel): aplazado por c10 (`config.yaml:1936`, `:1942`); por eso `cierra: no`.
- **F1C-05 · fuera:** Migrar alarmas y derivación (`destinatariosDeCargo`, `apps/desk/src/lib/personas.ts:74-78`) al cargo nuevo.
- **F1C-05 · fuera:** Motivo y Fecha prevista de la Liberación sin factura: F1C-02 (`decision/anexo-33-checkbox`, `config.yaml:2388`).
- **F1C-05 · fuera:** Construir la OVI de garantía: F1B-03 (`config.yaml:2349`). Top 5 y su edición: F1B-07 (`config.yaml:1958`).
- **F1C-05 · fuera:** Asignar `cargo_permiso` en producción: tarea de persona P.1 de la propuesta; archivar no la da por hecha.
