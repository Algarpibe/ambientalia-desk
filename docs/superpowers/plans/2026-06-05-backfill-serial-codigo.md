# Backfill de serial/código desde el asunto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poblar `serial` y `codigo_servicio` extrayéndolos del asunto: hacia adelante al sincronizar, y con un backfill (endpoint admin) sobre los tickets existentes.

**Architecture:** Helper puro `extractServiceCode(text)` en `shared/`; `ticketRowFromZoho` lo usa como fallback cuando Zoho no trae el campo; `backfillSerialFromSubject(db)` lo aplica a los tickets existentes vía `POST /api/admin/backfill-serial` (admin).

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest. Spec: `docs/superpowers/specs/2026-06-05-backfill-serial-codigo-design.md`.

**Contexto del repo:**
- `shared/ticketCreate.ts`: ya tiene `parseCodigoFromPotential` (regex de código de 4 partes). Añadimos `extractServiceCode` (fecha opcional).
- `server/db/mappers.ts`: `ticketRowFromZoho(raw)` promueve columnas desde `raw.customFields[label]` (incl. `serial`←"Serial", `codigo_servicio`←"Código Servicio"); tiene `row.subject`. `mappers.test.ts` importa `ticketRowFromZoho`.
- `server/app.ts`: importa `requireAuth, requireAdmin as requireSuperAdmin`; `app.test.ts` tiene `adminCookie()`, `userCookie(areas)`, `appWith()`, `db`, `request`.

---

## Estructura de archivos
- Modify `shared/ticketCreate.ts` (+ `.test.ts`) — `extractServiceCode`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — fallback en `ticketRowFromZoho`.
- Create `server/backfillSerial.ts` (+ `.test.ts`) — `backfillSerialFromSubject`.
- Modify `server/app.ts` (+ `app.test.ts`) — `POST /api/admin/backfill-serial`.

---

## Task 1: `extractServiceCode` (TDD puro)

**Files:** Modify `shared/ticketCreate.ts`, `shared/ticketCreate.test.ts`

- [ ] **Step 1: Añadir a `shared/ticketCreate.test.ts`**
```ts
import { extractServiceCode } from './ticketCreate'

describe('extractServiceCode', () => {
  it('extrae serial + código de 4 partes', () => {
    expect(extractServiceCode('Servicio Técnico CHEMILAB GRIMM EDM 180C MT_18A19042_EDM180C_260305'))
      .toEqual({ serial: '18A19042', codigo: 'MT_18A19042_EDM180C_260305' })
  })
  it('extrae código de 3 partes (sin fecha)', () => {
    expect(extractServiceCode('Equipo Nuevo Laboratorio HV_219587_Defender520'))
      .toEqual({ serial: '219587', codigo: 'HV_219587_Defender520' })
  })
  it('null si no hay código', () => {
    expect(extractServiceCode('Servicio Técnico sin código')).toBeNull()
    expect(extractServiceCode(null)).toBeNull()
  })
})
```
(Si `describe`/`it`/`expect` ya están importados arriba en el archivo, no dupliques el import de vitest; solo añade el import de `extractServiceCode` si falta.)

- [ ] **Step 2:** Run `npx vitest run shared/ticketCreate.test.ts` — confirm FAIL.

- [ ] **Step 3: Añadir a `shared/ticketCreate.ts`** (junto a `parseCodigoFromPotential`):
```ts
/** Extrae el código de servicio y su serial de un texto (p.ej. el asunto del ticket). Fecha opcional. */
export function extractServiceCode(text: string | null | undefined): { serial: string; codigo: string } | null {
  if (!text) return null
  const m = text.match(/\b(MT|CG|HV|SR|PRO)_([^_\s]+)_([^_\s]+)(?:_(\d{6}))?\b/)
  return m ? { serial: m[2], codigo: m[0] } : null
}
```

- [ ] **Step 4:** Run `npx vitest run shared/ticketCreate.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add shared/ticketCreate.ts shared/ticketCreate.test.ts
git commit -m "feat(serial): extractServiceCode (serial+codigo del asunto, fecha opcional)"
```

---

## Task 2: Fallback en `ticketRowFromZoho` (TDD)

**Files:** Modify `server/db/mappers.ts`, `server/db/mappers.test.ts`

- [ ] **Step 1: Añadir a `server/db/mappers.test.ts`** (asegura `ticketRowFromZoho` en el import desde `./mappers`):
```ts
describe('ticketRowFromZoho (serial/codigo desde el asunto)', () => {
  it('rellena serial/codigo_servicio del asunto cuando Zoho viene vacío', () => {
    const row = ticketRowFromZoho({ id: 't1', ticketNumber: '190', subject: 'Servicio Técnico CHEMILAB MT_18A19042_EDM180C_260305', status: 'Finalizado', customFields: {} } as any)
    expect(row.serial).toBe('18A19042')
    expect(row.codigo_servicio).toBe('MT_18A19042_EDM180C_260305')
  })
  it('no sobreescribe lo que Zoho sí trae', () => {
    const row = ticketRowFromZoho({ id: 't2', ticketNumber: '191', subject: 'X MT_AAA_BBB_260101', status: 'X', customFields: { Serial: 'ZHO-SER', 'Código Servicio': 'ZHO-COD' } } as any)
    expect(row.serial).toBe('ZHO-SER')
    expect(row.codigo_servicio).toBe('ZHO-COD')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/mappers.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/mappers.ts`:**
  - Añade el import (arriba): `import { extractServiceCode } from '../../shared/ticketCreate'`.
  - En `ticketRowFromZoho`, **antes del `return row as TicketRow`** (tras `row.custom_fields = cf`), añade:
