# Diseño — Reasignar la persona a cargo sin cambiar de estado, con motivo, traza y aviso (F1B-05)

Propuesta: `openspec/changes/reasignacion-con-motivo/proposal.md` (D1 a D8 y S-1 a S-7 tomados, no se reabren).
Requisitos: RQ-TC-50, RQ-TC-51, RQ-TC-52, RQ-PM-27, RQ-TZ-20 y RQ-AV-20 de los deltas de `specs/` de este cambio.
Toda cita de este documento es a un fichero que existe y fue leído en el worktree; los ficheros nuevos se nombran sin línea.

## 1. Enfoque técnico

Una ruta fina (`routes/`) que encadena guardas A < B < C y delega: el permiso y el contenido en un módulo puro de
`packages/shared`; la escritura en un módulo de `apps/desk/server/db/` que hace un `UPDATE` **condicionado** más el
`INSERT` de la traza dentro de `enTransaccion`; el aviso en un servicio aparte, fuera de la transacción. El historial
suma una cuarta fuente al leer. Ningún fichero muy citado gana líneas: todo lo que se modifica se edita **sobre la línea
que ya existe**, y lo nuevo va en ficheros nuevos o al final.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativas descartadas | Por qué |
|---|---|---|---|
| DD-1 | Carrera: `UPDATE tickets SET derivado_a = $2 WHERE id = $1 AND derivado_a = $3 RETURNING id` (o `AND derivado_a IS NULL` si el origen leído es nulo). Cero filas: no se inserta traza y la ruta responde `409` | `SELECT … FOR UPDATE` (no hay un solo uso en `apps/` ni `packages/`: comportamiento en pg-mem sin probar); `IS NOT DISTINCT FROM` (ídem); insertar la traza con subconsulta del valor vigente (dos transacciones leerían el mismo origen) | Es el molde que ya corre sobre pg-mem: `apps/desk/server/db/migracionTicketsAbiertos.ts:86-87`, y el `409` tras una escritura que no encontró su fila es `apps/desk/server/routes/ovAsociaciones.ts:53-54`. Garantiza lo que exige RQ-TC-51: el `de` de la traza es el `derivado_a` que el ticket tenía al aplicarse |
| DD-2 | El `UPDATE` toca **sólo** `derivado_a` | Añadir `updated_at`, `modified_time` o `managed_by_app` como `apps/desk/server/db/prioridadCliente.ts:93` | RQ-TC-51 lo prohíbe; `managed_by_app` cortaría el sincronizador (`packages/zoho-sync/src/db/repo.ts:71`) |
| DD-3 | El validador devuelve **un** error, el primero en el orden motivo, destino ausente, destino igual al actual | Acumular todos, como `packages/shared/src/prioridad.ts:65-74` | La spec fija qué `422` gana; con un solo error el orden es observable y mutable. Molde: `packages/shared/src/cargos.ts:90-98` |
| DD-4 | Dos ficheros en `db/`: acceso a la traza y evento del historial | Uno solo | Van en lotes distintos; molde de `apps/desk/server/db/traspaso.ts:19-46` (compositor puro aparte) |
| DD-5 | Sin `GET` nuevo: el `POST` devuelve `{ ticketId, derivadoA }` y la lista de reasignaciones sólo se lee desde el historial | `GET /api/tickets/:id/reasignaciones` | La propuesta sólo pide una ruta; el panel no lista nada |
| DD-6 | **Supuesto S-8 (reversible, fuera de «Áreas afectadas» de la propuesta):** `eliminarTicket` barre también `reasignaciones` | No tocarlo | `apps/desk/server/db/eliminarTicket.ts:45-56` no la incluye; las filas huérfanas de un ticket borrado seguirían contando en `usosDeUsuario` y esa persona no se podría borrar nunca. Se añade **en la misma línea** de `apps/desk/server/db/eliminarTicket.ts:54`. Hipótesis: sus pruebas llevan recuentos que habrá que mover (no se leyeron) |
| DD-7 | El historial se refresca remontando `HistoriaPanel` con `key` | Dejarlo | `apps/desk/src/components/HistoriaPanel.tsx:18` sólo recarga al cambiar `ticketId`; la propuesta pide recargar ticket e historial |

