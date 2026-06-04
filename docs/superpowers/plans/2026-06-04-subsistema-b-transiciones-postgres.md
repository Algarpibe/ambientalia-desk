# Subsistema B — Transiciones escribiendo en Postgres — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que las transiciones del Blueprint se ejecuten escribiendo en **Postgres** (no Zoho): actualizan el ticket (estado + columnas tipadas + `managed_by_app=true`), insertan el comentario en `conversations` y registran el historial en `ticket_transitions`.

**Architecture:** Se reaprovecha el motor de transiciones (config en `shared/transitions.ts`, validación, y el frontend `TransitionPanel`). Se reescribe `transitionExec` para producir un **plan de columnas Postgres** (en vez del body de Zoho), un nuevo `applyTransition` en el repo hace las 3 escrituras, y el endpoint se reescribe para usarlos (sin Zoho, sin guard `ENABLE_WRITES`). El mapeo etiqueta→columna usa `PROMOTED_COLUMNS` (ya existe en `server/db/rows.ts`). El actor es una constante temporal (lo reemplaza el Subsistema H).

**Tech Stack:** TypeScript ESM, Express, pg, pg-mem, Vitest. Spec: `docs/superpowers/specs/2026-06-04-subsistema-b-transiciones-postgres-design.md`.

**Contexto:** repo en `main`. Subsistema A ya desplegado (esquema tipado). El endpoint `POST /api/tickets/:id/transition` hoy escribe en Zoho (`buildTransitionUpdate` + `cfApiNames`) — se reemplaza. `server/db/repo.ts` ya tiene `getTicketRow`, `getTicketWithRefs`, `upsertTicket`. `server/db/rows.ts` exporta `PROMOTED_COLUMNS` (`{col, label, kind}` con kind `'text'|'date'|'bool'|'int'`).

---

## Estructura de archivos

- Create `server/transitionActor.ts` — constante `TRANSITION_ACTOR`.
- Rewrite `server/transitionExec.ts` — `buildTransitionPlan(transition, values): TransitionPlan`.
- Rewrite `server/transitionExec.test.ts`.
- Modify `server/db/repo.ts` — `applyTransition(...)`.
- Modify `server/db/repo.test.ts` — test de `applyTransition`.
- Modify `server/app.ts` — reescribe el endpoint de transición (sin Zoho/guard).
- Modify `server/app.test.ts` — reescribe los tests del endpoint de transición.
- Delete `server/cfApiNames.ts` (era para escribir cf en Zoho).

---

## Task 1: Plan de transición (`buildTransitionPlan`) + actor + borrar cfApiNames

**Files:**
- Create: `server/transitionActor.ts`
- Rewrite: `server/transitionExec.ts`
- Rewrite: `server/transitionExec.test.ts`
- Delete: `server/cfApiNames.ts`

- [ ] **Step 1: Crear `server/transitionActor.ts`**

```ts
// Actor temporal de las transiciones (autor del comentario e historial).
// El Subsistema H (login/roles) lo reemplazará por el usuario autenticado.
export const TRANSITION_ACTOR = process.env.TRANSITION_ACTOR || 'Equipo Técnico'
```

- [ ] **Step 2: Reescribir el test `server/transitionExec.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildTransitionPlan } from './transitionExec'
import { transitionById } from '../shared/transitions'

describe('buildTransitionPlan', () => {
  it('mapea a columnas tipadas + comentario para "Habilitar Servicio"', () => {
    const t = transitionById('habilitar_servicio')!
    const plan = buildTransitionPlan(t, {
      comment: 'condiciones ok',
      'Orden de Venta': 'OV-2026-081',
      'Fecha Orden De Venta': '2026-05-19',
      'Fecha de Cotización': '2026-05-19',
      'Fecha Orden de Compra': '2026-05-19',
      'Cumple condiciones comerciales': true,
    })
    expect(plan.errors).toEqual([])
    expect(plan.status).toBe('Ingresado')
    expect(plan.statusType).toBe('Open')
    expect(plan.comment).toBe('condiciones ok')
    expect(plan.columns.orden_venta).toBe('OV-2026-081')
    expect(plan.columns.fecha_orden_venta).toBe('2026-05-19')
    expect(plan.columns.cumple_condiciones_comerciales).toBe(true)
    expect(plan.customFields).toEqual({})
  })

  it('reporta obligatorios faltantes', () => {
    const t = transitionById('ingreso_a_servicio')!
    const plan = buildTransitionPlan(t, { comment: '' })
    expect(plan.errors.length).toBeGreaterThan(0)
    expect(plan.errors).toContain('Falta el comentario')
  })

  it('prioridad va a su campo y número a columna int', () => {
    const t = transitionById('escalado_a_revision')!
    const plan = buildTransitionPlan(t, { comment: 'x', priority: 'High', 'Días de entrega': '20' })
    expect(plan.errors).toEqual([])
    expect(plan.priority).toBe('High')
    expect(plan.columns.dias_entrega).toBe(20)
  })

  it('statusType=Closed al transicionar a Finalizado', () => {
    const t = transitionById('facturado_cierre')! // Por Facturar → Finalizado
    const plan = buildTransitionPlan(t, { comment: 'facturado', 'Fecha De Factura': '2026-06-01' })
    expect(plan.status).toBe('Finalizado')
    expect(plan.statusType).toBe('Closed')
    expect(plan.columns.fecha_factura).toBe('2026-06-01')
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**
Run: `npx vitest run server/transitionExec.test.ts`
Expected: FAIL (`buildTransitionPlan` no existe).

- [ ] **Step 4: Reescribir `server/transitionExec.ts`**

```ts
import type { Transition } from '../shared/transitions'
import { PROMOTED_COLUMNS } from './db/rows'

