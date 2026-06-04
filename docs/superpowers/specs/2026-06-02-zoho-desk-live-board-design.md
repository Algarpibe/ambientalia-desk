# Diseño — Tablero Ambientalia conectado a Zoho Desk (vía Postgres autoalojado)

> ⚠️ **SUPERADO (2026-06-04).** Este diseño corresponde a la Fase 0 (tablero leyendo de Postgres,
> réplica de Zoho). El proyecto giró a **reemplazar Zoho Desk por completo** (Postgres = fuente de
> verdad; la app escribe en Postgres, no en Zoho). Ver `docs/migracion-zoho-roadmap.md` y los specs
> de los subsistemas A–G. Se conserva como referencia histórica.

**Fecha:** 2026-06-02
**Estado:** SUPERADO · (originalmente: Aprobado para planificación · Revisado — pivote a Postgres)
**Autor:** Claude + comercial@ambientalia.com.co

---

## ⚑ Revisión 2026-06-02b — Pivote a base de datos autoalojada (Postgres)

> Esta sección **supersede la ruta de lectura** descrita más abajo. El backend ya no
> lee en vivo de Zoho: lee de **Postgres** (autoalojado en el VPS del usuario, gestionado
> con EasyPanel). Un **job de sincronización dentro del propio backend** (no n8n) replica
> Zoho Desk → Postgres. Las **escrituras** siguen yendo a Zoho (fuente de verdad) y tras
> escribir se re-sincroniza el ticket afectado.

**Decisiones de este pivote:**

| Decisión | Elección |
|---|---|
| Origen de lecturas | Postgres autoalojado (réplica de Zoho) |
| Motor | PostgreSQL (servicio EasyPanel) |
| Sincronización | Job dentro del backend Express (`setInterval`), no n8n |
| Fuente de verdad | Zoho Desk; Postgres es réplica de lectura |
| Escrituras | Van a Zoho; luego re-sync del ticket afectado |
| Driver / tests DB | `pg` (node-postgres) + `pg-mem` para tests sin DB real |

**Arquitectura revisada:**
```
Zoho Desk (fuente de verdad)
   ▲ escrituras (reply, status)         │ sync: backfill inicial + polling incremental
   │ (vía zohoClient/tokenManager)      ▼ (zohoClient → ticketRowFromZoho → upsert)
Express backend ───────────────────► Postgres (tablas tickets, conversations)
   │  lecturas (normalizeTicket(raw))
   ▼
Tablero React (sin cambios respecto al plan original)
```

**Reutilización de lo ya construido (Tareas 0–3):** `shared/types.ts`, `shared/columns.ts`,
`server/normalize.ts` (con `normalizeTicket`/`normalizeConversation`) se reutilizan **sin
cambios** en la ruta de lectura: la DB guarda el JSON crudo de Zoho en una columna `raw jsonb`
y al leer se aplica `normalizeTicket(row.raw)`. `tokenManager`/`zohoClient` alimentan el sync.

**Modelo de datos (Postgres):**
- `tickets`: `id text pk`, `ticket_number text`, `status text`, `status_type text`,
  `created_time timestamptz`, `modified_time timestamptz`, `raw jsonb`, `synced_at timestamptz`.
  Las columnas tipadas permiten filtrar/ordenar/reportar; `raw` conserva el payload completo.
- `conversations`: `id text pk`, `ticket_id text`, `commented_time timestamptz`, `raw jsonb`.

**Sincronización (dentro del backend):**
- *Backfill* al arrancar si `tickets` está vacía: pagina `/tickets` (from=0,100,…) y hace upsert.
  Se ejecuta en segundo plano para no bloquear el `listen`.
- *Incremental*: `setInterval` (`SYNC_INTERVAL_MS`, def. 180000) re-trae la primera página
  ordenada por tiempo y hace upsert.
- *Conversaciones*: carga perezosa — el endpoint de detalle sincroniza las conversaciones del
  ticket si la DB no las tiene aún, luego lee de DB.
- *Tras escritura*: PATCH estado / POST reply → re-sync de ese ticket (y sus conversaciones).

