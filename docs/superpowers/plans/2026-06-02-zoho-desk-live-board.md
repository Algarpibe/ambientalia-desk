# Tablero Ambientalia en Vivo (Zoho Desk) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar el tablero Kanban y el detalle de tickets a datos reales de Zoho Desk vía un backend Express, con lectura del tablero/detalle y acciones de escritura (responder, cambiar estado) protegidas por un flag.

**Architecture:** Un servidor Express (`server/`) en TypeScript guarda el refresh token de Zoho, gestiona el access token (cache + auto-refresh ante 401) y expone una API REST en `/api`. En dev, Vite hace proxy de `/api` al server; en prod, el mismo Express sirve `dist/`. El frontend React consume `/api` mediante una capa `src/api/client.ts` y hooks. Toda la lógica de mapeo/normalización vive en funciones puras testeadas. Las dependencias de I/O se inyectan (factories) para poder testear sin red.

**Tech Stack:** React 19, Vite 6, TypeScript 5.6, Tailwind 3, Express, dotenv, tsx, concurrently, cross-env, Vitest, supertest.

**Convención de commits (gitignore note):** El proyecto NO es un repo git todavía. La Tarea 0 lo inicializa para que los commits del plan funcionen.

---

## Estructura de archivos

**Compartido**
- Crear `shared/types.ts` — tipos `Ticket`, `Message`, `Column`, tipos crudos de Zoho.
- Crear `shared/columns.ts` — definición de las 8 columnas y `columnForStatus()`.

**Backend (`server/`)**
- Crear `server/config.ts` — lee/valida env.
- Crear `server/tokenManager.ts` — factory de access token con auto-refresh.
- Crear `server/zohoClient.ts` — factory de `zohoFetch` (base URL, header orgId, retry 401).
- Crear `server/normalize.ts` — `normalizeTicket()`, `normalizeConversation()`.
- Crear `server/app.ts` — `createApp(deps)` con las rutas REST (testeable con supertest).
- Crear `server/index.ts` — arranque real (lee config, monta app, sirve `dist/` en prod).

**Frontend**
- Crear `src/api/client.ts` — funciones fetch a `/api`.
- Crear `src/board.ts` — `groupTicketsByColumn()` (pura, testeada).
- Crear `src/hooks/useAsync.ts` — hook genérico fetch→{data,loading,error}.
- Modificar `src/data/mockData.ts` — re-exporta tipos desde `shared/`, conserva `TICKETS` como fixture.
- Modificar `src/App.tsx` — usa la API en vez de `TICKETS`; counts dinámicos; loading/error.
- Modificar `src/components/TicketDetailView.tsx` — recibe `ticketId`, carga datos reales, acciones.

**Config**
- Modificar `package.json` — scripts y dependencias.
- Modificar `vite.config.ts` — proxy `/api`.
- Crear `tsconfig.server.json` — compilación/IDE del server.
- Crear `vitest.config.ts` — runner de tests.
- Crear `.env.example` — plantilla sin secretos.
- Modificar `.gitignore` — asegurar `.env`.

---

## Tarea 0: Setup del proyecto (git, deps, scripts, config)

**Files:**
- Inicializar git en la raíz
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Create: `tsconfig.server.json`
- Create: `vitest.config.ts`
- Create: `.env.example`

- [ ] **Step 1: Inicializar git**

Run:
```bash
git init
```
Expected: "Initialized empty Git repository".

- [ ] **Step 2: Instalar dependencias**

Run:
```bash
npm install express dotenv
npm install -D tsx concurrently cross-env vitest supertest @types/express @types/supertest
```
Expected: termina sin errores; `package.json` lista las nuevas deps.

- [ ] **Step 3: Actualizar scripts en `package.json`**

Reemplaza el bloque `"scripts"` por:
```json
  "scripts": {
    "dev": "concurrently -k -n web,api -c blue,green \"npm:dev:web\" \"npm:dev:api\"",
    "dev:web": "vite",
    "dev:api": "tsx watch server/index.ts",
    "build": "tsc -b && vite build",
    "start": "cross-env NODE_ENV=production tsx server/index.ts",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 4: Añadir proxy en `vite.config.ts`**

Reemplaza el contenido por:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 5: Crear `tsconfig.server.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["server/**/*.ts", "shared/**/*.ts"]
}
```

- [ ] **Step 6: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
```

- [ ] **Step 7: Crear `.env.example`**

