# Resolución del ticket (texto enriquecido + imágenes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una pestaña "Resolución" en el detalle del ticket que permita escribir la solución (texto enriquecido) y adjuntar imágenes, guardado en Postgres como repositorio interno (no se envía a nadie).

**Architecture:** `tickets.resolution_*` + tabla `resolution_attachments` (imágenes en base64 sobre `text`). Endpoints REST bajo la auth de `/api/tickets`. Frontend: editor `contentEditable` ligero + galería, HTML saneado con DOMPurify; subida con `multer` (memoria).

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, multer, Vitest + supertest, React 19 + Vite + Tailwind + DOMPurify. Spec: `docs/superpowers/specs/2026-06-05-resolucion-ticket-design.md`.

**Contexto del repo:**
- `server/db/schema.sql`: tablas con `CREATE TABLE IF NOT EXISTS …;` y `ALTER TABLE … ADD COLUMN IF NOT EXISTS …;` (válidos en pg-mem; comentarios en líneas propias). `server/db/equipos.ts` usa `randomUUID` de `node:crypto` con ids `eq-`+uuid.
- `server/app.ts`: `express.json()` (línea ~42); `app.use('/api/tickets', requireAuth(db))` gatea todo `/api/tickets/*`; `req.user?.name` disponible. `app.test.ts` tiene `adminCookie()`, `appWith()` (→ `{ app }`), `db`, `request` (supertest).
- `src/components/TicketDetailView.tsx`: `TABS` (línea ~34 la pestaña `{ id: 'res', label: 'RESOLUCIÓN', view: 'otros' }`); el área de contenido tiene bloques `activeView === 'conversaciones'|'actividades'|'otros'` (líneas ~205, 253, 258).
- `src/api/client.ts`: `json<T>` + import de tipos desde `../../shared/types`. `src/hooks/useAsync.ts`: `useAsync(fn, deps) → { data, loading, error, reload }`.

---

## Estructura de archivos
- Modify `server/db/schema.sql`; Modify `shared/types.ts` — columnas + tabla + tipos.
- Create `server/db/resolutions.ts` (+ `.test.ts`) — repo.
- Modify `server/app.ts` (+ `app.test.ts`); add dep `multer` — endpoints.
- Modify `src/api/client.ts`; Create `src/components/ResolucionPanel.tsx`; Modify `src/components/TicketDetailView.tsx`; add dep `dompurify`.

---

## Task 1: Esquema + tipos

**Files:** Modify `server/db/schema.sql`, `shared/types.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`:**
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_html text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_by text;

