# Capacidad `hojas-vida` — datos comerciales del equipo y enlace a Drive

| Dato | Valor |
|---|---|
| Capacidad | `hojas-vida` (`openspec/config.yaml:149-151`) |
| Estado | **nueva** (`status_at_start: "nuevo"`, `config.yaml:151`) — sin código construido a la fecha de esta spec |
| Tanda que la escribe | F1B-02 |
| Procedencia | ítem 9 del §3.2 del maestro (`R08.2.md:3012-3013`), apartado `[EN REVISIÓN — R08]`: vale como procedencia, no como alcance acordado. Justificación operativa: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:157` |
| Decisiones de Gerencia | `decision/p8-p54-drive` (`openspec/config.yaml:1607-1626`) — el enlace a Drive es la solución definitiva, no fase 0 de una migración · `decision/titularidad-mantenedor` (`:1667-1689`) — el mantenedor se apunta en la hoja de vida |
| Depende de | `catalogo-equipos` (marca/modelo/tipo del equipo) · el propio `equipo` como entidad (`apps/desk/server/db/equipos.ts`) y el cliente de Books (`getClient`, `packages/zoho-sync/src/books/repo.ts:129-132`) |
| La usa | **F1B-11**, que depende de esta tanda: construye la guarda que compara el cliente de la orden de venta contra el mantenedor. **IV-8 no se cierra aquí** (`openspec/config.yaml:1677-1679`) |

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

### RQ-HV-01 · Los seis campos son opcionales y no alteran el comportamiento existente

El sistema **SHALL** permitir guardar, por equipo, seis campos nuevos, todos opcionales: fecha de
adquisición, fecha de factura de compra, fin de garantía, código interno, mantenedor (referencia a un
cliente de Books) y enlace a la carpeta de Drive. Ninguno **SHALL** ser obligatorio para crear o para
seguir operando un equipo: hoy el alta sólo exige `serial`, `clientId` y `modeloId`
(`apps/desk/server/routes/equipos.ts:47-64`), y los seis campos nuevos **MUST NOT** ampliar esa lista.

#### Scenario: Alta de equipo sin los cinco campos comerciales
- GIVEN un alta que trae sólo `serial`, `modeloId` y `clientId` (los tres exigidos hoy)
- WHEN se envía el `POST /api/equipos`
- THEN el equipo se crea con `201`
- AND los seis campos nuevos quedan vacíos, y el equipo se busca, edita y desactiva igual que hoy

#### Scenario: Alta de equipo con los seis campos comerciales
- GIVEN un alta que además trae los seis campos comerciales, todos válidos
- WHEN se envía el `POST /api/equipos`
- THEN el equipo se crea con `201` y la respuesta devuelve los seis valores

### RQ-HV-02 · Se extiende el POST y el PATCH existentes; no hay endpoint nuevo

El sistema **SHALL** aceptar los seis campos en el mismo `POST /api/equipos` y `PATCH /api/equipos/:id`
que ya existen (`apps/desk/server/routes/equipos.ts:47`, `:66`; escritura en `db/equipos.ts:104`
`createEquipo` y `:114` `updateEquipo`), y **MUST NOT** crear una ruta nueva. Un `PATCH` **SHALL** seguir
el patrón ya construido de campos opcionales (`if (b.X !== undefined) …`, `routes/equipos.ts:71-88`): sólo
se escribe lo que llega.

#### Scenario: PATCH parcial que sólo toca uno de los campos nuevos
- GIVEN un equipo existente sin ninguno de los seis campos comerciales
- WHEN se manda un `PATCH` con sólo el código interno
- THEN responde `200` y sólo ese campo queda escrito
- AND los otros cinco siguen vacíos, y el resto del equipo (serial, modelo, cliente, `active`) no cambia

### RQ-HV-03 · Toda fecha se valida en servidor, y el rechazo precede a cualquier escritura

El sistema **SHALL** validar el formato de las tres fechas (adquisición, factura de compra, fin de
garantía) en el servidor y **MUST NOT** escribir nada del `POST` o `PATCH` cuando una de ellas es
inválida — el mismo principio que ya aplican `clientId` y `modeloId`, cuyo `422` se devuelve **antes** de
construir el `patch` que se escribe (`routes/equipos.ts:72-88`, escritura recién en `:89`). Precedente de
formato en este mismo repositorio: `apps/desk/server/routes/remision.ts:127` valida fecha contra
`^\d{4}-\d{2}-\d{2}$`.

#### Scenario: Fecha inválida → 422 sin escritura
- GIVEN un alta o un `PATCH` cuya fecha de adquisición no cumple el formato `AAAA-MM-DD`
- WHEN se envía la petición
- THEN responde `422`
- AND ninguno de los seis campos nuevos, ni el resto del equipo, queda escrito

### RQ-HV-04 · El enlace de Drive se valida con `urlSegura`, sólo `https://`

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

