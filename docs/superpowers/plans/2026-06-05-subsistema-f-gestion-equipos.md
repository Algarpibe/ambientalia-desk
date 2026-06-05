# Subsistema F — Gestión de equipos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear, editar y desactivar equipos desde la app (sobre el registro `equipos` del Subsistema E), con Marca/Tipo desde facetas de la BD y Cliente desde Books.

**Architecture:** Se añade `equipos.client_id`; el repo de equipos gana CRUD + facetas; endpoints `/api/equipos/manage`, `/api/equipos/facets`, `POST/PATCH /api/equipos` (con sesión); una página `EquiposAdmin` (patrón `UsersAdmin`) con buscador, tabla y modal de alta/edición.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-subsistema-f-gestion-equipos-design.md`.

**Contexto del repo:**
- `server/db/equipos.ts` (de E) ya tiene `upsertEquipo`, `searchEquipos` (solo `active=true`, límite 20), `getEquipo`, `countEquipos`, helper `J = JSON.stringify`, y `toLite`. `EquipoRow` vive en `server/db/seedEquipos.ts`.
- `shared/types.ts` tiene `EquipoLite` (`{ id, serial, marca?, modelo?, tipo?, clienteNombre? }`).
- `server/app.ts`: `GET /api/equipos` ya existe; importa de `./db/equipos` y de `./books/repo` (incl. `getClient`). `requireAuth(db)` se aplica por ruta (las de equipos NO van bajo `/api/tickets`).
- `server/app.test.ts`: helpers `adminCookie()`, `appWith()`, `db`, `request`; ya importa `upsertClient`/`clientFromBooks` (Books) y `upsertEquipo`/`parseEquiposCsv`.
- `src/components/UsersAdmin.tsx` es el patrón de página admin. `src/components/Header.tsx` define `Header` (props `onOpenUsers`/`onOpenRoles`) + `UserMenu`. `src/App.tsx` orquesta los modales (`showUsers`/`showRoles`) y rinde `<Header .../>`. `src/api/client.ts` tiene `searchClients` y el helper `json<T>`.

---

## Estructura de archivos
- Modify `server/db/schema.sql` (+ `migrate.test.ts`) — `equipos.client_id`.
- Modify `shared/types.ts` — `EquipoFull`.
- Modify `server/db/equipos.ts` (+ `equipos.test.ts`) — `createEquipo`, `updateEquipo`, `setEquipoActive`, `listEquiposManage`, `equipoFacets`, `getEquipoFull`.
- Modify `server/app.ts` (+ `app.test.ts`) — endpoints manage/facets/POST/PATCH.
- Modify `src/api/client.ts`; Create `src/components/EquiposAdmin.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`.

---

## Task 1: Columna `equipos.client_id`

**Files:** Modify `server/db/schema.sql`, `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir a `server/db/schema.sql`** (al final, junto a los otros `ALTER`; comentario en línea propia o ninguno):
```sql
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS client_id text;
```

- [ ] **Step 2: En `server/db/migrate.test.ts`** añade:
```ts
  it('equipos tiene client_id (Subsistema F)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect((await db.query('SELECT client_id FROM equipos')).rows).toEqual([])
  })
```

- [ ] **Step 3:** Run `npx vitest run server/db/migrate.test.ts` — Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(F): equipos.client_id"
```

---

## Task 2: Repo CRUD + facetas (TDD pg-mem)

**Files:** Modify `shared/types.ts`, `server/db/equipos.ts`, `server/db/equipos.test.ts`

- [ ] **Step 1: Añadir a `shared/types.ts`** (tras `EquipoLite`):
```ts
export interface EquipoFull extends EquipoLite {
  active: boolean
  clientId?: string
}
```

- [ ] **Step 2: Añadir al final de `server/db/equipos.test.ts`** un bloque (el archivo ya tiene `newDb`/`migrate`/`beforeEach` que crean `db`):
```ts
import { createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull } from './equipos'

