# Diseño — F3-02: desacoplar la lectura de tickets de la API de Zoho

**Fecha:** 2026-06-19
**Estado:** Aprobado para planificación
**Origen:** auditoría (Fase D). Repo: `ambientalia-desk`. Rama: `fix/f3-02-lectura-async`.

## Problema
Abrir un ticket bloquea en una llamada en vivo a Zoho antes de responder ([apps/desk/server/app.ts](apps/desk/server/app.ts)):
- `GET /api/tickets/:id` → `await sync.syncTicket(id)` (cada apertura).
- `GET /api/tickets/:id/history` → `await sync.syncTicketHistory(id)` (cada apertura).
- `GET /api/tickets/:id/conversations` → sincroniza si está vacío (ya es lazy).
Consecuencias: latencia, fragilidad ante Zoho lento/caído, consumo de rate-limit por apertura.

## Decisión (confirmada): modelo "Lazy + background"
- Servir SIEMPRE desde la base local (réplica) sin bloquear.
- Si NO hay datos locales (primera vez) → bloquear UNA vez para poblar (lazy), luego servir.
- Si HAY datos locales → servir local al instante y disparar el refresco desde Zoho en **segundo plano** (fire-and-forget, sin `await`).
- Cada sync en background captura sus errores (`.catch`) y nunca tumba el request.

## Comportamiento por endpoint
- **`GET /api/tickets/:id`:** `getTicketWithRefs(db,id)`. Si existe → responder + `sync.syncTicket(id).catch(log)` (background). Si NO existe localmente → `await sync.syncTicket(id)` (fallback), re-leer; 404 si sigue sin existir. (En la práctica el ticket siempre está local porque viene del listado, pero el fallback cubre el caso borde.)
- **`GET /api/tickets/:id/history`:** `getTicketHistory(db,id)`. Si vacío → `await sync.syncTicketHistory(id)` + re-leer (lazy primera vez). Si no vacío → responder local + `sync.syncTicketHistory(id).catch(log)` (background).
- **`GET /api/tickets/:id/conversations`:** mantener el lazy actual (si vacío → await sync + re-leer). Añadir: si NO vacío → `sync.syncConversations(id).catch(log)` (background refresh).

## No-objetivos / invariantes
- Sin cambios de API ni de forma de respuesta (mismos JSON).
- Sin tocar el worker ni los loops de sync existentes.
- El sync en background usa las MISMAS funciones (`sync.syncTicket/​syncTicketHistory/​syncConversations`); solo cambia el `await` por fire-and-forget gated por "hay datos locales".
- Trade-off aceptado: tras la primera carga, el usuario ve datos de hasta el último refresco; el background lo actualiza para la siguiente apertura.

## Pruebas (TDD, supertest + mocks del `appWith()` de app.test.ts)
- Detalle: con ticket en local, la respuesta NO espera a `syncTicket` (p.ej. `syncTicket` mock que tarda/cuenta llamadas → la respuesta llega con los datos locales; se invoca en background una vez). Verificar que un fallo de `syncTicket` (rechaza) NO rompe la respuesta (sigue 200 con local).
- Historial: con historial local vacío → se llama `syncTicketHistory` (await) y se devuelve lo poblado; con historial local no vacío → se devuelve local y `syncTicketHistory` se dispara en background (no bloquea, fallo no rompe).
- Conversaciones: vacío → await sync (comportamiento actual intacto); no vacío → background refresh disparado, fallo no rompe.

## Verificación
`npm test` (todo verde + nuevos), `npm run typecheck`, `npm run lint`, `npm run build`.

## Despliegue
Rama → PR → CI verde → merge → EasyPanel despliega. Validar en prod: abrir un ticket es instantáneo; el historial/conversaciones se mantienen; si Zoho está lento, abrir el ticket sigue respondiendo (con datos locales).

## Fuera de alcance
- TTL/expiración por tiempo (este diseño usa "hay datos locales" como gate, no un TTL temporal). F3-01 paginación, resto de Fase D.