**Endpoints (revisados):**
- `GET /api/tickets` → lee `tickets` de Postgres (sólo no-cerrados), mapea con `normalizeTicket`.
- `GET /api/tickets/:id` → lee DB; si falta, sincroniza ese ticket y lee.
- `GET /api/tickets/:id/conversations` → lee DB; si vacío, sincroniza y lee.
- `PATCH /api/tickets/:id/status` → Zoho PATCH (guard `ENABLE_WRITES`) → re-sync ticket.
- `POST /api/tickets/:id/reply` → Zoho sendReply (guard) → re-sync conversaciones.

**Config nueva:** `DATABASE_URL` (requerida, connection string de EasyPanel),
`SYNC_INTERVAL_MS` (opcional, def. 180000). Se mantienen todas las `ZOHO_*` y `ENABLE_WRITES`.

**Tests:** las funciones puras (`normalize`, `columns`, mappers de fila) se testean directo;
los repositorios se testean con `pg-mem` (Postgres en memoria, sin DB real); el sync se testea
con `zohoFetch` y repos mockeados.

**Riesgos nuevos:** frescura limitada por el intervalo de sync; backfill inicial lento por los
límites de la API de Zoho (mitigado: corre en background, por lotes); conectividad del backend
a la Postgres del VPS (EasyPanel expone host/puerto o red interna). Webhooks de Zoho para
casi-tiempo-real quedan como mejora futura.

---

> _Lo que sigue es el diseño original (ruta de lectura en vivo). Mantén las secciones de
> backend OAuth, escritura, frontend, columnas y normalización; sólo la **fuente de lectura**
> cambia de "Zoho en vivo" a "Postgres" según la revisión de arriba._

## Objetivo

Conectar el tablero Kanban de tickets (hoy una maqueta con datos hardcodeados en
`src/data/mockData.ts`) a datos reales del portal **Zoho Desk de Ambientalia
S.A.S.**, con lectura del tablero, lectura del detalle del ticket (contacto,
propiedades, conversaciones) y acciones de escritura (responder, cambiar estado).

## Contexto del proyecto

- App **React 19 + TypeScript + Vite 6 + Tailwind 3**. Solo UI estática.
- Réplica visual de Zoho Desk para "Ambientalia Soporte y Servicio Técnico".
- Componentes: `App.tsx` (tablero Kanban), `Header`, `Sidebar`, `TicketCard`,
  `TicketDetailView` (hoy ignora el ticket seleccionado y muestra contenido fijo).
- Datos Zoho confirmados vía MCP:
  - **orgId:** `713448415` (Ambientalia S.A.S., DC `desk.zoho.com`).
  - **departmentId:** `495552000000006907` ("Ambientalia Soporte y Servicio Técnico").
  - El `status` de Zoho coincide con los labels de columna del mock
    (p.ej. `"Notificación cliente"`), confirmando que las columnas mapean a
    **estados personalizados de Zoho Desk por su nombre en español**.

## Decisiones tomadas (brainstorming)

| Decisión | Elección |
|---|---|
| Origen de datos | Backend propio + API Zoho (live) |
| Credenciales | El usuario ya tiene Client ID, Client Secret y Refresh Token |
| Alcance | Tablero + detalle + acciones (lectura y escritura) |
| Topología backend | Express único; Vite proxy en dev, sirve `dist/` en prod |
| Escrituras al inicio | `ENABLE_WRITES=false` (se activa tras probar lecturas) |
| Mock `TICKETS` | Conservar como fixture de tests |

## Arquitectura y flujo de datos

```
Navegador (React/Vite)
   │  fetch /api/...
   ▼
Express (server/)  ──OAuth access token (cache + auto-refresh)──►  Zoho Desk API
   │                                                                (desk.zoho.com/api/v1)
   └─ en prod: sirve también dist/
```

- **Dev:** `npm run dev` levanta Vite (5173) + Express (3001) en paralelo; Vite
  hace proxy de `/api` → `http://localhost:3001`.
- **Prod:** `npm run build` genera `dist/`; `node server` lo sirve estáticamente
  y expone `/api`.