describe('equipos CRUD (Subsistema F)', () => {
  it('create (id propio + client_id), getFull, y aparece en searchEquipos', async () => {
    const id = await createEquipo(db, { serial: 'NEW1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'cli1' })
    expect(id).toMatch(/^eq-/)
    expect(await getEquipoFull(db, id)).toMatchObject({ serial: 'NEW1', marca: 'Grimm', active: true, clientId: 'cli1', clienteNombre: 'ACME' })
    expect((await searchEquipos(db, 'NEW1')).length).toBe(1)
  })

  it('desactivar lo saca de searchEquipos pero sigue en listEquiposManage', async () => {
    const id = await createEquipo(db, { serial: 'NEW2', marca: 'Horiba', modelo: 'APMA', tipo: 'CO', clienteNombre: 'X', clientId: 'cli1' })
    await setEquipoActive(db, id, false)
    expect((await searchEquipos(db, 'NEW2')).length).toBe(0)
    expect((await listEquiposManage(db, 'NEW2')).map((e) => e.active)).toEqual([false])
  })

  it('update cambia campos y reconcilia cliente', async () => {
    const id = await createEquipo(db, { serial: 'NEW3', marca: 'Grimm', modelo: 'm', tipo: 'Monitor', clienteNombre: 'Viejo', clientId: null })
    await updateEquipo(db, id, { tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
    expect(await getEquipoFull(db, id)).toMatchObject({ tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
  })

  it('facets devuelve marcas y tipos distintos', async () => {
    await createEquipo(db, { serial: 'A', marca: 'Grimm', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    await createEquipo(db, { serial: 'B', marca: 'Horiba', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    const f = await equipoFacets(db)
    expect(f.marcas).toEqual(expect.arrayContaining(['Grimm', 'Horiba']))
    expect(f.tipos).toContain('Monitor')
  })
})
```

- [ ] **Step 3:** Run `npx vitest run server/db/equipos.test.ts` — confirm FAIL.

- [ ] **Step 4: En `server/db/equipos.ts`** añade los imports y las funciones:
```ts
import { randomUUID } from 'node:crypto'
import type { EquipoFull } from '../../shared/types'

export interface EquipoInput {
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  clienteNombre: string | null
  clientId: string | null
}

function toFull(r: any): EquipoFull {
  return {
    id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined,
    tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined,
    active: r.active === true, clientId: r.client_id ?? undefined,
  }
}

export async function createEquipo(db: Queryable, input: EquipoInput): Promise<string> {
  const id = 'eq-' + randomUUID()
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,client_id,source,active,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'app',true,now())`,
    [id, input.serial, input.marca, input.modelo, input.tipo, input.clienteNombre, input.clientId],
  )
  return id
}

export async function updateEquipo(db: Queryable, id: string, patch: Partial<EquipoInput>): Promise<void> {
  const sets = ['updated_at=now()']
  const params: unknown[] = [id]
  const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (patch.serial !== undefined) add('serial', patch.serial)
  if (patch.marca !== undefined) add('marca', patch.marca)
  if (patch.modelo !== undefined) add('modelo', patch.modelo)
  if (patch.tipo !== undefined) add('tipo', patch.tipo)
  if (patch.clienteNombre !== undefined) add('cliente_nombre', patch.clienteNombre)
  if (patch.clientId !== undefined) add('client_id', patch.clientId)
  await db.query(`UPDATE equipos SET ${sets.join(',')} WHERE id=$1`, params)
}

export async function setEquipoActive(db: Queryable, id: string, active: boolean): Promise<void> {
  await db.query('UPDATE equipos SET active=$2, updated_at=now() WHERE id=$1', [id, active])
}

export async function getEquipoFull(db: Queryable, id: string): Promise<EquipoFull | null> {
  const r = await db.query('SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,active FROM equipos WHERE id=$1', [id])
  return r.rows[0] ? toFull(r.rows[0]) : null
}

export async function listEquiposManage(db: Queryable, q: string, limit = 50, offset = 0): Promise<EquipoFull[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,active FROM equipos
     WHERE LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1
     ORDER BY serial LIMIT $2 OFFSET $3`,
    [like, limit, offset],
  )
  return r.rows.map(toFull)
}

export async function equipoFacets(db: Queryable): Promise<{ marcas: string[]; tipos: string[] }> {
  const m = await db.query("SELECT DISTINCT marca FROM equipos WHERE marca IS NOT NULL AND marca <> '' ORDER BY marca")
  const t = await db.query("SELECT DISTINCT tipo FROM equipos WHERE tipo IS NOT NULL AND tipo <> '' ORDER BY tipo")
  return { marcas: m.rows.map((x: any) => x.marca), tipos: t.rows.map((x: any) => x.tipo) }
}
```
(`Queryable` ya está importado en el archivo. `EquipoInput.clienteNombre` se pasa desde el servidor ya resuelto del cliente de Books.)

- [ ] **Step 5:** Run `npx vitest run server/db/equipos.test.ts` — confirm PASS. Si pg-mem fallara con `OFFSET`, prueba sin `OFFSET` (usa solo `LIMIT $2`) y reporta.

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/db/equipos.ts server/db/equipos.test.ts
git commit -m "feat(F): equipos CRUD repo (create/update/setActive/listManage/facets) + EquipoFull"
```

---

## Task 3: Endpoints de gestión (TDD supertest)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts`** añade imports (si faltan) + un bloque:
```ts
import { listEquiposManage } from './db/equipos'

describe('Gestión de equipos (Subsistema F)', () => {
  it('crea un equipo (cliente de Books) y lo desactiva', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cliF', contact_name: 'Cliente F', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-F1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10', clientId: 'cliF',
    })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({ serial: 'SN-F1', marca: 'Grimm', active: true, clientId: 'cliF', clienteNombre: 'Cliente F' })
    const id = create.body.id
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ active: false, tipo: 'Analizador CO' })
    expect(patch.status).toBe(200)
    expect(patch.body).toMatchObject({ active: false, tipo: 'Analizador CO' })
    expect((await listEquiposManage(db, 'SN-F1')).length).toBe(1)
  })

  it('422 sin serial o sin cliente; 422 si el cliente no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ clientId: 'x' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S', clientId: 'no-existe' })).status).toBe(422)
  })

  it('facets devuelve marcas/tipos; manage lista; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cliG', contact_name: 'G', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-G', marca: 'Horiba', tipo: 'O3', clientId: 'cliG' })
    const f = await request(app).get('/api/equipos/facets').set('Cookie', cookie)
    expect(f.status).toBe(200)
    expect(f.body.marcas).toContain('Horiba')
    const m = await request(app).get('/api/equipos/manage?search=SN-G').set('Cookie', cookie)
    expect(m.status).toBe(200)
    expect(m.body.items[0]).toMatchObject({ serial: 'SN-G' })
    expect((await request(app).get('/api/equipos/manage')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`** amplía el import de `./db/equipos` y registra las rutas. Cambia la línea de import existente a:
```ts
import { searchEquipos, getEquipo, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull } from './db/equipos'
```
Y añade, junto a la ruta `GET /api/equipos` existente:
```ts
  app.get('/api/equipos/manage', requireAuth(db), async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page ?? 1))
      const items = await listEquiposManage(db, String(req.query.search ?? ''), 50, (page - 1) * 50)
      res.json({ items, page })
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.get('/api/equipos/facets', requireAuth(db), async (_req, res) => {
    try { res.json(await equipoFacets(db)) } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.post('/api/equipos', requireAuth(db), async (req, res) => {
    try {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const id = await createEquipo(db, {
        serial, marca: b.marca ? String(b.marca) : null, modelo: b.modelo ? String(b.modelo) : null,
        tipo: b.tipo ? String(b.tipo) : null, clienteNombre: cliente.name, clientId,
      })
      res.status(201).json(await getEquipoFull(db, id))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.patch('/api/equipos/:id', requireAuth(db), async (req, res) => {
    try {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.marca !== undefined) patch.marca = b.marca ? String(b.marca) : null
      if (b.modelo !== undefined) patch.modelo = b.modelo ? String(b.modelo) : null
      if (b.tipo !== undefined) patch.tipo = b.tipo ? String(b.tipo) : null
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
      }
      if (Object.keys(patch).length) await updateEquipo(db, id, patch)
      if (b.active !== undefined) await setEquipoActive(db, id, Boolean(b.active))
      res.json(await getEquipoFull(db, id))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```
(`getClient` ya está importado de `./books/repo`. `searchEquipos`/`getEquipo` siguen igual; el `getEquipo` puede quedar sin uso — si eslint marca import sin usar, déjalo solo si lo usa otra ruta; si no, quítalo del import.)

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit` — Expected: PASS + typecheck limpio.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(F): endpoints gestión equipos (manage/facets/POST/PATCH, session-gated)"
```

---

## Task 4: Frontend — página de gestión de equipos

**Files:** Modify `src/api/client.ts`, `src/components/Header.tsx`, `src/App.tsx`; Create `src/components/EquiposAdmin.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `EquipoFull` al import de tipos y las funciones:
```ts
import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, EquipoLite, EquipoFull, CreateTicketPayload } from '../../shared/types'
```
```ts
export interface EquipoInput { serial: string; marca: string | null; modelo: string | null; tipo: string | null; clientId?: string }

export function listEquiposManage(search: string, page = 1): Promise<{ items: EquipoFull[]; page: number }> {
  return fetch(`/api/equipos/manage?search=${encodeURIComponent(search)}&page=${page}`, { credentials: 'include' }).then((r) => json<{ items: EquipoFull[]; page: number }>(r))
}

export function equipoFacets(): Promise<{ marcas: string[]; tipos: string[] }> {
  return fetch('/api/equipos/facets', { credentials: 'include' }).then((r) => json<{ marcas: string[]; tipos: string[] }>(r))
}

export async function createEquipo(input: EquipoInput): Promise<EquipoFull> {
  const res = await fetch('/api/equipos', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<EquipoFull>
}

export function updateEquipo(id: string, patch: Partial<EquipoInput> & { active?: boolean }): Promise<EquipoFull> {
  return fetch(`/api/equipos/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then((r) => json<EquipoFull>(r))
}

export function setEquipoActive(id: string, active: boolean): Promise<EquipoFull> {
  return updateEquipo(id, { active })
}
```
(Si `EquipoLite` ya estaba importado, solo añade `EquipoFull`.)

- [ ] **Step 2: Crear `src/components/EquiposAdmin.tsx`**
```tsx
import { useEffect, useState } from 'react'
import type { EquipoFull, ClientLite } from '../../shared/types'
import { listEquiposManage, equipoFacets, createEquipo, updateEquipo, setEquipoActive, searchClients } from '../api/client'

export function EquiposAdmin({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<EquipoFull[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EquipoFull | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setItems((await listEquiposManage(search, 1)).items) }
    catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [search])

  async function toggleActive(e: EquipoFull) {
    try { await setEquipoActive(e.id, !e.active); reload() }
    catch (err) { alert('Error: ' + String(err instanceof Error ? err.message : err)) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Equipos</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por serie, cliente, marca, modelo, tipo…" className="ml-4 bg-white/10 text-white placeholder-white/50 rounded px-3 py-1.5 text-[13px] w-[360px] outline-none" />
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo equipo</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Serie</th><th>Marca</th><th>Modelo</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className={`border-b ${e.active ? '' : 'opacity-50'}`}>
                <td className="py-2 font-bold">{e.serial}</td>
                <td>{e.marca}</td><td>{e.modelo}</td><td>{e.tipo}</td><td>{e.clienteNombre}</td>
                <td>{e.active ? 'Activo' : 'Inactivo'}</td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setEditing(e)} className="text-[12px] text-blue-600 mr-3">Editar</button>
                  <button onClick={() => toggleActive(e)} className="text-[12px] text-blue-600">{e.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">Sin equipos.</td></tr>}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <EquipoForm equipo={editing} onClose={() => { setCreating(false); setEditing(null) }} onSaved={() => { setCreating(false); setEditing(null); reload() }} />
      )}
    </div>
  )
}

function EquipoForm({ equipo, onClose, onSaved }: { equipo: EquipoFull | null; onClose: () => void; onSaved: () => void }) {
  const [serial, setSerial] = useState(equipo?.serial ?? '')
  const [marca, setMarca] = useState(equipo?.marca ?? '')
  const [modelo, setModelo] = useState(equipo?.modelo ?? '')
  const [tipo, setTipo] = useState(equipo?.tipo ?? '')
  const [clientId, setClientId] = useState<string | null>(equipo?.clientId ?? null)
  const [clientName, setClientName] = useState(equipo?.clienteNombre ?? '')
  const [clientQuery, setClientQuery] = useState(equipo?.clienteNombre ?? '')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [facets, setFacets] = useState<{ marcas: string[]; tipos: string[] }>({ marcas: [], tipos: [] })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { equipoFacets().then(setFacets).catch(() => {}) }, [])
  useEffect(() => {
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery])

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setBusy(true); setError(null)
    try {
      const payload = { serial, marca: marca || null, modelo: modelo || null, tipo: tipo || null, clientId: clientId ?? undefined }
      if (equipo) await updateEquipo(equipo.id, payload)
      else await createEquipo(payload)
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'
  const marcas = !marca || facets.marcas.includes(marca) ? facets.marcas : [marca, ...facets.marcas]
  const tipos = !tipo || facets.tipos.includes(tipo) ? facets.tipos : [tipo, ...facets.tipos]

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[480px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">{equipo ? 'Editar equipo' : 'Nuevo equipo'}</h3>
        <input className={field} placeholder="Número de serie *" value={serial} onChange={(e) => setSerial(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">Marca…</option>
            {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className={field} placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </div>
        <select className={field} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tipo de equipo…</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative">
          <input className={`${field} w-full`} placeholder="Cliente (Books) *" value={clientQuery}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value) }} required={!equipo && !clientId} />
          {clientResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => { setClientId(c.id); setClientName(c.name); setClientQuery(c.name); setClientResults([]) }} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">{c.name} {c.nit ? `· NIT ${c.nit}` : ''}</button></li>
              ))}
            </ul>
          )}
          {clientId && <div className="text-[11px] text-slate-400 mt-1">Cliente vinculado: {clientName}</div>}
        </div>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/Header.tsx`** añade el prop `onOpenEquipos` y un botón en `UserMenu` (visible para todos). **Read el archivo y**:
  - Cambia la firma de `Header` para aceptar `onOpenEquipos: () => void` y pásalo a `<UserMenu .../>`.
  - En `UserMenu`, acepta `onOpenEquipos` y añade, ANTES del bloque `{user.isAdmin && (...)}`:
```tsx
      <button onClick={onOpenEquipos} title="Equipos" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
      </button>
```

- [ ] **Step 4: En `src/App.tsx`** (lee el archivo y adapta): importa `EquiposAdmin`, añade estado `const [showEquipos, setShowEquipos] = useState(false)`, pasa `onOpenEquipos={() => setShowEquipos(true)}` al `<Header .../>`, y junto a `{showUsers && ...}` añade:
```tsx
      {showEquipos && <EquiposAdmin onClose={() => setShowEquipos(false)} />}
```

- [ ] **Step 5:** Run `npx tsc -b && npx vite build` — Expected: sin errores; build OK.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/EquiposAdmin.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat(F): página de gestión de equipos (alta/edición/desactivar) + entrada en el menú"
```

---

## Task 5: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Menú → **Equipos** → tabla con búsqueda. **Nuevo equipo** → serial + marca (desplegable) + modelo + tipo (desplegable) + cliente (buscador Books) → Guardar → aparece en la tabla.
2. **Editar** un equipo sembrado → al elegir el cliente de Books se reconcilia (`client_id`); guardar.
3. **Desactivar** un equipo → en la creación de tickets ese serial ya **no** aparece en el buscador.
4. PgWeb: `SELECT serial, marca, tipo, cliente_nombre, client_id, active FROM equipos WHERE source='app';`

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(F): subsistema F verificado (gestión de equipos)"
```

---

## Notas de cierre
- **Cualquier usuario autenticado** gestiona; nada de admin-only.
- **Desactivar** (soft): el equipo sale del buscador de creación pero conserva su `equipo_id` en tickets.
- **Reconciliación**: editar un equipo sembrado y elegir cliente de Books le pone `client_id`.
- **Siguiente**: hoja de vida del equipo (historial de tickets), reportería (G) o correo (D).
