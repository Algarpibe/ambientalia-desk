# Subsistema A — Modelo de datos propio (Postgres fuente de verdad) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Postgres de réplica raw-jsonb a **sistema de registro tipado** (esquema híbrido), con sync que parsea Zoho→tipado respetando `managed_by_app`, y lectura desde columnas tipadas.

**Architecture:** Esquema híbrido: columnas tipadas para flujo/reportables + `custom_fields jsonb` + `raw jsonb` (referencia hasta el corte). Entidades: accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions. Mappers puros Zoho→fila y fila→UI (TDD); repos con `pg-mem`; el sync parsea a entidades y omite los `managed_by_app`. La lectura reconstruye el `customFields` que la UI ya espera (columna→etiqueta) para no tocar el frontend.

**Tech Stack:** TypeScript, Express, pg, pg-mem, Vitest. ESM. Spec: `docs/superpowers/specs/2026-06-04-subsistema-a-modelo-datos-design.md`.

**Contexto:** repo en `main`. Hoy el esquema es `tickets(raw jsonb…)` + `conversations(raw jsonb…)`; los reads usan `normalize(raw)`. Este plan **reemplaza** esa capa. No hay tickets gestionados por la app aún → es seguro recrear el esquema y re-poblar desde Zoho.

**Nota de coherencia:** el endpoint `POST /tickets/:id/transition` (escribe en Zoho, transitorio hasta el subsistema B) y `/reply`, `/api/attachment` se mantienen; este plan sólo ajusta sus lecturas a los nuevos mappers.

---

## Estructura de archivos

- Modify `shared/types.ts` — `Account`, `Contact`, `Agent`; enriquecer `Ticket`/`TicketDetail`.
- Create `server/db/rows.ts` — tipos de fila DB (`TicketRow`, `AccountRow`, `ContactRow`, `AgentRow`, `ConversationRow`, `AttachmentRow`) + mapa columna↔etiqueta.
- Modify `server/db/schema.sql` — esquema híbrido + secuencia.
- Modify `server/db/migrate.ts` — aplicar (split `;`) + `reseedTicketNumber`.
- Rewrite `server/db/mappers.ts` — `zoho*ToRow` y `rowTo*`.
- Rewrite `server/db/repo.ts` — upserts/queries por entidad + numeración.
- Modify `server/sync.ts` — parsear a entidades; omitir `managed_by_app`.
- Modify `server/app.ts` — endpoints de lectura usan repo/mappers nuevos.
- Delete `server/normalize.ts` + `server/normalize.test.ts` — su lógica pasa a mappers.

---

## Task 1: Tipos compartidos y de fila

**Files:**
- Modify: `shared/types.ts`
- Create: `server/db/rows.ts`

- [ ] **Step 1: Añadir tipos de dominio en `shared/types.ts`**

Añade al final de `shared/types.ts`:
```ts
export interface Account {
  id: string
  name: string
  nit?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
}

export interface Contact {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  accountId?: string | null
}

export interface Agent {
  id: string
  name: string
  email?: string | null
}
```
Modifica `TicketDetail` (ya existe) para añadir los campos promovidos típicos (no rompe nada; son opcionales):
```ts
export interface TicketDetail extends Ticket {
  contactName?: string
  email?: string
  phone?: string
  ownerName?: string
  onholdSince?: string
  classification?: string
  priority?: string
  channel?: string
  customFields: Record<string, string | null>
}
```
(Si ya tenía esa forma, déjala igual — el `customFields` se reconstruye en el mapper.)

- [ ] **Step 2: Crear `server/db/rows.ts`**