- Los secretos (Client ID/Secret/Refresh Token) nunca llegan al navegador.

## Componentes

### Backend (`server/`)

Cada módulo con una responsabilidad clara:

- **`config.ts`** — lee y valida variables de entorno; falla rápido si falta un secreto.
- **`tokenManager.ts`** — intercambia refresh token → access token contra
  `${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`; cachea el access token en memoria con
  su expiración; renueva automáticamente cuando expira o ante un 401.
  - Interfaz: `getAccessToken(): Promise<string>`.
- **`zohoClient.ts`** — wrapper `fetch` con base `${ZOHO_API_DOMAIN}/api/v1`,
  header `orgId`, y reintento único tras refrescar el token en caso de 401.
  - Interfaz: `zohoFetch(path, init): Promise<Response>`.
- **`normalize.ts`** — funciones puras que transforman la respuesta de Zoho al
  shape `Ticket` que ya usa el frontend (resuelve `contact.name`, `assignee.name`,
  formatea fechas, etc.).
  - Interfaz: `normalizeTicket(raw): Ticket`, `normalizeConversation(raw): Message`.
- **`statusMap.ts`** (compartido conceptualmente con el frontend) — define las 8
  columnas por nombre de estado Zoho y clasifica cada ticket.
  - Interfaz: `columnForStatus(status: string): ColumnId | null`.
- **`routes.ts`** — define los endpoints REST.
- **`index.ts`** — arranca Express, monta `/api`, sirve `dist/` en prod.

#### Endpoints REST

| Método | Ruta | Llamada Zoho | Uso |
|---|---|---|---|
| GET | `/api/tickets` | `GET /tickets?include=contacts,assignee&departmentId=…` | tablero |
| GET | `/api/tickets/:id` | `GET /tickets/:id?include=contacts,assignee` | detalle |
| GET | `/api/tickets/:id/conversations` | `GET /tickets/:id/conversations` | hilos |
| PATCH | `/api/tickets/:id/status` | `PATCH /tickets/:id` `{status}` | acción ✍️ |
| POST | `/api/tickets/:id/reply` | `POST /tickets/:id/sendReply` | acción ✍️ |

- Las rutas de escritura (PATCH/POST) devuelven `403` si `ENABLE_WRITES=false`.
- El backend normaliza siempre antes de responder, de modo que el frontend
  consume su propio shape `Ticket`/`Message` y cambia lo mínimo.

### Mapeo de estados → columnas (`statusMap.ts`)

- Las 8 columnas se definen por el **nombre de estado de Zoho** (p.ej.
  `"Notificación cliente"`, `"Por Facturar"`). El backend devuelve el `status`
  crudo y la UI agrupa por columna usando `columnForStatus`.
- **Bug corregido de paso:** los `count` de columna pasan a ser **dinámicos**
  (contados de los tickets reales), no los números fijos del mock.
- Estados de cierre (`statusType: "Closed"`, p.ej. `"Finalizado"`) se filtran del
  tablero activo para evitar ruido.
- El listado exacto de estados intermedios se confirma durante la implementación
  consultando tickets activos por estado (hoy la mayoría están "Finalizado").

### Frontend

- **`src/api/client.ts`** — funciones `fetchTickets()`, `fetchTicket(id)`,
  `fetchConversations(id)`, `replyTicket(id, body)`, `updateTicketStatus(id, status)`.
- **Hooks** `useTickets()`, `useTicket(id)`, `useConversations(id)` — encapsulan
  fetch + estados `loading`/`error`/`data`. Sin librería extra (fetch nativo +
  `useState`/`useEffect`); React Query queda como opción futura.
- **`App.tsx`** — reemplaza `import { TICKETS }` por `useTickets()`; columnas con
  counts dinámicos; skeletons mientras carga; banner de error con reintento.
- **`TicketDetailView.tsx`** — recibe `ticketId`; carga contacto, propiedades y
  conversaciones reales; elimina el contenido hardcodeado. Incluye los controles
  de acción (responder, cambiar estado) con diálogo de confirmación.
