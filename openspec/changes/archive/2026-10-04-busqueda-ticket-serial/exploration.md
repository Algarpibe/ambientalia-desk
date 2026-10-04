# Exploración — `busqueda-ticket-serial` (F1B-08, E-133)

> Volcado de la exploración guardada en Engram (`sdd/busqueda-ticket-serial/explore`, obs. 1343), hecho por la
> fase de propuesta el 2026-10-04 sobre el worktree, base `2a74fdc`. **Cada cita de abajo se comprobó contra el
> fichero antes de reutilizarla**; lo que no se comprobó lleva la palabra «hipótesis». Las correcciones respecto
> al texto original de la exploración están reunidas en el §8.

## 1 · Estado actual

- **Endpoint.** `GET /api/tickets` es `apps/desk/server/routes/tickets.ts:104-116`. Con `scope=closed` pagina de
  50 (`apps/desk/server/routes/tickets.ts:106`), llama a `getClosedTickets` y a `countClosedTickets`
  (`apps/desk/server/routes/tickets.ts:108-109`) y responde `{items,total,page,pageSize}`
  (`apps/desk/server/routes/tickets.ts:110`). El resto (`scope=all` o por defecto) pasa por `colaDelTaller`
  (`apps/desk/server/routes/tickets.ts:114-115`). Sólo lee `scope` y `page`: no hay parámetro de búsqueda.
- **SQL.** `packages/zoho-sync/src/db/repo.ts:142-155` (`getActiveTickets`), `packages/zoho-sync/src/db/repo.ts:157-170`
  (`getClosedTickets`, con `LIMIT $2 OFFSET $3`), `packages/zoho-sync/src/db/repo.ts:172-175` (`countClosedTickets`)
  y `packages/zoho-sync/src/db/repo.ts:177-190` (`getAllTickets`). Los tres `SELECT` comparten seis `LEFT JOIN`
  y el orden `created_time DESC`.
- **Envoltorio de provisionales.** `apps/desk/server/db/ticketsConCliente.ts:26-34`, con las mismas firmas.
- **«Mis tickets».** `apps/desk/server/routes/prioridad.ts:83-86`: `getActiveTickets` → `colaDelTaller` → `filter(esDeMisTickets)`.
- **Cliente.** `apps/desk/src/App.tsx:57-72` decide qué pide según la vista; la paginación se reinicia en
  `apps/desk/src/App.tsx:59`; la cabecera del listado es `apps/desk/src/App.tsx:98-110` y no tiene caja de
  búsqueda; la paginación se pinta en `apps/desk/src/App.tsx:134-142`. Las llamadas son
  `apps/desk/src/api/client.ts:19-21`, `apps/desk/src/api/client.ts:25-27` y `apps/desk/src/api/client.ts:743-745`.
- **Filtro de vista.** `apps/desk/src/lib/boardView.ts:38-56`, documentado como filtro de VISTA y no de
  visibilidad en `apps/desk/src/lib/boardView.ts:33-37`.
- **Peticiones obsoletas.** `apps/desk/src/hooks/useAsync.ts:20-27` descarta la respuesta de una petición cuyas
  dependencias ya cambiaron (`cancelled`), así que una búsqueda lenta no pisa a la siguiente.
- Hipótesis: `ClientesPage.tsx` tiene una caja de búsqueda en cliente que sirve de referencia de estilo (no releída).

## 2 · Datos

- `tickets` se crea en `packages/zoho-sync/src/db/schema.sql:20-43`: `number integer UNIQUE NOT NULL`
  (`packages/zoho-sync/src/db/schema.sql:22`) y `serial text` (`packages/zoho-sync/src/db/schema.sql:28`).
  `equipo_id` llega por `ALTER` (`packages/zoho-sync/src/db/schema.sql:206`).
- El DTO del listado enseña `number: '#'+row.number` (`packages/zoho-sync/src/db/mappers.ts:199`) y **no lleva
  el serial** (`packages/zoho-sync/src/db/mappers.ts:196-219`): buscar por serial en el navegador sobre lo
  cargado es imposible sin ampliar el DTO.
- De dónde sale `tickets.serial`: en los de Zoho, de los campos personalizados o, si falta, del asunto
  (`packages/zoho-sync/src/db/mappers.ts:61-66`); en los de la aplicación, del equipo elegido
  (`apps/desk/server/services/ticketService.ts:105`, junto a `equipoId` en `:107`).
- **`tickets.serial` puede divergir de `equipos.serial` — verificado, ya no es hipótesis.** La edición de un
  equipo puede cambiar su serial (`apps/desk/server/db/equipos.ts:137`, `apps/desk/server/db/equipos.ts:150`) y
  el único `UPDATE` de `tickets.serial` fuera de pruebas es el relleno puntual de
  `apps/desk/server/backfillSerial.ts:16` (`grep "UPDATE (desk\.)?tickets SET.*serial"` sobre
  `apps/desk/server`, de una línea: un `UPDATE` partido en varias se le escaparía).