## 3. Módulos y firmas

### (a) `packages/shared/src/reasignacion.ts` (nuevo) — exportado con una línea nueva al final de `packages/shared/src/index.ts` (hoy acaba en `packages/shared/src/index.ts:37`)

```ts
export const MENSAJES_REASIGNACION: { permiso: string; motivo: string; destino: string; mismo: string; inexistente: string; carrera: string }
export function puedeReasignar(s: Pick<SujetoDePermiso, 'areas' | 'isAdmin'>, ticket: TicketDeFlujo): boolean
//   s.isAdmin || areasSiguientes(ticket.status, catalogoDelTicket(ticket)).some((a) => s.areas.includes(a))
export type CuerpoReasignacion = { ok: true; destino: string; motivo: string } | { ok: false; error: string }
export function reasignacionDelCuerpo(v: unknown, actual: string | null): CuerpoReasignacion
```

Consume `packages/shared/src/transitions.ts:327-334`, `packages/shared/src/flujos.ts:64-66`, `packages/shared/src/flujos.ts:13-16`
y `packages/shared/src/cargos.ts:37`. `reasignacionDelCuerpo` recorta motivo y destino (lo que no es cadena vale vacío) y
compara el destino recortado con `actual ?? ''`. La existencia del destino no es suya: necesita la base.

### (b) Esquema

Al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `packages/zoho-sync/src/db/schema.sql:750-751`), copia del
patrón de `packages/zoho-sync/src/db/schema.sql:613-622`. Los comentarios van sin punto y coma (el troceo es por `;`,
`packages/zoho-sync/src/db/migrate.ts:20`) y sin tildes, como el resto del fichero.

```sql
CREATE TABLE IF NOT EXISTS public.reasignaciones (
  id bigserial PRIMARY KEY,
  ticket_id text NOT NULL,
  de text,
  a text NOT NULL,
  motivo text NOT NULL CONSTRAINT reasignaciones_motivo CHECK (motivo <> ''),
  reasignado_por text NOT NULL,
  reasignado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reasignaciones_ticket ON public.reasignaciones (ticket_id);
```

pg-mem: sólo construcciones ya probadas. El `CHECK (motivo <> '')` con nombre funciona
(`packages/zoho-sync/src/db/migrate.test.ts:553-558`); no se añade `CHECK` de lista ni entre columnas
(`packages/zoho-sync/src/db/schema.sql:625`), ni claves foráneas.

`'reasignaciones'` se añade a `PUBLIC_TABLES` sobre `packages/zoho-sync/src/db/migrate.ts:73`. Recuentos de
`packages/zoho-sync/src/db/migrate.test.ts` que se mueven:

| Línea | Hoy | Nuevo |
|---|---|---|
| `packages/zoho-sync/src/db/migrate.test.ts:282` (título) | 42 tablas, 29 en `public` | 43 y 30, nombrando `reasignaciones, F1B-05` |
| `packages/zoho-sync/src/db/migrate.test.ts:283` | `[10, 29, 3]` | `[10, 30, 3]` |
| `packages/zoho-sync/src/db/migrate.test.ts:284`, `packages/zoho-sync/src/db/migrate.test.ts:285`, `packages/zoho-sync/src/db/migrate.test.ts:286` | `42` | `43` |
| `packages/zoho-sync/src/db/migrate.test.ts:652` | `ultima + 1 + 6 + 2 + 17 + 1 + 2 + 2 + 4 + 3` | la misma suma `+ 2`, con su etiqueta |

No cambian: las `ALTER` (59, 33 y 26 en `packages/zoho-sync/src/db/migrate.test.ts:376-378`), la posición 116
(`packages/zoho-sync/src/db/migrate.test.ts:522`) ni `creates[36]` (`packages/zoho-sync/src/db/migrate.test.ts:545`).
El bloque `describe` nuevo va detrás del último (`packages/zoho-sync/src/db/migrate.test.ts:771-779`).

