# Tablero Ambientalia con Postgres autoalojado (Zoho Desk) — Implementation Plan

> ⚠️ **SUPERADO (2026-06-04).** Plan de la Fase 0 (tablero + réplica de Postgres), ya implementado y
> desplegado. El proyecto giró a reemplazar Zoho por completo; ver `docs/migracion-zoho-roadmap.md`
> y los specs de los subsistemas A–G. Se conserva como referencia histórica.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El tablero Kanban y el detalle de tickets leen de una base de datos **Postgres autoalojada** que replica Zoho Desk. Un job de sincronización dentro del backend Express trae Zoho→Postgres (backfill + incremental). Las acciones de escritura (responder, cambiar estado) van a Zoho y luego re-sincronizan.

**Architecture:** Express (TypeScript/tsx) expone `/api`. Las **lecturas** salen de Postgres (`pg`), guardando el JSON crudo de Zoho en una columna `raw jsonb` y aplicando `normalizeTicket(raw)` al leer. Un **sync** interno usa `zohoClient`+`tokenManager` para poblar Postgres (backfill al arranque + `setInterval` incremental + carga perezosa de conversaciones). Las **escrituras** llaman a Zoho (con guard `ENABLE_WRITES`) y re-sincronizan el ticket afectado. En dev, Vite hace proxy de `/api` al server; en prod, el mismo Express sirve `dist/`. Toda la lógica pura (mapeo/normalización) se testea directo; los repositorios con `pg-mem`; el sync con `zohoFetch` mockeado.

**Tech Stack:** React 19, Vite 6, TypeScript 5.6, Tailwind 3, Express 5, pg, pg-mem, dotenv, tsx, concurrently, cross-env, Vitest (3.x), supertest.

**Estado:** Tareas 0–3 ya completadas en `main` (setup, tipos, columnas, normalize). Empezar en Tarea 4.

**Nota git:** repo en rama `main`. Cada tarea termina con commit. No es necesario branch por tarea.

---

## Estructura de archivos (revisada)

**Compartido (hecho)**
- `shared/types.ts` — tipos `Ticket`, `Message`, `Column`, `ZohoTicketRaw`, `ZohoConversationRaw`.
- `shared/columns.ts` — `COLUMNS` y `columnForStatus()`.

**Backend (`server/`)**
- `server/normalize.ts` (hecho) — `normalizeTicket()`, `normalizeConversation()` (ruta de lectura).
- Modify `server/config.ts` — añade `databaseUrl`, `syncIntervalMs`.
- `server/tokenManager.ts` — access token (sin cambios respecto al plan).
- `server/zohoClient.ts` — `zohoFetch` (sin cambios respecto al plan).
- Create `server/db/schema.sql` — DDL de `tickets` y `conversations`.
- Create `server/db/migrate.ts` — aplica el schema (idempotente).
- Create `server/db/mappers.ts` — `ticketRowFromZoho()`, `conversationRowFromZoho()` (puras).
- Create `server/db/repo.ts` — upserts y queries sobre Postgres.
- Create `server/sync.ts` — `createSync()` (backfill, incremental, por-ticket, conversaciones).
- Create `server/app.ts` — endpoints REST (lee de repo, escribe en Zoho + re-sync).
- Create `server/index.ts` — arranque: pool, migrate, sync, app, static en prod.

**Frontend** (igual que el plan original)
- Create `src/api/client.ts`, `src/board.ts`, `src/hooks/useAsync.ts`.
- Modify `src/data/mockData.ts`, `src/App.tsx`, `src/components/TicketDetailView.tsx`.

---

## Tarea 4: Config del backend con Postgres (TDD)

**Files:**
- Create/overwrite: `server/config.ts`
- Test: `server/config.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { loadConfig } from './config'

const base = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref',
  ZOHO_ORG_ID: '713448415', ZOHO_DEPARTMENT_ID: '495552000000006907',
  DATABASE_URL: 'postgres://u:p@localhost:5432/desk',
}

describe('loadConfig', () => {
  it('aplica defaults de dominios, flags y sync', () => {
    const c = loadConfig(base)
    expect(c.accountsDomain).toBe('accounts.zoho.com')
    expect(c.apiDomain).toBe('desk.zoho.com')
    expect(c.enableWrites).toBe(false)
    expect(c.port).toBe(3001)
    expect(c.databaseUrl).toBe('postgres://u:p@localhost:5432/desk')
    expect(c.syncIntervalMs).toBe(180000)
  })

  it('respeta ENABLE_WRITES=true y SYNC_INTERVAL_MS', () => {
    const c = loadConfig({ ...base, ENABLE_WRITES: 'true', SYNC_INTERVAL_MS: '60000' })
    expect(c.enableWrites).toBe(true)
    expect(c.syncIntervalMs).toBe(60000)
  })

  it('lanza si falta un secreto o DATABASE_URL', () => {
    expect(() => loadConfig({ ...base, ZOHO_CLIENT_ID: undefined })).toThrow(/ZOHO_CLIENT_ID/)
    expect(() => loadConfig({ ...base, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/config.test.ts`
Expected: FAIL — "Cannot find module './config'".

- [ ] **Step 3: Implementar `server/config.ts`**

```ts
export interface AppConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  orgId: string
  departmentId: string
  accountsDomain: string
  apiDomain: string
  enableWrites: boolean
  port: number
  databaseUrl: string
  syncIntervalMs: number
}

type Env = Record<string, string | undefined>

function required(env: Env, key: string): string {
  const v = env[key]
  if (!v) throw new Error(`Falta la variable de entorno requerida: ${key}`)
  return v
}

export function loadConfig(env: Env = process.env): AppConfig {
  return {
    clientId: required(env, 'ZOHO_CLIENT_ID'),
    clientSecret: required(env, 'ZOHO_CLIENT_SECRET'),
    refreshToken: required(env, 'ZOHO_REFRESH_TOKEN'),
    orgId: required(env, 'ZOHO_ORG_ID'),
    departmentId: required(env, 'ZOHO_DEPARTMENT_ID'),
    accountsDomain: env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    apiDomain: env.ZOHO_API_DOMAIN || 'desk.zoho.com',
    enableWrites: env.ENABLE_WRITES === 'true',
    port: env.PORT ? Number(env.PORT) : 3001,
    databaseUrl: required(env, 'DATABASE_URL'),
    syncIntervalMs: env.SYNC_INTERVAL_MS ? Number(env.SYNC_INTERVAL_MS) : 180000,
  }
}
```

