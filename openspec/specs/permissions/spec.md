# Capacidad `permissions` — quién puede hacer qué

| Dato | Valor |
|---|---|
| Capacidad | `permissions` (`openspec/config.yaml:110-112`) |
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
(`packages/shared/src/transitions.ts:303`).

- Un área compuesta **SHALL** descomponerse por el separador `' / '`
  (`transitions.ts:306-308`).
- Un usuario **MAY** ejecutar una transición compuesta si tiene **al menos una** de sus áreas
  (`permissions.ts:6`, el `.some(...)`).
- «Gerencia» / Director **MUST NOT** ser un área nueva: es un rol con las tres
  (`design H2:21`, y lo cumple `roles.ts:13-16`, que sólo admite áreas de `AREAS`).

### RQ-PM-03 · La matriz completa, probada contra el servidor

La matriz área × transición **SHALL** ser **34 × 3 = 102 casos: 60 prohibidos y 42 permitidos**
(26 transiciones de área simple × 2 áreas prohibidas + 8 compartidas × 1)
(`apps/desk/server/permisos.test.ts:77-82`).

- La matriz **MUST** derivarse del grafo y no escribirse a mano: escrita a mano, la transición 35 que
  añada F1B-06 no tendría fila y nadie se enteraría (`permisos.test.ts:24-27`).
- El **total** sí **SHALL** ir escrito a mano, porque una matriz derivada de un grafo vacío también
  daría verde (`permisos.test.ts:26-27`, `:70`).
- **MUST** probarse contra el servidor y no contra la función pura: el `403` lo lanza
  `ticketService.ts:89`, y hay dos guardas por delante que se comen la respuesta
  (`permisos.test.ts:29-33`). Cada ticket se coloca en `t.from[0]`, un estado válido.
- Un administrador **MAY** ejecutar las 34 sin que su área importe
  (`permissions.ts:5`; probado contra el servidor en `permisos.test.ts:89-109`, con un usuario cuyo
  rol **no** cubre ninguna transición).

**Y de aquí sale la legitimidad del espejo del cliente.** Con esta matriz probada,
`apps/desk/src/components/TransitionPanel.tsx:56-58` deja de ser un espejo sin comprobar y pasa a ser
**comodidad legítima** bajo la regla invariable 13: la frontera está impuesta y probada en el
servidor, y la pantalla sólo evita ofrecer lo que va a ser rechazado (`permisos.test.ts:35-39`).
Antes de F0-04 no lo era.

> **Given** un usuario cuyo rol sólo tiene el área `Compras`
> **When** intenta ejecutar `facturado`, de área `Comercial`, desde `Por Facturar`
> **Then** el servidor responde `403` y el mensaje nombra el área que hacía falta
> (`ticketService.ts:90`; probado en `services/ticketService.test.ts:96`).

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

---

## 4 · Comportamiento actual, a corregir

### 4.1 · C10 — dos ejes de permiso aplanados en uno · **destino F1C-05**

**Comportamiento actual, a corregir en C10** (maestro M1.9.1 `[ABIERTO — R05]`, `:1637-1650`, punto
abierto nº 39). El as-is exige tres niveles de permiso y el código sólo implementa uno:

| Nivel | Ejemplo del as-is (maestro) | Situación en el código |
|---|---|---|
| **Área** | la mayoría de transiciones (`:1642`) | Implementado (`permissions.ts:4-6`) |
| **Cargo** | `Liberación sin factura` — «sólo el gerente comercial» (`:1645`) | **No distinguido.** Toda el área `Comercial` puede ejecutarla: `liberacion_sin_factura` declara `area: 'Comercial'` a secas (`transitions.ts:246`) |
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
(`boardView.ts:34-52`) filtra por vista en el navegador **a propósito**, y no es una guarda: no hay
nada que guardar, porque el servidor no segmenta la visibilidad (§4.3).

Lo que sí es un desvío en ese mismo fichero es la clasificación de esperas por regex
(`boardView.ts:35`), que es IV-1 y pertenece a `transitions-st` §3.6.

---

## 5 · Discrepancias

### 5.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «Alcance: **solo transiciones**; visualización/edición/**responder** por rol → futuro» (`design H2:26`, `:130`) | `requireArea` gatea `POST /api/tickets/:id/reply` (`apps/desk/server/routes/tickets.ts:196`), y `requireAdmin` gatea usuarios, roles, anular y restaurar remisiones | **Superado.** «Responder por rol» dejó de ser futuro. La visualización sigue sin gatear, pero por decisión en contra (§4.3), no por pendiente |
| D-2 | La tabla `roles` tiene cuatro campos: `id`, `name`, `areas`, `active` (`design H2:49-56`) | Cinco: **`recibe_avisos boolean NOT NULL DEFAULT false`** (`schema.sql:143`; en el tipo, `roles.ts:5`; atajo en `:51-53`) | **Ampliado después.** Lo trajo el subsistema de avisos por correo; el rol pasó a ser también el canal de notificación. Pertenece a `derivacion-avisos` |
| D-3 | Áreas inválidas → **422**; nombre duplicado → 409; `roleId` inexistente → 422 (`design H2:111`, `:125`) | Las áreas inválidas se **descartan en silencio** (`roles.ts:13-16`). El nombre duplicado sí falla, por la restricción `UNIQUE` de la base (`schema.sql:105`) | **Parcialmente incumplido.** Registrado en §4.2 |
| D-4 | Enforcement del `403` en `server/app.ts` (`design H2:89-91`) | En `apps/desk/server/services/ticketService.ts:89-91`, llamado desde `routes/tickets.ts:192-194` | Movido, igual que el resto de la ruta de transición |
| D-5 | `users` gana sólo `role_id` (`design H2:57`) | Gana `role_id` **y** `cargo` **y** `empresa` (`schema.sql:112`, `:115-116`) | **Ampliado después** por el documento de remisión (`schema.sql:114`) y por el alta de usuario de agosto. `cargo` es además el dato que C10 necesitará (§4.1) |
| D-6 | El `403` de la transición llega «tras validar la transición y **ANTES** de aplicarla» (`design H2:89-90`) | Llega **después** del `409` de estado (`ticketService.ts:86-88` antes de `:89-91`) | El diseño no fija el orden frente al estado, y el código eligió uno que informa del estado a quien no tiene el área. Es una de las dos inversiones de precedencia: `transitions-st` §3.8 b) |

### 5.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.9.1 (`:1636`): «**Diez** de las 34 transiciones son compartidas por dos áreas» | **Ocho** (`transitions.ts:171-256`; emparejamiento en `invariantesGrafo.test.ts:91-106`; reparto 26/8 en `permisos.test.ts:72-73`) | **Ya registrada en F0-01** (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:128`, desarrollada en `:141-166`) y re-confirmada en F0-02. Aquí importa por su efecto directo: con diez, la matriz de F1C-05 sale 58/44 en vez de 60/42 |
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
