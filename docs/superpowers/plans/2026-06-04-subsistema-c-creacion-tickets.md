# Subsistema C — Creación de tickets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear tickets dentro de la plataforma (Postgres), pivotando opcionalmente en una Orden de Venta de Zoho Books para autocompletar cliente + Orden de Venta, armando el asunto/código estandarizado y dejando el ticket en "OV asignada".

**Architecture:** Constructor puro de asunto/código (`shared/ticketCreate.ts`); `createTicket` en el repo (transacción: número de secuencia + insert ticket gestionado + insert transición #1); endpoint `POST /api/tickets`; selectores de OV/cliente en un modal del tablero. La empresa del tablero se resuelve con `COALESCE(account, client)`.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-04-subsistema-c-creacion-tickets-design.md`.

**Contexto del repo:**
- `server/db/repo.ts`: `nextTicketNumber`, `insertTransition`, `applyTransition` (patrón transacción con `PoolLike.connect()`), `getActiveTickets`/`getTicketWithRefs` (JOIN accounts→`a`, agents→`g`, contacts→`c`). `J = JSON.stringify`. `randomUUID` ya importado.
- `server/app.ts`: `app.use('/api/tickets', requireAuth(db))` (línea 59) ya **gatea por sesión** todo `/api/tickets` incl. el POST. Endpoints leen el cuerpo con `express.json()`. `req.user` lo pone `requireAuth`.
- `server/books/repo.ts`: `getClient(db,id): ClientLite|null`, `getSalesOrder(db,id): SalesOrderLite|null`, `upsertClient`, `upsertSalesOrder`. `server/books/mappers.ts`: `clientFromBooks`, `salesOrderFromBooks`.
- `server/app.test.ts`: helpers `adminCookie()` (→ `sid=...`), `appWith()` (→ `{ app }`) y un `db` de módulo (seed en `beforeEach`). `request` de supertest.
- `src/api/client.ts`: helper `json<T>`; todas las llamadas `credentials:'include'`. `src/App.tsx`: barra de cabecera del tablero (líneas 34–42) y `reload` de `useAsync(fetchTickets,...)`.
- `shared/types.ts`: ya tiene `ClientLite`, `SalesOrderLite`, `TicketDetail`.

---

## Estructura de archivos
- Modify `server/db/schema.sql` — `ALTER TABLE tickets ADD COLUMN client_id, salesorder_id`.
- Modify `server/db/migrate.test.ts` — afirmar las columnas nuevas.
- Create `shared/ticketCreate.ts` (+ `.test.ts`) — constructor puro + constantes.
- Modify `server/db/repo.ts` (+ `server/db/repo.test.ts`) — `createTicket` + COALESCE de empresa.
- Modify `server/app.ts` (+ `server/app.test.ts`) — `POST /api/tickets`.
- Modify `shared/types.ts`, `src/api/client.ts`, `src/App.tsx`; Create `src/components/CreateTicket.tsx` — frontend.

---

## Task 1: Columnas `client_id` + `salesorder_id` en `tickets`

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir a `server/db/schema.sql`** (al final, junto a los otros `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`):
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id text;      -- → clients.id (Books), tickets creados en la app
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS salesorder_id text;  -- → sales_orders.id (Books)
```

- [ ] **Step 2: En `server/db/migrate.test.ts`** añade un test (auto-contenido; usa el mismo `import { newDb }`, `migrate` ya presentes en el archivo):
```ts
  it('tickets tiene columnas client_id y salesorder_id (Subsistema C)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    const r = await db.query('SELECT client_id, salesorder_id FROM tickets')
    expect(r.rows).toEqual([])
  })
```

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(C): tickets.client_id + tickets.salesorder_id columns"
```

---

## Task 2: Constructor de asunto/código (TDD, puro)

**Files:**
- Create: `shared/ticketCreate.ts`
- Create: `shared/ticketCreate.test.ts`