- [ ] **Step 4: Actualizar `.env.example`**

Añade al final de `.env.example` (deja las variables Zoho existentes):
```
DATABASE_URL=postgres://usuario:password@host:5432/basededatos
SYNC_INTERVAL_MS=180000
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run server/config.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/config.ts server/config.test.ts .env.example
git commit -m "feat: backend config with DATABASE_URL and sync interval"
```

---

## Tarea 5: Token manager (TDD, fetch inyectado)

**Files:**
- Create: `server/tokenManager.ts`
- Test: `server/tokenManager.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/tokenManager.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createTokenManager } from './tokenManager'
import type { AppConfig } from './config'

const config = {
  clientId: 'cid', clientSecret: 'sec', refreshToken: 'ref',
  orgId: 'o', departmentId: 'd', accountsDomain: 'accounts.zoho.com',
  apiDomain: 'desk.zoho.com', enableWrites: false, port: 3001,
  databaseUrl: 'postgres://x', syncIntervalMs: 180000,
} as AppConfig

function tokenResponse(token: string, expiresIn = 3600) {
  return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), { status: 200 })
}

describe('tokenManager', () => {
  it('pide un access token y lo cachea', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse('AT1'))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => 0 })
    expect(await tm.getAccessToken()).toBe('AT1')
    expect(await tm.getAccessToken()).toBe('AT1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refresca cuando el token expiró', async () => {
    let t = 0
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse('AT1', 100))
      .mockResolvedValueOnce(tokenResponse('AT2', 100))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => t })
    expect(await tm.getAccessToken()).toBe('AT1')
    t = 200_000
    expect(await tm.getAccessToken()).toBe('AT2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('forceRefresh ignora la cache', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse('AT1'))
      .mockResolvedValueOnce(tokenResponse('AT2'))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => 0 })
    await tm.getAccessToken()
    expect(await tm.getAccessToken(true)).toBe('AT2')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/tokenManager.test.ts`
Expected: FAIL — "Cannot find module './tokenManager'".

- [ ] **Step 3: Implementar `server/tokenManager.ts`**

```ts
import type { AppConfig } from './config'

export interface TokenManager {
  getAccessToken(forceRefresh?: boolean): Promise<string>
}

interface Deps {
  config: AppConfig
  fetchImpl?: typeof fetch
  now?: () => number
}

export function createTokenManager({ config, fetchImpl = fetch, now = () => Date.now() }: Deps): TokenManager {
  let token: string | null = null
  let expiresAt = 0

  async function refresh(): Promise<string> {
    const url = `https://${config.accountsDomain}/oauth/v2/token`
    const body = new URLSearchParams({
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    })
    const res = await fetchImpl(url, { method: 'POST', body })
    if (!res.ok) {
      throw new Error(`Fallo al refrescar token Zoho: ${res.status} ${await res.text()}`)
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }
    if (!data.access_token) {
      throw new Error(`Respuesta de token inválida: ${JSON.stringify(data)}`)
    }
    token = data.access_token
    expiresAt = now() + ((data.expires_in ?? 3600) - 60) * 1000
    return token
  }

  return {
    async getAccessToken(forceRefresh = false): Promise<string> {
      if (!forceRefresh && token && now() < expiresAt) return token
      return refresh()
    },
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/tokenManager.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/tokenManager.ts server/tokenManager.test.ts
git commit -m "feat: Zoho OAuth token manager with cache and auto-refresh"
```

---

## Tarea 6: Zoho client con retry 401 (TDD, fetch inyectado)

**Files:**
- Create: `server/zohoClient.ts`
- Test: `server/zohoClient.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/zohoClient.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createZohoClient } from './zohoClient'
import type { AppConfig } from './config'

const config = {
  clientId: 'c', clientSecret: 's', refreshToken: 'r', orgId: 'ORG', departmentId: 'd',
  accountsDomain: 'accounts.zoho.com', apiDomain: 'desk.zoho.com', enableWrites: false, port: 3001,
  databaseUrl: 'postgres://x', syncIntervalMs: 180000,
} as AppConfig

