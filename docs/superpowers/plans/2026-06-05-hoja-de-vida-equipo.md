# Hoja de vida del equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar, por equipo, su historial de servicio (tickets emparejados por `equipo_id` o `serial`, con la línea de tiempo de transiciones de cada uno), accesible desde la página Equipos y desde el detalle del ticket.

**Architecture:** Un endpoint `GET /api/equipos/:id/historial` + repo `getEquipoHistorial`; una página `HojaDeVida` de solo lectura (cabecera + tickets + timeline). El detalle del ticket expone `equipoId` para enlazar.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-hoja-de-vida-equipo-design.md`.

**Nota de arquitectura (evitar import circular / overlays anidados):** `HojaDeVida` NO renderiza `TicketDetailView` y NO importa nada que importe a `HojaDeVida`. Tanto `EquiposAdmin` como `TicketDetailView` importan `HojaDeVida` (una sola dirección). La hoja es **solo lectura** (sin botón "Abrir ticket" — diferido). `HojaDeVida` usa `z-[75]` para quedar por encima de Equipos (`z-70`) y del detalle (`z-60`).

**Contexto del repo:**
- `server/db/equipos.ts`: `getEquipoFull`, `Queryable`, `J`. `server/db/mappers.ts`: `rowToTicketDetail(row, refs)` (usa `(row as any)` para columnas no tipadas en `TicketRow`). `server/app.ts`: rutas de equipos con `requireAuth(db)`; importa de `./db/equipos`. `server/app.test.ts`: helpers `adminCookie()`, `appWith()`, `db`, `request`, `upsertClient`/`clientFromBooks`.
- `src/api/client.ts`: helper `json<T>`. `src/hooks/useAsync.ts`: `useAsync(fn, deps) → { data, loading, error, reload }` (`error` es string). `src/components/EquiposAdmin.tsx` (tabla con acciones por fila), `src/components/TicketDetailView.tsx` (overlay `z-[60]`; usa `ticket` de `fetchTicket`).

---

## Estructura de archivos
- Modify `shared/types.ts` — tipos del historial + `TicketDetail.equipoId`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — `rowToTicketDetail` expone `equipoId`.
- Modify `server/db/equipos.ts` (+ `equipos.test.ts`) — `getEquipoHistorial`.
- Modify `server/app.ts` (+ `app.test.ts`) — `GET /api/equipos/:id/historial`.
- Modify `src/api/client.ts`; Create `src/components/HojaDeVida.tsx`; Modify `src/components/EquiposAdmin.tsx`, `src/components/TicketDetailView.tsx`.

---

## Task 1: Tipos compartidos

**Files:** Modify `shared/types.ts`

- [ ] **Step 1: Añadir a `shared/types.ts`** (al final):
```ts
export interface HistorialTransition {
  transitionName: string | null
  fromStatus: string | null
  toStatus: string | null
  area: string | null
  performedBy: string | null
  performedAt: string | null
}
export interface HistorialTicket {
  id: string
  number: string
  subject: string
  status: string
  statusType?: string | null
  createdAt?: string | null
  tecnico?: string | null
  codigoServicio?: string | null
  tipoServicio?: string | null
  transitions: HistorialTransition[]
}
export interface EquipoHistorial {
  equipo: EquipoFull
  tickets: HistorialTicket[]
}
```

- [ ] **Step 2: En `shared/types.ts`, dentro de `interface TicketDetail`**, añade tras `channel?: string`:
```ts
  equipoId?: string | null
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit` — Expected: sin errores (solo tipos nuevos).

- [ ] **Step 4: Commit**
```bash
git add shared/types.ts
git commit -m "feat(hv): tipos EquipoHistorial/HistorialTicket/HistorialTransition + TicketDetail.equipoId"
```

---

## Task 2: `rowToTicketDetail` expone `equipoId` (TDD)

**Files:** Modify `server/db/mappers.ts`, `server/db/mappers.test.ts`

- [ ] **Step 1: En `server/db/mappers.test.ts`** añade (asegura `rowToTicketDetail` en el import desde `./mappers`):
```ts
describe('rowToTicketDetail (equipoId)', () => {
  it('expone equipoId desde la columna equipo_id', () => {
    const row = { id: 't1', number: 5, subject: 'S', status: 'Ingresado', equipo_id: 'eq-9' } as any
    expect(rowToTicketDetail(row, {}).equipoId).toBe('eq-9')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/mappers.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/mappers.ts`, en `rowToTicketDetail`**, añade el campo al objeto devuelto (junto a los otros campos del detalle, p.ej. tras `channel: ...`):
```ts
    equipoId: (row as any).equipo_id ?? undefined,
```

- [ ] **Step 4:** Run `npx vitest run server/db/mappers.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(hv): rowToTicketDetail expone equipoId"
```

---

## Task 3: Repo `getEquipoHistorial` (TDD pg-mem)

**Files:** Modify `server/db/equipos.ts`, `server/db/equipos.test.ts`

- [ ] **Step 1: En `server/db/equipos.test.ts`** añade el import y un bloque:
```ts
import { getEquipoHistorial } from './equipos'

async function insTicket(id: string, number: number, serial: string | null, equipoId: string | null, status: string) {
  await db.query(
    `INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ($1,$2,$3,$4,'Open',$5,$6,now())`,
    [id, number, `Ticket ${number}`, status, serial, equipoId],
  )
}

describe('getEquipoHistorial', () => {
  it('empareja por equipo_id y por serial, agrupa transiciones', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-1', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1' })
    await insTicket('app-1', 901, 'SN-1', eqId, 'Ingresado')   // por equipo_id
    await insTicket('zoho-1', 303, 'SN-1', null, 'Finalizado') // por serial (histórico)
    await insTicket('otro-1', 500, 'SN-X', null, 'Ingresado')  // no coincide
    await db.query(`INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('app-1','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin',now())`)
    const h = await getEquipoHistorial(db, eqId)
    expect(h).not.toBeNull()
    expect(h!.equipo.serial).toBe('SN-1')
    expect(h!.tickets.map((t) => t.id).sort()).toEqual(['app-1', 'zoho-1'])
    const app1 = h!.tickets.find((t) => t.id === 'app-1')!
    expect(app1.number).toBe('#901')
    expect(app1.transitions.map((x) => x.transitionName)).toEqual(['Habilitar Servicio'])
  })

  it('devuelve null si el equipo no existe', async () => {
    expect(await getEquipoHistorial(db, 'eq-nope')).toBeNull()
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/equipos.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/equipos.ts`** añade el import de tipos y la función (al final):
```ts
import type { EquipoHistorial, HistorialTicket, HistorialTransition } from '../../shared/types'

export async function getEquipoHistorial(db: Queryable, id: string): Promise<EquipoHistorial | null> {
  const equipo = await getEquipoFull(db, id)
  if (!equipo) return null
  const tk = await db.query(
    `SELECT t.id, t.number, t.subject, t.status, t.status_type, t.created_time, t.codigo_servicio, t.tipo_servicio, g.name AS agent_name
     FROM tickets t LEFT JOIN agents g ON t.assignee_id=g.id
     WHERE t.equipo_id=$1 OR (COALESCE(t.serial,'') <> '' AND t.serial=$2)
     ORDER BY t.created_time DESC NULLS LAST`,
    [id, equipo.serial],
  )
  const ids = (tk.rows as any[]).map((r) => r.id)
  const byTicket = new Map<string, HistorialTransition[]>()
  if (ids.length) {
    const ph = ids.map((_, i) => `$${i + 1}`).join(',')
    const tr = await db.query(
      `SELECT ticket_id, transition_name, from_status, to_status, area, performed_by, performed_at
       FROM ticket_transitions WHERE ticket_id IN (${ph}) ORDER BY performed_at`,
      ids,
    )
    for (const r of tr.rows as any[]) {
      const list = byTicket.get(r.ticket_id) ?? []
      list.push({
        transitionName: r.transition_name ?? null, fromStatus: r.from_status ?? null, toStatus: r.to_status ?? null,
        area: r.area ?? null, performedBy: r.performed_by ?? null, performedAt: r.performed_at ?? null,
      })
      byTicket.set(r.ticket_id, list)
    }
  }
  const tickets: HistorialTicket[] = (tk.rows as any[]).map((r) => ({
    id: r.id, number: `#${r.number}`, subject: r.subject ?? '', status: r.status, statusType: r.status_type ?? null,
    createdAt: r.created_time ?? null, tecnico: r.agent_name ?? null, codigoServicio: r.codigo_servicio ?? null,
    tipoServicio: r.tipo_servicio ?? null, transitions: byTicket.get(r.id) ?? [],
  }))
  return { equipo, tickets }
}
```
(El `IN (${ph})` usa placeholders generados por conteo, no input de usuario → sin inyección.)

- [ ] **Step 4:** Run `npx vitest run server/db/equipos.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/equipos.ts server/db/equipos.test.ts
git commit -m "feat(hv): getEquipoHistorial (tickets por equipo_id/serial + transiciones agrupadas)"
```

---

## Task 4: Endpoint `GET /api/equipos/:id/historial` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts`** añade un test (en el `describe('Gestión de equipos (Subsistema F)')` o uno nuevo):
```ts
  it('GET /api/equipos/:id/historial → equipo + tickets; 404; 401', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cH', contact_name: 'H', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const eqId = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-H', marca: 'Grimm', clientId: 'cH' })).body.id
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ('h1',777,'T','Ingresado','Open','SN-H',$1,now())`, [eqId])
    const res = await request(app).get(`/api/equipos/${eqId}/historial`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo.serial).toBe('SN-H')
    expect(res.body.tickets[0]).toMatchObject({ id: 'h1', number: '#777' })
    expect((await request(app).get('/api/equipos/eq-nope/historial').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/equipos/${eqId}/historial`)).status).toBe(401)
  })
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`** añade `getEquipoHistorial` al import de `./db/equipos` y registra la ruta (junto a las otras de equipos):
```ts
  app.get('/api/equipos/:id/historial', requireAuth(db), async (req, res) => {
    try {
      const h = await getEquipoHistorial(db, String(req.params.id))
      if (!h) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      res.json(h)
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```
(Ruta de dos segmentos `/:id/historial`; no choca con `/manage`, `/facets` ni `PATCH/DELETE /:id`.)

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit` — Expected: PASS + typecheck limpio.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(hv): GET /api/equipos/:id/historial (session-gated)"
```

---

## Task 5: Frontend — página Hoja de vida + accesos

**Files:** Modify `src/api/client.ts`; Create `src/components/HojaDeVida.tsx`; Modify `src/components/EquiposAdmin.tsx`, `src/components/TicketDetailView.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `EquipoHistorial` al import de tipos y la función:
```ts
export function fetchEquipoHistorial(id: string): Promise<EquipoHistorial> {
  return fetch(`/api/equipos/${id}/historial`, { credentials: 'include' }).then((r) => json<EquipoHistorial>(r))
}
```
(Añade `EquipoHistorial` a la línea `import type { ... } from '../../shared/types'`.)

- [ ] **Step 2: Crear `src/components/HojaDeVida.tsx`**
```tsx
import type { EquipoHistorial } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchEquipoHistorial } from '../api/client'

function fmtFecha(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function HojaDeVida({ equipoId, onClose }: { equipoId: string; onClose: () => void }) {
  const { data, loading, error } = useAsync<EquipoHistorial>(() => fetchEquipoHistorial(equipoId), [equipoId])
  const eq = data?.equipo

  return (
    <div className="fixed inset-0 z-[75] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Hoja de vida</h1>
        {eq && <span className="text-[13px] text-white/70 truncate">· {eq.serial} · {eq.marca} {eq.modelo}</span>}
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto bg-[#f4f5f7] p-6">
        {loading && !eq && <div className="text-center text-slate-400 text-[13px]">Cargando…</div>}
        {eq && data && (
          <div className="max-w-[900px] mx-auto">
            <section className="bg-white border border-slate-200 rounded-md p-4 mb-4">
              <h2 className="text-[16px] font-bold text-slate-800">{eq.marca} {eq.modelo} <span className="text-slate-400 font-normal">· {eq.tipo}</span></h2>
              <div className="text-[13px] text-slate-500 mt-1">Serie <b className="text-slate-700">{eq.serial}</b> · Cliente {eq.clienteNombre ?? '—'} · {eq.active ? 'Activo' : 'Inactivo'}</div>
              <div className="text-[12px] text-slate-400 mt-1">{data.tickets.length} ticket(s) en el historial</div>
            </section>

            {data.tickets.length === 0 && <div className="text-[13px] text-slate-400">Este equipo aún no tiene tickets.</div>}

            <div className="flex flex-col gap-3">
              {data.tickets.map((t) => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[14px] font-bold text-slate-800">{t.subject}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    {t.number} · {t.status} · {t.tecnico ?? 'Sin asignar'}{t.codigoServicio ? ` · ${t.codigoServicio}` : ''}{t.createdAt ? ` · ${fmtFecha(t.createdAt)}` : ''}
                  </div>
                  {t.transitions.length > 0 && (
                    <ol className="mt-3 border-l-2 border-slate-100 pl-4 flex flex-col gap-2">
                      {t.transitions.map((x, i) => (
                        <li key={i} className="text-[12px] text-slate-600 relative">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-400" />
                          <b>{x.transitionName ?? 'Transición'}</b> · {x.fromStatus} → {x.toStatus}
                          <span className="text-slate-400"> · {x.area ?? ''} · {x.performedBy ?? ''} · {fmtFecha(x.performedAt)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/EquiposAdmin.tsx`** añade el botón "Hoja de vida" por fila.
  - Import: `import { HojaDeVida } from './HojaDeVida'`.
  - Estado en `EquiposAdmin` (junto a `editing`): `const [historial, setHistorial] = useState<EquipoFull | null>(null)`.
  - En la celda de acciones de cada fila, antes del botón "Editar":
```tsx
                  <button onClick={() => setHistorial(e)} className="text-[12px] text-blue-600 mr-3">Hoja de vida</button>
```
  - Junto al render del formulario (`{(creating || editing) && ...}`), añade:
```tsx
      {historial && <HojaDeVida equipoId={historial.id} onClose={() => setHistorial(null)} />}
```

- [ ] **Step 4: En `src/components/TicketDetailView.tsx`** añade el enlace a la hoja de vida (visible si el ticket tiene `equipoId`).
  - Import: `import { HojaDeVida } from './HojaDeVida'`.
  - Estado (junto a los otros `useState`): `const [showHistorial, setShowHistorial] = useState(false)`.
  - En la fila de metadatos del encabezado del hilo (donde se muestran `ticket?.number`, el técnico y `ticket?.time`), añade tras el bloque del tiempo:
```tsx
                                        {ticket?.equipoId && (
                                          <button onClick={() => setShowHistorial(true)} className="text-[11px] text-blue-600 font-bold border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">history</span> Hoja de vida del equipo
                                          </button>
                                        )}
```
  - Antes del cierre del componente (junto a `{confirmingReply && ...}`), añade:
```tsx
            {showHistorial && ticket?.equipoId && <HojaDeVida equipoId={ticket.equipoId} onClose={() => setShowHistorial(false)} />}
```

- [ ] **Step 5:** Run `npx tsc -b && npx vite build` — Expected: sin errores; build OK. Además `npx eslint src/components/HojaDeVida.tsx src/components/EquiposAdmin.tsx src/components/TicketDetailView.tsx` — 0 errores.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/HojaDeVida.tsx src/components/EquiposAdmin.tsx src/components/TicketDetailView.tsx
git commit -m "feat(hv): página Hoja de vida (solo lectura) + accesos desde Equipos y detalle del ticket"
```

---

## Task 6: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Menú → **Equipos** → en una fila, **Hoja de vida** → se abre la hoja del equipo con sus tickets y, por ticket, la línea de tiempo de transiciones.
2. Crea un ticket en la app con ese equipo (o usa uno con el mismo serial) → aparece en la hoja.
3. Abre un ticket creado en la app → en el encabezado, **"Hoja de vida del equipo"** → abre la hoja del equipo.
4. Equipo sin tickets → "Este equipo aún no tiene tickets."

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(hv): hoja de vida verificada"
```

---

## Notas de cierre
- **Solo lectura**; matching por `equipo_id` o `serial` (incluye históricos de Zoho). Caveat: seriales repetidos podrían mezclar (pocos casos).
- **"Abrir ticket" desde la hoja** queda diferido (evita overlays anidados / import circular); la hoja ya muestra asunto + estado + transiciones.
- **Siguiente**: reportería (G) — métricas agregadas desde `ticket_transitions`.
