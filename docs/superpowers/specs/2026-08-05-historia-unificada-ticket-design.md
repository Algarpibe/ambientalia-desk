# Diseño — Historia unificada del ticket

**Fecha:** 2026-08-05
**Estado:** Aprobado para planificación

## Objetivo

Que la pestaña **HISTORIA** del detalle del ticket cuente todo lo que le ha pasado al ticket en una
sola línea de tiempo: cómo nació, cada transición —de Zoho y de la app— con los campos que se
diligenciaron, y las remisiones con su desenlace.

## El problema, medido

Tres fallos distintos, no uno:

1. **CONVERSACIONES solo trae correo de Zoho.** Un ticket creado en la app no tiene ninguna, así que
   la pestaña sale vacía. Lo que en Zoho llenaba ese hueco eran *comentarios privados* escritos a
   mano; no es un registro automático y no se va a replicar como tal (ver "Fuera de alcance").
2. **HISTORIA enseña las transiciones de Zoho o las de la app, nunca las dos.**
   `getTicketHistory` (`packages/zoho-sync/src/db/history.ts:24`) hace
   `if (hay filas en ticket_history) … else (ticket_transitions)`. Un ticket que **vino de Zoho y
   luego se movió en la app** no enseña jamás sus transiciones de la app. Es el fallo más grave de
   los tres porque oculta datos que sí existen.
3. **Crear una remisión no deja rastro en el ticket.** `POST /api/remisiones` escribe en `remisiones`
   y nada más: ni `ticket_transitions` ni `ticket_history`.

## Decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Dónde vive el tracking | **HISTORIA**, unificada | CONVERSACIONES se queda para el correo real con el cliente, que es lo que es |
| Cómo se construye | **Derivada al leer** | Aparece sola toda la historia que ya existe: las 149 remisiones migradas y las transiciones de todos los tickets actuales. Registrar eventos nuevos solo funcionaría de hoy en adelante |
| Qué eventos | Creación con sus datos · transiciones de Zoho **y** de la app · campos diligenciados en cada transición · remisión creada, su desenlace y su anulación | Decidido por el usuario |
| Escrituras nuevas | Solo una: `createTicket` guarda el payload completo (ver abajo) | El resto es lectura |

## El caveat de la creación, y qué se hace con él

`createTicket` (`packages/zoho-sync/src/db/repo.ts:326`) guarda en `values` **únicamente**
`{ orden_venta }`. El resto de los datos con los que nació el ticket —cliente, equipo, marca,
modelo, serie, tipo de servicio, clasificación, prioridad— no está en la transición: está en la fila
de `tickets`, que es **estado actual**, no una foto del momento.

Hoy coinciden porque nada reescribe esas columnas, pero apoyarse en eso es exactamente el error que
ya se evitó en remisiones ("una remisión es un documento, no una vista"). Se cierra en dos mitades:

- **De aquí en adelante:** `createTicket` guarda el payload completo en `values`. El evento usa esa
  foto cuando existe.
- **Para lo ya creado:** el evento cae a la fila de `tickets`. **No tiene arreglo retroactivo** y se
  asume: la foto no se puede inventar. El evento no distingue visualmente un caso del otro —hacerlo
  sería ruido para el técnico— pero queda escrito aquí.

## Backend

### Reparto de responsabilidades

`getTicketHistory` vive hoy en `packages/zoho-sync`, que es el motor de sync de Zoho. Componer ahí
una vista que lee `remisiones` —tabla de la app Desk, ajena a Zoho— sería meter la app dentro del
motor. Se parte en dos:

- **`packages/zoho-sync/src/db/history.ts`** — `getZohoHistoryEvents(db, ticketId)`: solo
  `ticket_history`, mapeado con `mapHistoryEvent`. **Se le quita el fallback a
  `ticket_transitions`**, que sube un nivel. `upsertHistoryEvent` se queda como está.
- **`apps/desk/server/db/historial.ts`** (nuevo) — `getHistorialTicket(db, ticketId)`: compone las
  tres fuentes y devuelve `HistoryEvent[]` ordenado por tiempo descendente.
- **`apps/desk/server/routes/tickets.ts`** — `GET /api/tickets/:id/history` pasa a llamar a
  `getHistorialTicket`. Ni la ruta ni el contrato de la respuesta cambian.

### Las tres fuentes

**1. Zoho** — `getZohoHistoryEvents`, sin cambios de forma.

**2. Transiciones** (`ticket_transitions`, por `ticket_id`). Dos formas según la fila:

- **La creación** (`from_status = '(creación)'`, que es lo que escribe `createTicket`):
  `title = 'Ticket creado'`, `actor = performed_by`. Detalles: cliente, orden de venta, equipo
  (marca, modelo, serie), tipo de servicio, clasificación y prioridad. Los valores salen de `values`
  si trae la foto completa; si no, de la fila de `tickets` (con `LEFT JOIN clients` para el nombre
  del cliente). Se omite cada detalle que quede vacío: una lista con seis "—" no informa.