CREATE TABLE IF NOT EXISTS resolution_attachments (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  filename text,
  content_type text,
  content_b64 text NOT NULL,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_resolution_att_ticket ON resolution_attachments (ticket_id);
```

- [ ] **Step 2: Añadir al final de `shared/types.ts`:**
```ts
export interface ResolutionAttachment { id: string; filename: string; contentType: string; size: number }
export interface Resolution { html: string | null; updatedAt: string | null; updatedBy: string | null; attachments: ResolutionAttachment[] }
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql shared/types.ts
git commit -m "feat(resolucion): columnas tickets.resolution_* + tabla resolution_attachments + tipos"
```

---

## Task 2: Repo `server/db/resolutions.ts` (TDD pg-mem)

**Files:** Create `server/db/resolutions.ts`, `server/db/resolutions.test.ts`

- [ ] **Step 1: Escribir `server/db/resolutions.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { saveResolution, getResolution, addResolutionAttachment, getResolutionAttachmentContent, deleteResolutionAttachment } from './resolutions'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('resolutions repo', () => {
  it('guarda/lee resolución y adjuntos (round-trip base64)', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await saveResolution(db, 't1', '<p>Listo</p>', 'Ana')
    const att = await addResolutionAttachment(db, { ticketId: 't1', filename: 'foto.png', contentType: 'image/png', contentB64: 'aGVsbG8=', size: 5, by: 'Ana' })
    const res = await getResolution(db, 't1')
    expect(res.html).toBe('<p>Listo</p>')
    expect(res.updatedBy).toBe('Ana')
    expect(res.attachments).toEqual([{ id: att.id, filename: 'foto.png', contentType: 'image/png', size: 5 }])
    const content = await getResolutionAttachmentContent(db, 't1', att.id)
    expect(content).toMatchObject({ contentType: 'image/png', contentB64: 'aGVsbG8=' })
    await deleteResolutionAttachment(db, 't1', att.id)
    expect((await getResolution(db, 't1')).attachments).toHaveLength(0)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/resolutions.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/db/resolutions.ts`**
```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from './migrate'
import type { Resolution, ResolutionAttachment } from '../../shared/types'

export async function saveResolution(db: Queryable, ticketId: string, html: string, by: string | null): Promise<void> {
  await db.query('UPDATE tickets SET resolution_html=$1, resolution_at=now(), resolution_by=$2 WHERE id=$3', [html, by, ticketId])
}

export async function listResolutionAttachments(db: Queryable, ticketId: string): Promise<ResolutionAttachment[]> {
  const r = await db.query('SELECT id, filename, content_type, size FROM resolution_attachments WHERE ticket_id=$1 ORDER BY created_at ASC', [ticketId])
  return (r.rows as any[]).map((x) => ({ id: x.id, filename: x.filename ?? '', contentType: x.content_type ?? 'application/octet-stream', size: x.size ?? 0 }))
}

export async function getResolution(db: Queryable, ticketId: string): Promise<Resolution> {
  const r = await db.query('SELECT resolution_html, resolution_at, resolution_by FROM tickets WHERE id=$1', [ticketId])
  const row = (r.rows as any[])[0]
  const attachments = await listResolutionAttachments(db, ticketId)
  return { html: row?.resolution_html ?? null, updatedAt: row?.resolution_at ?? null, updatedBy: row?.resolution_by ?? null, attachments }
}

export async function addResolutionAttachment(
  db: Queryable,
  a: { ticketId: string; filename: string; contentType: string; contentB64: string; size: number; by: string | null },
): Promise<ResolutionAttachment> {
  const id = 'res-' + randomUUID()
  await db.query(
    'INSERT INTO resolution_attachments (id,ticket_id,filename,content_type,content_b64,size,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, a.ticketId, a.filename, a.contentType, a.contentB64, a.size, a.by],
  )
  return { id, filename: a.filename, contentType: a.contentType, size: a.size }
}

export async function getResolutionAttachmentContent(db: Queryable, ticketId: string, attId: string): Promise<{ filename: string; contentType: string; contentB64: string } | null> {
  const r = await db.query('SELECT filename, content_type, content_b64 FROM resolution_attachments WHERE id=$1 AND ticket_id=$2', [attId, ticketId])
  const row = (r.rows as any[])[0]
  if (!row) return null
  return { filename: row.filename ?? '', contentType: row.content_type ?? 'application/octet-stream', contentB64: row.content_b64 }
}

export async function deleteResolutionAttachment(db: Queryable, ticketId: string, attId: string): Promise<void> {
  await db.query('DELETE FROM resolution_attachments WHERE id=$1 AND ticket_id=$2', [attId, ticketId])
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/resolutions.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/resolutions.ts` — typecheck limpio; eslint 0 errores (un WARNING `no-explicit-any` por `as any[]` es aceptable).

- [ ] **Step 6: Commit**
```bash
git add server/db/resolutions.ts server/db/resolutions.test.ts
git commit -m "feat(resolucion): repo (save/get + adjuntos base64)"
```

---

## Task 3: Dependencia `multer` + endpoints (TDD supertest)

**Files:** `package.json` (dep); Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: Instalar multer**
Run: `npm i multer && npm i -D @types/multer`
Expected: se añaden a package.json sin errores.

- [ ] **Step 2: En `server/app.test.ts` añade un bloque:**
```ts
describe('Resolución del ticket', () => {
  it('PUT guarda; GET devuelve; POST imagen 201; GET content sirve; 415 no-imagen; DELETE; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const { app } = appWith()
    expect((await request(app).put('/api/tickets/t1/resolution').set('Cookie', cookie).send({ html: '<p>ok</p>' })).status).toBe(200)
    const g = await request(app).get('/api/tickets/t1/resolution').set('Cookie', cookie)
    expect(g.body).toMatchObject({ html: '<p>ok</p>' })
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    const up = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie).attach('file', png, { filename: 'a.png', contentType: 'image/png' })
    expect(up.status).toBe(201)
    const attId = up.body.id
    const g2 = await request(app).get('/api/tickets/t1/resolution').set('Cookie', cookie)
    expect(g2.body.attachments).toHaveLength(1)
    const c = await request(app).get(`/api/tickets/t1/resolution/attachments/${attId}`).set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.headers['content-type']).toContain('image/png')
    const txt = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie).attach('file', Buffer.from('hola'), { filename: 'a.txt', contentType: 'text/plain' })
    expect(txt.status).toBe(415)
    expect((await request(app).delete(`/api/tickets/t1/resolution/attachments/${attId}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/tickets/t1/resolution')).status).toBe(401)
  })
})
```

- [ ] **Step 3:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 4: En `server/app.ts`:**
  - Imports (con los demás): `import multer from 'multer'` y `import { getResolution, saveResolution, addResolutionAttachment, getResolutionAttachmentContent, deleteResolutionAttachment } from './db/resolutions'`.
  - Tras `const guardWrites = …` (o cerca de las rutas de `/api/tickets`), define: `const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })`.
  - Registra las rutas (van bajo `app.use('/api/tickets', requireAuth(db))`):
```ts
  app.get('/api/tickets/:id/resolution', async (req, res) => {
    try { res.json(await getResolution(db, String(req.params.id))) }
    catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.put('/api/tickets/:id/resolution', async (req, res) => {
    try {
      const html = typeof req.body?.html === 'string' ? req.body.html : ''
      await saveResolution(db, String(req.params.id), html, req.user?.name ?? null)
      res.json({ ok: true })
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.post('/api/tickets/:id/resolution/attachments', upload.single('file'), async (req, res) => {
    try {
      const f = req.file
      if (!f) { res.status(400).json({ error: 'Falta el archivo' }); return }
      if (!/^image\//.test(f.mimetype)) { res.status(415).json({ error: 'Solo imágenes' }); return }
      const meta = await addResolutionAttachment(db, { ticketId: String(req.params.id), filename: f.originalname, contentType: f.mimetype, contentB64: f.buffer.toString('base64'), size: f.size, by: req.user?.name ?? null })
      res.status(201).json(meta)
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.get('/api/tickets/:id/resolution/attachments/:attId', async (req, res) => {
    try {
      const c = await getResolutionAttachmentContent(db, String(req.params.id), String(req.params.attId))
      if (!c) { res.status(404).json({ error: 'No encontrado' }); return }
      res.set('Content-Type', c.contentType)
      res.send(Buffer.from(c.contentB64, 'base64'))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.delete('/api/tickets/:id/resolution/attachments/:attId', async (req, res) => {
    try { await deleteResolutionAttachment(db, String(req.params.id), String(req.params.attId)); res.status(204).end() }
    catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 5:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0 errores.

- [ ] **Step 6: Commit**
```bash
git add server/app.ts server/app.test.ts package.json package-lock.json
git commit -m "feat(resolucion): endpoints GET/PUT resolución + POST/GET/DELETE imágenes (multer)"
```

---

## Task 4: Frontend — panel + cliente + pestaña

**Files:** `package.json` (dep); Modify `src/api/client.ts`; Create `src/components/ResolucionPanel.tsx`; Modify `src/components/TicketDetailView.tsx`

- [ ] **Step 1: Instalar dompurify**
Run: `npm i dompurify`
(Si `npx tsc -b` se queja por falta de tipos en el Step 4, ejecuta también `npm i -D @types/dompurify`.)

- [ ] **Step 2: En `src/api/client.ts`** añade `Resolution, ResolutionAttachment` al import de tipos y las funciones:
```ts
export function fetchResolution(id: string): Promise<Resolution> {
  return fetch(`/api/tickets/${id}/resolution`, { credentials: 'include' }).then((r) => json<Resolution>(r))
}
export async function saveResolution(id: string, html: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}/resolution`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
export async function uploadResolutionImage(id: string, file: File): Promise<ResolutionAttachment> {
  const fd = new FormData(); fd.append('file', file)
  const res = await fetch(`/api/tickets/${id}/resolution/attachments`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<ResolutionAttachment>
}
export async function deleteResolutionImage(id: string, attId: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}/resolution/attachments/${attId}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
```

- [ ] **Step 3: Crear `src/components/ResolucionPanel.tsx`** (verbatim):
```tsx
import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { Resolution, ResolutionAttachment } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchResolution, saveResolution, uploadResolutionImage, deleteResolutionImage } from '../api/client'

export function ResolucionPanel({ ticketId }: { ticketId: string }) {
  const { data, loading, reload } = useAsync<Resolution>(() => fetchResolution(ticketId), [ticketId])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atts, setAtts] = useState<ResolutionAttachment[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setAtts(data?.attachments ?? []) }, [data])
  useEffect(() => { if (editing && editorRef.current) editorRef.current.innerHTML = data?.html ?? '' }, [editing, data])

  const attUrl = (a: ResolutionAttachment) => `/api/tickets/${ticketId}/resolution/attachments/${a.id}`
  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val)

  async function onSave() {
    setSaving(true); setError(null)
    try { await saveResolution(ticketId, editorRef.current?.innerHTML ?? ''); setEditing(false); reload() }
    catch (e) { setError(String(e)) } finally { setSaving(false) }
  }
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    try { const meta = await uploadResolutionImage(ticketId, f); setAtts((p) => [...p, meta]) } catch (err) { setError(String(err)) }
    if (fileRef.current) fileRef.current.value = ''
  }
  async function onDelete(a: ResolutionAttachment) {
    try { await deleteResolutionImage(ticketId, a.id); setAtts((p) => p.filter((x) => x.id !== a.id)) } catch (err) { setError(String(err)) }
  }

  if (loading && !data) return <div className="p-4 text-[13px] text-slate-400">Cargando…</div>

  if (!editing) {
    return (
      <div className="p-4 max-w-[900px]">
        {error && <div className="text-[12px] text-red-600 mb-2">{error}</div>}
        {data?.html
          ? <div className="text-[13px] text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html) }} />
          : <div className="text-[13px] text-slate-400">Sin resolución registrada.</div>}
        {atts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {atts.map((a) => (
              <a key={a.id} href={attUrl(a)} target="_blank" rel="noreferrer">
                <img src={attUrl(a)} alt={a.filename} className="h-24 w-24 object-cover rounded border border-slate-200" />
              </a>
            ))}
          </div>
        )}
        {data?.updatedBy && <div className="text-[11px] text-slate-400 mt-3">Actualizado por {data.updatedBy}</div>}
        <button onClick={() => setEditing(true)} className="mt-4 bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">{data?.html ? 'Editar' : 'Agregar resolución'}</button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-[900px]">
      {error && <div className="text-[12px] text-red-600 mb-2">{error}</div>}
      <div className="flex items-center gap-1 mb-2 border border-slate-200 rounded p-1 bg-slate-50">
        <button onMouseDown={(e) => { e.preventDefault(); exec('bold') }} className="px-2 py-1 hover:bg-slate-200 rounded font-bold text-[13px]">B</button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('italic') }} className="px-2 py-1 hover:bg-slate-200 rounded italic text-[13px]">I</button>
        <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList') }} className="px-2 py-1 hover:bg-slate-200 rounded text-[13px]">• Lista</button>
        <button onMouseDown={(e) => { e.preventDefault(); const u = prompt('URL del enlace:'); if (u) exec('createLink', u) }} className="px-2 py-1 hover:bg-slate-200 rounded text-[13px]">Enlace</button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning className="min-h-[160px] border border-slate-200 rounded p-3 text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300 [&_ul]:list-disc [&_ul]:ml-5 [&_a]:text-blue-600 [&_a]:underline" />
      <div className="flex flex-wrap gap-2 mt-3">
        {atts.map((a) => (
          <div key={a.id} className="relative">
            <img src={attUrl(a)} alt={a.filename} className="h-20 w-20 object-cover rounded border border-slate-200" />
            <button onClick={() => onDelete(a)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none flex items-center justify-center">×</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="border border-slate-300 px-3 py-1.5 rounded text-[13px]">Adjuntar imagen</button>
        <button onClick={onSave} disabled={saving} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
        <button onClick={() => { setEditing(false); reload() }} className="text-[13px] text-slate-500">Cancelar</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: En `src/components/TicketDetailView.tsx`:**
  - Import: `import { ResolucionPanel } from './ResolucionPanel'`.
  - En `TABS`, cambia la pestaña `res` a `view: 'resolucion'`:
```tsx
        { id: 'res', label: 'RESOLUCIÓN', view: 'resolucion' },
```
  - En el área de contenido, junto a los bloques `activeView === 'actividades'` / `'otros'`, añade:
```tsx
                        {activeView === 'resolucion' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                <ResolucionPanel ticketId={ticketId} />
                            </div>
                        )}
```

- [ ] **Step 5:** Run `npx tsc -b && npx vite build && npx eslint src/components/ResolucionPanel.tsx src/components/TicketDetailView.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores. (Si tsc se queja por tipos de dompurify, `npm i -D @types/dompurify` y reintenta.)

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/ResolucionPanel.tsx src/components/TicketDetailView.tsx package.json package-lock.json
git commit -m "feat(resolucion): panel (editor enriquecido + galería) + pestaña Resolución funcional"
```

---

## Task 5: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Abre un ticket → pestaña **RESOLUCIÓN** → "Agregar resolución" → escribe con formato (negrita/lista), **Adjuntar imagen** (se ve en la galería), **Guardar**.
2. Reabre el ticket → la resolución y las imágenes persisten; "Actualizado por <tu nombre>".
3. Edita, quita una imagen, guarda → se refleja. Sin sesión, los endpoints dan 401.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(resolucion): verificado"
```

---

## Notas de cierre
- **Interno**: no se envía a nadie (correo = D, diferido). No usa `ENABLE_WRITES` (escritura a Postgres propia).
- **Imágenes** en base64 sobre `text` (sin infra nueva; misma idea "todo en Postgres").
- **Futuro**: base de conocimiento consultable entre tickets (búsqueda global de resoluciones).