### (c) `apps/desk/server/db/reasignaciones.ts` (nuevo)

```ts
export interface TicketParaReasignar { id: string; numero: number; status: string; classification: string | null; derivadoA: string | null }
export async function ticketParaReasignar(db: Queryable, ticketId: string): Promise<TicketParaReasignar | null>
export interface Reasignar { ticketId: string; de: string | null; a: string; motivo: string; por: string }
/** `false`: el ticket ya no estaba a cargo de `de`; no se escribió nada. */
export async function reasignar(db: Queryable, r: Reasignar): Promise<boolean>
export interface Reasignacion { de: string | null; a: string; motivo: string; reasignadoPor: string; reasignadoAt: string }
export async function reasignacionesDelTicket(db: Queryable, ticketId: string): Promise<Reasignacion[]>   // ORDER BY id
export async function usosEnReasignaciones(db: Queryable, userId: string): Promise<number>
```

`reasignar` usa `enTransaccion` (`apps/desk/server/db/transaccion.ts:13-28`): primero el `UPDATE` de DD-1 y, sólo si
devolvió fila, el `INSERT`. Consultas sin calificar, como `apps/desk/server/db/prioridadCliente.ts:91-96`.
`usosEnReasignaciones`: `COUNT(*)` con `de = $1 OR a = $1` (hipótesis: pg-mem admite el parámetro repetido con `OR`; si no,
dos `COUNT`).

### (d) `apps/desk/server/routes/reasignacion.ts` (nuevo)

`registerReasignacionRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void`, con el molde de
`apps/desk/server/routes/prioridad.ts:62-77`. Registro **en sitio**: el `import` se añade a
`apps/desk/server/app.ts:22` y la llamada a `apps/desk/server/app.ts:61`, con `{ db, config }` como
`apps/desk/server/app.ts:59`.

### (e) `apps/desk/server/services/avisoReasignacion.ts` (nuevo)

```ts
export function avisoReasignacion(c: { nuevo: string; actorId: string; actorNombre: string; ticketNumero: number; motivo: string }): AvisoNuevo | null
export async function notificarReasignacion(db: Queryable, config: AppConfig, c: { ticketId: string; ticketNumero: number; actorId: string; actorNombre: string; motivo: string; destino: { id: string; email: string; name: string } }, fetchImpl?: typeof fetch): Promise<void>
```

Se reutiliza, sin tocar `apps/desk/server/services/ticketService.ts`, exactamente lo que ese fichero importa en
`apps/desk/server/services/ticketService.ts:11-13`: el tipo `AvisoNuevo` (`apps/desk/server/services/avisoDerivacion.ts:12-16`),
`crearAviso` (`apps/desk/server/db/avisos.ts:8-18`), `dispararAvisos` y `AvisoParaEnviar`
(`apps/desk/server/avisosWebhook.ts:53-57`, `apps/desk/server/avisosWebhook.ts:4-17`) y `marcarEnviados`
(`apps/desk/server/db/avisos.ts:57-62`), con la misma secuencia de `apps/desk/server/services/ticketService.ts:179-183`
y `apps/desk/server/services/ticketService.ts:215-219`: crear el aviso, mandar un único elemento con `conCopia: true`
(S-7), sellar si salió y, si no, `logger.warn`. `avisoReasignacion` devuelve `null` si `nuevo === actorId` (S-5).

La URL del webhook no se lee en la ruta: `config` llega por `deps` desde `createApp` y `dispararAvisos` saca de él
`avisosWebhookUrl`, el token, `appBaseUrl` y la copia; con la URL vacía devuelve motivo y no lanza
(`apps/desk/server/avisosWebhook.ts:58`, `apps/desk/server/avisosWebhook.ts:44`). Es el mismo camino por el que
`config` llega a `executeTransition` (`apps/desk/server/routes/tickets.ts:193`). Límite declarado, igual que el molde: si
falla el `INSERT` del aviso tras la escritura, la respuesta es `500` con la reasignación ya hecha.

### (f) `apps/desk/server/db/eventoReasignacion.ts` (nuevo) e historial