```ts
// Tipos de fila de Postgres (esquema híbrido) + mapa columna↔etiqueta de Zoho.

export interface AccountRow {
  id: string; name: string; nit: string | null; email: string | null
  phone: string | null; website: string | null; city: string | null
  address: string | null; industry: string | null
  source: string; managed_by_app: boolean; raw: unknown
}

export interface ContactRow {
  id: string; first_name: string | null; last_name: string | null
  email: string | null; phone: string | null; mobile: string | null
  account_id: string | null; source: string; managed_by_app: boolean; raw: unknown
}

export interface AgentRow {
  id: string; name: string | null; email: string | null; role: string | null
  source: string; raw: unknown
}

export interface TicketRow {
  id: string; number: number; subject: string | null; status: string
  status_type: string | null; priority: string | null; classification: string | null
  channel: string | null; description: string | null
  contact_id: string | null; account_id: string | null; assignee_id: string | null
  created_time: string | null; modified_time: string | null; closed_time: string | null
  onhold_time: string | null; due_date: string | null
  codigo_servicio: string | null; tipo_servicio: string | null; equipo: string | null
  marca: string | null; modelo: string | null; serial: string | null; codigo_interno: string | null
  encargado: string | null; correo_encargado: string | null; nit: string | null; ciudad: string | null
  direccion: string | null; telefono: string | null; orden_venta: string | null; conformidad: string | null
  dias_entrega: number | null; cumple_condiciones_comerciales: boolean | null
  fecha_creacion_ticket: string | null; fecha_remision_entrada: string | null
  fecha_revision_informe: string | null; fecha_cotizacion: string | null
  fecha_orden_compra: string | null; fecha_orden_venta: string | null
  fecha_recepcion_repuestos: string | null; fecha_finalizacion_st: string | null
  fecha_factura: string | null; fecha_remision_salida: string | null
  fecha_salida_servicio_externo: string | null; fecha_entrada_servicio_externo: string | null
  fecha_notificacion_garantia: string | null; fecha_solicitud_sku: string | null
  fecha_orden_compra_final: string | null; fecha_orden_venta_final: string | null
  equipo_partes_listas: boolean | null; archivo_trazabilidad_actualizado: boolean | null
  doc_almacenada_drive: boolean | null; hv_actualizada: boolean | null
  liberacion_sin_facturar: boolean | null; servicio_in_situ: boolean | null
  custom_fields: Record<string, string | null>; managed_by_app: boolean; source: string; raw: unknown
}

export interface ConversationRow {
  id: string; ticket_id: string; kind: string; author_name: string | null
  author_type: string | null; is_public: boolean | null; content: string | null
  content_type: string | null; commented_time: string | null; source: string; raw: unknown
}

export interface AttachmentRow {
  id: string; conversation_id: string | null; ticket_id: string
  name: string | null; size: number | null; content_type: string | null
  zoho_href: string | null; storage_path: string | null; raw: unknown
}

/** Columna tipada ↔ etiqueta de customField de Zoho (para parseo y para reconstruir la UI). */
export const PROMOTED_COLUMNS: Array<{ col: keyof TicketRow; label: string; kind: 'text' | 'date' | 'bool' | 'int' }> = [
  { col: 'codigo_servicio', label: 'Código Servicio', kind: 'text' },
  { col: 'tipo_servicio', label: 'Tipo de Servicio', kind: 'text' },
  { col: 'equipo', label: 'Equipo', kind: 'text' },
  { col: 'marca', label: 'Marca', kind: 'text' },
  { col: 'modelo', label: 'Modelo de equipo', kind: 'text' },
  { col: 'serial', label: 'Serial', kind: 'text' },
  { col: 'codigo_interno', label: 'Código Interno', kind: 'text' },
  { col: 'encargado', label: 'Encargado', kind: 'text' },
  { col: 'correo_encargado', label: 'Correo Encargado', kind: 'text' },
  { col: 'nit', label: 'NIT.', kind: 'text' },
  { col: 'ciudad', label: 'Ciudad', kind: 'text' },
  { col: 'direccion', label: 'Dirección', kind: 'text' },
  { col: 'telefono', label: 'Número de teléfono', kind: 'text' },
  { col: 'orden_venta', label: 'Orden de Venta', kind: 'text' },
  { col: 'conformidad', label: 'Conformidad', kind: 'text' },
  { col: 'dias_entrega', label: 'Días de entrega', kind: 'int' },
  { col: 'cumple_condiciones_comerciales', label: 'Cumple condiciones comerciales', kind: 'bool' },
  { col: 'fecha_creacion_ticket', label: 'Fecha creación ticket', kind: 'date' },
  { col: 'fecha_remision_entrada', label: 'Fecha Remisión Entrada', kind: 'date' },
  { col: 'fecha_revision_informe', label: 'Fecha Revisión Informe', kind: 'date' },
  { col: 'fecha_cotizacion', label: 'Fecha de Cotización', kind: 'date' },
  { col: 'fecha_orden_compra', label: 'Fecha Orden de Compra', kind: 'date' },
  { col: 'fecha_orden_venta', label: 'Fecha Orden De Venta', kind: 'date' },
  { col: 'fecha_recepcion_repuestos', label: 'Fecha Recepción de repuestos', kind: 'date' },
  { col: 'fecha_finalizacion_st', label: 'Fecha Finalización ST', kind: 'date' },
  { col: 'fecha_factura', label: 'Fecha De Factura', kind: 'date' },
  { col: 'fecha_remision_salida', label: 'Fecha Remisión de Salida', kind: 'date' },
  { col: 'fecha_salida_servicio_externo', label: 'Fecha Salida Servicio externo', kind: 'date' },
  { col: 'fecha_entrada_servicio_externo', label: 'Fecha Entrada de servicio externo', kind: 'date' },
  { col: 'fecha_notificacion_garantia', label: 'Fecha Notificación por garantía', kind: 'date' },
  { col: 'fecha_solicitud_sku', label: 'Fecha solicitud SKU', kind: 'date' },
  { col: 'fecha_orden_compra_final', label: 'Fecha Orden de Compra Final', kind: 'date' },
  { col: 'fecha_orden_venta_final', label: 'Fecha Orden de Venta Final', kind: 'date' },
  { col: 'equipo_partes_listas', label: 'Equipo y/o partes listas para entrega al cliente?', kind: 'bool' },
  { col: 'archivo_trazabilidad_actualizado', label: 'Archivo de trazabilidad Actualizado?', kind: 'bool' },
  { col: 'doc_almacenada_drive', label: 'Documentacion Almacenada en el Drive?', kind: 'bool' },
  { col: 'hv_actualizada', label: 'H. V Actualizada?', kind: 'bool' },
  { col: 'liberacion_sin_facturar', label: 'Liberación del ticket sin facturar', kind: 'bool' },
  { col: 'servicio_in_situ', label: 'Servicio ejecutado in Situ!', kind: 'bool' },
]
```

- [ ] **Step 3: Verificar typecheck y commit**

Run: `npx tsc -b`
Expected: sin errores.
```bash
git add shared/types.ts server/db/rows.ts
git commit -m "feat(A): shared domain types + DB row types + promoted-column map"
```

---

## Task 2: Esquema híbrido (`schema.sql`)

**Files:**
- Modify: `server/db/schema.sql`

