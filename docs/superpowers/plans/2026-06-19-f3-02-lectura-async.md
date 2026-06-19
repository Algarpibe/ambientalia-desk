# F3-02 desacoplar lectura↔Zoho — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development. Rama `fix/f3-02-lectura-async` → PR.

**Goal:** Que abrir un ticket lea de la base local sin bloquear en Zoho; refresco "Lazy + background".

**Spec:** `docs/superpowers/specs/2026-06-19-f3-02-lectura-async-design.md`.

**Contexto (app.ts actual):**
- `:170-178` `GET /api/tickets/:id` → `await sync.syncTicket(id)` (try/catch propio que loguea) + `getTicketWithRefs`.
- `:189-195` `GET /api/tickets/:id/history` → `await sync.syncTicketHistory(id)` (try/catch) + `getTicketHistory`.
- `:180-187` `GET /api/tickets/:id/conversations` → `if (convs.length===0){ await sync.syncConversations(id); convs=... }`.
- Estos handlers ya fueron envueltos en `asyncHandler` (Fase B). Reusar ese patrón.

---

## Task 1: Lazy + background en los 3 endpoints (TDD)

**Files:** `apps/desk/server/app.ts`, `apps/desk/server/app.test.ts`.

- [ ] **Step 1: Tests (app.test.ts)** — leer primero el helper `appWith()` (devuelve `{app, sync, zohoFetch, ...}` y permite controlar mocks). Añadir un `describe('F3-02 lectura asíncrona')` con:
  - **Detalle no bloquea:** mock `sync.syncTicket` que cuenta llamadas y rechaza (`vi.fn().mockRejectedValue(new Error('zoho down'))`); GET `/api/tickets/<id existente local>` → status 200 con los datos locales (no 500), y `syncTicket` se llamó (background). Sembrar el ticket en el `db` local del test.
  - **Historial vacío → lazy (await):** sin historial local, `syncTicketHistory` mock que puebla; GET `/history` → devuelve lo poblado; `syncTicketHistory` llamado.
  - **Historial con datos → background:** con historial local, `syncTicketHistory` que rechaza; GET `/history` → 200 con local, `syncTicketHistory` llamado (no rompe).
  - **Conversaciones con datos → background refresh:** con convs locales, `syncConversations` que rechaza; GET `/conversations` → 200 con local, `syncConversations` llamado.
  (Adaptar a cómo `appWith()` expone/inyecta `sync`; si no permite inyectar un `sync` mockeado, extender el helper mínimamente o construir vía `createApp` con un `sync` stub + `db` sembrado.)
- [ ] **Step 2: Run** los nuevos → FAIL (hoy await bloquea / un rechazo en background hoy no aplica porque se await-ea con try/catch).
- [ ] **Step 3: Implementar en `app.ts`:**
  - **`GET /api/tickets/:id`:**
    ```ts
    app.get('/api/tickets/:id', asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      let found = await getTicketWithRefs(db, id)
      if (!found) { // primera vez sin datos locales → poblar (lazy)
        try { await sync.syncTicket(id) } catch (e) { console.error(`syncTicket(${id}) falló:`, e) }
        found = await getTicketWithRefs(db, id)
        if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
      } else {
        void sync.syncTicket(id).catch((e) => console.error(`syncTicket bg(${id}) falló:`, e)) // refresco en background
      }
      res.json(rowToTicketDetail(found.row, found.refs))
    }))
    ```
  - **`GET /api/tickets/:id/history`:**
    ```ts
    app.get('/api/tickets/:id/history', asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      let hist = await getTicketHistory(db, id)
      if (hist.length === 0) {
        try { await sync.syncTicketHistory(id) } catch (e) { console.error(`syncTicketHistory(${id}) falló:`, e) }
        hist = await getTicketHistory(db, id)
      } else {
        void sync.syncTicketHistory(id).catch((e) => console.error(`syncTicketHistory bg(${id}) falló:`, e))
      }
      res.json(hist)
    }))
    ```
  - **`GET /api/tickets/:id/conversations`:**
    ```ts
    app.get('/api/tickets/:id/conversations', asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      let convs = await getConversations(db, id)
      if (convs.length === 0) { await sync.syncConversations(id); convs = await getConversations(db, id) }
      else { void sync.syncConversations(id).catch((e) => console.error(`syncConversations bg(${id}) falló:`, e)) }
      res.json(convs.map(({ row, attachments }) => rowToMessage(row, attachments)))
    }))
    ```
  (Verificar que `getTicketHistory` devuelve un array con `.length`; si devuelve otra forma, adaptar el chequeo de "vacío".)
- [ ] **Step 4: Run** `npm test` → todos verdes (incl. nuevos). `npm run typecheck`, `npm run lint`, `npm run build` → OK.
- [ ] **Step 5: Commit** (en la rama): `git add apps/desk/server/app.ts apps/desk/server/app.test.ts && git commit -m "perf(desk): lectura de tickets desde la réplica local + refresco en background (F3-02)"` (trailer Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>).

## Notas
- `void promise.catch(...)` = fire-and-forget explícito (no `await`); el linter no se queja del flotante.
- No cambia la forma de las respuestas. El worker/sync no se toca.