```ts
export function eventoReasignacion(r: Reasignacion, nombres: Map<string, string>): HistoryEvent
export async function eventosReasignacion(db: Queryable, ticketId: string): Promise<HistoryEvent[]>
```

`eventName: 'AppReasignacion'`, `time: r.reasignadoAt`, `actor: r.reasignadoPor`, título `Reasignación: {de} → {a}` y
detalles De, A, Motivo y Reasignado por. Origen nulo: «Sin derivar». Un id que no resuelve se enseña crudo, como
`apps/desk/server/db/ticketFuentes.ts:101-105`. Los nombres se piden con `SELECT id, name FROM users` sólo si el ticket
tiene reasignaciones (molde de `apps/desk/server/db/ticketFuentes.ts:115-125`). En `apps/desk/server/db/historial.ts`
se editan dos líneas en sitio: el `import` en `apps/desk/server/db/historial.ts:3` y la unión de
`apps/desk/server/db/historial.ts:157`, que pasa a cuatro fuentes; el orden lo sigue dando `masRecientePrimero`
(`apps/desk/server/db/historial.ts:124`).

### (g) `usosDeUsuario`

En `apps/desk/server/auth/users.ts:136-140` se suma `await usosEnReasignaciones(db, id)` sobre la línea del `return`; el
`import` va en `apps/desk/server/auth/users.ts:4` y el comentario de `apps/desk/server/auth/users.ts:126-134` se
reescribe sin cambiar su número de líneas («Dos» pasa a «Tres»).

### (h) Cliente

| Pieza | Diseño |
|---|---|
| `apps/desk/src/api/client.ts` | `reasignarTicket(ticketId, cuerpo: { destino: string; motivo: string }): Promise<{ ticketId: string; derivadoA: string }>`, al final del fichero, molde de `apps/desk/src/api/client.ts:736-740` |
| `apps/desk/src/lib/reasignacion.ts` y su `.test.ts` (nuevos) | `opcionesReasignacion(activas: PersonaLite[], actualId: string \| null): OpcionPersona[]` (sin la persona actual y sin «Sin derivar»; tipo de `apps/desk/src/lib/personas.ts:4`) y `puedeEnviarReasignacion(destino, motivo, actualId): boolean`, que es `reasignacionDelCuerpo(...).ok` |
| `apps/desk/src/components/PanelReasignar.tsx` (nuevo) | Molde de `apps/desk/src/components/PanelPrioridad.tsx:16-40`. Props: `ticketId`, `status`, `clasificacion`, `derivadoActual`, `onCambio`. Se pinta sólo si `puedeReasignar(user, …)`. Errores con `erroresDelServidor` (`apps/desk/src/api/client.ts:748-757`) |
| Personas activas | `getPersonas()` (`apps/desk/src/api/client.ts:217-218`), que lee `/api/personas` (`apps/desk/server/routes/directory.ts:49-51`) y ésta `listPersonas` (`apps/desk/server/auth/users.ts:74-81`), sólo activos |
| Montaje | En sitio en `apps/desk/src/components/TicketDetailView.tsx`: `import` en la línea 15, estado `versionHistoria` en la 72, `key` en la 291 y el panel en la 320, con `derivadoActual={ticket.derivado ?? null}` como en `apps/desk/src/components/TicketDetailView.tsx:338` |

## 4. Carrera de dos reasignaciones simultáneas

Solución: DD-1. La ruta lee el ticket (guarda A), valida contra ese `derivadoA` y lo pasa como `de`; el `UPDATE` sólo
acierta si el ticket sigue a cargo de esa persona. Quien pierde recibe `409` (escalón D, `MENSAJES_REASIGNACION.carrera`),
sin traza y sin aviso; al recargar ve a la persona nueva y decide.