- [ ] **Step 1: Reemplazar `server/db/schema.sql` por el esquema híbrido completo**

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY, name text NOT NULL, nit text, email text, phone text,
  website text, city text, address text, industry text,
  source text NOT NULL DEFAULT 'zoho', managed_by_app boolean NOT NULL DEFAULT false,
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS contacts (
  id text PRIMARY KEY, first_name text, last_name text, email text, phone text, mobile text,
  account_id text, source text NOT NULL DEFAULT 'zoho', managed_by_app boolean NOT NULL DEFAULT false,
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS agents (
  id text PRIMARY KEY, name text, email text, role text,
  source text NOT NULL DEFAULT 'zoho', raw jsonb,
  synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  number integer UNIQUE NOT NULL,
  subject text, status text NOT NULL, status_type text, priority text, classification text,
  channel text, description text,
  contact_id text, account_id text, assignee_id text,
  created_time timestamptz, modified_time timestamptz, closed_time timestamptz,
  onhold_time timestamptz, due_date timestamptz,
  codigo_servicio text, tipo_servicio text, equipo text, marca text, modelo text, serial text,
  codigo_interno text, encargado text, correo_encargado text, nit text, ciudad text, direccion text,
  telefono text, orden_venta text, conformidad text, dias_entrega integer,
  cumple_condiciones_comerciales boolean,
  fecha_creacion_ticket date, fecha_remision_entrada date, fecha_revision_informe date,
  fecha_cotizacion date, fecha_orden_compra date, fecha_orden_venta date,
  fecha_recepcion_repuestos date, fecha_finalizacion_st date, fecha_factura date,
  fecha_remision_salida date, fecha_salida_servicio_externo date, fecha_entrada_servicio_externo date,
  fecha_notificacion_garantia date, fecha_solicitud_sku date, fecha_orden_compra_final date,
  fecha_orden_venta_final date,
  equipo_partes_listas boolean, archivo_trazabilidad_actualizado boolean, doc_almacenada_drive boolean,
  hv_actualizada boolean, liberacion_sin_facturar boolean, servicio_in_situ boolean,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  managed_by_app boolean NOT NULL DEFAULT false, source text NOT NULL DEFAULT 'zoho',
  raw jsonb, synced_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY, ticket_id text NOT NULL, kind text, author_name text, author_type text,
  is_public boolean, content text, content_type text, commented_time timestamptz,
  source text NOT NULL DEFAULT 'zoho', raw jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id text PRIMARY KEY, conversation_id text, ticket_id text NOT NULL,
  name text, size bigint, content_type text, zoho_href text, storage_path text,
  raw jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_transitions (
  id bigserial PRIMARY KEY, ticket_id text NOT NULL, transition_id text, transition_name text,
  from_status text, to_status text, area text, performed_by text, values jsonb,
  comment_id text, performed_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE INDEX IF NOT EXISTS idx_tickets_status_type ON tickets (status_type);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_account ON tickets (account_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets (contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_modified ON tickets (modified_time);
CREATE INDEX IF NOT EXISTS idx_conversations_ticket ON conversations (ticket_id);
CREATE INDEX IF NOT EXISTS idx_transitions_ticket ON ticket_transitions (ticket_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts (account_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments (ticket_id);
```

- [ ] **Step 2: Commit**
```bash
git add server/db/schema.sql
git commit -m "feat(A): hybrid Postgres schema (typed columns + jsonb) + ticket_number_seq"
```

---

## Task 3: Migración — aplicar schema + re-sembrar secuencia (TDD)

**Files:**
- Modify: `server/db/migrate.ts`
- Test: `server/db/migrate.test.ts`

- [ ] **Step 1: Reescribir el test `server/db/migrate.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, reseedTicketNumber, type Queryable } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  return db
}

describe('migrate', () => {
  it('crea las tablas del esquema híbrido', async () => {
    const db = await freshDb()
    const res = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    )
    const names = res.rows.map((r: { table_name: string }) => r.table_name)
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions']) {
      expect(names).toContain(t)
    }
  })

  it('reseedTicketNumber deja la secuencia en el máximo number', async () => {
    const db = await freshDb()
    await db.query(
      "INSERT INTO tickets (id, number, status) VALUES ('a', 953, 'Ingresado')",
    )
    await reseedTicketNumber(db)
    const res = await db.query("SELECT nextval('ticket_number_seq') AS n")
    expect(Number(res.rows[0].n)).toBe(954)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: FAIL (`reseedTicketNumber` no existe / split de sentencias).

- [ ] **Step 3: Reescribir `server/db/migrate.ts`**

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

/** Aplica el esquema (idempotente). Divide por `;` para compatibilidad con pg-mem. */
export async function migrate(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) await db.query(stmt)
}

/** Re-siembra la secuencia de numeración al máximo `number` existente. */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  await db.query("SELECT setval('ticket_number_seq', (SELECT COALESCE(MAX(number),0) FROM tickets))")
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS (2 tests).
Nota: si `pg-mem` no soporta `CREATE SEQUENCE`/`setval`/`nextval`, implementa la numeración con una
**tabla contador** en su lugar: `CREATE TABLE IF NOT EXISTS ticket_counter (value integer NOT NULL)`;
`reseedTicketNumber` hace `UPSERT value = MAX(number)`; `nextTicketNumber` (Task 8) hace
`UPDATE ticket_counter SET value = value + 1 RETURNING value`. Ajusta los tests a esa variante.
Aplica solo si la secuencia falla en pg-mem.

- [ ] **Step 5: Commit**
```bash
git add server/db/migrate.ts server/db/migrate.test.ts
git commit -m "feat(A): migrate applies hybrid schema (split statements) + reseedTicketNumber"
```

---

## Task 4: Mappers Zoho→fila de ticket (TDD, puro)

**Files:**
- Rewrite: `server/db/mappers.ts`
- Test: `server/db/mappers.test.ts`

- [ ] **Step 1: Escribir el test `server/db/mappers.test.ts`** (parte ticket)

```ts
import { describe, it, expect } from 'vitest'
import { ticketRowFromZoho } from './mappers'

const raw = {
  id: '1', ticketNumber: '941', subject: 'Servicio X', status: 'Notificación cliente',
  statusType: 'On Hold', priority: 'High', classification: 'Equipo Para Servicio', channel: 'Email',
  createdTime: '2026-05-07T19:39:36.000Z', modifiedTime: '2026-05-29T17:43:58.000Z',
  onholdTime: '2026-05-28T20:40:59.000Z', contactId: 'c1', accountId: 'a1', assigneeId: 'g1',
  email: 'x@y.com',
  customFields: {
    'Serial': '18A22053', 'Ciudad': 'Barranquilla', 'NIT.': '900082143',
    'Días de entrega': '20', 'Cumple condiciones comerciales': 'true',
    'Fecha de Cotización': '2026-05-19', 'Servicio ejecutado in Situ!': 'false',
    'Campo Raro Que No Existe': 'algo',
  },
}

describe('ticketRowFromZoho', () => {
  it('mapea identidad, relaciones y promueve columnas', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.id).toBe('1')
    expect(row.number).toBe(941)
    expect(row.status).toBe('Notificación cliente')
    expect(row.contact_id).toBe('c1')
    expect(row.account_id).toBe('a1')
    expect(row.assignee_id).toBe('g1')
    expect(row.serial).toBe('18A22053')
    expect(row.ciudad).toBe('Barranquilla')
    expect(row.nit).toBe('900082143')
    expect(row.dias_entrega).toBe(20)
    expect(row.cumple_condiciones_comerciales).toBe(true)
    expect(row.servicio_in_situ).toBe(false)
    expect(row.fecha_cotizacion).toBe('2026-05-19')
  })

  it('los campos no promovidos van a custom_fields', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.custom_fields['Campo Raro Que No Existe']).toBe('algo')
    expect(row.custom_fields['Serial']).toBeUndefined() // promovido, no duplicado
  })

  it('conserva el raw', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.raw).toEqual(raw)
    expect(row.source).toBe('zoho')
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: FAIL (`ticketRowFromZoho` no existe).

- [ ] **Step 3: Implementar la parte ticket en `server/db/mappers.ts`** (sobrescribe el archivo)

```ts
import { PROMOTED_COLUMNS, type TicketRow, type AccountRow, type ContactRow, type AgentRow, type ConversationRow, type AttachmentRow } from './rows'

function toBool(v: unknown): boolean | null {
  if (v === undefined || v === null || v === '') return null
  return v === true || v === 'true' || v === 'Sí' || v === 'si'
}
function toInt(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v); return Number.isNaN(n) ? null : n
}
function dateOnly(v: unknown): string | null {
  if (!v) return null
  return String(v).slice(0, 10) // "2026-05-19" o ISO → YYYY-MM-DD
}
function str(v: unknown): string | null {
  return v === undefined || v === null ? null : String(v)
}

export function ticketRowFromZoho(raw: any): TicketRow {
  const cf: Record<string, string | null> = { ...(raw.customFields ?? {}) }
  const row: Partial<TicketRow> = {
    id: raw.id, number: Number(raw.ticketNumber), subject: raw.subject ?? null,
    status: raw.status, status_type: raw.statusType ?? null, priority: raw.priority ?? null,
    classification: raw.classification ?? null, channel: raw.channel ?? null,
    description: raw.description ?? null,
    contact_id: raw.contactId ?? null, account_id: raw.accountId ?? null, assignee_id: raw.assigneeId ?? null,
    created_time: raw.createdTime ?? null, modified_time: raw.modifiedTime ?? null,
    closed_time: raw.closedTime ?? null, onhold_time: raw.onholdTime ?? null, due_date: raw.dueDate ?? null,
    custom_fields: {}, managed_by_app: false, source: 'zoho', raw,
  }
  for (const { col, label, kind } of PROMOTED_COLUMNS) {
    const v = (raw.customFields ?? {})[label]
    ;(row as any)[col] = kind === 'bool' ? toBool(v) : kind === 'int' ? toInt(v) : kind === 'date' ? dateOnly(v) : str(v)
    delete cf[label] // no duplicar en custom_fields
  }
  row.custom_fields = cf
  return row as TicketRow
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts server/db/rows.ts
git commit -m "feat(A): ticketRowFromZoho — promote typed columns, rest to custom_fields"
```

---

## Task 5: Mappers Zoho→fila (account/contact/agent/conversation/attachment) (TDD)

**Files:**
- Modify: `server/db/mappers.ts`
- Modify: `server/db/mappers.test.ts`

- [ ] **Step 1: Añadir tests** (al final de `server/db/mappers.test.ts`)

```ts
import { accountRowFromZoho, contactRowFromZoho, agentRowFromZoho, conversationRowFromZoho, attachmentRowsFrom } from './mappers'

describe('account/contact/agent mappers', () => {
  it('accountRowFromZoho', () => {
    const r = accountRowFromZoho({ id: 'a1', accountName: 'Gecelca S.A. E.S.P.', customFields: { NIT: '900082143' }, city: 'Barranquilla', phone: '330300' } as any)
    expect(r.id).toBe('a1'); expect(r.name).toBe('Gecelca S.A. E.S.P.'); expect(r.nit).toBe('900082143'); expect(r.city).toBe('Barranquilla')
  })
  it('contactRowFromZoho', () => {
    const r = contactRowFromZoho({ id: 'c1', firstName: 'Sebastián', lastName: 'Laguna', email: 's@g.co', phone: '301', accountId: 'a1' } as any)
    expect(r.first_name).toBe('Sebastián'); expect(r.account_id).toBe('a1')
  })
  it('agentRowFromZoho', () => {
    const r = agentRowFromZoho({ id: 'g1', firstName: 'Equipo', lastName: 'Técnico', email: 'info@a.co', roleName: 'CEO' } as any)
    expect(r.name).toBe('Equipo Técnico'); expect(r.role).toBe('CEO')
  })
})

describe('conversation/attachment mappers', () => {
  const conv = {
    id: 'k1', type: 'comment', isPublic: false, content: '<div>x</div>', contentType: 'html',
    commentedTime: '2026-05-28T20:40:59.000Z', commenter: { name: 'Equipo Técnico', type: 'AGENT' },
    attachments: [{ id: 'at1', name: 'r.pdf', size: '718521', href: 'https://desk.zoho.com/api/v1/tickets/9/comments/8/attachments/7/content' }],
  }
  it('conversationRowFromZoho', () => {
    const r = conversationRowFromZoho(conv as any, 't1')
    expect(r.ticket_id).toBe('t1'); expect(r.kind).toBe('comment'); expect(r.author_name).toBe('Equipo Técnico')
    expect(r.author_type).toBe('agent'); expect(r.is_public).toBe(false); expect(r.content_type).toBe('html')
  })
  it('attachmentRowsFrom', () => {
    const rows = attachmentRowsFrom(conv as any, 't1')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: 'at1', ticket_id: 't1', conversation_id: 'k1', name: 'r.pdf', size: 718521 })
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: FAIL (mappers no existen).

- [ ] **Step 3: Añadir los mappers en `server/db/mappers.ts`**

```ts
export function accountRowFromZoho(raw: any): AccountRow {
  return {
    id: raw.id, name: raw.accountName ?? '', nit: raw.cf?.cf_nit ?? raw.customFields?.NIT ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, website: raw.website ?? null,
    city: raw.city ?? null, address: raw.street ?? null, industry: raw.industry ?? null,
    source: 'zoho', managed_by_app: false, raw,
  }
}

export function contactRowFromZoho(raw: any): ContactRow {
  return {
    id: raw.id, first_name: raw.firstName ?? null, last_name: raw.lastName ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, mobile: raw.mobile ?? null,
    account_id: raw.accountId ?? null, source: 'zoho', managed_by_app: false, raw,
  }
}

export function agentRowFromZoho(raw: any): AgentRow {
  const name = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || (raw.name ?? null)
  return { id: raw.id, name, email: raw.email ?? null, role: raw.roleName ?? null, source: 'zoho', raw }
}

export function conversationRowFromZoho(raw: any, ticketId: string): ConversationRow {
  const authorName = raw.commenter?.name ?? raw.author?.name ?? null
  const authorType = (raw.commenter?.type ?? raw.author?.type) === 'AGENT' ? 'agent' : raw.commenter || raw.author ? 'end_user' : null
  const isPublic = raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  return {
    id: raw.id, ticket_id: ticketId, kind: raw.type ?? 'comment', author_name: authorName,
    author_type: authorType, is_public: isPublic, content: (raw.content ?? raw.summary ?? null),
    content_type: raw.contentType ?? null, commented_time: raw.commentedTime ?? raw.createdTime ?? null,
    source: 'zoho', raw,
  }
}

function attachmentPath(href?: string | null): string | null {
  if (!href) return null
  try { return new URL(href).pathname.replace(/^\/api\/v1/, '') } catch { return null }
}

export function attachmentRowsFrom(conv: any, ticketId: string): AttachmentRow[] {
  return (conv.attachments ?? []).filter((a: any) => a?.id).map((a: any) => ({
    id: a.id, conversation_id: conv.id ?? null, ticket_id: ticketId, name: a.name ?? null,
    size: a.size ? Number(a.size) : null, content_type: a.contentType ?? null,
    zoho_href: attachmentPath(a.href), storage_path: null, raw: a,
  }))
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(A): zoho→row mappers for account, contact, agent, conversation, attachment"
```

---

## Task 6: Mappers fila→UI (`rowToTicket`/`rowToTicketDetail`/`rowToMessage`) (TDD)

**Files:**
- Modify: `server/db/mappers.ts`
- Modify: `server/db/mappers.test.ts`

- [ ] **Step 1: Añadir tests**

```ts
import { rowToTicket, rowToTicketDetail, rowToMessage } from './mappers'
import type { TicketRow, ConversationRow } from './rows'

function baseTicketRow(): TicketRow {
  return {
    id: '1', number: 941, subject: 'Servicio X', status: 'Notificación cliente', status_type: 'On Hold',
    priority: 'High', classification: 'Equipo Para Servicio', channel: 'Email', description: null,
    contact_id: 'c1', account_id: 'a1', assignee_id: 'g1',
    created_time: '2026-05-07T19:39:36.000Z', modified_time: null, closed_time: null,
    onhold_time: '2026-05-28T20:40:59.000Z', due_date: null,
    codigo_servicio: 'MT_X', tipo_servicio: 'calibración', equipo: 'Monitor', marca: 'GRIMM',
    modelo: 'EDM180C', serial: '18A22053', codigo_interno: 'MP-1', encargado: 'Miguel',
    correo_encargado: 't@a.co', nit: '900082143', ciudad: 'Barranquilla', direccion: 'Cra 55',
    telefono: '330300', orden_venta: 'OV-1', conformidad: 'Conforme', dias_entrega: 20,
    cumple_condiciones_comerciales: true,
    fecha_creacion_ticket: '2026-05-21', fecha_remision_entrada: null, fecha_revision_informe: null,
    fecha_cotizacion: '2026-05-19', fecha_orden_compra: null, fecha_orden_venta: null,
    fecha_recepcion_repuestos: null, fecha_finalizacion_st: null, fecha_factura: null,
    fecha_remision_salida: null, fecha_salida_servicio_externo: null, fecha_entrada_servicio_externo: null,
    fecha_notificacion_garantia: null, fecha_solicitud_sku: null, fecha_orden_compra_final: null,
    fecha_orden_venta_final: null,
    equipo_partes_listas: null, archivo_trazabilidad_actualizado: null, doc_almacenada_drive: null,
    hv_actualizada: null, liberacion_sin_facturar: null, servicio_in_situ: false,
    custom_fields: { 'Otro Campo': 'v' }, managed_by_app: false, source: 'zoho', raw: {},
  }
}

describe('rowToTicket / rowToTicketDetail', () => {
  it('rowToTicket arma la tarjeta', () => {
    const t = rowToTicket(baseTicketRow(), { accountName: 'Gecelca S.A. E.S.P.', agentName: 'Equipo Técnico' })
    expect(t.number).toBe('#941')
    expect(t.title).toBe('Servicio X')
    expect(t.company).toBe('Gecelca S.A. E.S.P.')
    expect(t.status).toBe('Notificación cliente')
    expect(t.assignee?.name).toBe('Equipo Técnico')
  })

  it('rowToTicketDetail reconstruye customFields desde columnas + jsonb', () => {
    const d = rowToTicketDetail(baseTicketRow(), { accountName: 'Gecelca', agentName: 'ET', contactName: 'Sebastián Laguna', contactPhone: '301', email: 's@g.co' })
    expect(d.contactName).toBe('Sebastián Laguna')
    expect(d.customFields['Serial']).toBe('18A22053')
    expect(d.customFields['Fecha de Cotización']).toBe('2026-05-19')
    expect(d.customFields['Cumple condiciones comerciales']).toBe('true')
    expect(d.customFields['Otro Campo']).toBe('v')
  })
})

describe('rowToMessage', () => {
  it('arma el mensaje de UI', () => {
    const row: ConversationRow = {
      id: 'k1', ticket_id: 't1', kind: 'comment', author_name: 'Equipo Técnico', author_type: 'agent',
      is_public: false, content: '<div>x</div>', content_type: 'html', commented_time: '2026-05-28T20:40:59.000Z',
      source: 'zoho', raw: {},
    }
    const m = rowToMessage(row, [])
    expect(m.author).toBe('Equipo Técnico')
    expect(m.type).toBe('Privado')
    expect(m.isHtml).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar los mappers fila→UI en `server/db/mappers.ts`**

```ts
import type { Ticket, TicketDetail, Message, Attachment } from '../../shared/types'

function initialsOf(name: string): string {
  const p = name.split(/\s+/).filter(Boolean)
  if (p.length === 0) return '?'
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function fmtTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}
function fmtSize(n?: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export interface TicketRefs { accountName?: string | null; agentName?: string | null }
export interface DetailRefs extends TicketRefs { contactName?: string | null; contactPhone?: string | null; email?: string | null }

export function rowToTicket(row: TicketRow, refs: TicketRefs = {}): Ticket {
  const assigneeName = refs.agentName || 'Sin asignar'
  return {
    id: row.id, number: `#${row.number}`, title: row.subject ?? '', company: refs.accountName ?? '',
    time: fmtTime(row.created_time), status: row.status,
    assignee: { name: assigneeName, initials: initialsOf(assigneeName) },
    urgent: row.priority === 'High' || row.priority === 'Urgent',
  }
}

/** Reconstruye el objeto customFields (etiqueta→valor) que la UI espera, desde columnas + jsonb. */
function customFieldsFromRow(row: TicketRow): Record<string, string | null> {
  const out: Record<string, string | null> = { ...(row.custom_fields ?? {}) }
  for (const { col, label } of PROMOTED_COLUMNS) {
    const v = (row as any)[col]
    out[label] = v === null || v === undefined ? null : String(v)
  }
  return out
}

export function rowToTicketDetail(row: TicketRow, refs: DetailRefs = {}): TicketDetail {
  return {
    ...rowToTicket(row, refs),
    contactName: refs.contactName ?? undefined,
    email: refs.email ?? undefined,
    phone: refs.contactPhone ?? undefined,
    ownerName: refs.agentName ?? undefined,
    onholdSince: row.onhold_time ? fmtTime(row.onhold_time) : undefined,
    classification: row.classification ?? undefined,
    priority: row.priority ?? undefined,
    channel: row.channel ?? undefined,
    customFields: customFieldsFromRow(row),
  }
}

export function rowToMessage(row: ConversationRow, attachments: AttachmentRow[]): Message {
  const atts: Attachment[] = attachments
    .filter((a) => a.zoho_href)
    .map((a) => ({ name: a.name ?? 'adjunto', size: fmtSize(a.size), path: a.zoho_href! }))
  return {
    id: row.id, author: row.author_name ?? 'Desconocido',
    type: row.is_public ? 'Público' : 'Privado', time: fmtTime(row.commented_time),
    content: row.content ?? '', isHtml: row.content_type === 'html' || row.content_type === 'text/html',
    attachments: atts.length ? atts : undefined,
  }
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/mappers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(A): row→UI mappers; rowToTicketDetail rebuilds customFields for stable frontend"
```

---

## Task 7: Repositorio — upserts + `managed_by_app` (TDD con pg-mem)

**Files:**
- Rewrite: `server/db/repo.ts`
- Test: `server/db/repo.test.ts`

- [ ] **Step 1: Reescribir el test `server/db/repo.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertAccount, upsertContact, upsertAgent, upsertTicket, getTicketRow, countTickets } from './repo'
import { ticketRowFromZoho, accountRowFromZoho } from './mappers'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function zTicket(id: string, number: number, status = 'Ingresado') {
  return ticketRowFromZoho({ id, ticketNumber: String(number), status, statusType: 'Open', customFields: {} } as any)
}

describe('repo upserts', () => {
  it('upsertTicket inserta y actualiza', async () => {
    await upsertTicket(db, zTicket('1', 941))
    await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso') })
    expect(await countTickets(db)).toBe(1)
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso')
  })

  it('upsertTicket NO sobrescribe si managed_by_app=true', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), managed_by_app: true, status: 'En Proceso' })
    await upsertTicket(db, { ...zTicket('1', 941, 'Ingresado') }) // viene del sync
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso') // preservado
    expect(r!.managed_by_app).toBe(true)
  })

  it('upsertAccount inserta', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    const r = await db.query('SELECT name FROM accounts WHERE id=$1', ['a1'])
    expect(r.rows[0].name).toBe('Gecelca')
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: FAIL (funciones no existen / firma cambió).

- [ ] **Step 3: Reescribir `server/db/repo.ts`** (upserts; las queries van en Task 8)

```ts
import type { Queryable } from './migrate'
import type { AccountRow, ContactRow, AgentRow, TicketRow, ConversationRow, AttachmentRow } from './rows'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertAccount(db: Queryable, r: AccountRow): Promise<void> {
  await db.query(
    `INSERT INTO accounts (id,name,nit,email,phone,website,city,address,industry,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,nit=EXCLUDED.nit,email=EXCLUDED.email,phone=EXCLUDED.phone,
       website=EXCLUDED.website,city=EXCLUDED.city,address=EXCLUDED.address,industry=EXCLUDED.industry,raw=EXCLUDED.raw,
       synced_at=now(),updated_at=now() WHERE accounts.managed_by_app = false`,
    [r.id, r.name, r.nit, r.email, r.phone, r.website, r.city, r.address, r.industry, r.source, r.managed_by_app, J(r.raw)],
  )
}

export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  await db.query(
    `INSERT INTO contacts (id,first_name,last_name,email,phone,mobile,account_id,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())
     ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,email=EXCLUDED.email,
       phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,account_id=EXCLUDED.account_id,raw=EXCLUDED.raw,synced_at=now(),updated_at=now()
       WHERE contacts.managed_by_app = false`,
    [r.id, r.first_name, r.last_name, r.email, r.phone, r.mobile, r.account_id, r.source, r.managed_by_app, J(r.raw)],
  )
}

export async function upsertAgent(db: Queryable, r: AgentRow): Promise<void> {
  await db.query(
    `INSERT INTO agents (id,name,email,role,source,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role=EXCLUDED.role,raw=EXCLUDED.raw,synced_at=now(),updated_at=now()`,
    [r.id, r.name, r.email, r.role, r.source, J(r.raw)],
  )
}

const TICKET_COLS = [
  'id','number','subject','status','status_type','priority','classification','channel','description',
  'contact_id','account_id','assignee_id','created_time','modified_time','closed_time','onhold_time','due_date',
  'codigo_servicio','tipo_servicio','equipo','marca','modelo','serial','codigo_interno','encargado','correo_encargado',
  'nit','ciudad','direccion','telefono','orden_venta','conformidad','dias_entrega','cumple_condiciones_comerciales',
  'fecha_creacion_ticket','fecha_remision_entrada','fecha_revision_informe','fecha_cotizacion','fecha_orden_compra',
  'fecha_orden_venta','fecha_recepcion_repuestos','fecha_finalizacion_st','fecha_factura','fecha_remision_salida',
  'fecha_salida_servicio_externo','fecha_entrada_servicio_externo','fecha_notificacion_garantia','fecha_solicitud_sku',
  'fecha_orden_compra_final','fecha_orden_venta_final','equipo_partes_listas','archivo_trazabilidad_actualizado',
  'doc_almacenada_drive','hv_actualizada','liberacion_sin_facturar','servicio_in_situ','custom_fields','managed_by_app','source','raw',
] as const

export async function upsertTicket(db: Queryable, r: TicketRow): Promise<void> {
  const values = TICKET_COLS.map((c) => (c === 'custom_fields' || c === 'raw') ? J((r as any)[c]) : (r as any)[c])
  const placeholders = TICKET_COLS.map((_, i) => `$${i + 1}`).join(',')
  const updates = TICKET_COLS.filter((c) => c !== 'id' && c !== 'managed_by_app')
    .map((c) => `${c}=EXCLUDED.${c}`).join(',')
  await db.query(
    `INSERT INTO tickets (${TICKET_COLS.join(',')}, synced_at, updated_at)
     VALUES (${placeholders}, now(), now())
     ON CONFLICT (id) DO UPDATE SET ${updates}, synced_at=now(), updated_at=now()
     WHERE tickets.managed_by_app = false`,
    values,
  )
}

export async function upsertConversation(db: Queryable, r: ConversationRow): Promise<void> {
  await db.query(
    `INSERT INTO conversations (id,ticket_id,kind,author_name,author_type,is_public,content,content_type,commented_time,source,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET ticket_id=EXCLUDED.ticket_id,kind=EXCLUDED.kind,author_name=EXCLUDED.author_name,
       author_type=EXCLUDED.author_type,is_public=EXCLUDED.is_public,content=EXCLUDED.content,content_type=EXCLUDED.content_type,
       commented_time=EXCLUDED.commented_time,raw=EXCLUDED.raw`,
    [r.id, r.ticket_id, r.kind, r.author_name, r.author_type, r.is_public, r.content, r.content_type, r.commented_time, r.source, J(r.raw)],
  )
}

export async function upsertAttachment(db: Queryable, r: AttachmentRow): Promise<void> {
  await db.query(
    `INSERT INTO attachments (id,conversation_id,ticket_id,name,size,content_type,zoho_href,storage_path,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id,ticket_id=EXCLUDED.ticket_id,name=EXCLUDED.name,
       size=EXCLUDED.size,content_type=EXCLUDED.content_type,zoho_href=EXCLUDED.zoho_href,raw=EXCLUDED.raw`,
    [r.id, r.conversation_id, r.ticket_id, r.name, r.size, r.content_type, r.zoho_href, r.storage_path, J(r.raw)],
  )
}
```
Nota: si `pg-mem` no soporta `WHERE` en `ON CONFLICT ... DO UPDATE`, sustituye esa cláusula por un
`DO UPDATE SET ... ` sin `WHERE` y, antes del upsert de ticket en `upsertTicket`, consulta
`SELECT managed_by_app FROM tickets WHERE id=$1` y **omite** el update si es `true`. Aplica esta variante
solo si el test "NO sobrescribe si managed_by_app=true" falla con la cláusula `WHERE`.

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: PASS (3 tests). Si falla el caso `managed_by_app`, aplica la nota del Step 3.

- [ ] **Step 5: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(A): repo upserts per entity; sync never overwrites managed_by_app rows"
```

---

## Task 8: Repositorio — queries, numeración e historial (TDD)

**Files:**
- Modify: `server/db/repo.ts`
- Modify: `server/db/repo.test.ts`

- [ ] **Step 1: Añadir tests**

```ts
import { getActiveTickets, getConversations, nextTicketNumber, insertTransition } from './repo'
import { reseedTicketNumber } from './migrate'

describe('repo queries', () => {
  it('getActiveTickets excluye cerrados y junta empresa/agente', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    await upsertTicket(db, { ...zTicket('1', 1, 'Ingresado'), account_id: 'a1' })
    await upsertTicket(db, { ...zTicket('2', 2, 'Finalizado'), status_type: 'Closed' })
    const list = await getActiveTickets(db)
    expect(list.map((x) => x.row.id)).toEqual(['1'])
    expect(list[0].refs.accountName).toBe('Gecelca')
  })

  it('nextTicketNumber continúa desde el máximo', async () => {
    await upsertTicket(db, zTicket('1', 953))
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(954)
  })

  it('insertTransition registra el historial', async () => {
    await upsertTicket(db, zTicket('1', 1))
    await insertTransition(db, { ticketId: '1', transitionId: 'aprobacion', transitionName: 'Aprobación', fromStatus: 'Notificación cliente', toStatus: 'En Proceso', area: 'Comercial', performedBy: 'app', values: { comment: 'ok' }, commentId: null })
    const r = await db.query('SELECT to_status FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(r.rows[0].to_status).toBe('En Proceso')
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Añadir queries a `server/db/repo.ts`**

```ts
import type { TicketRefs, DetailRefs } from './mappers'

export async function countTickets(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM tickets')
  return r.rows[0].n as number
}

export async function getTicketRow(db: Queryable, id: string): Promise<TicketRow | null> {
  const r = await db.query('SELECT * FROM tickets WHERE id=$1', [id])
  return (r.rows[0] as TicketRow) ?? null
}

export interface TicketWithRefs { row: TicketRow; refs: TicketRefs }

export async function getActiveTickets(db: Queryable): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, a.name AS account_name, g.name AS agent_name
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     WHERE t.status_type IS DISTINCT FROM 'Closed' ORDER BY t.created_time DESC NULLS LAST`,
  )
  return r.rows.map((row: any) => ({ row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name } }))
}

export async function getTicketWithRefs(db: Queryable, id: string): Promise<{ row: TicketRow; refs: DetailRefs } | null> {
  const r = await db.query(
    `SELECT t.*, a.name AS account_name, g.name AS agent_name,
            c.first_name AS c_first, c.last_name AS c_last, c.phone AS c_phone, c.email AS c_email
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN contacts c ON t.contact_id=c.id WHERE t.id=$1`,
    [id],
  )
  const row = r.rows[0]
  if (!row) return null
  const contactName = [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null
  return { row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name, contactName, contactPhone: row.c_phone, email: row.c_email ?? (row.raw?.email ?? null) } }
}

export async function getConversations(db: Queryable, ticketId: string): Promise<{ row: ConversationRow; attachments: AttachmentRow[] }[]> {
  const conv = await db.query('SELECT * FROM conversations WHERE ticket_id=$1 ORDER BY commented_time DESC NULLS LAST', [ticketId])
  const att = await db.query('SELECT * FROM attachments WHERE ticket_id=$1', [ticketId])
  const byConv = new Map<string, AttachmentRow[]>()
  for (const a of att.rows as AttachmentRow[]) {
    const k = a.conversation_id ?? ''
    byConv.set(k, [...(byConv.get(k) ?? []), a])
  }
  return (conv.rows as ConversationRow[]).map((row) => ({ row, attachments: byConv.get(row.id) ?? [] }))
}

export async function nextTicketNumber(db: Queryable): Promise<number> {
  const r = await db.query("SELECT nextval('ticket_number_seq') AS n")
  return Number(r.rows[0].n)
}

export interface TransitionRecord {
  ticketId: string; transitionId: string; transitionName: string; fromStatus: string; toStatus: string
  area: string; performedBy: string; values: unknown; commentId: string | null
}
export async function insertTransition(db: Queryable, t: TransitionRecord): Promise<void> {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [t.ticketId, t.transitionId, t.transitionName, t.fromStatus, t.toStatus, t.area, t.performedBy, J(t.values), t.commentId],
  )
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: PASS. (Si pg-mem no soporta `IS DISTINCT FROM`, usa `(t.status_type <> 'Closed' OR t.status_type IS NULL)`.)

- [ ] **Step 5: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(A): repo queries (active/detail/conversations), nextTicketNumber, transition history"
```

---

## Task 9: Sync — parsear a entidades tipadas (TDD)

**Files:**
- Modify: `server/sync.ts`
- Modify: `server/sync.test.ts`

- [ ] **Step 1: Reescribir el test `server/sync.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { countTickets, getTicketRow } from './db/repo'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig
function page(t: unknown[]) { return new Response(JSON.stringify({ data: t }), { status: 200 }) }
function z(id: string, n: number) {
  return { id, ticketNumber: String(n), subject: 's', status: 'Ingresado', statusType: 'Open', accountId: 'a1', customFields: { Serial: 'SR' + id } }
}

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('sync (tipado)', () => {
  it('backfill parsea tickets a columnas tipadas', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('1', 1), z('2', 2)]))
      .mockResolvedValue(page([])) // páginas siguientes + contactos/cuentas/agentes ausentes
    const sync = createSync({ zohoFetch, db, config })
    await sync.backfillTickets()
    expect(await countTickets(db)).toBe(2)
    const r = await getTicketRow(db, '1')
    expect(r!.serial).toBe('SR1')
    expect(r!.number).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/sync.test.ts`
Expected: FAIL (firma/comportamiento cambió).

- [ ] **Step 3: Reescribir `server/sync.ts`** para parsear a entidades

```ts
import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation, upsertAttachment, upsertAccount, upsertContact, upsertAgent } from './db/repo'
import { ticketRowFromZoho, conversationRowFromZoho, attachmentRowsFrom, accountRowFromZoho, contactRowFromZoho, agentRowFromZoho } from './db/mappers'

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
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  const accountSeen = new Set<string>()

  async function ensureAccount(accountId: string | null | undefined): Promise<void> {
    if (!accountId || accountSeen.has(accountId)) return
    accountSeen.add(accountId)
    try {
      const res = await zohoFetch(`/accounts/${accountId}`)
      if (res.ok) await upsertAccount(db, accountRowFromZoho(await readData(res)))
    } catch { /* sin empresa si falla */ }
  }
  async function ensureContact(contactId: string | null | undefined): Promise<void> {
    if (!contactId) return
    try {
      const res = await zohoFetch(`/contacts/${contactId}`)
      if (res.ok) {
        const c = await readData(res)
        await ensureAccount(c.accountId)
        await upsertContact(db, contactRowFromZoho(c))
      }
    } catch { /* */ }
  }

  async function persistTicket(t: any): Promise<void> {
    await ensureAccount(t.accountId)
    await ensureContact(t.contactId)
    if (t.assignee) await upsertAgent(db, agentRowFromZoho(t.assignee))
    await upsertTicket(db, ticketRowFromZoho(t))
  }

  async function fetchTicketPage(from: number, sortBy = 'createdTime'): Promise<any[]> {
    const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), sortBy, include: 'contacts,assignee' })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}`)
    return ((await readData(res)).data ?? [])
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const pageItems = await fetchTicketPage(from)
        if (pageItems.length === 0) break
        for (const t of pageItems) await persistTicket(t)
        total += pageItems.length
        if (pageItems.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async syncRecent(): Promise<number> {
      const pageItems = await fetchTicketPage(1, '-recentThread')
      for (const t of pageItems) await persistTicket(t)
      return pageItems.length
    },
    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await persistTicket(await readData(res))
    },
    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = ((await readData(res)).data ?? []) as any[]
      for (const c of items) {
        await upsertConversation(db, conversationRowFromZoho(c, id))
        for (const a of attachmentRowsFrom(c, id)) await upsertAttachment(db, a)
      }
    },
  }
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/sync.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/sync.ts server/sync.test.ts
git commit -m "feat(A): sync parses Zoho into typed entities (accounts/contacts/agents/tickets/conversations/attachments)"
```

---

## Task 10: App — endpoints de lectura sobre el modelo tipado + retirar `normalize.ts`

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Delete: `server/normalize.ts`, `server/normalize.test.ts`

- [ ] **Step 1: Actualizar `server/app.test.ts`** — el GET /tickets ahora se siembra con el modelo tipado

Reemplaza el helper de siembra y el test de GET /tickets:
```ts
import { upsertTicket, upsertAccount } from './db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from './db/mappers'

// dentro de "GET /api/tickets":
it('devuelve tickets activos normalizados desde Postgres', async () => {
  await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
  await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1' })
  const { app } = appWith()
  const res = await request(app).get('/api/tickets')
  expect(res.status).toBe(200)
  expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
})
```
Elimina los `import` de `getTicketRaw`/`normalizeTicket` si los hubiera en el test y cualquier siembra basada en `raw`.

- [ ] **Step 2: Actualizar `server/app.ts`** — imports y endpoints de lectura

Cambia imports (quita `./normalize`, añade repo/mappers):
```ts
import { getActiveTickets, getTicketWithRefs, getConversations } from './db/repo'
import { rowToTicket, rowToTicketDetail, rowToMessage } from './db/mappers'
```
Reemplaza los tres handlers de lectura:
```ts
app.get('/api/tickets', async (_req, res) => {
  try {
    const list = await getActiveTickets(db)
    res.json(list.map(({ row, refs }) => rowToTicket(row, refs)))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const id = String(req.params.id)
    try { await sync.syncTicket(id) } catch (e) { console.error(`syncTicket(${id}) falló:`, e) }
    const found = await getTicketWithRefs(db, id)
    if (!found) return res.status(404).json({ error: 'Ticket no encontrado' })
    res.json(rowToTicketDetail(found.row, found.refs))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

app.get('/api/tickets/:id/conversations', async (req, res) => {
  try {
    const id = String(req.params.id)
    let convs = await getConversations(db, id)
    if (convs.length === 0) { await sync.syncConversations(id); convs = await getConversations(db, id) }
    res.json(convs.map(({ row, attachments }) => rowToMessage(row, attachments)))
  } catch (err) { res.status(500).json({ error: String(err) }) }
})
```
En el endpoint de **transición** y **status** (si existe): reemplaza `getTicketRaw(...)` + `normalizeTicketDetail(...)` por `getTicketWithRefs(...)` + `rowToTicketDetail(found.row, found.refs)`. (El endpoint de transición sigue escribiendo en Zoho — transitorio; solo cambia su lectura final.)

- [ ] **Step 3: Borrar `server/normalize.ts` y `server/normalize.test.ts`**
```bash
git rm server/normalize.ts server/normalize.test.ts
```
Verifica que nada más importe de `./normalize`:
Run: `npx grep -rn "from './normalize'" server` (o búsqueda del editor) → no debe haber resultados.

- [ ] **Step 4: Verificar suite + typecheck**
Run: `npx vitest run && npx tsc -b`
Expected: PASS y exit 0.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(A): read endpoints use typed repo/mappers; retire normalize.ts"
```

---

## Task 11: Arranque, migración de datos y verificación completa

**Files:**
- Modify: `server/index.ts`
- Sin tests nuevos.

- [ ] **Step 1: Actualizar `server/index.ts`** — re-sembrar la secuencia tras migrar y tras backfill

Tras `await migrate(pool)` añade `await reseedTicketNumber(pool)` (import desde `./db/migrate`). Tras completar el backfill en background, vuelve a llamar `reseedTicketNumber(pool)`:
```ts
import { migrate, reseedTicketNumber } from './db/migrate'
// ...
await migrate(pool)
await reseedTicketNumber(pool)
// en el .then del backfill, después de "Backfill completado":
await reseedTicketNumber(pool)
```

- [ ] **Step 2: Suite + typecheck + lint + build**
Run: `npm test && npx tsc -b && npx eslint . && npx vite build`
Expected: todo verde (lint con 0 errores).

- [ ] **Step 3: Verificación manual (re-poblar Postgres con el nuevo esquema)**

Como el esquema cambió, hay que **recrear** las tablas en la Postgres real. En EasyPanel, terminal de Postgres (o psql):
```sql
DROP TABLE IF EXISTS tickets, conversations, attachments, accounts, contacts, agents, ticket_transitions CASCADE;
DROP SEQUENCE IF EXISTS ticket_number_seq;
```
Luego **Implementar** la app: al arrancar, `migrate` crea el esquema nuevo y el backfill (DB vacía) re-puebla **tipado** desde Zoho.

Run (tras unos minutos): `curl https://ambientalia-desk.ambientalia.cloud/api/tickets`
Expected: tickets con `number`, `title`, `company`, `status` (igual que antes, pero servidos desde columnas tipadas). Abre un ticket: el panel de propiedades sigue mostrando los customFields (reconstruidos desde columnas + jsonb).

- [ ] **Step 4: Commit final**
```bash
git add server/index.ts
git commit -m "chore(A): reseed ticket_number_seq on boot/after backfill; subsystem A complete"
```

---

## Notas de cierre
- **Idempotente/seguro:** no hay tickets `managed_by_app` aún, por eso recrear es seguro. Tras el subsistema B (transiciones a Postgres), recrear ya NO será seguro (perdería cambios locales) — a partir de ahí, migraciones aditivas.
- **Frontend sin cambios:** `rowToTicketDetail` reconstruye el `customFields` que la UI espera; el tablero y el detalle siguen igual.
- **`cfApiNames.ts` / `transitionExec.ts`** se mantienen (los usa el endpoint de transición transitorio); se reescriben en el subsistema B.