```ts
  // Históricos de Zoho: si el serial/código no vienen en customFields, extraerlos del asunto.
  const ext = extractServiceCode(row.subject)
  if (ext) {
    if (!row.serial) row.serial = ext.serial
    if (!row.codigo_servicio) row.codigo_servicio = ext.codigo
  }
```

- [ ] **Step 4:** Run `npx vitest run server/db/mappers.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(serial): ticketRowFromZoho rellena serial/codigo del asunto si Zoho viene vacío"
```

---

## Task 3: `backfillSerialFromSubject` + endpoint (TDD)

**Files:** Create `server/backfillSerial.ts`, `server/backfillSerial.test.ts`; Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: Escribir `server/backfillSerial.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { backfillSerialFromSubject } from './backfillSerial'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('backfillSerialFromSubject', () => {
  it('rellena vacíos desde el asunto, idempotente, no toca managed_by_app', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('h1',1,'Servicio MT_18A19042_EDM180C_260305','Finalizado',false)")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('app1',2,'X MT_AAA_BBB_260101','Ingresado',true,'APP-SER')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('no',3,'Sin codigo','X',false)")
    expect(await backfillSerialFromSubject(db)).toEqual({ updated: 1 })
    const h1 = (await db.query("SELECT serial, codigo_servicio FROM tickets WHERE id='h1'")).rows[0]
    expect(h1).toMatchObject({ serial: '18A19042', codigo_servicio: 'MT_18A19042_EDM180C_260305' })
    expect((await db.query("SELECT serial FROM tickets WHERE id='app1'")).rows[0].serial).toBe('APP-SER')
    expect(await backfillSerialFromSubject(db)).toEqual({ updated: 0 })
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/backfillSerial.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/backfillSerial.ts`**
```ts
import type { Queryable } from './db/migrate'
import { extractServiceCode } from '../shared/ticketCreate'

export async function backfillSerialFromSubject(db: Queryable): Promise<{ updated: number }> {
  const r = await db.query(
    `SELECT id, subject, serial, codigo_servicio FROM tickets
     WHERE managed_by_app = false AND (COALESCE(serial,'') = '' OR COALESCE(codigo_servicio,'') = '')`,
  )
  let updated = 0
  for (const row of r.rows as any[]) {
    const ext = extractServiceCode(row.subject)
    if (!ext) continue
    const newSerial = (row.serial == null || row.serial === '') ? ext.serial : row.serial
    const newCodigo = (row.codigo_servicio == null || row.codigo_servicio === '') ? ext.codigo : row.codigo_servicio
    if (newSerial !== row.serial || newCodigo !== row.codigo_servicio) {
      await db.query('UPDATE tickets SET serial=$1, codigo_servicio=$2, updated_at=now() WHERE id=$3', [newSerial, newCodigo, row.id])
      updated++
    }
  }
  return { updated }
}
```

- [ ] **Step 4:** Run `npx vitest run server/backfillSerial.test.ts` — confirm PASS.

- [ ] **Step 5: En `server/app.test.ts`** añade un bloque:
```ts
import { backfillSerialFromSubject } from './backfillSerial'

describe('POST /api/admin/backfill-serial (admin)', () => {
  it('admin → {updated}; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('b1',1,'Servicio MT_18A19042_EDM180C_260305','Finalizado',false)")
    const { app } = appWith()
    const res = await request(app).post('/api/admin/backfill-serial').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body.updated).toBe(1)
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-serial').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-serial')).status).toBe(401)
  })
})
```
(El import `backfillSerialFromSubject` se usa solo si quieres verificar en el test directamente; no es obligatorio. Si eslint marca import sin usar, quítalo — el test ya valida vía el endpoint.)

- [ ] **Step 6:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 7: En `server/app.ts`** añade el import y la ruta (junto a las otras rutas admin / no-`/api/tickets`):
```ts
import { backfillSerialFromSubject } from './backfillSerial'
```
```ts
  app.post('/api/admin/backfill-serial', requireAuth(db), requireSuperAdmin, async (_req, res) => {
    try {
      res.json(await backfillSerialFromSubject(db))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 8:** Run `npx vitest run server/app.test.ts server/backfillSerial.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts server/backfillSerial.ts` — Expected: tests PASS; typecheck clean; eslint 0 errores.

- [ ] **Step 9: Commit**
```bash
git add server/backfillSerial.ts server/backfillSerial.test.ts server/app.ts server/app.test.ts
git commit -m "feat(serial): backfillSerialFromSubject + POST /api/admin/backfill-serial (admin)"
```

---

## Task 4: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Como **admin**, dispara una vez: `POST /api/admin/backfill-serial` (con la cookie de sesión; p.ej. desde la consola del navegador estando logueado:
   `fetch('/api/admin/backfill-serial', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)`).
   Debe devolver `{ updated: N }` con N > 0.
2. En PgWeb: `SELECT count(*) FROM tickets WHERE COALESCE(serial,'') <> '';` debe ser mucho mayor que 1.
   `SELECT number, serial, codigo_servicio FROM tickets WHERE serial='18A19042';` muestra los históricos ya poblados.
3. La búsqueda de equipos y la hoja de vida siguen funcionando (ahora también por la columna `serial`).

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(serial): backfill verificado"
```

---

## Notas de cierre
- **Solo rellena lo vacío** y **solo `managed_by_app=false`**; idempotente.
- **Forward**: los tickets que se re-sincronicen (al abrirlos o en el refresco) ya quedan con serial/código del asunto.
- El endpoint es **manual** (un disparo tras desplegar); no corre en cada arranque.