- Índices de `tickets`: `packages/zoho-sync/src/db/schema.sql:72-76` y `packages/zoho-sync/src/db/schema.sql:124`.
  Ninguno sobre `serial`; `number` tiene el implícito del `UNIQUE`. `equipos` sí tiene
  `packages/zoho-sync/src/db/schema.sql:202`, que un «contiene» no aprovecha.

## 3 · Nociones de serial ya existentes (molde H5)

| # | Dónde | Qué hace |
|---|---|---|
| 1 | `apps/desk/server/db/equipos.ts:59-74` (`searchEquipos`) | `LOWER(serial) LIKE '%q%'`: contiene, sin distinguir mayúsculas, **sin recortar** `q` y sin escapar `%` ni `_`. Es el autocompletado de la recepción (`apps/desk/server/routes/equipos.ts:19`, llamado desde `apps/desk/src/components/CreateTicket.tsx:141`) |
| 2 | `apps/desk/server/db/equipos.ts:396-399` | `trim` + minúsculas, igualdad exacta |
| 3 | `apps/desk/server/db/remisionesHistoricas.ts:41-43` | `trim` + colapsa espacios + mayúsculas, en JS porque pg-mem no soporta `TRIM` (`apps/desk/server/db/remisionesHistoricas.ts:37-39`) |
| 4 | `packages/shared/src/altaManual.ts:22-26` | sólo `trim`, distingue mayúsculas |

El autocompletado exige en el navegador dos caracteres como mínimo (`apps/desk/src/components/CreateTicket.tsx:138`);
el servidor no impone ese mínimo.

## 4 · La letra de Gerencia

- `openspec/config.yaml:3469` (`decision/trabajo-del-01-10-antes-del-corte-sin-fila`, `respuesta_textual`):
  «(1) la búsqueda por número de ticket y serial entra en F1B-08, antes del corte».
- `docs/sdd/ENTRADA.md:1579` (E-133, literal): «El serial se filtra con búsqueda parcial (por ejemplo, los
  últimos dígitos), con la misma lógica que el autocompletado por serial de la recepción. En el listado de
  tickets, la búsqueda por número de ticket y por serial es paridad con Zoho Desk y debe estar antes del corte
  del 14/12; si ya existe, solo se confirma. En el cuadro de mando con indicadores entra con el resto de los
  filtros, en Fase 2.»
- El maestro vigente ya lo recoge: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1152`
  y, dentro de M7.5, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3061-3062`.
- Plan: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:88` y
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:153` (talla S, ampliación de F1B-08).
- **No existe hoy**: medido en E-133 (`docs/sdd/ENTRADA.md:1582`) y vuelto a medir aquí (§1).
- **Lo que la letra no dice:** si el número coincide exacto o parcial; mayúsculas y espacios; si la búsqueda
  respeta la vista activa; longitud máxima.

## 5 · Enfoques

| Enfoque | Veredicto |
|---|---|
| A · En el servidor: `q` en `GET /api/tickets` (activos, cerrados paginados y recuento) y en «Mis tickets» | **Recomendado.** Alcanza los cerrados paginados; el cliente sólo envía texto (regla 13); una implementación |
| B · Sólo en el cliente sobre lo cargado | Descartado: no ve los cerrados de otras páginas ni el serial (no está en el DTO) |

## 6 · Permisos

Todos ven todos los tickets: `openspec/specs/permissions/spec.md:541` en `59d02da` (§4.3) y `apps/desk/src/lib/boardView.ts:33-37`.
La búsqueda no segmenta; basta el `requireAuth` ya montado (`apps/desk/server/routes/tickets.ts:35`).

## 7 · Riesgos

- Quinta noción de normalización de serial (molde H5).
- Divergencia `tickets.serial` / `equipos.serial` (§2, verificada).
- Desplazamiento de citas en ficheros muy citados (regla de mutación 4).
- pg-mem: `LIKE` y la igualdad entera son seguros (hipótesis apoyada en que `searchEquipos` se prueba sobre
  pg-mem en `apps/desk/server/db/equipos.test.ts:25`); `CAST` y `TRIM` no.
- Buscar dentro de la vista puede sorprender a quien espere búsqueda global (reversible).
- Tickets de Zoho sin serial en columna ni en el asunto: no se encuentran por serial. Es un límite, no un fallo.

## 8 · Correcciones al texto original de la exploración

1. Daba la divergencia `tickets.serial`/`equipos.serial` como hipótesis: **está verificada** (§2) y cambia el
   enfoque de la propuesta (se busca en las dos columnas).
2. No recogía que el maestro R08.4 ya contiene el pasaje (§4): `toca_maestro` es `no` y `maestro` es `["M7.5"]`.
3. Estimaba 230-330 líneas **sin** aplicar el factor ×1,8 a las pruebas ni contar las casillas de `tasks.md`.
   Rehecha en la propuesta: no cabe en un lote.
4. Decía «110 citas en 54 ficheros» de `routes/tickets.ts`: no se remidió esa cifra. La medida útil —citas
   **por debajo** del punto de inserción— está en la propuesta.
5. `searchEquipos` no recorta `q`: el recorte que la exploración atribuía al conjunto es sólo de las nociones 2-4.