- [ ] **Step 1: Escribir `shared/ticketCreate.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { buildCodigoServicio, buildSubject, parseCodigoFromPotential } from './ticketCreate'

describe('buildCodigoServicio', () => {
  it('arma PREFIJO_serie_modelo_AAMMDD', () => {
    expect(buildCodigoServicio({ prefijo: 'MT', serie: '18A20070', modelo: 'EDM180C', fecha: new Date(2026, 5, 4) }))
      .toBe('MT_18A20070_EDM180C_260604')
  })
})

describe('buildSubject', () => {
  it('arma el asunto estandarizado y colapsa espacios', () => {
    expect(buildSubject({ cliente: 'Gecelca S.A. E.S.P.', tipoEquipo: 'Monitor de partículas', codigo: 'MT_18A20070_EDM180C_260604' }))
      .toBe('Servicio Técnico Gecelca S.A. E.S.P. Monitor de partículas MT_18A20070_EDM180C_260604')
  })
})

describe('parseCodigoFromPotential', () => {
  it('extrae prefijo/serie/modelo cuando hay código', () => {
    expect(parseCodigoFromPotential('Corola - 0526 - MT_18A10077_EDM180D_260416'))
      .toEqual({ prefijo: 'MT', serie: '18A10077', modelo: 'EDM180D' })
  })
  it('devuelve null si no hay código', () => {
    expect(parseCodigoFromPotential('Daphnia - Alquiler Cilindros')).toBeNull()
    expect(parseCodigoFromPotential(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run shared/ticketCreate.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar `shared/ticketCreate.ts`**
```ts
export const PREFIJOS = ['MT', 'CG', 'HV', 'SR', 'PRO'] as const
export const TIPOS_SERVICIO = ['Calibración', 'Diagnóstico', 'Garantía', 'Mantenimiento', 'No aplica', 'Otro'] as const
export const CLASIFICACIONES = ['Equipo para servicio de mantenimiento', 'Equipo nuevo', 'Soporte remoto'] as const

function yymmdd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

export function buildCodigoServicio(input: { prefijo: string; serie: string; modelo: string; fecha: Date }): string {
  return [input.prefijo, input.serie, input.modelo, yymmdd(input.fecha)].filter((p) => p != null && p !== '').join('_')
}

export function buildSubject(input: { cliente: string; tipoEquipo: string; codigo: string }): string {
  return `Servicio Técnico ${input.cliente} ${input.tipoEquipo} ${input.codigo}`.replace(/\s+/g, ' ').trim()
}