```
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ORG_ID=713448415
ZOHO_DEPARTMENT_ID=495552000000006907
ZOHO_ACCOUNTS_DOMAIN=accounts.zoho.com
ZOHO_API_DOMAIN=desk.zoho.com
ENABLE_WRITES=false
PORT=3001
```

- [ ] **Step 8: Asegurar `.env` en `.gitignore`**

Verifica que `.gitignore` contenga estas líneas; añádelas si faltan:
```
.env
.env.local
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: project setup for live Zoho Desk backend (deps, scripts, config)"
```

---

## Tarea 1: Tipos compartidos

**Files:**
- Create: `shared/types.ts`

- [ ] **Step 1: Crear `shared/types.ts`**

```ts
/** Shape consumido por el frontend (tarjeta y tablero). */
export interface Ticket {
  id: string
  number: string        // "#864"
  title: string
  company: string
  time: string          // texto ya formateado para mostrar
  status: string        // status crudo de Zoho, p.ej. "Notificación cliente"
  assignee?: {
    name: string
    avatar?: string
    initials?: string
    type?: string
  }
  urgent?: boolean
  messages?: number
  description?: string
}

/** Un mensaje del hilo de conversación en el detalle. */
export interface Message {
  id: string
  author: string
  type: 'Público' | 'Privado'
  time: string
  content: string
  attachment?: { name: string; size: string }
}

/** Definición de una columna del tablero Kanban. */
export interface Column {
  id: string
  label: string
  statuses: string[]    // status de Zoho que caen en esta columna
}

/** Subconjunto del ticket crudo de Zoho que usamos. */
export interface ZohoTicketRaw {
  id: string
  ticketNumber: string
  subject: string
  status: string
  statusType: string    // "Open" | "Closed" | "On Hold"
  priority?: string | null
  createdTime: string
  commentCount?: string
  threadCount?: string
  contact?: {
    firstName?: string | null
    lastName?: string | null
    accountName?: string | null
    email?: string | null
    phone?: string | null
  } | null
  assignee?: {
    firstName?: string | null
    lastName?: string | null
    photoURL?: string | null
  } | null
}

/** Subconjunto de un item de /conversations. */
export interface ZohoConversationRaw {
  id: string
  type?: string         // "thread" | "comment"
  content?: string | null
  summary?: string | null
  isPublic?: boolean | string
  visibility?: string   // "public" | "private"
  commenterName?: string | null
  authorName?: string | null
  author?: { name?: string | null } | null
  commentedTime?: string | null
  createdTime?: string | null
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: shared Ticket/Message/Column and Zoho raw types"
```

---

## Tarea 2: Columnas y mapeo de estados (TDD, pura)

**Files:**
- Create: `shared/columns.ts`
- Test: `shared/columns.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`shared/columns.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'