describe('zohoFetch', () => {
  it('agrega base URL, orgId y Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValue('AT1') }
    const { zohoFetch } = createZohoClient({ config, tokenManager: tm, fetchImpl: fetchMock })
    await zohoFetch('/tickets')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://desk.zoho.com/api/v1/tickets')
    expect((init.headers as Record<string, string>).orgId).toBe('ORG')
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-oauthtoken AT1')
  })

  it('ante 401 refresca el token y reintenta una vez', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('unauth', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValueOnce('AT1').mockResolvedValueOnce('AT2') }
    const { zohoFetch } = createZohoClient({ config, tokenManager: tm, fetchImpl: fetchMock })
    const res = await zohoFetch('/tickets')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(tm.getAccessToken).toHaveBeenLastCalledWith(true)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/zohoClient.test.ts`
Expected: FAIL — "Cannot find module './zohoClient'".

- [ ] **Step 3: Implementar `server/zohoClient.ts`**

```ts
import type { AppConfig } from './config'
import type { TokenManager } from './tokenManager'

export interface ZohoClient {
  zohoFetch(path: string, init?: RequestInit): Promise<Response>
}

interface Deps {
  config: AppConfig
  tokenManager: TokenManager
  fetchImpl?: typeof fetch
}

export function createZohoClient({ config, tokenManager, fetchImpl = fetch }: Deps): ZohoClient {
  const base = `https://${config.apiDomain}/api/v1`

  async function call(path: string, init: RequestInit, token: string): Promise<Response> {
    return fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        orgId: config.orgId,
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })
  }

  return {
    async zohoFetch(path: string, init: RequestInit = {}): Promise<Response> {
      let token = await tokenManager.getAccessToken()
      let res = await call(path, init, token)
      if (res.status === 401) {
        token = await tokenManager.getAccessToken(true)
        res = await call(path, init, token)
      }
      return res
    },
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/zohoClient.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/zohoClient.ts server/zohoClient.test.ts
git commit -m "feat: Zoho REST client with orgId header and 401 retry"
```

---

## Tarea 7: Esquema Postgres y migración (TDD con pg-mem)

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/migrate.ts`
- Test: `server/db/migrate.test.ts`

- [ ] **Step 1: Instalar dependencias de base de datos**

Run:
```bash
npm install pg
npm install -D pg-mem @types/pg
```
Expected: termina sin errores.

- [ ] **Step 2: Crear `server/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS tickets (
  id            text PRIMARY KEY,
  ticket_number text NOT NULL,
  status        text NOT NULL,
  status_type   text NOT NULL,
  created_time  timestamptz,
  modified_time timestamptz,
  raw           jsonb NOT NULL,
  synced_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id             text PRIMARY KEY,
  ticket_id      text NOT NULL,
  commented_time timestamptz,
  raw            jsonb NOT NULL,
  synced_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_type ON tickets (status_type);
CREATE INDEX IF NOT EXISTS idx_conversations_ticket ON conversations (ticket_id);
```

- [ ] **Step 3: Escribir el test que falla**

`server/db/migrate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate } from './migrate'

describe('migrate', () => {
  it('crea las tablas tickets y conversations', async () => {
    const db = newDb()
    const pg = db.adapters.createPg()
    const pool = new pg.Pool()
    await migrate(pool)
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
    )
    const names = res.rows.map((r: { table_name: string }) => r.table_name)
    expect(names).toContain('tickets')
    expect(names).toContain('conversations')
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que falla**

Run: `npx vitest run server/db/migrate.test.ts`
Expected: FAIL — "Cannot find module './migrate'".

- [ ] **Step 5: Implementar `server/db/migrate.ts`**

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** Algo con `query` (pg Pool/Client o adaptador pg-mem). */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

/** Aplica el esquema (idempotente). */
export async function migrate(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  await db.query(sql)
}
```
Nota: si `pg-mem` no acepta múltiples sentencias en un solo `query`, divide `sql` por `;`
y ejecuta cada sentencia no vacía en orden. Implementa esa variante sólo si el test lo exige.

- [ ] **Step 6: Ejecutar y verificar que pasa**

Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS. Si falla por múltiples sentencias, aplica la nota del Step 5 (split por `;`).

- [ ] **Step 7: Commit**

```bash
git add server/db/schema.sql server/db/migrate.ts server/db/migrate.test.ts package.json package-lock.json
git commit -m "feat: Postgres schema and idempotent migrate (pg-mem tested)"
```

---

## Tarea 8: Mappers Zoho→fila (TDD, puros)

**Files:**
- Create: `server/db/mappers.ts`
- Test: `server/db/mappers.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/db/mappers.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ticketRowFromZoho, conversationRowFromZoho } from './mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

describe('ticketRowFromZoho', () => {
  it('extrae columnas indexadas y conserva el raw', () => {
    const raw: ZohoTicketRaw = {
      id: '1', ticketNumber: '864', subject: 'x', status: 'Ingresado',
      statusType: 'Open', createdTime: '2026-01-25T20:44:00.000Z',
    }
    const row = ticketRowFromZoho(raw as any)
    expect(row.id).toBe('1')
    expect(row.ticket_number).toBe('864')
    expect(row.status).toBe('Ingresado')
    expect(row.status_type).toBe('Open')
    expect(row.created_time).toBe('2026-01-25T20:44:00.000Z')
    expect(row.raw).toEqual(raw)
  })
})

describe('conversationRowFromZoho', () => {
  it('liga al ticket y conserva el raw', () => {
    const raw: ZohoConversationRaw = { id: 'c1', commentedTime: '2026-06-01T13:57:00.000Z' }
    const row = conversationRowFromZoho(raw as any, '1')
    expect(row.id).toBe('c1')
    expect(row.ticket_id).toBe('1')
    expect(row.commented_time).toBe('2026-06-01T13:57:00.000Z')
    expect(row.raw).toEqual(raw)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/db/mappers.test.ts`
Expected: FAIL — "Cannot find module './mappers'".

- [ ] **Step 3: Implementar `server/db/mappers.ts`**

```ts
import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

export interface TicketRow {
  id: string
  ticket_number: string
  status: string
  status_type: string
  created_time: string | null
  modified_time: string | null
  raw: ZohoTicketRaw
}

export interface ConversationRow {
  id: string
  ticket_id: string
  commented_time: string | null
  raw: ZohoConversationRaw
}

export function ticketRowFromZoho(raw: ZohoTicketRaw & { modifiedTime?: string }): TicketRow {
  return {
    id: raw.id,
    ticket_number: raw.ticketNumber,
    status: raw.status,
    status_type: raw.statusType,
    created_time: raw.createdTime ?? null,
    modified_time: raw.modifiedTime ?? null,
    raw,
  }
}

export function conversationRowFromZoho(raw: ZohoConversationRaw, ticketId: string): ConversationRow {
  return {
    id: raw.id,
    ticket_id: ticketId,
    commented_time: raw.commentedTime ?? raw.createdTime ?? null,
    raw,
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/db/mappers.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat: pure Zoho→DB row mappers for tickets and conversations"
```

---

## Tarea 9: Repositorio Postgres (TDD con pg-mem)

**Files:**
- Create: `server/db/repo.ts`
- Test: `server/db/repo.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/db/repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import {
  upsertTicket, getActiveTicketsRaw, getTicketRaw, countTickets,
  upsertConversation, getConversationsRaw,
} from './repo'
import type { TicketRow, ConversationRow } from './mappers'

function ticket(id: string, statusType = 'Open'): TicketRow {
  return {
    id, ticket_number: id, status: 'Ingresado', status_type: statusType,
    created_time: `2026-01-0${id}T00:00:00.000Z`, modified_time: null,
    raw: { id, ticketNumber: id, subject: `s${id}`, status: 'Ingresado', statusType, createdTime: `2026-01-0${id}T00:00:00.000Z` } as any,
  }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('tickets repo', () => {
  it('upsert inserta y luego actualiza por id', async () => {
    await upsertTicket(db, ticket('1'))
    await upsertTicket(db, { ...ticket('1'), status: 'En Proceso' })
    expect(await countTickets(db)).toBe(1)
    const raw = await getTicketRaw(db, '1')
    expect(raw.status).toBe('En Proceso')
  })

  it('getActiveTicketsRaw excluye cerrados', async () => {
    await upsertTicket(db, ticket('1', 'Open'))
    await upsertTicket(db, ticket('2', 'Closed'))
    const raws = await getActiveTicketsRaw(db)
    expect(raws.map((r: any) => r.id)).toEqual(['1'])
  })
})

describe('conversations repo', () => {
  it('upsert y lectura por ticket', async () => {
    const c: ConversationRow = { id: 'c1', ticket_id: '1', commented_time: null, raw: { id: 'c1' } as any }
    await upsertConversation(db, c)
    const raws = await getConversationsRaw(db, '1')
    expect(raws.map((r: any) => r.id)).toEqual(['c1'])
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/db/repo.test.ts`
Expected: FAIL — "Cannot find module './repo'".

- [ ] **Step 3: Implementar `server/db/repo.ts`**

```ts
import type { Queryable } from './migrate'
import type { TicketRow, ConversationRow } from './mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

export async function upsertTicket(db: Queryable, row: TicketRow): Promise<void> {
  await db.query(
    `INSERT INTO tickets (id, ticket_number, status, status_type, created_time, modified_time, raw, synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, now())
     ON CONFLICT (id) DO UPDATE SET
       ticket_number = EXCLUDED.ticket_number,
       status = EXCLUDED.status,
       status_type = EXCLUDED.status_type,
       created_time = EXCLUDED.created_time,
       modified_time = EXCLUDED.modified_time,
       raw = EXCLUDED.raw,
       synced_at = now()`,
    [row.id, row.ticket_number, row.status, row.status_type, row.created_time, row.modified_time, JSON.stringify(row.raw)],
  )
}

export async function getActiveTicketsRaw(db: Queryable): Promise<ZohoTicketRaw[]> {
  const res = await db.query(
    `SELECT raw FROM tickets WHERE status_type <> 'Closed' ORDER BY created_time DESC NULLS LAST`,
  )
  return res.rows.map((r) => r.raw as ZohoTicketRaw)
}

export async function getTicketRaw(db: Queryable, id: string): Promise<ZohoTicketRaw | null> {
  const res = await db.query(`SELECT raw FROM tickets WHERE id = $1`, [id])
  return res.rows[0] ? (res.rows[0].raw as ZohoTicketRaw) : null
}

export async function countTickets(db: Queryable): Promise<number> {
  const res = await db.query(`SELECT COUNT(*)::int AS n FROM tickets`)
  return res.rows[0].n as number
}

export async function upsertConversation(db: Queryable, row: ConversationRow): Promise<void> {
  await db.query(
    `INSERT INTO conversations (id, ticket_id, commented_time, raw, synced_at)
     VALUES ($1,$2,$3,$4, now())
     ON CONFLICT (id) DO UPDATE SET
       ticket_id = EXCLUDED.ticket_id,
       commented_time = EXCLUDED.commented_time,
       raw = EXCLUDED.raw,
       synced_at = now()`,
    [row.id, row.ticket_id, row.commented_time, JSON.stringify(row.raw)],
  )
}

export async function getConversationsRaw(db: Queryable, ticketId: string): Promise<ZohoConversationRaw[]> {
  const res = await db.query(
    `SELECT raw FROM conversations WHERE ticket_id = $1 ORDER BY commented_time ASC NULLS LAST`,
    [ticketId],
  )
  return res.rows.map((r) => r.raw as ZohoConversationRaw)
}
```
Nota: si `pg-mem` devuelve `raw` como string en vez de objeto, parsea con `JSON.parse`
condicionalmente (`typeof r.raw === 'string' ? JSON.parse(r.raw) : r.raw`). Aplica sólo si
el test lo exige.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/db/repo.test.ts`
Expected: PASS (3 tests). Si `raw` llega como string, aplica la nota del Step 3.

- [ ] **Step 5: Commit**

```bash
git add server/db/repo.ts server/db/repo.test.ts
git commit -m "feat: Postgres repository for tickets and conversations (pg-mem tested)"
```

---

## Tarea 10: Sincronización Zoho→Postgres (TDD)

**Files:**
- Create: `server/sync.ts`
- Test: `server/sync.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/sync.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { countTickets, getConversationsRaw } from './db/repo'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig

function page(tickets: unknown[]) {
  return new Response(JSON.stringify({ data: tickets }), { status: 200 })
}
function z(id: string) {
  return { id, ticketNumber: id, subject: 's', status: 'Ingresado', statusType: 'Open', createdTime: '2026-01-01T00:00:00.000Z' }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('sync', () => {
  it('backfill pagina hasta vaciar y hace upsert', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('1'), z('2')]))
      .mockResolvedValueOnce(page([])) // página vacía corta el bucle
    const sync = createSync({ zohoFetch, db, config })
    await sync.backfillTickets()
    expect(await countTickets(db)).toBe(2)
    // pidió el departmentId
    expect(String(zohoFetch.mock.calls[0][0])).toContain('departmentId=DEP')
  })

  it('syncConversations trae y guarda las conversaciones del ticket', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(page([{ id: 'c1' }, { id: 'c2' }]))
    const sync = createSync({ zohoFetch, db, config })
    await sync.syncConversations('1')
    const raws = await getConversationsRaw(db, '1')
    expect(raws.map((r: any) => r.id)).toEqual(['c1', 'c2'])
  })

  it('syncTicket trae un ticket y lo upserta', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(z('9')), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config })
    await sync.syncTicket('9')
    expect(await countTickets(db)).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/sync.test.ts`
Expected: FAIL — "Cannot find module './sync'".

- [ ] **Step 3: Implementar `server/sync.ts`**

```ts
import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation } from './db/repo'
import { ticketRowFromZoho, conversationRowFromZoho } from './db/mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}