| Prueba | Fichero | Cómo |
|---|---|---|
| Dato viejo en la capa de datos | `apps/desk/server/db/reasignaciones.test.ts` | Ticket a cargo de B; `reasignar` con `de: A` devuelve `false`, `derivado_a` sigue en B y la tabla queda vacía. Ídem con `de: null` |
| `409` en la ruta, determinista | `apps/desk/server/routes/reasignacion.test.ts` | `appWith({}, dbPropia)` (`apps/desk/server/testing/appHarness.ts:46-54`) con un `Queryable` sin `connect` (así `enTransaccion` llama directo, `apps/desk/server/db/transaccion.ts:15`) que, justo antes de reenviar el `UPDATE tickets SET derivado_a`, escribe otro `derivado_a` en la base real |
| Encadenadas | la misma | A→B y B→C dejan dos filas con `de` A y `de` B |

**Límite declarado.** pg-mem no tiene bloqueo de fila ni dos conexiones concurrentes reales, y no revierte un `ROLLBACK`
(`apps/desk/server/db/transaccion.test.ts:17`). Que en PostgreSQL el segundo `UPDATE` espere al primero y reevalúe su
`WHERE` es comportamiento del motor en `READ COMMITTED`: hipótesis no ejercitada por la suite (tampoco se leyó el nivel
de aislamiento del pool).

## 5. Guardas de la ruta y pruebas de posición

| Orden | Escalón | Guarda | Respuesta |
|---|---|---|---|
| 1 | A | `ticketParaReasignar` devuelve `null` | `404` |
| 2 | B | `!puedeReasignar(user, { status, classification })` | `403` |
| 3 | C | `reasignacionDelCuerpo(body, t.derivadoA)`: motivo | `422` |
| 4 | C | ídem: destino ausente | `422` |
| 5 | C | ídem: destino igual al actual | `422` |
| 6 | C | `getUserById` no devuelve un usuario activo (criterio de `apps/desk/server/services/ticketService.ts:138-142`) | `422` |
| 7 | D | `reasignar` devuelve `false` | `409` |

| Par | Entrada que activa las dos | Se espera |
|---|---|---|
| 1 y 2 (y 3) | Ticket inexistente, usuario sin área, cuerpo vacío | `404` |
| 2 y 3 | Ticket existente, usuario sin área, sin motivo | `403` |
| 3 y 4 | Con permiso, motivo de espacios, sin destino | `422` con el texto del motivo |
| 3 y 5, 3 y 6 | Motivo vacío con destino igual al actual, inexistente e inactivo | `422` con el texto del motivo, las tres veces |
| 4 y 5 | Ticket **sin** persona a cargo, motivo válido, destino ausente | `422` con el texto de destino ausente, no el de «ya está a cargo» |
| 5 y 6 | Destino que es la persona actual y está inactiva | `422` con el texto de destino igual |
| 6 y 7 | No hay par: D es el resultado de la propia escritura y no puede ir antes | — |

Los textos se comparan contra `MENSAJES_REASIGNACION`, no contra literales.

## 6. Sincronizador de extremo a extremo (D5)

Fichero `apps/desk/server/reasignacionSync.test.ts`, con `instalarArnes`, `appWith` y `adminCookie`
(`apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:46-54`,
`apps/desk/server/testing/appHarness.ts:86-89`) más `upsertTicket` y `ticketRowFromZoho`, importados como en
`apps/desk/server/prioridadTop5.test.ts:5-6`. El ticket «venido de Zoho» se fabrica **por el propio sincronizador**:
`upsertTicket(db, ticketRowFromZoho({ id, ticketNumber, subject, status: 'Ingresado', statusType: 'Open', customFields: {} }))`,
molde de `packages/zoho-sync/src/db/repo.test.ts:19-21` y `apps/desk/server/prioridadTop5.test.ts:322-330`; la prueba
afirma `managed_by_app === false` como precondición. Pasos: `POST` de reasignación (`200`), segundo `upsertTicket` con
`status: 'En Proceso'`, y se comprueba `derivado_a` igual al destino, `status` igual a `En Proceso` y `managed_by_app` en
`false`. Completa, con la ruta real, lo que `packages/zoho-sync/src/db/repo.test.ts:47-55` fija con un `UPDATE` a mano.

## 7. Plan de pruebas (rojo primero) y mutaciones