describe('columns', () => {
  it('define 8 columnas en orden', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ingresado', 'comercial', 'proceso', 'notif_cliente',
      'por_facturar', 'entregar_sin_facturar', 'por_entregar', 'espera_repuestos',
    ])
  })

  it('mapea un status conocido a su columna', () => {
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('En Proceso')).toBe('proceso')
    expect(columnForStatus('Por Facturar')).toBe('por_facturar')
  })

  it('devuelve null para estados de cierre o desconocidos', () => {
    expect(columnForStatus('Finalizado')).toBeNull()
    expect(columnForStatus('Cualquier Cosa')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run shared/columns.test.ts`
Expected: FAIL — "Cannot find module './columns'".

- [ ] **Step 3: Implementar `shared/columns.ts`**

```ts
import type { Column } from './types'

export const COLUMNS: Column[] = [
  { id: 'ingresado', label: 'Ingresado', statuses: ['Ingresado'] },
  { id: 'comercial', label: 'Notificación Comercial', statuses: ['Notificación Comercial'] },
  { id: 'proceso', label: 'En Proceso', statuses: ['En Proceso'] },
  { id: 'notif_cliente', label: 'Notificación cliente', statuses: ['Notificación cliente'] },
  { id: 'por_facturar', label: 'Por Facturar', statuses: ['Por Facturar'] },
  { id: 'entregar_sin_facturar', label: 'Por Entregar / Sin facturar', statuses: ['Por Entregar / Sin facturar'] },
  { id: 'por_entregar', label: 'Por Entregar', statuses: ['Por Entregar'] },
  { id: 'espera_repuestos', label: 'En Espera de Repuestos', statuses: ['En Espera de Repuestos'] },
]

const STATUS_TO_COLUMN: Record<string, string> = Object.fromEntries(
  COLUMNS.flatMap((c) => c.statuses.map((s) => [s, c.id])),
)

/** Devuelve el id de columna para un status de Zoho, o null si no aplica al tablero. */
export function columnForStatus(status: string): string | null {
  return STATUS_TO_COLUMN[status] ?? null
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run shared/columns.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Verificar nombres de estado contra datos reales**

Run (consulta tickets activos, no-cerrados):
```bash
echo "Pedir a Claude: getTickets con status de cada columna para confirmar strings exactos"
```
Nota: la mayoría de tickets están "Finalizado". Si algún status real difiere del usado
arriba (acentos, espacios), AÑADE el string real al array `statuses` de su columna y
extiende el test con ese caso. No elimines los existentes.

- [ ] **Step 6: Commit**

```bash
git add shared/columns.ts shared/columns.test.ts
git commit -m "feat: column definitions and status→column mapping"
```

---

## Tarea 3: Normalización de tickets (TDD, pura)

**Files:**
- Create: `server/normalize.ts`
- Test: `server/normalize.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/normalize.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { normalizeTicket, normalizeConversation } from './normalize'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

const raw: ZohoTicketRaw = {
  id: '495552000009514385',
  ticketNumber: '864',
  subject: 'Servicio Técnico AGQ Colombia',
  status: 'Ingresado',
  statusType: 'Open',
  priority: 'High',
  createdTime: '2026-01-25T20:44:00.000Z',
  commentCount: '3',
  threadCount: '1',
  contact: { firstName: 'Mauricio', lastName: 'Tovar', accountName: 'AGQ Colombia S.A.S.' },
  assignee: { firstName: 'David', lastName: 'León', photoURL: 'http://x/a.png' },
}

describe('normalizeTicket', () => {
  it('mapea campos básicos', () => {
    const t = normalizeTicket(raw)
    expect(t.id).toBe('495552000009514385')
    expect(t.number).toBe('#864')
    expect(t.title).toBe('Servicio Técnico AGQ Colombia')
    expect(t.status).toBe('Ingresado')
    expect(t.company).toBe('AGQ Colombia S.A.S.')
  })

  it('compone nombre, iniciales y avatar del asignado', () => {
    const t = normalizeTicket(raw)
    expect(t.assignee?.name).toBe('David León')
    expect(t.assignee?.initials).toBe('DL')
    expect(t.assignee?.avatar).toBe('http://x/a.png')
  })

  it('marca urgente por prioridad alta y cuenta mensajes', () => {
    const t = normalizeTicket(raw)
    expect(t.urgent).toBe(true)
    expect(t.messages).toBe(3)
  })

  it('usa "Sin asignar" cuando no hay assignee', () => {
    const t = normalizeTicket({ ...raw, assignee: null })
    expect(t.assignee?.name).toBe('Sin asignar')
    expect(t.assignee?.initials).toBe('SA')
  })
})

describe('normalizeConversation', () => {
  it('mapea un comentario privado', () => {
    const c: ZohoConversationRaw = {
      id: '1', type: 'comment', content: 'Crédito',
      visibility: 'private', commenterName: 'Alfonso Garcia',
      commentedTime: '2026-06-01T13:57:00.000Z',
    }
    const m = normalizeConversation(c)
    expect(m.author).toBe('Alfonso Garcia')
    expect(m.type).toBe('Privado')
    expect(m.content).toBe('Crédito')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run server/normalize.test.ts`
Expected: FAIL — "Cannot find module './normalize'".

- [ ] **Step 3: Implementar `server/normalize.ts`**

```ts
import type { Ticket, Message, ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

function fullName(p?: { firstName?: string | null; lastName?: string | null } | null): string {
  if (!p) return ''
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim()
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function normalizeTicket(raw: ZohoTicketRaw): Ticket {
  const assigneeName = fullName(raw.assignee) || 'Sin asignar'
  const company = raw.contact?.accountName || fullName(raw.contact) || ''
  return {
    id: raw.id,
    number: `#${raw.ticketNumber}`,
    title: raw.subject,
    company,
    time: formatTime(raw.createdTime),
    status: raw.status,
    assignee: {
      name: assigneeName,
      avatar: raw.assignee?.photoURL ?? undefined,
      initials: initialsOf(assigneeName),
    },
    urgent: raw.priority === 'High' || raw.priority === 'Urgent',
    messages: raw.commentCount ? Number(raw.commentCount) : undefined,
  }
}

export function normalizeConversation(raw: ZohoConversationRaw): Message {
  const author =
    raw.commenterName || raw.authorName || raw.author?.name || 'Desconocido'
  const isPublic =
    raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  const time = formatTime(raw.commentedTime || raw.createdTime || '')
  return {
    id: raw.id,
    author,
    type: isPublic ? 'Público' : 'Privado',
    time,
    content: (raw.content || raw.summary || '').toString(),
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/normalize.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add server/normalize.ts server/normalize.test.ts
git commit -m "feat: normalize Zoho tickets and conversations to UI shape"
```

---

## Tarea 4: Config del backend (TDD)

**Files:**
- Create: `server/config.ts`
- Test: `server/config.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { loadConfig } from './config'

const base = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref',
  ZOHO_ORG_ID: '713448415', ZOHO_DEPARTMENT_ID: '495552000000006907',
}

describe('loadConfig', () => {
  it('aplica defaults de dominios y flags', () => {
    const c = loadConfig(base)
    expect(c.accountsDomain).toBe('accounts.zoho.com')
    expect(c.apiDomain).toBe('desk.zoho.com')
    expect(c.enableWrites).toBe(false)
    expect(c.port).toBe(3001)
  })

  it('respeta ENABLE_WRITES=true', () => {
    expect(loadConfig({ ...base, ENABLE_WRITES: 'true' }).enableWrites).toBe(true)
  })

  it('lanza si falta un secreto', () => {
    expect(() => loadConfig({ ...base, ZOHO_CLIENT_ID: undefined })).toThrow(/ZOHO_CLIENT_ID/)
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
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run server/config.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/config.ts server/config.test.ts
git commit -m "feat: backend config loader with validation and defaults"
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
    t = 200_000 // ms: pasaron 200s > 100s
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
    // margen de 60s para evitar usar un token a punto de expirar
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

## Tarea 7: App Express y endpoint de tickets (TDD con supertest)

**Files:**
- Create: `server/app.ts`
- Test: `server/app.test.ts`

- [ ] **Step 1: Escribir el test que falla**

`server/app.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createApp } from './app'
import type { AppConfig } from './config'

const config = { enableWrites: false } as AppConfig

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status })
}

describe('GET /api/tickets', () => {
  it('devuelve tickets normalizados', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(jsonResponse({
      data: [{
        id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado',
        statusType: 'Open', priority: 'High', createdTime: '2026-01-25T20:44:00.000Z',
        commentCount: '2', contact: { accountName: 'AGQ' },
        assignee: { firstName: 'David', lastName: 'León' },
      }],
    }))
    const app = createApp({ zohoFetch, config })
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })
})

describe('escrituras bloqueadas', () => {
  it('PATCH status devuelve 403 si enableWrites=false', async () => {
    const zohoFetch = vi.fn()
    const app = createApp({ zohoFetch, config })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('PATCH status pasa a Zoho si enableWrites=true', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(jsonResponse({ id: '1', status: 'En Proceso', ticketNumber: '864', subject: 'x', statusType: 'Open', createdTime: '2026-01-25T20:44:00.000Z' }))
    const app = createApp({ zohoFetch, config: { enableWrites: true } as AppConfig })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(200)
    expect(zohoFetch).toHaveBeenCalledWith('/tickets/1', expect.objectContaining({ method: 'PATCH' }))
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
import { normalizeTicket, normalizeConversation } from './normalize'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>
  config: AppConfig
}

export function createApp({ zohoFetch, config }: Deps): Express {
  const app = express()
  app.use(express.json())

  const guardWrites = (req: Request, res: Response, next: () => void) => {
    if (!config.enableWrites) {
      res.status(403).json({ error: 'Escrituras deshabilitadas (ENABLE_WRITES=false)' })
      return
    }
    next()
  }

  async function readJson(res: globalThis.Response): Promise<any> {
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  }

  // Listado del tablero
  app.get('/api/tickets', async (_req, res) => {
    try {
      const params = new URLSearchParams({
        departmentId: config.departmentId,
        include: 'contacts,assignee',
        limit: '100',
        sortBy: 'createdTime',
      })
      const zres = await zohoFetch(`/tickets?${params.toString()}`)
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      const body = await readJson(zres)
      const tickets = (body.data ?? []).map((t: ZohoTicketRaw) => normalizeTicket(t))
      res.json(tickets)
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  // Detalle
  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const zres = await zohoFetch(`/tickets/${req.params.id}?include=contacts,assignee`)
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      res.json(normalizeTicket((await readJson(zres)) as ZohoTicketRaw))
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  // Conversaciones
  app.get('/api/tickets/:id/conversations', async (req, res) => {
    try {
      const zres = await zohoFetch(`/tickets/${req.params.id}/conversations`)
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      const body = await readJson(zres)
      const messages = (body.data ?? []).map((c: ZohoConversationRaw) => normalizeConversation(c))
      res.json(messages)
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  // Cambiar estado (escritura)
  app.patch('/api/tickets/:id/status', guardWrites, async (req, res) => {
    try {
      const zres = await zohoFetch(`/tickets/${req.params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: req.body.status }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      res.json(normalizeTicket((await readJson(zres)) as ZohoTicketRaw))
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  // Responder (escritura)
  app.post('/api/tickets/:id/reply', guardWrites, async (req, res) => {
    try {
      const addrRes = await zohoFetch(`/tickets/${req.params.id}/sendReplyMailIDs`)
      const addrBody = addrRes.ok ? await readJson(addrRes) : { data: [] }
      const fromEmailAddress = addrBody.data?.[0]?.email ?? addrBody.data?.[0]?.value
      const zres = await zohoFetch(`/tickets/${req.params.id}/sendReply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          contentType: 'plainText',
          content: req.body.content,
          fromEmailAddress,
          to: req.body.to,
        }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      res.json(await readJson(zres))
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
git commit -m "feat: Express API for tickets, detail, conversations, write guards"
```

---

## Tarea 8: Arranque del servidor (`index.ts`)

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: Implementar `server/index.ts`**

```ts
import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createApp } from './app'

const config = loadConfig()
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })

const app = createApp({ zohoFetch, config })

// En producción, servir el frontend compilado.
// Nota: usamos un middleware de fallback (no `app.get('*')`) para ser
// compatibles con Express 5 (path-to-regexp v8 rechaza el comodín '*').
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(process.cwd(), 'dist')
  app.use(express.static(dist))
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(config.port, () => {
  console.log(`API Zoho Desk escuchando en http://localhost:${config.port} (writes=${config.enableWrites})`)
})
```

- [ ] **Step 2: Verificación manual del backend**

Crea `.env` (copia de `.env.example`) y rellena `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`,
`ZOHO_REFRESH_TOKEN` con tus credenciales reales. Luego:

Run: `npm run dev:api`
Expected: imprime "API Zoho Desk escuchando ... (writes=false)".

En otra terminal:
Run: `curl http://localhost:3001/api/tickets`
Expected: JSON array de tickets reales (objetos con `number`, `title`, `status`, `company`).
Si devuelve error de auth, revisa que el refresh token y el DC (`ZOHO_ACCOUNTS_DOMAIN`)
sean correctos.

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: server entrypoint wiring config, token, client, static dist in prod"
```

---

## Tarea 9: Capa de API del frontend (TDD)

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

## Tarea 10: Agrupar tickets por columna (TDD, pura) + hook useAsync

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
    // "Finalizado" no aparece en ninguna columna
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

## Tarea 11: Conservar tipos/fixture en `mockData.ts`

**Files:**
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Reemplazar las definiciones de tipo por re-exports**

Al inicio de `src/data/mockData.ts`, sustituye el bloque `export interface Ticket { ... }`
(líneas 1-17) por:
```ts
export type { Ticket } from '../../shared/types'
```
Mantén intacto el array `export const TICKETS: Ticket[] = [ ... ]` (ahora es fixture de tests).
Puedes eliminar `NAVIGATION_ITEMS`, `VIEWS` y `TABS` SOLO si no se usan; verifica antes:

Run: `npx grep -rn "TABS\|VIEWS\|NAVIGATION_ITEMS" src` (o usa la búsqueda del editor)
Expected: `VIEWS` se usa en `Sidebar.tsx` → consérvalo. `TABS` se reemplaza por `COLUMNS`
en la Tarea 12 → puedes dejarlo por ahora y quitarlo cuando `App.tsx` ya no lo importe.

- [ ] **Step 2: Verificar que el frontend sigue compilando**

Run: `npx tsc -b`
Expected: sin errores de tipos por el re-export.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockData.ts
git commit -m "refactor: source Ticket type from shared/, keep TICKETS as fixture"
```

---

## Tarea 12: Conectar el tablero (`App.tsx`) a la API

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Reescribir `App.tsx` para usar datos reales**

Reemplaza el contenido de `src/App.tsx` por:
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
          {/* Sub-Header / Breadcrumb */}
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

          {/* Kanban Board */}
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
                    {loading && (
                      <div className="h-20 rounded-lg bg-slate-200/60 animate-pulse" />
                    )}
                    {!loading && colTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      />
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
Nota: `TicketDetailView` ahora recibe `ticketId`; su firma se actualiza en la Tarea 13.
Hasta entonces `tsc` marcará error en esa prop — es esperado y se resuelve en la siguiente tarea.

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire Kanban board to live tickets with dynamic counts and states"
```

---

## Tarea 13: Conectar el detalle (`TicketDetailView.tsx`) a datos reales

**Files:**
- Modify: `src/components/TicketDetailView.tsx`

- [ ] **Step 1: Cambiar la firma y cargar datos reales**

Reemplaza la cabecera del componente (líneas 1-7) por:
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

- [ ] **Step 2: Sustituir el contenido hardcodeado por datos reales**

Dentro del JSX, reemplaza los textos fijos por los del ticket cargado:
- El título grande (línea ~162 del original) por `{ticket?.title ?? (loading ? 'Cargando…' : '')}`.
- `#825` (línea ~165) por `{ticket?.number}`.
- El nombre/fecha del autor por `{ticket?.assignee?.name}` y `{ticket?.time}`.
- El bloque de mensajes hardcodeado (el array literal de `.map`, líneas ~207-243 del
  original) por el render de `messages`:
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

- [ ] **Step 3: Añadir controles de acción (responder / cambiar estado)**

Antes del cierre del componente (justo antes del botón "Need Help"), añade:
```tsx
{/* Barra de acciones */}
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
Nota sobre escrituras: con `ENABLE_WRITES=false`, el backend responde 403 y el `catch`
muestra el alert. Es el comportamiento esperado hasta activar el flag.

- [ ] **Step 4: Verificar compilación**

Run: `npx tsc -b`
Expected: sin errores (la prop `ticketId` ya coincide con `App.tsx`).

- [ ] **Step 5: Commit**

```bash
git add src/components/TicketDetailView.tsx
git commit -m "feat: load real ticket detail + conversations, add reply/status actions"
```

---

## Tarea 14: Verificación end-to-end y suite completa

**Files:** ninguno nuevo

- [ ] **Step 1: Ejecutar toda la suite de tests**

Run: `npm test`
Expected: PASS en todos los archivos (`shared/`, `server/`, `src/`).

- [ ] **Step 2: Lint y typecheck**

Run: `npm run lint && npx tsc -b`
Expected: sin errores.

- [ ] **Step 3: Verificación manual completa (lectura)**

Asegúrate de tener `.env` con credenciales reales.
Run: `npm run dev`
Expected: Vite en 5173, API en 3001. Abre `http://localhost:5173`:
- Las columnas muestran tickets reales con counts dinámicos (la mayoría caerán fuera del
  tablero por estar "Finalizado"; eso es correcto).
- Clic en una tarjeta abre el detalle con título/número reales y las conversaciones del ticket.
- El botón refresh recarga.

- [ ] **Step 4: Verificación manual de escrituras (opcional, con cuidado)**

SOLO cuando quieras probar escrituras: pon `ENABLE_WRITES=true` en `.env`, reinicia
`npm run dev`, elige un ticket de prueba y confirma un cambio de estado. Verifica en
Zoho Desk que el cambio se reflejó. Vuelve a `ENABLE_WRITES=false` tras la prueba.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: full suite green; live Zoho Desk board verified"
```

---

## Notas de cierre

- **Mapeo de estados:** si en producción ves tickets activos cuyo `status` no cae en
  ninguna columna, añade ese string exacto al array `statuses` de la columna adecuada en
  `shared/columns.ts` y extiende `shared/columns.test.ts`.
- **DC / dominio:** si la API de tu portal no es `desk.zoho.com`/`accounts.zoho.com`,
  ajusta `ZOHO_API_DOMAIN`/`ZOHO_ACCOUNTS_DOMAIN` en `.env`.
- **Endpoint de reply:** la ruta exacta de direcciones de remitente puede variar según
  la versión de la API de Zoho Desk (`sendReplyMailIDs` vs `replyAddress`); si el reply
  falla por falta de `fromEmailAddress`, ajusta `server/app.ts` según la respuesta real.