- **`src/data/mockData.ts`** — se conservan `interface Ticket`, `TABS`/columnas;
  el array `TICKETS` se retira del tablero y se reutiliza como fixture de tests.

## Seguridad de escritura

Las escrituras tocan **producción real** de Zoho. Salvaguardas:

- Flag `ENABLE_WRITES` en `.env` (por defecto `false`): con writes deshabilitados,
  los botones quedan visibles pero inertes y el backend rechaza POST/PATCH con 403.
- **Diálogo de confirmación** en la UI antes de enviar respuesta o cambiar estado.
- El reply usa `getReplyMailAddresses` para elegir un remitente válido.

## Manejo de errores y estados

- **Backend:** errores de Zoho se propagan como `{ error, status }` con código HTTP
  adecuado; 401 dispara un único refresh + reintento antes de fallar.
- **Frontend:** skeletons en columnas y detalle; banner de error con reintento si la
  API falla; estado vacío "Sin Tickets" (ya existe) cuando una columna no tiene tickets.

## Configuración y secretos (`.env`, gitignored)

```
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_ORG_ID=713448415
ZOHO_DEPARTMENT_ID=495552000000006907
ZOHO_ACCOUNTS_DOMAIN=accounts.zoho.com
ZOHO_API_DOMAIN=desk.zoho.com
ENABLE_WRITES=false
PORT=3001
```

- Se añade `.env.example` (sin secretos).
- Se verifica/añade `.env` en `.gitignore`.

## Pruebas

- **Backend (unitarias):**
  - `columnForStatus` — mapeo de estados conocidos, cierre filtrado, desconocidos → `null`.
  - `normalizeTicket` / `normalizeConversation` — resolución de nombres y fechas.
  - `zohoFetch` / `tokenManager` — con respuestas Zoho mockeadas: refresh de token,
    flujo 401 → retry, propagación de errores.
  - Guardas de escritura — PATCH/POST devuelven 403 con `ENABLE_WRITES=false`.
- **Frontend:**
  - Hooks de datos con `fetch` mockeado: estados loading/success/error.
  - Counts de columna calculados desde un set de tickets fixture.

## Dependencias nuevas

- Producción: `express`, `dotenv` (y `cors` solo si se separan orígenes en dev).
- Dev: `concurrently` (correr Vite + Express con un comando), `tsx` o equivalente
  para ejecutar el server TypeScript, y un runner de tests (Vitest, alineado con Vite).

## Fases de implementación

1. **Backend base + tablero (read-only):** `config`, `tokenManager`, `zohoClient`,
   `normalize`, `statusMap`, `GET /api/tickets`; wire `App.tsx`; counts dinámicos;
   skeletons/error. Entrega valor visible pronto.
2. **Detalle (read):** `GET /api/tickets/:id` + `/conversations`; wire
   `TicketDetailView` con datos reales.
3. **Acciones (write):** `PATCH /status` + `POST /reply` con `ENABLE_WRITES` y
   diálogos de confirmación.

## Fuera de alcance (YAGNI)

- Autenticación de usuarios de la app (se asume uso interno/confiable).
- Paginación infinita / búsqueda avanzada (solo el listado base del departamento).
- Sincronización en tiempo real (websockets); refresco es manual / al recargar.
- Adjuntos: se muestran metadatos si vienen, pero subir/descargar queda para después.
- Otros MCP (Zoho CRM / Books) — no se tocan en esta iteración.

## Riesgos

- **Escrituras en producción:** mitigado con `ENABLE_WRITES=false` + confirmación.
- **DC / dominio de token:** el refresh token es específico del data center; se
  asume `accounts.zoho.com` + `desk.zoho.com` (coherente con el favicon del org).
  Configurable por env si fuera otro DC.
- **Scopes del refresh token:** debe incluir lectura de tickets y, para fase 3,
  `Desk.tickets.UPDATE` y envío de respuestas. Se verifica al implementar.
- **No es repo git:** el proyecto no está inicializado en git; el versionado de
  este diseño queda pendiente de `git init` (opcional).