const LABEL_TO_COL = new Map(PROMOTED_COLUMNS.map((p) => [p.label, p]))
const CLOSED_STATUSES = new Set(['Finalizado'])

export interface TransitionPlan {
  status: string
  statusType: string
  columns: Record<string, unknown>
  customFields: Record<string, string | null>
  priority?: string
  comment?: string
  errors: string[]
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  const s = String(v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return ['true', 'si', 'yes', 'y', '1'].includes(s)
}
function convert(kind: 'text' | 'date' | 'bool' | 'int', raw: unknown): unknown {
  if (kind === 'bool') return asBool(raw)
  if (kind === 'int') { const n = Number(raw); return Number.isNaN(n) ? null : n }
  if (kind === 'date') return String(raw).slice(0, 10)
  return String(raw)
}

export function buildTransitionPlan(t: Transition, values: Record<string, unknown>): TransitionPlan {
  const plan: TransitionPlan = {
    status: t.to, statusType: CLOSED_STATUSES.has(t.to) ? 'Closed' : 'Open',
    columns: {}, customFields: {}, errors: [],
  }
  for (const f of t.fields) {
    const raw = values[f.key]
    const empty = raw === undefined || raw === null || raw === ''

    if (f.target === 'comment') { if (!empty) plan.comment = String(raw); continue }

    if (f.kind === 'checkbox') {
      const col = LABEL_TO_COL.get(f.key)
      if (col) plan.columns[col.col as string] = asBool(raw)
      else plan.customFields[f.key] = asBool(raw) ? 'true' : 'false'
      continue
    }

    if (f.required && empty) { plan.errors.push(`Falta el campo obligatorio: ${f.label}`); continue }
    if (empty) continue

    if (f.target === 'priority') { plan.priority = String(raw); continue }

    const col = LABEL_TO_COL.get(f.key)
    if (col) plan.columns[col.col as string] = convert(col.kind, raw)
    else plan.customFields[f.key] = String(raw)
  }

  const commentField = t.fields.find((f) => f.target === 'comment')
  if (commentField?.required && !plan.comment) plan.errors.push('Falta el comentario')
  return plan
}
```
NOTE: el regex `/[̀-ͯ]/g` son los diacríticos combinantes U+0300–U+036F (igual que en `mappers.ts`).

- [ ] **Step 5: Ejecutar y ver pasar**
Run: `npx vitest run server/transitionExec.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Borrar `server/cfApiNames.ts`**
```bash
git rm server/cfApiNames.ts
```
(Nadie más lo importa: solo lo usaba la versión Zoho de `transitionExec`, ahora reescrita.)

- [ ] **Step 7: Commit**
```bash
git add server/transitionActor.ts server/transitionExec.ts server/transitionExec.test.ts
git commit -m "feat(B): buildTransitionPlan (Zoho→Postgres columns) + actor const; remove cfApiNames"
```

---

## Task 2: `applyTransition` en el repo (TDD con pg-mem)

**Files:**
- Modify: `server/db/repo.ts`
- Modify: `server/db/repo.test.ts`

- [ ] **Step 1: Añadir test a `server/db/repo.test.ts`**

Añade `applyTransition` al import existente de `./repo` (junto a `upsertTicket`, `getTicketRow`…) y agrega el bloque de test. `upsertTicket`, `getTicketRow` y `ticketRowFromZoho` ya están importados al inicio del archivo (Subsistema A).
```ts
import { applyTransition } from './repo'

describe('applyTransition', () => {
  it('actualiza ticket (managed), inserta comentario e historial', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'OV asignada', statusType: 'Open', customFields: {} } as any))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'habilitar_servicio', name: 'Habilitar Servicio', area: 'Comercial' },
      { status: 'Ingresado', statusType: 'Open', columns: { orden_venta: 'OV-1', fecha_cotizacion: '2026-05-19' }, customFields: {}, comment: 'ok' },
      'Equipo Técnico', { comment: 'ok' },
    )
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('Ingresado')
    expect(r!.managed_by_app).toBe(true)
    expect(r!.orden_venta).toBe('OV-1')
    const conv = await db.query('SELECT count(*)::int AS n FROM conversations WHERE ticket_id=$1', ['1'])
    expect(conv.rows[0].n).toBe(1)
    const hist = await db.query('SELECT to_status, from_status, performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].to_status).toBe('Ingresado')
    expect(hist.rows[0].from_status).toBe('OV asignada')
    expect(hist.rows[0].performed_by).toBe('Equipo Técnico')
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: FAIL (`applyTransition` no existe).

- [ ] **Step 3: Añadir `applyTransition` a `server/db/repo.ts`**

```ts
import { randomUUID } from 'node:crypto'

export interface TransitionApply {
  status: string
  statusType: string
  columns: Record<string, unknown>
  customFields: Record<string, string | null>
  priority?: string
  comment?: string
}

export async function applyTransition(
  db: Queryable,
  ticketId: string,
  fromStatus: string,
  transition: { id: string; name: string; area: string },
  plan: TransitionApply,
  actor: string,
  values: unknown,
): Promise<void> {
  // 1) Comentario (si lo hay) → conversations
  let commentId: string | null = null
  if (plan.comment) {
    commentId = `app-${randomUUID()}`
    await db.query(
      `INSERT INTO conversations (id,ticket_id,kind,author_name,author_type,is_public,content,content_type,commented_time,source)
       VALUES ($1,$2,'comment',$3,'agent',false,$4,'plainText',now(),'app')`,
      [commentId, ticketId, actor, plan.comment],
    )
  }

  // 2) Update del ticket: estado + columnas tipadas + custom_fields + managed_by_app. Los nombres de
  //    columna provienen de PROMOTED_COLUMNS (confiables, no input de usuario) → no hay inyección.
  const sets = ['status=$2', 'status_type=$3', 'managed_by_app=true', 'source=' + "'app'", 'modified_time=now()', 'updated_at=now()']
  const params: unknown[] = [ticketId, plan.status, plan.statusType]
  if (plan.priority) { params.push(plan.priority); sets.push(`priority=$${params.length}`) }
  for (const [col, val] of Object.entries(plan.columns)) { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (Object.keys(plan.customFields).length) {
    params.push(JSON.stringify(plan.customFields))
    sets.push(`custom_fields = custom_fields || $${params.length}::jsonb`)
  }
  await db.query(`UPDATE tickets SET ${sets.join(',')} WHERE id=$1`, params)

  // 3) Historial
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [ticketId, transition.id, transition.name, fromStatus, plan.status, transition.area, actor, JSON.stringify(values), commentId],
  )
}
```
NOTA pg-mem: si el merge `custom_fields || $n::jsonb` falla en pg-mem, sustitúyelo por leer+fusionar en JS:
lee `SELECT custom_fields FROM tickets WHERE id=$1`, fusiona en JS, y escribe el objeto completo como
`custom_fields=$n::jsonb`. Aplica solo si el test lo exige (en el test de arriba `customFields` está vacío,
así que la rama del merge no se ejecuta y no debería hacer falta).

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/db/repo.test.ts`
Expected: PASS (todos, incl. el nuevo).

- [ ] **Step 5: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(B): applyTransition — update ticket (managed) + comment + transition history"
```

---

## Task 3: Reescribir el endpoint de transición (Postgres) + tests

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

- [ ] **Step 1: Actualizar imports en `server/app.ts`**
- Quita: `import { buildTransitionUpdate } from './transitionExec'`.
- Añade:
```ts
import { buildTransitionPlan } from './transitionExec'
import { applyTransition } from './db/repo'
import { TRANSITION_ACTOR } from './transitionActor'
```
(`transitionById` desde `'../shared/transitions'`, `getTicketWithRefs` desde `'./db/repo'` y
`rowToTicketDetail` desde `'./db/mappers'` ya están importados.)

- [ ] **Step 2: Reemplazar el handler `POST /api/tickets/:id/transition`**

Reemplaza TODO el bloque actual del endpoint de transición por:
```ts
  // Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
  app.post('/api/tickets/:id/transition', async (req, res) => {
    try {
      const id = String(req.params.id)
      const t = transitionById(String(req.body.transitionId))
      if (!t) { res.status(400).json({ error: 'Transición desconocida' }); return }
      const current = await getTicketWithRefs(db, id)
      if (!current) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
      const values = (req.body.values ?? {}) as Record<string, unknown>
      const plan = buildTransitionPlan(t, values)
      if (plan.errors.length) { res.status(422).json({ errors: plan.errors }); return }
      await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, TRANSITION_ACTOR, values)
      const updated = await getTicketWithRefs(db, id)
      res.json(updated ? rowToTicketDetail(updated.row, updated.refs) : {})
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })
```
(Ya NO usa `guardWrites`, `zohoFetch`, ni `sync` — escribe solo en Postgres.)

- [ ] **Step 3: Reemplazar los tests del endpoint de transición en `server/app.test.ts`**

Asegúrate de que el archivo importe lo necesario (al inicio ya hay `upsertTicket`, `ticketRowFromZoho`;
añade `getTicketRow` si falta):
```ts
import { upsertTicket, upsertAccount, getTicketRow } from './db/repo'
```
Reemplaza el bloque `describe('POST /api/tickets/:id/transition', ...)` por:
```ts
describe('POST /api/tickets/:id/transition (Postgres)', () => {
  it('400 si la transición es desconocida', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'no-existe', values: {} })
    expect(res.status).toBe(400)
  })

  it('422 si faltan campos obligatorios', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'ingreso_a_servicio', values: {} })
    expect(res.status).toBe(422)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('aplica la transición en Postgres y devuelve el detalle', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'aprobacion', values: { comment: 'aprobado' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso')
    expect(r!.managed_by_app).toBe(true)
  })
})
```

- [ ] **Step 4: Verificar suite completa + typecheck server**
Run: `npx vitest run && npx tsc -p tsconfig.server.json --noEmit`
Expected: todos los tests PASS; typecheck server sin errores. (Si algún test viejo del endpoint de
transición quedó referenciando `zohoFetch`/`guardWrites`/`sync.syncTicket`, elimínalo — el endpoint ya
no usa nada de eso.)

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(B): transition endpoint writes to Postgres (applyTransition); no Zoho, no ENABLE_WRITES guard"
```