export interface Sync {
  backfillTickets(): Promise<number>
  syncRecent(): Promise<number>
  syncTicket(id: string): Promise<void>
  syncConversations(id: string): Promise<void>
}

const PAGE_SIZE = 100

async function readData(res: Response): Promise<any> {
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  async function fetchTicketPage(from: number): Promise<ZohoTicketRaw[]> {
    const params = new URLSearchParams({
      departmentId: config.departmentId,
      from: String(from),
      limit: String(PAGE_SIZE),
      sortBy: 'createdTime',
    })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}: ${await res.text()}`)
    return ((await readData(res)).data ?? []) as ZohoTicketRaw[]
  }

  async function upsertTickets(tickets: ZohoTicketRaw[]): Promise<void> {
    for (const t of tickets) await upsertTicket(db, ticketRowFromZoho(t))
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 0
      let total = 0
      // Zoho usa índices 1-based en algunos endpoints; from=0 y 1 son equivalentes al inicio.
      for (;;) {
        const page = await fetchTicketPage(from === 0 ? 1 : from)
        if (page.length === 0) break
        await upsertTickets(page)
        total += page.length
        if (page.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },

    async syncRecent(): Promise<number> {
      const page = await fetchTicketPage(1)
      await upsertTickets(page)
      return page.length
    },

    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await upsertTicket(db, ticketRowFromZoho((await readData(res)) as ZohoTicketRaw))
    },

    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = ((await readData(res)).data ?? []) as ZohoConversationRaw[]
      for (const c of items) await upsertConversation(db, conversationRowFromZoho(c, id))
    },
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/sync.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/sync.ts server/sync.test.ts
git commit -m "feat: in-backend Zoho→Postgres sync (backfill, recent, per-ticket, conversations)"
```

---

## Tarea 11: App Express (lee de Postgres, escribe en Zoho + re-sync) (TDD con supertest)

**Files:**
- Create: `server/app.ts`
- Test: `server/app.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/app.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket } from './db/repo'
import { ticketRowFromZoho } from './db/mappers'
import { createApp } from './app'
import type { AppConfig } from './config'

function zTicket(id: string, statusType = 'Open') {
  return { id, ticketNumber: id, subject: 'Test', status: 'Ingresado', statusType,
    createdTime: '2026-01-25T20:44:00.000Z', commentCount: '2',
    contact: { accountName: 'AGQ' }, assignee: { firstName: 'David', lastName: 'León' } }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function appWith(overrides: Partial<{ enableWrites: boolean }> = {}) {
  const config = { enableWrites: false, ...overrides } as AppConfig
  const sync = { backfillTickets: vi.fn(), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn() }
  const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  const app = createApp({ db, zohoFetch, sync, config })
  return { app, sync, zohoFetch }
}

describe('GET /api/tickets', () => {
  it('devuelve tickets normalizados desde Postgres', async () => {
    await upsertTicket(db, ticketRowFromZoho(zTicket('864') as any))
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })
})

describe('escrituras', () => {
  it('PATCH status → 403 si enableWrites=false', async () => {
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('PATCH status → llama Zoho y re-sincroniza si enableWrites=true', async () => {
    const { app, zohoFetch, sync } = appWith({ enableWrites: true })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(200)
    expect(zohoFetch).toHaveBeenCalledWith('/tickets/1', expect.objectContaining({ method: 'PATCH' }))
    expect(sync.syncTicket).toHaveBeenCalledWith('1')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/app.test.ts`
Expected: FAIL — "Cannot find module './app'".

- [ ] **Step 3: Implementar `server/app.ts`**

```ts
import express, { type Express, type Request, type Response } from 'express'
import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import type { Sync } from './sync'
import { normalizeTicket, normalizeConversation } from './normalize'
import { getActiveTicketsRaw, getTicketRaw, getConversationsRaw } from './db/repo'

interface Deps {
  db: Queryable
  zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>
  sync: Sync
  config: AppConfig
}

export function createApp({ db, zohoFetch, sync, config }: Deps): Express {
  const app = express()
  app.use(express.json())

  const guardWrites = (_req: Request, res: Response, next: () => void) => {
    if (!config.enableWrites) {
      res.status(403).json({ error: 'Escrituras deshabilitadas (ENABLE_WRITES=false)' })
      return
    }
    next()
  }

  // Tablero: lee de Postgres
  app.get('/api/tickets', async (_req, res) => {
    try {
      const raws = await getActiveTicketsRaw(db)
      res.json(raws.map((r) => normalizeTicket(r)))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  // Detalle: lee de DB; si falta, sincroniza y reintenta
  app.get('/api/tickets/:id', async (req, res) => {
    try {
      let raw = await getTicketRaw(db, req.params.id)
      if (!raw) {
        await sync.syncTicket(req.params.id)
        raw = await getTicketRaw(db, req.params.id)
      }
      if (!raw) return res.status(404).json({ error: 'Ticket no encontrado' })
      res.json(normalizeTicket(raw))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  // Conversaciones: lee de DB; si vacío, sincroniza (carga perezosa) y lee
  app.get('/api/tickets/:id/conversations', async (req, res) => {
    try {
      let raws = await getConversationsRaw(db, req.params.id)
      if (raws.length === 0) {
        await sync.syncConversations(req.params.id)
        raws = await getConversationsRaw(db, req.params.id)
      }
      res.json(raws.map((r) => normalizeConversation(r)))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  // Cambiar estado: escribe en Zoho y re-sincroniza el ticket
  app.patch('/api/tickets/:id/status', guardWrites, async (req, res) => {
    try {
      const zres = await zohoFetch(`/tickets/${req.params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: req.body.status }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      await sync.syncTicket(req.params.id)
      const raw = await getTicketRaw(db, req.params.id)
      res.json(raw ? normalizeTicket(raw) : {})
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  // Responder: envía a Zoho y re-sincroniza conversaciones
  app.post('/api/tickets/:id/reply', guardWrites, async (req, res) => {
    try {
      const addrRes = await zohoFetch(`/tickets/${req.params.id}/sendReplyMailIDs`)
      const addrText = await addrRes.text()
      const addrBody = addrText ? JSON.parse(addrText) : { data: [] }
      const fromEmailAddress = addrBody.data?.[0]?.email ?? addrBody.data?.[0]?.value
      const zres = await zohoFetch(`/tickets/${req.params.id}/sendReply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL', contentType: 'plainText',
          content: req.body.content, fromEmailAddress, to: req.body.to,
        }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      await sync.syncConversations(req.params.id)
      res.json({ ok: true })
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  return app
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/app.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/app.ts server/app.test.ts
git commit -m "feat: Express API reading from Postgres, writes to Zoho with re-sync"
```

---

## Tarea 12: Arranque del servidor (pool, migrate, sync, static)

**Files:**
- Create: `server/db/pool.ts`
- Create: `server/index.ts`

- [ ] **Step 1: Crear `server/db/pool.ts`**

```ts
import { Pool } from 'pg'
import type { AppConfig } from '../config'

export function createPool(config: AppConfig): Pool {
  return new Pool({ connectionString: config.databaseUrl })
}
```

- [ ] **Step 2: Implementar `server/index.ts`**

```ts
import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createPool } from './db/pool'
import { migrate } from './db/migrate'
import { createSync } from './sync'
import { createApp } from './app'
import { countTickets } from './db/repo'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

async function main() {
  await migrate(pool)

  const app = createApp({ db: pool, zohoFetch, sync, config })

  // En producción servimos el frontend compilado (Express 5: usar middleware, no app.get('*'))
  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist')
    app.use(express.static(dist))
    app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.listen(config.port, () => {
    console.log(`API en http://localhost:${config.port} (writes=${config.enableWrites})`)
  })

  // Backfill en segundo plano si la DB está vacía (no bloquea el listen)
  countTickets(pool)
    .then(async (n) => {
      if (n === 0) {
        console.log('DB vacía: iniciando backfill de tickets…')
        const total = await sync.backfillTickets()
        console.log(`Backfill completado: ${total} tickets`)
      }
    })
    .catch((e) => console.error('Backfill falló:', e))

  // Sync incremental periódico
  setInterval(() => {
    sync.syncRecent().catch((e) => console.error('Sync incremental falló:', e))
  }, config.syncIntervalMs)
}

main().catch((e) => {
  console.error('Fallo al arrancar el servidor:', e)
  process.exit(1)
})
```

- [ ] **Step 3: Verificación manual del backend (requiere `.env` real)**

Crea `.env` (copia de `.env.example`) y rellena `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`,
`ZOHO_REFRESH_TOKEN` y `DATABASE_URL` (connection string de la Postgres de EasyPanel).
Asegúrate de que la Postgres sea accesible desde donde corres el backend (host/puerto
expuestos por EasyPanel, o túnel/red interna).

Run: `npm run dev:api`
Expected: imprime "API en http://localhost:3001 (writes=false)", luego "DB vacía: iniciando
backfill…" y al cabo "Backfill completado: N tickets".

En otra terminal:
Run: `curl http://localhost:3001/api/tickets`
Expected: JSON array de tickets reales (objetos con `number`, `title`, `status`, `company`).

- [ ] **Step 4: Commit**

```bash
git add server/db/pool.ts server/index.ts
git commit -m "feat: server entrypoint with Postgres pool, migrate, background backfill, periodic sync"
```

---

## Tarea 13: Capa de API del frontend (TDD)

**Files:**
- Create: `src/api/client.ts`
- Test: `src/api/client.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`src/api/client.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchTickets, updateTicketStatus } from './client'

afterEach(() => vi.restoreAllMocks())

describe('client', () => {
  it('fetchTickets pega a /api/tickets y devuelve json', async () => {
    const data = [{ id: '1', number: '#864' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 })))
    expect(await fetchTickets()).toEqual(data)
    expect(fetch).toHaveBeenCalledWith('/api/tickets')
  })

  it('lanza si la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))
    await expect(fetchTickets()).rejects.toThrow()
  })

  it('updateTicketStatus envía PATCH con el status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    await updateTicketStatus('1', 'En Proceso')
    const [url, init] = (fetch as any).mock.calls[0]
    expect(url).toBe('/api/tickets/1/status')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ status: 'En Proceso' })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/api/client.test.ts`
Expected: FAIL — "Cannot find module './client'".

- [ ] **Step 3: Implementar `src/api/client.ts`**

```ts
import type { Ticket, Message } from '../../shared/types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export function fetchTickets(): Promise<Ticket[]> {
  return fetch('/api/tickets').then((r) => json<Ticket[]>(r))
}