### RQ-HV-05 · El mantenedor se valida contra Books, igual que el cliente

El sistema **SHALL** validar el mantenedor contra `getClient` (`packages/zoho-sync/src/books/repo.ts:129-132`),
con el mismo patrón `422` que ya usa `clientId` en el alta y el `PATCH`
(`routes/equipos.ts:55-56` y `:73-74`, «Cliente no encontrado»).

#### Scenario: Mantenedor inexistente → 422
- GIVEN un alta o un `PATCH` cuyo mantenedor no resuelve a ningún cliente de Books
- WHEN se envía la petición
- THEN responde `422`
- AND el mantenedor no queda escrito

**Fuera de esta spec:** la guarda que compara el mantenedor con el cliente de la orden de venta pertenece
a **F1B-11**; aquí sólo se guarda y valida el dato (`decision/titularidad-mantenedor`,
`openspec/config.yaml:1677-1679`).

### RQ-HV-06 · El código interno es identificador secundario de búsqueda

`searchEquipos` (`apps/desk/server/db/equipos.ts:58-73`) **SHALL** encontrar un equipo por su código
interno con el mismo criterio —insensible a mayúsculas, por coincidencia parcial— con el que ya busca por
serial hoy (`LOWER(serial) LIKE $1`, `:66-67`).

#### Scenario: Buscar por código interno devuelve el mismo equipo que por serial
- GIVEN un equipo con serial `SN-1` y código interno `INT-001`
- WHEN se busca por `INT-001`
- THEN el resultado incluye ese equipo, igual que buscarlo por `SN-1`

### RQ-HV-07 · La hoja de vida muestra los seis campos, vacíos o poblados

La cabecera de `HojaDeVida.tsx` (hoy marca, modelo, tipo, serie, cliente y estado, `:159-165`)
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

### RQ-HV-08 · El alta y la edición piden los seis campos

`EquipoForm` (`apps/desk/src/components/EquiposAdmin.tsx:95`, payload hoy en `:148`) **SHALL** pedir los
seis campos, en alta y en edición, y enviarlos en el mismo payload que ya manda `serial`, `modeloId` y
`clientId`.

---

## 2 · Fuera de alcance de esta spec

- **Carga retroactiva del parque ya sembrado** — comprobación de persona, no tarea de esta tanda
  (`openspec/changes/hojas-vida/proposal.md`, sección «Comprobaciones de persona»).
- **La guarda del mantenedor sobre la orden de venta** → F1B-11. **IV-8 no se cierra aquí**
  (`openspec/config.yaml:1677-1679`).
- **Cálculo automático de garantía y alertas**, **marca de visibilidad por campo** para el portal, y
  **almacenamiento propio de documentos** — gate cerrado a favor del enlace (`config.yaml:1616-1617`).
- **Permisos por área** para escribir equipos: hoy basta `requireAuth`
  (`routes/equipos.ts:47`, `:66`); esta spec no lo cambia.
- **`tickets.codigo_interno`, `tickets.fecha_factura`, `tickets.doc_almacenada_drive`** — nociones
  distintas del ticket, no se tocan (`packages/zoho-sync/src/db/repo.ts:47`, `:50`, `:53`).