| Fichero de prueba | Qué fija |
|---|---|
| `packages/shared/src/reasignacion.test.ts` | Barrido de `puedeReasignar` sobre todos los estados de los tres catálogos (`packages/shared/src/flujos.ts:19-22`) por cada área, contra un esperado calculado en la prueba desde `from` y `area`; administrador; estado sin salida (S-2); orden y recorte del validador |
| `packages/zoho-sync/src/db/migrate.test.ts` | Tabla en `public`, `CREATE` calificado y último, índice en una sola sentencia, `CHECK` del motivo, recuentos |
| `apps/desk/server/db/reasignaciones.test.ts` | Escritura y traza juntas, origen nulo, dato viejo, lectura ordenada, usos; atomicidad por verbos `BEGIN, UPDATE, INSERT, ROLLBACK` por la conexión de la transacción, molde de `apps/desk/server/prioridadTop5.test.ts:333-345` con un `UPDATE` que sí devuelve fila |
| `apps/desk/server/services/avisoReasignacion.test.ts` | Texto con motivo y actor, supresión a uno mismo, aviso creado, sellado, correo fallando, copia |
| `apps/desk/server/auth/users.test.ts` (bloque al final) | Origen y destino cuentan como uso; `borrarUsuario` se niega |
| `apps/desk/server/db/eventoReasignacion.test.ts` | Evento puro, «Sin derivar», id crudo, y `getHistorialTicket` con transición y reasignación ordenadas |
| `apps/desk/server/routes/reasignacion.test.ts` | Criterios 1 a 4, 7 a 12 y 16; posición (§5); `409`; barrido HTTP de estados por áreas con cuerpo sin motivo (`403` frente a `422`); `escritoresTransiciones` sigue en verde (`apps/desk/server/escritoresTransiciones.test.ts:55-59`) |
| `apps/desk/server/reasignacionSync.test.ts` | Criterio 14 |
| `apps/desk/src/lib/reasignacion.test.ts` | Opciones sin la persona actual ni «Sin derivar»; botón |

| Mutación | Prueba que debe ponerse roja |
|---|---|
| `403` delante del `404` | Par 1 y 2 |
| `422` delante del `403` | Par 2 y 3 |
| Destino delante de motivo (en el validador) | Par 3 y 4, en `shared` y en la ruta |
| `CREATE TABLE` sin `public.` | Guardián de `packages/zoho-sync/src/db/migrate.test.ts:271` |
| Quitar el `CHECK` del motivo | `INSERT` directo con motivo vacío, en `migrate.test.ts` |
| `puedeReasignar` siempre verdadero | Barrido puro y barrido HTTP |
| `managed_by_app = true` en el `UPDATE` | `reasignacionSync.test.ts` (el estado de Zoho no entra) |
| `INSERT` de la traza fuera de la transacción | Prueba de verbos |
| Quitar la supresión a uno mismo | Prueba pura del aviso y la de la ruta |
| Quitar la tercera fuente de `usosDeUsuario` | Bloque nuevo de `users.test.ts` |
| Quitar la condición sobre `derivado_a` del `UPDATE` (añadida por este diseño) | Dato viejo y `409` |

## 8. Lotes

Bruto = líneas añadidas más borradas; una línea editada en sitio cuenta dos. Techo 800, válvula 720.

| Lote | Ficheros (bruto) | Bruto | × 1,8 |
|---|---|---|---|
| 1 · dominio, esquema y datos | `shared/reasignacion.ts` 55, su prueba 95, `index.ts` 1, `schema.sql` 13, `migrate.ts` 2, `migrate.test.ts` 40, `db/reasignaciones.ts` 60, su prueba 95 | 361 | 650 |
| 2 · aviso, usos, borrado e historial | `avisoReasignacion.ts` 45, su prueba 70, `users.ts` 8, `users.test.ts` 18, `eliminarTicket.ts` 2 y su prueba 15 (hipótesis), `eventoReasignacion.ts` 45, su prueba 70, `historial.ts` 4 | 277 | 499 |
| 3 · ruta, registro y sincronizador | `routes/reasignacion.ts` 50, `app.ts` 4, prueba de la ruta 240, `reasignacionSync.test.ts` 45 | 339 | 610 |
| 4 · cliente y documentos | `client.ts` 10, `lib` 30 y su prueba 45, `PanelReasignar.tsx` 75, `TicketDetailView.tsx` 8, corrección 30 35, `DEPLOY.md` 12, paquete de despliegue 60, `openspec/config.yaml` 15, tabla de la regla 13 10 | 300 | 540 |
| 5 · verify | Informe y remediación | — | intento propio |