export function parseCodigoFromPotential(potentialName: string | null | undefined): { prefijo: string; serie: string; modelo: string } | null {
  if (!potentialName) return null
  const m = potentialName.match(/\b(MT|CG|HV|SR|PRO)_([^_\s]+)_([^_\s]+)_(\d{6})\b/)
  return m ? { prefijo: m[1], serie: m[2], modelo: m[3] } : null
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run shared/ticketCreate.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add shared/ticketCreate.ts shared/ticketCreate.test.ts
git commit -m "feat(C): subject/codigo builder + parseCodigoFromPotential (pure)"
```

---

## Task 3: `createTicket` en el repo + empresa por COALESCE (TDD pg-mem)

**Files:**
- Modify: `server/db/repo.ts`
- Modify: `server/db/repo.test.ts`

- [ ] **Step 1: Escribir el test en `server/db/repo.test.ts`** (añade imports arriba y el bloque; el archivo ya crea un `db` pg-mem migrado en `beforeEach`):
```ts
import { createTicket } from './repo'
import { upsertClient } from '../books/repo'
import { clientFromBooks } from '../books/mappers'

describe('createTicket (Subsistema C)', () => {
  it('crea un ticket gestionado en "OV asignada" con número de secuencia + transición #1', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'cli1', contact_name: 'Gecelca S.A. E.S.P.', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const id = await createTicket(db, {
      subject: 'Servicio Técnico Gecelca S.A. E.S.P. Monitor MT_18A20070_EDM180C_260604',
      codigoServicio: 'MT_18A20070_EDM180C_260604', classification: 'Equipo para servicio de mantenimiento',
      tipoServicio: 'Mantenimiento', equipo: 'Monitor de partículas', marca: 'Grimm', modelo: 'EDM180C',
      serial: '18A20070', ordenVenta: 'OV-2026-200', priority: null, clientId: 'cli1', salesorderId: 'so1', actor: 'Admin',
    })
    expect(id).toMatch(/^app-/)
    const row = (await db.query('SELECT number, status, status_type, managed_by_app, source, client_id, salesorder_id, orden_venta FROM tickets WHERE id=$1', [id])).rows[0]
    expect(row.status).toBe('OV asignada')
    expect(row.status_type).toBe('Open')
    expect(row.managed_by_app).toBe(true)
    expect(row.source).toBe('app')
    expect(row.client_id).toBe('cli1')
    expect(row.salesorder_id).toBe('so1')
    expect(row.orden_venta).toBe('OV-2026-200')
    expect(Number(row.number)).toBeGreaterThan(0)
    const tr = (await db.query('SELECT to_status, transition_name, area, performed_by FROM ticket_transitions WHERE ticket_id=$1', [id])).rows[0]
    expect(tr).toMatchObject({ to_status: 'OV asignada', transition_name: 'Enviar', area: 'Comercial', performed_by: 'Admin' })
    // empresa resuelta por client_id (COALESCE) en tablero y detalle
    const active = await getActiveTickets(db)
    expect(active.find((t) => t.row.id === id)?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
    const detail = await getTicketWithRefs(db, id)
    expect(detail?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
  })
})
```
(Si `getActiveTickets`/`getTicketWithRefs` no están ya importados en el test, añádelos al import existente de `./repo`.)

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: FAIL (`createTicket` no existe).

- [ ] **Step 3: Implementar.** En `server/db/repo.ts`:

(a) Cambia la query de `getActiveTickets` para unir `clients` y resolver empresa con COALESCE:
```ts
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     WHERE (t.status_type <> 'Closed' OR t.status_type IS NULL) ORDER BY t.created_time DESC NULLS LAST`,
  )
```

(b) Cambia la query de `getTicketWithRefs` (ojo: el alias `c` ya es para `contacts`; usa `cl` para clients):
```ts
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name,
            c.first_name AS c_first, c.last_name AS c_last, c.phone AS c_phone, c.email AS c_email
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN contacts c ON t.contact_id=c.id
     LEFT JOIN clients cl ON t.client_id=cl.id WHERE t.id=$1`,
    [id],
  )
```

(c) Añade el tipo y la función `createTicket` al final del archivo:
```ts
export interface CreateTicketInput {
  subject: string
  codigoServicio: string | null
  classification: string | null
  tipoServicio: string | null
  equipo: string | null
  marca: string | null
  modelo: string | null
  serial: string | null
  ordenVenta: string | null
  priority: string | null
  clientId: string
  salesorderId: string | null
  actor: string
}

/** Crea un ticket gestionado por la app en "OV asignada" + su transición #1, de forma atómica. */
export async function createTicket(db: Queryable, input: CreateTicketInput): Promise<string> {
  const id = `app-${randomUUID()}`
  const number = await nextTicketNumber(db)
  const run = async (q: Queryable): Promise<void> => {
    await q.query(
      `INSERT INTO tickets (id,number,subject,status,status_type,priority,classification,tipo_servicio,equipo,marca,modelo,serial,codigo_servicio,orden_venta,client_id,salesorder_id,managed_by_app,source,created_time,modified_time,updated_at)
       VALUES ($1,$2,$3,'OV asignada','Open',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,'app',now(),now(),now())`,
      [id, number, input.subject, input.priority, input.classification, input.tipoServicio, input.equipo, input.marca, input.modelo, input.serial, input.codigoServicio, input.ordenVenta, input.clientId, input.salesorderId],
    )
    await q.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
       VALUES ($1,'enviar','Enviar','(creación)','OV asignada','Comercial',$2,$3,null)`,
      [id, input.actor, JSON.stringify({ orden_venta: input.ordenVenta })],
    )
  }
  const pool = db as PoolLike
  if (typeof pool.connect !== 'function') { await run(db); return id }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await run(client)
    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch { /* ignora fallo de rollback */ }
    throw e
  } finally {
    client.release()
  }
  return id
}
```
(`PoolLike`, `nextTicketNumber`, `randomUUID` ya existen en el archivo.)

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: PASS (incluye los tests previos + el nuevo).

- [ ] **Step 5: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(C): createTicket (managed, OV asignada, transition #1) + company via COALESCE(account,client)"
```

---

## Task 4: Endpoint `POST /api/tickets` (TDD supertest)

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

- [ ] **Step 1: Escribir el test en `server/app.test.ts`** (reusa `adminCookie()`, `appWith()`, `db`, `request`; añade imports de books seed):
```ts
import { upsertSalesOrder } from './books/repo'
import { salesOrderFromBooks } from './books/mappers'
// (upsertClient/clientFromBooks ya se importaron en el bloque de /api/clients)

describe('POST /api/tickets (crear)', () => {
  it('crea desde una OV: deriva cliente + orden de venta, estado OV asignada', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli1', contact_name: 'Gecelca S.A. E.S.P.', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 'so1', salesorder_number: 'OV-2026-200', customer_id: 'cli1', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      salesOrderId: 'so1', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento',
      tipoEquipo: 'Monitor de partículas', marca: 'Grimm', modelo: 'EDM180C', serie: '18A20070', prefijo: 'MT',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
    expect(res.body.company).toBe('Gecelca S.A. E.S.P.')
    const t = (await db.query("SELECT orden_venta, client_id, salesorder_id, managed_by_app, source FROM tickets WHERE salesorder_id='so1'")).rows[0]
    expect(t).toMatchObject({ orden_venta: 'OV-2026-200', client_id: 'cli1', salesorder_id: 'so1', managed_by_app: true, source: 'app' })
  })

  it('crea sin OV con cliente manual', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli2', contact_name: 'Camposol', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli2', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo',
      tipoEquipo: 'Sensor', marca: 'Horiba', modelo: 'APDA', serie: 'SN1', prefijo: 'CG', ordenVenta: 'manual-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
    expect(res.body.company).toBe('Camposol')
  })

  it('422 si faltan obligatorios', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({ tipoServicio: 'Mantenimiento' })
    expect(res.status).toBe(422)
  })

  it('401 sin sesión', async () => {
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').send({ clientId: 'x' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/app.test.ts`
Expected: FAIL (ruta no existe → 404, o cuerpo no coincide).

- [ ] **Step 3: Implementar en `server/app.ts`.**

(a) Añade imports (junto a los demás):
```ts
import { getActiveTickets, getTicketWithRefs, getConversations, applyTransition, createTicket } from './db/repo'
import { searchClients, searchSalesOrders, getClient, getSalesOrder } from './books/repo'
import { buildSubject, buildCodigoServicio, PREFIJOS } from '../shared/ticketCreate'
```
(Sustituye las dos líneas de import existentes de `./db/repo` y `./books/repo` por estas versiones ampliadas.)

(b) Registra el endpoint **después** de `app.get('/api/tickets', ...)` (queda bajo el `app.use('/api/tickets', requireAuth(db))` ⇒ exige sesión):
```ts
  // Crea un ticket gestionado por la app en "OV asignada" (Subsistema C). Pivota opcionalmente en una OV de Books.
  app.post('/api/tickets', async (req, res) => {
    try {
      const b = (req.body ?? {}) as Record<string, unknown>
      let clientId: string | null = b.clientId ? String(b.clientId) : null
      let ordenVenta: string | null = b.ordenVenta ? String(b.ordenVenta) : null
      let salesorderId: string | null = null
      if (b.salesOrderId) {
        const ov = await getSalesOrder(db, String(b.salesOrderId))
        if (!ov) { res.status(422).json({ error: 'Orden de venta no encontrada' }); return }
        salesorderId = ov.id
        clientId = clientId ?? ov.clientId ?? null
        ordenVenta = ordenVenta ?? ov.number ?? null
      }
      const tipoServicio = b.tipoServicio ? String(b.tipoServicio) : ''
      const clasificaciones = b.clasificaciones ? String(b.clasificaciones) : ''
      const tipoEquipo = b.tipoEquipo ? String(b.tipoEquipo) : ''
      const marca = b.marca ? String(b.marca) : ''
      const modelo = b.modelo ? String(b.modelo) : ''
      const serie = b.serie ? String(b.serie) : ''
      const prefijo = b.prefijo ? String(b.prefijo) : ''
      const missing: string[] = []
      if (!clientId) missing.push('cliente')
      if (!tipoServicio) missing.push('tipo de servicio')
      if (!clasificaciones) missing.push('clasificaciones')
      if (!tipoEquipo) missing.push('tipo de equipo')
      if (!marca) missing.push('marca')
      if (!modelo) missing.push('modelo')
      if (!serie) missing.push('número de serie')
      if (!prefijo || !(PREFIJOS as readonly string[]).includes(prefijo)) missing.push('prefijo')
      if (missing.length) { res.status(422).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}` }); return }
      const cliente = await getClient(db, clientId!)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const codigoServicio = b.codigoServicio ? String(b.codigoServicio) : buildCodigoServicio({ prefijo, serie, modelo, fecha: new Date() })
      const subject = b.subject ? String(b.subject) : buildSubject({ cliente: cliente.name, tipoEquipo, codigo: codigoServicio })
      const id = await createTicket(db, {
        subject, codigoServicio, classification: clasificaciones, tipoServicio, equipo: tipoEquipo,
        marca, modelo, serial: serie, ordenVenta, priority: b.prioridad ? String(b.prioridad) : null,
        clientId: clientId!, salesorderId, actor: req.user?.name ?? 'App',
      })
      const created = await getTicketWithRefs(db, id)
      res.status(201).json(created ? rowToTicketDetail(created.row, created.refs) : {})
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4: Ejecutar y ver pasar + suite completa + typecheck server**
Run: `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit`
Expected: tests PASS; typecheck server limpio.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(C): POST /api/tickets (create from OV or manual, session-gated)"
```

---

## Task 5: Frontend — botón "Nuevo ticket" + modal de creación

**Files:**
- Modify: `shared/types.ts`
- Modify: `src/api/client.ts`
- Create: `src/components/CreateTicket.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Añadir a `shared/types.ts`** (al final):
```ts
export interface CreateTicketPayload {
  salesOrderId?: string
  clientId?: string
  tipoServicio: string
  clasificaciones: string
  tipoEquipo: string
  marca: string
  modelo: string
  serie: string
  prefijo: string
  ordenVenta?: string
  prioridad?: string
  subject?: string
  codigoServicio?: string
}
```

- [ ] **Step 2: Añadir a `src/api/client.ts`** las funciones (y amplía el import de tipos de la línea 1):
```ts
import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, CreateTicketPayload } from '../../shared/types'
```
```ts
export function searchClients(q: string): Promise<ClientLite[]> {
  return fetch(`/api/clients?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<ClientLite[]>(r))
}

