# Subsistema E — Registro de equipos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar en Postgres los equipos vendidos (serial→marca/modelo/tipo/cliente) desde el listado provisto, y hacer que la creación de tickets (C) exija elegir un equipo registrado (autocompletando marca/modelo/serie/tipo y guardando `equipo_id`).

**Architecture:** Tabla `equipos` sembrada al arrancar desde un CSV versionado; parser puro + repo + endpoint de búsqueda; el formulario y el endpoint de C reemplazan los campos libres de equipo por un selector obligatorio validado en servidor.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Server corre con `tsx server/index.ts` (lee la semilla vía `import.meta.url`). Spec: `docs/superpowers/specs/2026-06-04-subsistema-e-registro-equipos-design.md`.

**Contexto del repo:**
- `server/db/migrate.ts` aplica `schema.sql` tolerante (split por `;`; **comentarios en su propia línea**, no inline tras `;`). `server/db/migrate.test.ts` usa `newDb` + `migrate`.
- `server/db/repo.ts`: `createTicket(db, input)` (transacción, ya inserta el ticket + transición #1). `J = JSON.stringify`. `nextTicketNumber`, `randomUUID`, `PoolLike`.
- `server/app.ts`: `app.use('/api/tickets', requireAuth(db))` gatea POST; `app.post('/api/tickets', ...)` (Subsistema C) construye el ticket; imports de `./db/repo`, `./books/repo`, `../shared/ticketCreate`, `rowToTicketDetail`.
- `server/app.test.ts`: helpers `adminCookie()`, `appWith()`, `db` de módulo, `request`. Ya hay un bloque `describe('POST /api/tickets (crear)')` (Subsistema C) que **este plan modifica**.
- `server/index.ts`: boot con `pool`, `await migrate(pool)`, luego `reseedTicketNumber`. Server por `tsx` (ESM).
- `src/components/CreateTicket.tsx` (Subsistema C) tiene campos libres tipoEquipo/marca/modelo/serie que **este plan reemplaza** por un selector de equipo. `src/api/client.ts` patrón `json<T>` + `credentials:'include'`.

---

## Estructura de archivos
- Modify `server/db/schema.sql` (+ `migrate.test.ts`) — tabla `equipos` + `tickets.equipo_id`.
- Modify `shared/types.ts` — `EquipoLite`; ajustar `CreateTicketPayload`.
- Create `server/db/seedEquipos.ts` (+ `.test.ts`) — `EquipoRow`, `parseEquiposCsv`, `seedEquipos`.
- Create `server/db/equipos.ts` (+ `.test.ts`) — repo (`upsertEquipo`, `searchEquipos`, `getEquipo`, `countEquipos`).
- Create `server/db/equipos.seed.csv` — listado limpio (lo crea el controlador).
- Modify `server/index.ts` — sembrar al arrancar si vacío.
- Modify `server/app.ts` (+ `app.test.ts`) — `GET /api/equipos`; `POST /api/tickets` exige `equipoId`.
- Modify `server/db/repo.ts` (+ `repo.test.ts`) — `createTicket` gana `equipoId`.
- Modify `src/components/CreateTicket.tsx`, `src/api/client.ts` — selector de equipo.

---

## Task 1: Tabla `equipos` + `tickets.equipo_id`

**Files:** Modify `server/db/schema.sql`, `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`** (comentarios en línea propia, nunca tras `;`):
```sql
CREATE TABLE IF NOT EXISTS equipos (
  id text PRIMARY KEY,
  serial text NOT NULL,
  marca text,
  modelo text,
  tipo text,
  cliente_nombre text,
  source text NOT NULL DEFAULT 'seed',
  active boolean NOT NULL DEFAULT true,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos (serial);
CREATE INDEX IF NOT EXISTS idx_equipos_cliente ON equipos (cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos (tipo);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS equipo_id text;
```

- [ ] **Step 2: En `server/db/migrate.test.ts`** añade:
```ts
  it('existe equipos y tickets.equipo_id (Subsistema E)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect((await db.query('SELECT id, serial, marca, modelo, tipo, cliente_nombre, active FROM equipos')).rows).toEqual([])
    expect((await db.query('SELECT equipo_id FROM tickets')).rows).toEqual([])
  })
```

- [ ] **Step 3:** Run `npx vitest run server/db/migrate.test.ts` — Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(E): equipos table + tickets.equipo_id"
```

---

## Task 2: `EquipoLite` + parser del CSV (TDD, puro)

**Files:** Modify `shared/types.ts`; Create `server/db/seedEquipos.ts`, `server/db/seedEquipos.test.ts`

- [ ] **Step 1: Añadir a `shared/types.ts`:**
```ts
export interface EquipoLite {
  id: string
  serial: string
  marca?: string
  modelo?: string
  tipo?: string
  clienteNombre?: string
}
```

- [ ] **Step 2: Escribir `server/db/seedEquipos.test.ts`:**
```ts
import { describe, it, expect } from 'vitest'
import { parseEquiposCsv } from './seedEquipos'

const sample = [
  'Nombre cliente;Marca;Modelo;Numero serie;Tipo;;;',
  'Airlab Consulting S.A.S.;Grimm;EDM180C;18A21058;Monitor PM10/PM2.5;;;',
  'Airlab Consulting S.A.S.;Grimm;EDM180C;18A21058;Monitor PM10/PM2.5;;;',
  'CIMA;Grimm;EDM180C;18Aprueba_prueba;Monitor;;;',
  ';;;;;;;',
  'Ser As S.A.S.;Horiba;APMA-370;191TE0NC;Analizador CO;;;',
  'SGS Colombia S.A.S.;Horiba;APMA-370;191TE0NC;Analizador CO;;;',
].join('\n')

describe('parseEquiposCsv', () => {
  it('omite encabezado/vacías/prueba, deduplica y mapea columnas (incl. tipo)', () => {
    const rows = parseEquiposCsv(sample)
    expect(rows.map((r) => r.serial)).toEqual(['18A21058', '191TE0NC', '191TE0NC'])
    expect(rows).toHaveLength(3) // Airlab (dedupe a 1) + Ser As + SGS (mismo serial, distinto cliente)
    const airlab = rows[0]
    expect(airlab).toMatchObject({ serial: '18A21058', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10/PM2.5', cliente_nombre: 'Airlab Consulting S.A.S.', source: 'seed' })
    expect(airlab.id).toMatch(/^eq-/)
    // mismo serial + distinto cliente => ids distintos
    expect(rows[1].id).not.toBe(rows[2].id)
  })
})
```

- [ ] **Step 3:** Run `npx vitest run server/db/seedEquipos.test.ts` — Expected: FAIL (módulo no existe).

- [ ] **Step 4: Implementar `server/db/seedEquipos.ts`:**
```ts
import { createHash } from 'node:crypto'

export interface EquipoRow {
  id: string
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  cliente_nombre: string | null
  source: string
  raw: unknown
}

function equipoId(serial: string, cliente: string, modelo: string): string {
  return 'eq-' + createHash('sha1').update(`${serial}|${cliente}|${modelo}`).digest('hex').slice(0, 16)
}

export function parseEquiposCsv(text: string): EquipoRow[] {
  const out: EquipoRow[] = []
  const seen = new Set<string>()
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(';')
    const cliente = (cols[0] ?? '').trim()
    const marca = (cols[1] ?? '').trim()
    const modelo = (cols[2] ?? '').trim()
    const serial = (cols[3] ?? '').trim()
    const tipo = (cols[4] ?? '').trim()
    if (!serial) continue                                  // fila vacía / sin serie
    if (serial.toLowerCase() === 'numero serie') continue  // encabezado
    if (/prueba/i.test(serial)) continue                   // fila de prueba
    const id = equipoId(serial, cliente, modelo)
    if (seen.has(id)) continue                             // duplicado exacto
    seen.add(id)
    out.push({
      id, serial, marca: marca || null, modelo: modelo || null, tipo: tipo || null,
      cliente_nombre: cliente || null, source: 'seed', raw: { cliente, marca, modelo, serial, tipo },
    })
  }
  return out
}
```

- [ ] **Step 5:** Run `npx vitest run server/db/seedEquipos.test.ts` — Expected: PASS (1 test).

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/db/seedEquipos.ts server/db/seedEquipos.test.ts
git commit -m "feat(E): EquipoLite + parseEquiposCsv (header/empty/prueba skip, dedupe)"
```

---

## Task 3: Repo de equipos (TDD pg-mem)

**Files:** Create `server/db/equipos.ts`, `server/db/equipos.test.ts`

- [ ] **Step 1: Escribir `server/db/equipos.test.ts`:**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { parseEquiposCsv } from './seedEquipos'
import { upsertEquipo, searchEquipos, getEquipo, countEquipos } from './equipos'

const rows = parseEquiposCsv([
  'Nombre cliente;Marca;Modelo;Numero serie;Tipo',
  'Corola Ambiental S.A.S.;Horiba;APMA-370;85HHP0N0;Analizador de Monóxido de Carbono (CO)',
  'Gecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor de Material Particulado PM10/PM2.5',
].join('\n'))

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('equipos repo', () => {
  it('upsert + búsqueda por serie/cliente/tipo + count', async () => {
    for (const r of rows) await upsertEquipo(db, r)
    expect(await countEquipos(db)).toBe(2)
    expect((await searchEquipos(db, '85HHP')).map((e) => e.serial)).toEqual(['85HHP0N0'])
    expect((await searchEquipos(db, 'gecelca')).map((e) => e.marca)).toEqual(['Grimm'])
    expect((await searchEquipos(db, 'monóxido')).length).toBe(1)
    const e = await getEquipo(db, rows[0].id)
    expect(e).toMatchObject({ serial: '85HHP0N0', tipo: 'Analizador de Monóxido de Carbono (CO)', clienteNombre: 'Corola Ambiental S.A.S.' })
  })

  it('upsert es idempotente (mismo id no duplica)', async () => {
    await upsertEquipo(db, rows[0])
    await upsertEquipo(db, rows[0])
    expect(await countEquipos(db)).toBe(1)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/equipos.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementar `server/db/equipos.ts`:**
```ts
import type { Queryable } from './migrate'
import type { EquipoRow } from './seedEquipos'
import type { EquipoLite } from '../../shared/types'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertEquipo(db: Queryable, r: EquipoRow): Promise<void> {
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,source,active,raw,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,now())
     ON CONFLICT (id) DO UPDATE SET serial=EXCLUDED.serial,marca=EXCLUDED.marca,modelo=EXCLUDED.modelo,
       tipo=EXCLUDED.tipo,cliente_nombre=EXCLUDED.cliente_nombre,source=EXCLUDED.source,raw=EXCLUDED.raw,updated_at=now()`,
    [r.id, r.serial, r.marca, r.modelo, r.tipo, r.cliente_nombre, r.source, J(r.raw)],
  )
}

function toLite(r: any): EquipoLite {
  return { id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined, tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined }
}

export async function searchEquipos(db: Queryable, q: string, limit = 20): Promise<EquipoLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre FROM equipos
     WHERE active = true AND (LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1)
     ORDER BY serial LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(toLite)
}

export async function getEquipo(db: Queryable, id: string): Promise<EquipoLite | null> {
  const r = await db.query('SELECT id,serial,marca,modelo,tipo,cliente_nombre FROM equipos WHERE id=$1', [id])
  return r.rows[0] ? toLite(r.rows[0]) : null
}

export async function countEquipos(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM equipos')
  return r.rows[0].n as number
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/equipos.test.ts` — Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add server/db/equipos.ts server/db/equipos.test.ts
git commit -m "feat(E): equipos repo (upsert idempotent, search, get, count)"
```

---

## Task 4: Semilla + carga al arrancar

**Files:** Create `server/db/equipos.seed.csv` (lo provee el CONTROLADOR); Modify `server/db/seedEquipos.ts`, `server/db/seedEquipos.test.ts`, `server/index.ts`

> **NOTA controlador:** el archivo `server/db/equipos.seed.csv` (listado limpio `cliente;marca;modelo;serial;tipo`, ~330 filas) lo escribe el controlador antes de ejecutar este task. El subagente NO lo inventa; asume que existe.

- [ ] **Step 1: Añadir a `server/db/seedEquipos.test.ts`** (un test de `seedEquipos`):
```ts
import { newDb } from 'pg-mem'
import { migrate } from './migrate'
import { seedEquipos } from './seedEquipos'
import { countEquipos } from './equipos'

describe('seedEquipos', () => {
  const csv = [
    'Nombre cliente;Marca;Modelo;Numero serie;Tipo',
    'Corola Ambiental S.A.S.;Horiba;APMA-370;85HHP0N0;Analizador CO',
    'Gecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor PM10/PM2.5',
  ].join('\n')

  it('inserta y es idempotente', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect(await seedEquipos(db, csv)).toBe(2)
    expect(await countEquipos(db)).toBe(2)
    await seedEquipos(db, csv) // re-seed
    expect(await countEquipos(db)).toBe(2)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/seedEquipos.test.ts` — Expected: FAIL (`seedEquipos` no existe).

- [ ] **Step 3: Añadir a `server/db/seedEquipos.ts`** (al final; importa el repo):
```ts
import type { Queryable } from './migrate'
import { upsertEquipo } from './equipos'

export async function seedEquipos(db: Queryable, csvText: string): Promise<number> {
  const rows = parseEquiposCsv(csvText)
  for (const r of rows) await upsertEquipo(db, r)
  return rows.length
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/seedEquipos.test.ts` — Expected: PASS (2 tests).

- [ ] **Step 5: Cablear en `server/index.ts`.** Imports:
```ts
import { readFileSync } from 'node:fs'
import { seedEquipos } from './db/seedEquipos'
import { countEquipos } from './db/equipos'
```
Dentro de `main()`, **después** de `await migrate(pool)` (y del reseed), añade:
```ts
  try {
    if ((await countEquipos(pool)) === 0) {
      const csv = readFileSync(new URL('./db/equipos.seed.csv', import.meta.url), 'utf8')
      const n = await seedEquipos(pool, csv)
      console.log(`Equipos: semilla cargada (${n})`)
    } else {
      console.log('Equipos: ya hay datos, no se siembra')
    }
  } catch (e) { console.error('Seed de equipos falló:', e) }
```

- [ ] **Step 6:** Run `npx tsc -p tsconfig.server.json --noEmit` — Expected: limpio.

- [ ] **Step 7: Commit**
```bash
git add server/db/seedEquipos.ts server/db/seedEquipos.test.ts server/db/equipos.seed.csv server/index.ts
git commit -m "feat(E): seedEquipos + load on empty at boot (equipos.seed.csv)"
```

---

## Task 5: Endpoint `GET /api/equipos`

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts`** añade imports + test (mirror del bloque `/api/clients`):
```ts
import { upsertEquipo } from './db/equipos'
import { parseEquiposCsv } from './db/seedEquipos'

describe('GET /api/equipos', () => {
  it('busca equipos (con sesión)', async () => {
    const cookie = await adminCookie()
    const [eq] = parseEquiposCsv('Nombre cliente;Marca;Modelo;Numero serie;Tipo\nGecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor PM10/PM2.5')
    await upsertEquipo(db, eq)
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=18A22052').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ serial: '18A22052', marca: 'Grimm', tipo: 'Monitor PM10/PM2.5' })
  })

  it('GET /api/equipos sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=x')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — Expected: FAIL (404/401 mismatch).

- [ ] **Step 3: En `server/app.ts`** añade el import y la ruta (junto a `/api/clients`):
```ts
import { searchEquipos, getEquipo } from './db/equipos'
```
```ts
  app.get('/api/equipos', requireAuth(db), async (req, res) => {
    try {
      res.json(await searchEquipos(db, String(req.query.search ?? '')))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(E): GET /api/equipos search endpoint (session-gated)"
```

---

## Task 6: C exige `equipoId` (createTicket + endpoint + tests)

**Files:** Modify `server/db/repo.ts`, `server/db/repo.test.ts`, `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/db/repo.ts`**, añade `equipoId` al `CreateTicketInput` y a la inserción.

(a) Interface — añade el campo:
```ts
  salesorderId: string | null
  equipoId: string | null
  actor: string
```
(b) En `createTicket`, reemplaza la query de INSERT del ticket por (añade `equipo_id` y su `$15`):
```ts
    await q.query(
      `INSERT INTO tickets (id,number,subject,status,status_type,priority,classification,tipo_servicio,equipo,marca,modelo,serial,codigo_servicio,orden_venta,client_id,salesorder_id,equipo_id,managed_by_app,source,created_time,modified_time,updated_at)
       VALUES ($1,$2,$3,'OV asignada','Open',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,'app',now(),now(),now())`,
      [id, number, input.subject, input.priority, input.classification, input.tipoServicio, input.equipo, input.marca, input.modelo, input.serial, input.codigoServicio, input.ordenVenta, input.clientId, input.salesorderId, input.equipoId],
    )
```

- [ ] **Step 2: En `server/db/repo.test.ts`** actualiza el test de `createTicket`: añade `equipoId: 'eq-test'` al input y verifica que se guarda. En el objeto que se pasa a `createTicket`, añade tras `salesorderId: 'so1',`:
```ts
      salesorderId: 'so1', equipoId: 'eq-test', actor: 'Admin',
```
Y añade al SELECT y aserciones del test:
```ts
    const row = (await db.query('SELECT number, status, status_type, managed_by_app, source, client_id, salesorder_id, equipo_id, orden_venta FROM tickets WHERE id=$1', [id])).rows[0]
    expect(row.equipo_id).toBe('eq-test')
```

- [ ] **Step 3:** Run `npx vitest run server/db/repo.test.ts` — Expected: PASS.

- [ ] **Step 4: En `server/app.ts`**, modifica `app.post('/api/tickets', ...)` para exigir `equipoId` y tomar marca/modelo/serie/tipo del equipo. Reemplaza el cuerpo del handler por:
```ts
  app.post('/api/tickets', async (req, res) => {
    try {
      const b = (req.body ?? {}) as Record<string, unknown>
      const equipoId = b.equipoId ? String(b.equipoId) : ''
      if (!equipoId) { res.status(422).json({ error: 'Falta el equipo' }); return }
      const equipo = await getEquipo(db, equipoId)
      if (!equipo) { res.status(422).json({ error: 'Equipo no registrado' }); return }

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
      const prefijo = b.prefijo ? String(b.prefijo) : ''
      const missing: string[] = []
      if (!clientId) missing.push('cliente')
      if (!tipoServicio) missing.push('tipo de servicio')
      if (!clasificaciones) missing.push('clasificaciones')
      if (!prefijo || !(PREFIJOS as readonly string[]).includes(prefijo)) missing.push('prefijo')
      if (missing.length) { res.status(422).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}` }); return }
      const cliente = await getClient(db, clientId!)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const codigoServicio = b.codigoServicio ? String(b.codigoServicio) : buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })
      const subject = b.subject ? String(b.subject) : buildSubject({ cliente: cliente.name, tipoEquipo: equipo.tipo ?? '', codigo: codigoServicio })
      const id = await createTicket(db, {
        subject, codigoServicio, classification: clasificaciones, tipoServicio, equipo: equipo.tipo ?? null,
        marca: equipo.marca ?? null, modelo: equipo.modelo ?? null, serial: equipo.serial,
        ordenVenta, priority: b.prioridad ? String(b.prioridad) : null,
        clientId: clientId!, salesorderId, equipoId: equipo.id, actor: req.user?.name ?? 'App',
      })
      const created = await getTicketWithRefs(db, id)
      res.status(201).json(created ? rowToTicketDetail(created.row, created.refs) : {})
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```
(`getEquipo` ya se importó en Task 5; `getSalesOrder`, `getClient`, `buildCodigoServicio`, `buildSubject`, `PREFIJOS`, `createTicket`, `getTicketWithRefs`, `rowToTicketDetail` ya estaban.)

- [ ] **Step 5: En `server/app.test.ts`** reescribe el bloque `describe('POST /api/tickets (crear)')` para sembrar un equipo y enviar `equipoId`:
```ts
describe('POST /api/tickets (crear)', () => {
  const seedEquipo = async () => {
    const [eq] = parseEquiposCsv('Nombre cliente;Marca;Modelo;Numero serie;Tipo\nGecelca S.A. E.S.P.;Grimm;EDM180C;18A20070;Monitor PM10/PM2.5')
    await upsertEquipo(db, eq)
    return eq
  }

  it('crea desde una OV con equipo: deriva cliente + orden, toma marca/modelo/serie/tipo del equipo', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli1', contact_name: 'Gecelca S.A. E.S.P.', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 'so1', salesorder_number: 'OV-2026-200', customer_id: 'cli1', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      salesOrderId: 'so1', equipoId: eq.id, tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
    expect(res.body.company).toBe('Gecelca S.A. E.S.P.')
    const t = (await db.query("SELECT marca, modelo, serial, equipo, equipo_id, salesorder_id FROM tickets WHERE salesorder_id='so1'")).rows[0]
    expect(t).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070', equipo: 'Monitor PM10/PM2.5', equipo_id: eq.id })
  })

  it('crea sin OV con cliente manual + equipo', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli2', contact_name: 'Camposol', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli2', equipoId: eq.id, tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo', prefijo: 'CG', ordenVenta: 'manual-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
  })

  it('422 si el equipo no existe', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli3', contact_name: 'X', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli3', equipoId: 'eq-inexistente', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT',
    })
    expect(res.status).toBe(422)
  })

  it('422 sin equipo', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({ tipoServicio: 'Mantenimiento' })
    expect(res.status).toBe(422)
  })

  it('401 sin sesión', async () => {
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').send({ equipoId: 'x' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 6:** Run `npx vitest run server/app.test.ts server/db/repo.test.ts && npx tsc -p tsconfig.server.json --noEmit` — Expected: PASS + typecheck limpio.

- [ ] **Step 7: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts server/app.ts server/app.test.ts
git commit -m "feat(E): ticket creation requires a registered equipo (422 if missing) + equipo_id"
```

---

## Task 7: Frontend — selector de equipo en el alta

**Files:** Modify `shared/types.ts`, `src/api/client.ts`, `src/components/CreateTicket.tsx`

- [ ] **Step 1: En `shared/types.ts`** reemplaza `CreateTicketPayload` por:
```ts
export interface CreateTicketPayload {
  salesOrderId?: string
  clientId?: string
  equipoId: string
  tipoServicio: string
  clasificaciones: string
  prefijo: string
  ordenVenta?: string
  prioridad?: string
  subject?: string
  codigoServicio?: string
}
```

- [ ] **Step 2: En `src/api/client.ts`** añade `EquipoLite` al import de tipos y la función:
```ts
import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, EquipoLite, CreateTicketPayload } from '../../shared/types'
```
```ts
export function searchEquipos(q: string): Promise<EquipoLite[]> {
  return fetch(`/api/equipos?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<EquipoLite[]>(r))
}
```

- [ ] **Step 3: Reemplazar `src/components/CreateTicket.tsx`** por (quita marca/modelo/serie/tipoEquipo libres; añade selector de equipo):
```tsx
import { useEffect, useMemo, useState } from 'react'
import type { ClientLite, SalesOrderLite, EquipoLite } from '../../shared/types'
import { PREFIJOS, TIPOS_SERVICIO, CLASIFICACIONES, buildCodigoServicio, buildSubject, parseCodigoFromPotential } from '../../shared/ticketCreate'
import { searchClients, searchSalesOrders, searchEquipos, createTicket } from '../api/client'

export function CreateTicket({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [ovQuery, setOvQuery] = useState('')
  const [ovResults, setOvResults] = useState<SalesOrderLite[]>([])
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  const [equipoQuery, setEquipoQuery] = useState('')
  const [equipoResults, setEquipoResults] = useState<EquipoLite[]>([])
  const [equipo, setEquipo] = useState<EquipoLite | null>(null)

  const [tipoServicio, setTipoServicio] = useState('')
  const [clasificaciones, setClasificaciones] = useState('')
  const [prefijo, setPrefijo] = useState('MT')
  const [ordenVenta, setOrdenVenta] = useState('')
  const [prioridad, setPrioridad] = useState('')

  const [subjectOverride, setSubjectOverride] = useState<string | null>(null)
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
  useEffect(() => {
    if (equipoQuery.trim().length < 2) { setEquipoResults([]); return }
    let alive = true
    searchEquipos(equipoQuery).then((r) => { if (alive) setEquipoResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [equipoQuery])

  const codigo = codigoOverride ?? buildCodigoServicio({ prefijo, serie: equipo?.serial ?? '', modelo: equipo?.modelo ?? '', fecha: new Date() })
  const subject = useMemo(
    () => subjectOverride ?? buildSubject({ cliente: clientName, tipoEquipo: equipo?.tipo ?? '', codigo }),
    [subjectOverride, clientName, equipo, codigo],
  )

  function pickOv(ov: SalesOrderLite) {
    setSalesOrderId(ov.id)
    setOvQuery(ov.number)
    setOvResults([])
    if (ov.clientId) setClientId(ov.clientId)
    if (ov.customerName) { setClientName(ov.customerName); setClientQuery(ov.customerName) }
    setOrdenVenta(ov.number)
    const parsed = parseCodigoFromPotential(ov.potentialName)
    if (parsed) setPrefijo(parsed.prefijo)
  }
  function pickClient(c: ClientLite) {
    setClientId(c.id); setClientName(c.name); setClientQuery(c.name); setClientResults([])
  }
  function pickEquipo(e: EquipoLite) {
    setEquipo(e); setEquipoQuery(`${e.serial} · ${e.marca ?? ''} ${e.modelo ?? ''}`.trim()); setEquipoResults([])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      if (!equipo) { setError('Selecciona un equipo registrado'); setBusy(false); return }
      await createTicket({
        salesOrderId: salesOrderId ?? undefined,
        clientId: clientId ?? undefined,
        equipoId: equipo.id,
        tipoServicio, clasificaciones, prefijo,
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

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Equipo * (por serie / cliente / modelo)</label>
          <input className={`${field} w-full`} placeholder="Buscar equipo registrado…" value={equipoQuery}
            onChange={(e) => { setEquipoQuery(e.target.value); setEquipo(null) }} required={!equipo} />
          {equipoResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {equipoResults.map((e) => (
                <li key={e.id}><button type="button" onClick={() => pickEquipo(e)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  <b>{e.serial}</b> — {e.marca ?? ''} {e.modelo ?? ''} · {e.tipo ?? ''} <span className="text-slate-400">· {e.clienteNombre ?? ''}</span>
                </button></li>
              ))}
            </ul>
          )}
          {equipo && (
            <div className="mt-1 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
              <b>{equipo.marca} {equipo.modelo}</b> · {equipo.tipo} · serie {equipo.serial}
              <span className="text-slate-400"> · dueño: {equipo.clienteNombre}</span>
            </div>
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

- [ ] **Step 4:** Run `npx tsc -b && npx vite build` — Expected: sin errores; build OK.

- [ ] **Step 5: Commit**
```bash
git add shared/types.ts src/api/client.ts src/components/CreateTicket.tsx
git commit -m "feat(E): create-ticket form uses a required registered-equipment selector"
```

---

## Task 8: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Logs: `Equipos: semilla cargada (N)` (N≈330). PgWeb: `SELECT count(*) FROM equipos;` y `SELECT serial, marca, modelo, tipo, cliente_nombre FROM equipos LIMIT 5;`.
2. Tablero → **"Nuevo ticket"** → buscar **Equipo** por serie (p.ej. `18A20070`) → autocompleta marca/modelo/tipo (solo lectura).
3. Intentar crear sin equipo → bloquea (obligatorio); por API sin `equipoId` → 422.
4. Completar OV/cliente + tipo de servicio + clasificaciones + prefijo → **Crear** → aparece en "OV asignada"; en PgWeb el ticket tiene `equipo_id`, `marca`, `modelo`, `serial`, `equipo` (tipo) del equipo elegido.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(E): subsistema E verificado (registro de equipos)"
```

---

## Notas de cierre
- **Gate**: sin equipo registrado no hay ticket (validado en servidor, 422).
- **Semilla**: se carga al arrancar si `equipos` está vacío; las altas futuras irán por gestión de equipos.
- **Hoja de vida**: `tickets.equipo_id` queda como base para el historial por equipo (fase futura).
- **Siguiente**: gestión de equipos (alta/edición), reconciliar equipo↔cliente Books, vista de hoja de vida; o D (correo) / G (reportería).