Frente a la propuesta: su lote 2 sale en 409 brutas (736) y su lote 3 también (736), por encima de la válvula; por eso
son cuatro lotes de construcción y no tres. Si el lote 1 pasa de 720 al medirlo, se saca `db/reasignaciones` al lote 2.

## 9. Riesgo de citas (regla de mutación 4)

Citas completas contadas con el patrón de ruta entera más dos puntos y número, sobre el worktree:

| Fichero | Citas completas | Líneas que se tocan | Citas por debajo del primer punto tocado | Desplazadas con este diseño |
|---|---|---|---|---|
| `apps/desk/server/db/historial.ts` | 31 | 3 y 157 | 31 | 0 |
| `apps/desk/server/auth/users.ts` | 22 | 4, comentario de 126 a 134, y 139 | 21 | 0 |
| `apps/desk/server/app.ts` | 42 | 22 y 61 | 36 (13 por debajo de la 61) | 0 |

Cero desplazadas porque no se inserta ninguna línea: el molde de sentencias unidas por `;` en una línea ya está en
`apps/desk/server/db/historial.ts:3` y `apps/desk/server/app.ts:22`. Lo que sí hay que **leer** al cierre, porque la
línea sigue existiendo y puede dejar de decir lo que la frase afirma: las cuatro citas que abarcan la unión del
historial (dos vivas, `openspec/specs/trazas/spec.md:28` y `openspec/specs/trazas/spec.md:141`, que hoy describen tres
fuentes), y las siete que caen en `usosDeUsuario` o en su comentario. `TicketDetailView.tsx` tiene 72 citas con número de
línea (contadas por nombre de fichero, con cualquier prefijo de ruta) y se edita igual, en sitio. `schema.sql` y `client.ts` sólo crecen por el final.

`docs/sdd/ENTRADA.md` **no se toca** en esta tanda.

## 10. Flujo de datos

    Panel ──POST──▶ ruta: A ▶ B (shared) ▶ C (shared + users) ──▶ reasignar() ── enTransaccion ─▶ tickets.derivado_a
                                                                       │ false ▶ 409            └▶ public.reasignaciones
                                                                       └ true ▶ notificarReasignacion ▶ avisos ▶ n8n
    HistoriaPanel ◀── getHistorialTicket ◀── zoho + transiciones + remisiones + eventosReasignacion

## 11. Matriz de amenazas

N/A: el cambio no toca enrutado de agentes, órdenes de shell, subprocesos, automatización de control de versiones ni
clasificación de ejecutables.

## 12. Migración y despliegue

Sin relleno, sin interruptor y sin variables nuevas. La tabla la crea `migrate` al arrancar; P-4 de la propuesta
comprueba que existe en producción.

## 13. Preguntas abiertas

- [x] Resuelto (RQ-TC-50 lleva el escalón D y la adenda de la propuesta lo recoge). El `409` de carrera no figuraba en la propuesta ni en RQ-TC-50 ni RQ-TC-51: hace falta un escenario en el delta de `tickets-core`.
- [x] Confirmado por el orquestador (adenda de la propuesta, RQ-TC-51). DD-6 (S-8) amplía los ficheros tocados a `eliminarTicket.ts`: confirmar o retirar; si se retira, queda como hallazgo.
- [x] Resuelto de otro modo: `openspec/specs/trazas/spec.md:28` es un registro histórico anclado a una revisión y no se toca (caso B); lo que sí se modifica es RQ-TZ-06 (`openspec/specs/trazas/spec.md:139` en `821c348`), el requisito vivo que dice «tres fuentes».