export function searchSalesOrders(q: string): Promise<SalesOrderLite[]> {
  return fetch(`/api/sales-orders?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<SalesOrderLite[]>(r))
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketDetail> {
  const res = await fetch('/api/tickets', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<TicketDetail>
}
```

- [ ] **Step 3: Crear `src/components/CreateTicket.tsx`**
```tsx
import { useEffect, useMemo, useState } from 'react'
import type { ClientLite, SalesOrderLite } from '../../shared/types'
import { PREFIJOS, TIPOS_SERVICIO, CLASIFICACIONES, buildCodigoServicio, buildSubject, parseCodigoFromPotential } from '../../shared/ticketCreate'
import { searchClients, searchSalesOrders, createTicket } from '../api/client'

export function CreateTicket({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [ovQuery, setOvQuery] = useState('')
  const [ovResults, setOvResults] = useState<SalesOrderLite[]>([])
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  const [tipoServicio, setTipoServicio] = useState('')
  const [clasificaciones, setClasificaciones] = useState('')
  const [tipoEquipo, setTipoEquipo] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [serie, setSerie] = useState('')
  const [prefijo, setPrefijo] = useState('MT')
  const [ordenVenta, setOrdenVenta] = useState('')
  const [prioridad, setPrioridad] = useState('')

  const [subjectOverride, setSubjectOverride] = useState<string | null>(null)
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Búsquedas (simple: al teclear ≥2 caracteres).
  useEffect(() => {
    if (ovQuery.trim().length < 2) { setOvResults([]); return }
    let alive = true
    searchSalesOrders(ovQuery).then((r) => { if (alive) setOvResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [ovQuery])
  useEffect(() => {
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery])

  const codigo = codigoOverride ?? buildCodigoServicio({ prefijo, serie, modelo, fecha: new Date() })
  const subject = useMemo(
    () => subjectOverride ?? buildSubject({ cliente: clientName, tipoEquipo, codigo }),
    [subjectOverride, clientName, tipoEquipo, codigo],
  )

  function pickOv(ov: SalesOrderLite) {
    setSalesOrderId(ov.id)
    setOvQuery(ov.number)
    setOvResults([])
    if (ov.clientId) setClientId(ov.clientId)
    if (ov.customerName) { setClientName(ov.customerName); setClientQuery(ov.customerName) }
    setOrdenVenta(ov.number)
    const parsed = parseCodigoFromPotential(ov.potentialName)
    if (parsed) { setPrefijo(parsed.prefijo); setSerie(parsed.serie); setModelo(parsed.modelo) }
  }

  function pickClient(c: ClientLite) {
    setClientId(c.id)
    setClientName(c.name)
    setClientQuery(c.name)
    setClientResults([])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      await createTicket({
        salesOrderId: salesOrderId ?? undefined,
        clientId: clientId ?? undefined,
        tipoServicio, clasificaciones, tipoEquipo, marca, modelo, serie, prefijo,
        ordenVenta: ordenVenta || undefined,
        prioridad: prioridad || undefined,
        subject, codigoServicio: codigo,
      })
      onCreated()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo ticket</h3>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Orden de Venta (opcional)</label>
          <input className={`${field} w-full`} placeholder="Buscar OV (número o cliente)…" value={ovQuery}
            onChange={(e) => { setOvQuery(e.target.value); setSalesOrderId(null) }} />
          {ovResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {ovResults.map((ov) => (
                <li key={ov.id}><button type="button" onClick={() => pickOv(ov)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  <b>{ov.number}</b> — {ov.customerName ?? ''} {ov.ticketNumber ? `· ticket ${ov.ticketNumber}` : ''}
                </button></li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Cliente *</label>
          <input className={`${field} w-full`} placeholder="Buscar cliente…" value={clientQuery}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value) }} required={!clientId} />
          {clientResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => pickClient(c)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  {c.name} {c.nit ? `· NIT ${c.nit}` : ''}
                </button></li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} required>
            <option value="">Tipo de Servicio *</option>
            {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={field} value={clasificaciones} onChange={(e) => setClasificaciones(e.target.value)} required>
            <option value="">Clasificaciones *</option>
            {CLASIFICACIONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={field} placeholder="Tipo de equipo *" value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)} required />
          <input className={field} placeholder="Marca *" value={marca} onChange={(e) => setMarca(e.target.value)} required />
          <input className={field} placeholder="Modelo *" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
          <input className={field} placeholder="Número de serie *" value={serie} onChange={(e) => setSerie(e.target.value)} required />
          <select className={field} value={prefijo} onChange={(e) => setPrefijo(e.target.value)}>
            {PREFIJOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={field} value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="">Prioridad (opcional)</option>
            <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
          <input className={`${field} col-span-2`} placeholder="Orden de Venta (texto)" value={ordenVenta} onChange={(e) => setOrdenVenta(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Código Servicio</label>
          <input className={field} value={codigo} onChange={(e) => setCodigoOverride(e.target.value)} />
          <label className="text-[11px] font-bold text-slate-500 uppercase mt-1">Asunto</label>
          <input className={field} value={subject} onChange={(e) => setSubjectOverride(e.target.value)} />
        </div>

        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear ticket'}</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Conectar en `src/App.tsx`.**

(a) Import:
```tsx
import { CreateTicket } from './components/CreateTicket'
```
(b) Estado (junto a `showUsers`/`showRoles`):
```tsx
  const [showCreate, setShowCreate] = useState(false)
```
(c) Botón en la barra del tablero — reemplaza el `<div className="flex items-center gap-3">…</div>` de la cabecera (líneas ~35-41) por una versión con el botón al final de la barra. Concretamente, cambia el contenedor de la cabecera para incluir el botón:
```tsx
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-slate-400">star</span>
              <h1 className="text-[14px] font-semibold text-slate-700">Todos los Tickets</h1>
              <button onClick={reload} className="p-1 hover:bg-slate-100 rounded">
                <span className="material-symbols-outlined text-[18px] text-slate-400">refresh</span>
              </button>
            </div>
            <button onClick={() => setShowCreate(true)} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo ticket</button>
          </div>
```
(d) Render del modal (junto a `{showUsers && ...}`):
```tsx
      {showCreate && <CreateTicket onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
```

- [ ] **Step 5: Typecheck cliente + build**
Run: `npx tsc -b && npx vite build`
Expected: sin errores de tipos; build OK.

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts src/api/client.ts src/components/CreateTicket.tsx src/App.tsx
git commit -m "feat(C): 'Nuevo ticket' modal — OV/client search, standardized subject/codigo, board refresh"
```

---

## Task 6: Verificación completa

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite + typechecks + lint + build**
Run: `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores** (warnings OK); build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. En el tablero, botón **"Nuevo ticket"** → modal.
2. Buscar una **OV sin ticket** (p.ej. una con `ticket_number` NULL) → autocompleta cliente + orden de venta; si el `potential_name` trae código, prefill de prefijo/serie/modelo.
3. Completar tipo de servicio, clasificaciones, equipo/marca/modelo/serie; revisar la vista previa de Asunto/Código (editable).
4. **Crear** → el ticket aparece en la columna **"OV asignada"** con la empresa del cliente; al abrirlo, el panel muestra los datos; desde ahí el motor de transiciones (B) ofrece **"Habilitar Servicio"**.
5. En PgWeb: `SELECT number, subject, status, client_id, salesorder_id, orden_venta, source FROM tickets WHERE source='app' ORDER BY created_time DESC;`

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(C): subsistema C verificado (creación de tickets)"
```

---

## Notas de cierre
- **OV opcional**: con OV autocompleta cliente+orden; sin OV se elige cliente de Books.
- **Solo lectura en Books**: se guarda `salesorder_id` + `orden_venta` en el ticket; no se escribe en Books.
- **Empresa del tablero**: `COALESCE(account, client)` — sin cambios en el frontend del tablero.
- **Siguiente**: D (correo) o G (reportería). Write-back a Books (`cf_n_ticket`) queda como mejora futura (debt).