- **Las demás:** `title = 'Transición: <nombre>'`, detalle `Estado: <de> → <a>`, `Área` si la hay, y
  **un detalle por cada campo diligenciado** en `values`. Las claves de `values` son nombres técnicos
  (`orden_venta`); se pintan legibles con un formateador que sustituye `_` por espacio y pone la
  primera en mayúscula. No se traduce con un diccionario: el conjunto de campos lo decide el
  Blueprint y un diccionario quedaría desactualizado en silencio.

**3. Remisiones** (`remisiones`, por `ticket_id`). Hasta tres eventos por fila:

| Evento | Cuándo | Título | Detalles |
|---|---|---|---|
| Creada | `created_at` | `Remisión de entrada creada` | Técnico (`creado_por`), fecha de servicio, tipo de servicio, `Incluye` (unido por comas), observaciones |
| Desenlace | `resuelto_at`, si no es NULL | `Remisión: <etiqueta del estado>` | Carpeta de Drive (enlace), nº de fotos subidas, avisos y fallos si los hay |
| Anulada | `anulada_at`, si no es NULL | `Remisión anulada` | Quién (`anulada_por`) |

Se listan **todas** las remisiones del ticket, incluidas las anuladas: el historial es un registro de
lo que pasó, y una remisión anulada pasó. (`listRemisionesByTicket` filtra las anuladas y por eso
**no** se reutiliza aquí; se consulta directo.)

Las etiquetas del estado (`Enviando…` / `Creada` / `Creada con avisos` / `Falló`) las necesita ahora
también el servidor, y hoy viven en `apps/desk/src/lib/remisionResultado.ts`, que es código de
cliente. **Duplicarlas está descartado**: ese mismo fichero lleva escrito el porqué ("un único sitio:
dos mapas iguales acaban divergiendo"), y sería contradecirlo en el commit siguiente. Se extrae el
**texto** a `packages/shared/src/remision.ts` —donde ya viven las constantes compartidas de
remisiones— y `remisionResultado.ts` se queda con las clases de Tailwind, que son de cliente y solo
de cliente, componiendo la etiqueta desde shared.

### Orden

Todos los eventos se ordenan por `time` descendente, con los de `time` nulo al final. Es el orden
que el panel ya espera y el que agrupa por día sin tocar `HistoriaPanel`.

## Frontend

**Ninguno.** `HistoriaPanel.tsx` ya renderiza `HistoryEvent[]` con agrupación por día, hora, título y
la lista de `details`. Los eventos nuevos entran por el mismo molde. El enlace a la carpeta de Drive
se pasa por `urlSegura` **en el servidor** (exige `https://`) y viaja como detalle con `html: true`,
que el panel ya sanea con DOMPurify.

## Manejo de errores y seguridad

- La ruta sigue bajo `requireAuth`. Consultas con parámetros ligados.
- `urlSegura` en el servidor: esa URL la manda n8n por el callback y acaba en un `href`. El callback
  está tras un secreto compartido, pero es la única entrada de este panel que llega a un atributo
  peligroso.
- Un ticket sin nada devuelve `[]`, que el panel ya pinta como "Sin historial".

## Pruebas

Repo (pg-mem), en `apps/desk/server/db/historial.test.ts`:

- Un ticket con historia de Zoho **y** transiciones de la app devuelve **las dos** (la regresión del
  `else`, que es el fallo 2).
- La fila `(creación)` sale como "Ticket creado" con los datos del equipo y del cliente.
- La creación con foto completa en `values` usa la foto; sin ella, cae a la fila de `tickets`.
- Una transición normal expone un detalle por campo de `values`.
- Una remisión resuelta produce sus dos eventos (creada + desenlace); una anulada, los tres.
- Una remisión anulada **sí** aparece.
- Todo sale ordenado por fecha descendente.
- `carpetaUrl` que no empiece por `https://` no produce enlace.

Endpoint (supertest + sesión), en `app.test.ts`: la ruta devuelve los eventos compuestos; 401 sin
sesión.

`packages/zoho-sync/src/db/history.test.ts`: el test del fallback a `ticket_transitions` se **mueve**
al nuevo fichero, porque el fallback deja de existir ahí.

## Fuera de alcance

- Publicar notas en CONVERSACIONES. Se queda para el correo real con el cliente.
- Adjuntar el PDF de la remisión al ticket. La app no tiene credenciales de Drive.
- Exportar la historia.
- Paginar o plegar la línea de tiempo. Son decenas de eventos, no miles. **Riesgo asumido:** un
  ticket con mucha historia de Zoho, varias transiciones y varias remisiones va a dar una pantalla
  larga. Si al usarla resulta ilegible, el arreglo natural es plegar por tipo de evento.
- Backfill de la foto de creación para los tickets ya creados: no se puede reconstruir.