export function fetchTicket(id: string): Promise<Ticket> {
  return fetch(`/api/tickets/${id}`).then((r) => json<Ticket>(r))
}

export function fetchConversations(id: string): Promise<Message[]> {
  return fetch(`/api/tickets/${id}/conversations`).then((r) => json<Message[]>(r))
}

export function updateTicketStatus(id: string, status: string): Promise<Ticket> {
  return fetch(`/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then((r) => json<Ticket>(r))
}

export function replyTicket(id: string, content: string, to?: string): Promise<unknown> {
  return fetch(`/api/tickets/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, to }),
  }).then((r) => json<unknown>(r))
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/api/client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts
git commit -m "feat: frontend API client for tickets/conversations/actions"
```

---

## Tarea 14: Agrupar tickets por columna (TDD, pura) + hook useAsync

**Files:**
- Create: `src/board.ts`
- Test: `src/board.test.ts`
- Create: `src/hooks/useAsync.ts`

- [ ] **Step 1: Escribir el test que falla**

`src/board.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { groupTicketsByColumn } from './board'
import type { Ticket } from '../shared/types'

const t = (id: string, status: string): Ticket => ({
  id, number: `#${id}`, title: 't', company: 'c', time: '', status,
})

describe('groupTicketsByColumn', () => {
  it('agrupa por columna y cuenta', () => {
    const groups = groupTicketsByColumn([
      t('1', 'Ingresado'), t('2', 'Ingresado'), t('3', 'En Proceso'), t('4', 'Finalizado'),
    ])
    expect(groups.ingresado.map((x) => x.id)).toEqual(['1', '2'])
    expect(groups.proceso.map((x) => x.id)).toEqual(['3'])
    expect(groups.proceso.length).toBe(1)
    expect(Object.values(groups).flat().some((x) => x.id === '4')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/board.test.ts`
Expected: FAIL — "Cannot find module './board'".

- [ ] **Step 3: Implementar `src/board.ts`**

```ts
import type { Ticket } from '../shared/types'
import { COLUMNS, columnForStatus } from '../shared/columns'

export type ColumnGroups = Record<string, Ticket[]>

export function groupTicketsByColumn(tickets: Ticket[]): ColumnGroups {
  const groups: ColumnGroups = Object.fromEntries(COLUMNS.map((c) => [c.id, []]))
  for (const ticket of tickets) {
    const col = columnForStatus(ticket.status)
    if (col) groups[col].push(ticket)
  }
  return groups
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/board.test.ts`
Expected: PASS.

- [ ] **Step 5: Crear `src/hooks/useAsync.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** Ejecuta `fn` al montar (y cuando cambian `deps`), exponiendo loading/error/reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/board.ts src/board.test.ts src/hooks/useAsync.ts
git commit -m "feat: column grouping (tested) and useAsync hook"
```

---

## Tarea 15: Conservar tipos/fixture en `mockData.ts`

**Files:**
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Reemplazar la definición de tipo por re-export**

Al inicio de `src/data/mockData.ts`, sustituye el bloque `export interface Ticket { ... }`
por:
```ts
export type { Ticket } from '../../shared/types'
```
Mantén intacto el array `export const TICKETS: Ticket[] = [ ... ]` (fixture de tests).
Conserva `VIEWS` (lo usa `Sidebar.tsx`). `TABS` se reemplaza por `COLUMNS`; puedes dejarlo
hasta que `App.tsx` ya no lo importe (Tarea 16) y quitarlo entonces.

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc -b`
Expected: sin errores por el re-export.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockData.ts
git commit -m "refactor: source Ticket type from shared/, keep TICKETS as fixture"
```

---

## Tarea 16: Conectar el tablero (`App.tsx`) a la API

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Reescribir `App.tsx`** con el contenido siguiente:
```tsx
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketCard } from './components/TicketCard';
import { TicketDetailView } from './components/TicketDetailView';
import { COLUMNS } from '../shared/columns';
import { groupTicketsByColumn } from './board';
import { useAsync } from './hooks/useAsync';
import { fetchTickets } from './api/client';

function App() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { data: tickets, loading, error, reload } = useAsync(fetchTickets, []);
  const groups = groupTicketsByColumn(tickets ?? []);

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-slate-400">star</span>
              <h1 className="text-[14px] font-semibold text-slate-700">Todos los Tickets</h1>
              <button onClick={reload} className="p-1 hover:bg-slate-100 rounded">
                <span className="material-symbols-outlined text-[18px] text-slate-400">refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 text-[12px] px-4 py-2 flex items-center justify-between">
              <span>Error al cargar tickets: {error}</span>
              <button onClick={reload} className="font-bold underline">Reintentar</button>
            </div>
          )}

          <main className="flex-1 flex overflow-x-auto p-3 gap-2 bg-[#E9EDF2] dark:bg-slate-950">
            {COLUMNS.map((column) => {
              const colTickets = groups[column.id] ?? [];
              return (
                <section key={column.id} className="w-[280px] min-w-[280px] flex flex-col">
                  <div className="px-1 py-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {column.label} ({colTickets.length})
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 hide-scrollbar">
                    {loading && <div className="h-20 rounded-lg bg-slate-200/60 animate-pulse" />}
                    {!loading && colTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicketId(ticket.id)} />
                    ))}
                    {!loading && colTickets.length === 0 && (
                      <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center opacity-40">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sin Tickets</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>

      {selectedTicketId && (
        <TicketDetailView ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}
    </div>
  );
}

export default App;
```
Nota: `TicketDetailView` recibe ahora `ticketId`; su firma se actualiza en la Tarea 17. Hasta
entonces `tsc` marcará error en esa prop — es esperado y se resuelve en la siguiente tarea.

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire Kanban board to live tickets with dynamic counts and states"
```

---

## Tarea 17: Conectar el detalle (`TicketDetailView.tsx`) a datos reales

**Files:**
- Modify: `src/components/TicketDetailView.tsx`

- [ ] **Step 1: Cambiar la firma y cargar datos reales.** Reemplaza la cabecera del componente (imports + firma, las primeras ~7 líneas) por:
```tsx
import { useState } from 'react';
import type { Ticket, Message } from '../../shared/types';
import { useAsync } from '../hooks/useAsync';
import { fetchTicket, fetchConversations, updateTicketStatus, replyTicket } from '../api/client';
import { COLUMNS } from '../../shared/columns';

interface TicketDetailViewProps {
    ticketId: string;
    onClose: () => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({ ticketId, onClose }) => {
    const { data: ticket, loading } = useAsync<Ticket>(() => fetchTicket(ticketId), [ticketId]);
    const { data: messages } = useAsync<Message[]>(() => fetchConversations(ticketId), [ticketId]);
    const [replyText, setReplyText] = useState('');
    const [confirming, setConfirming] = useState<null | { kind: 'reply' } | { kind: 'status'; status: string }>(null);

    async function doConfirm() {
        if (!confirming) return;
        try {
            if (confirming.kind === 'reply') await replyTicket(ticketId, replyText);
            else await updateTicketStatus(ticketId, confirming.status);
            setConfirming(null);
            setReplyText('');
        } catch (e) {
            alert('La acción falló: ' + String(e));
        }
    }
```

- [ ] **Step 2: Sustituir el contenido hardcodeado por datos del ticket cargado:**
- El título grande (`Servicio Técnico COROLA Monitor…`) por `{ticket?.title ?? (loading ? 'Cargando…' : '')}`.
- `#825` por `{ticket?.number}`.
- El nombre/fecha del autor del encabezado por `{ticket?.assignee?.name}` y `{ticket?.time}`.
- El bloque de mensajes hardcodeado (el array literal `[{ author: 'Equipo Técnico'… }].map(...)`)
  por el render de `messages`:
```tsx
{(messages ?? []).map((msg) => (
  <div key={msg.id} className="flex gap-4 relative z-10">
    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm font-bold text-[12px] bg-slate-100 text-slate-700">
      {msg.author.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[13px] font-bold text-slate-800">{msg.author}</span>
        <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-100">{msg.type}</span>
        <span className="text-[11px] text-slate-400 font-medium">{msg.time}</span>
      </div>
      <div className="text-[13px] text-slate-700 leading-relaxed max-w-[800px] whitespace-pre-line">{msg.content}</div>
    </div>
  </div>
))}
```

- [ ] **Step 3: Añadir controles de acción.** Justo antes del botón "Need Help" (al final del componente), añade:
```tsx
<div className="absolute bottom-16 right-4 left-[660px] bg-white border border-slate-200 rounded-lg shadow-lg p-3 flex flex-col gap-2">
  <textarea
    value={replyText}
    onChange={(e) => setReplyText(e.target.value)}
    placeholder="Escribe una respuesta…"
    className="border border-slate-200 rounded p-2 text-[13px] resize-none h-16"
  />
  <div className="flex items-center justify-between">
    <select
      defaultValue=""
      onChange={(e) => e.target.value && setConfirming({ kind: 'status', status: e.target.value })}
      className="border border-slate-200 rounded text-[12px] px-2 py-1"
    >
      <option value="" disabled>Cambiar estado…</option>
      {COLUMNS.map((c) => <option key={c.id} value={c.statuses[0]}>{c.label}</option>)}
    </select>
    <button
      onClick={() => setConfirming({ kind: 'reply' })}
      disabled={!replyText.trim()}
      className="bg-[#2C7BE5] text-white px-4 py-1.5 rounded text-[13px] font-bold disabled:opacity-40"
    >
      Responder
    </button>
  </div>
</div>

{confirming && (
  <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-[360px] flex flex-col gap-4">
      <p className="text-[14px] text-slate-700">
        {confirming.kind === 'reply'
          ? '¿Enviar esta respuesta al cliente en Zoho Desk?'
          : `¿Cambiar el estado del ticket a "${confirming.status}"?`}
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={() => setConfirming(null)} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
        <button onClick={doConfirm} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold">Confirmar</button>
      </div>
    </div>
  </div>
)}
```
Nota: con `ENABLE_WRITES=false`, el backend responde 403 y el `catch` muestra el alert. Es lo esperado hasta activar el flag.

- [ ] **Step 4: Verificar compilación**

Run: `npx tsc -b`
Expected: sin errores (la prop `ticketId` ya coincide con `App.tsx`).

- [ ] **Step 5: Commit**

```bash
git add src/components/TicketDetailView.tsx
git commit -m "feat: load real ticket detail + conversations from Postgres-backed API, add actions"
```

---

## Tarea 18: Verificación end-to-end y suite completa

**Files:** ninguno nuevo

- [ ] **Step 1: Ejecutar toda la suite**

Run: `npm test`
Expected: PASS en todos los archivos (`shared/`, `server/`, `src/`).

- [ ] **Step 2: Lint y typecheck**

Run: `npm run lint && npx tsc -b`
Expected: sin errores.

- [ ] **Step 3: Verificación manual (lectura, requiere `.env` + Postgres)**

Con `.env` completo (incl. `DATABASE_URL`) y la Postgres accesible:
Run: `npm run dev`
Expected: Vite en 5173, API en 3001, backfill poblando la DB. Abre `http://localhost:5173`:
- Las columnas muestran tickets reales con counts dinámicos (los "Finalizado" no aparecen).
- Clic en una tarjeta abre el detalle con título/número reales y carga conversaciones (sync perezoso).
- El botón refresh recarga desde Postgres.

- [ ] **Step 4: Verificación de escrituras (opcional, con cuidado)**

SOLO cuando quieras: `ENABLE_WRITES=true` en `.env`, reinicia, prueba un cambio de estado en
un ticket de prueba, verifica en Zoho Desk y que el tablero lo refleje tras el re-sync. Vuelve
a `ENABLE_WRITES=false`.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: full suite green; Postgres-backed Zoho Desk board verified"
```

---

## Notas de cierre

- **Frescura:** el tablero refleja el último `syncRecent` (def. cada 3 min) + backfill inicial.
  Para casi-tiempo-real, añadir webhooks de Zoho Desk que disparen `syncTicket` (mejora futura).
- **Backfill grande:** si hay miles de tickets, el backfill inicial puede tardar; corre en
  background. Considerar paginar por lotes con pausas si Zoho aplica rate limiting (429).
- **Mapeo de estados:** si aparecen estados activos no mapeados, añádelos a `shared/columns.ts`
  y extiende su test.
- **Conexión a Postgres:** `DATABASE_URL` debe apuntar a la Postgres de EasyPanel accesible
  desde el backend (puerto expuesto o misma red). Para TLS, añadir `?sslmode=require` si aplica.
- **Endpoint de reply:** la ruta de direcciones de remitente puede variar según la versión de la
  API de Zoho (`sendReplyMailIDs` vs `replyAddress`); ajusta `server/app.ts` si el reply falla
  por falta de `fromEmailAddress`.
- **pg-mem vs Postgres real:** los tests usan `pg-mem`; algún comportamiento SQL avanzado puede
  diferir de Postgres real. La verificación manual (Tarea 18) valida contra la DB real.