---

## Task 4: Verificación completa

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite + typecheck + lint + build**
Run: `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; `tsc -b` exit 0; server typecheck sin errores; eslint **0 errores** (warnings OK);
vite build OK. Corrige cualquier error que introdujo este subsistema (p.ej. imports sin usar tras quitar
`buildTransitionUpdate`).

- [ ] **Step 2: Verificación manual (tras desplegar)**

Despliega en EasyPanel (Implementar). En el tablero abre un ticket activo, pulsa una transición simple
(p.ej. en un "Notificación cliente" → "Aprobación", que solo pide comentario), rellena el comentario y
confirma. Verifica:
- La app muestra el ticket con el **nuevo estado** (el detalle se actualiza).
- En **PgWeb**: `SELECT status, managed_by_app FROM tickets WHERE id='<id>'` → nuevo estado y
  `managed_by_app = true`. `SELECT * FROM ticket_transitions WHERE ticket_id='<id>'` → 1 fila.
  `SELECT * FROM conversations WHERE ticket_id='<id>' AND source='app'` → el comentario.
- El ticket **ya no se sobrescribe** desde Zoho (el sync lo omite por `managed_by_app=true`).

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(B): subsistema B verificado (transiciones → Postgres)"
```

---

## Notas de cierre
- **Cutover por ticket:** al transicionar, el ticket queda `managed_by_app=true` y el sync no lo vuelve a
  tocar. Es intencional. (Por eso el endpoint `recreate-schema` del Subsistema A ya NO debe usarse: borraría
  estos cambios locales.)
- **Actor temporal:** `TRANSITION_ACTOR` ('Equipo Técnico'). El Subsistema H lo reemplaza por el usuario
  autenticado y añade la validación de permisos por rol/área.
- **`status_type` On Hold fino** y los **indicadores calculados** quedan para reportería (Subsistema G).
