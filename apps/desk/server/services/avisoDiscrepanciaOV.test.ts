import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DiscrepanciaOV } from '@ambientalia/zoho-sync/db/repo'
import { avisarDiscrepanciaOV } from './avisoDiscrepanciaOV'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'

/**
 * RQ-AV-13 (delta `derivacion-avisos`, parche-iv11-orden-venta). El sincronizador detecta que Zoho
 * trae, para un ticket con `ov_elegida_en_app_at` puesta, un `orden_venta` distinto al protegido; este
 * servicio crea el aviso a Comercial y deja escrito el valor ya avisado (`ov_zoho_avisada`), en la
 * MISMA transacción (D4), para que una segunda pasada con el mismo valor no repita el aviso.
 */
let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

async function conComercial(): Promise<{ userId: string }> {
  const rol = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  const u = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: rol.id })
  return { userId: u.id }
}

async function ticketMarcado(id: string, numero: number, ovApp: string): Promise<void> {
  await db.query(
    `INSERT INTO tickets (id, number, status, orden_venta, ov_elegida_en_app_at) VALUES ($1,$2,'Ingresado',$3,now())`,
    [id, numero, ovApp],
  )
}

function avisos(rows: unknown[]) { return rows as Array<{ user_id: string; texto: string }> }

describe('avisarDiscrepanciaOV', () => {
  it('crea un aviso por destinatario de Comercial, nombrando las dos órdenes', async () => {
    const { userId } = await conComercial()
    await ticketMarcado('t1', 500, 'OV-APP')
    const d: DiscrepanciaOV = { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' }

    await avisarDiscrepanciaOV(db, d)

    const r = await db.query('SELECT user_id, texto FROM avisos')
    expect(avisos(r.rows)).toHaveLength(1)
    expect(avisos(r.rows)[0].user_id).toBe(userId)
    expect(avisos(r.rows)[0].texto).toContain('OV-ZOHO')
    expect(avisos(r.rows)[0].texto).toContain('OV-APP')
    expect(avisos(r.rows)[0].texto).toContain('500')

    const t = await db.query("SELECT ov_zoho_avisada FROM tickets WHERE id='t1'")
    expect(t.rows[0].ov_zoho_avisada).toBe('OV-ZOHO')
  })

  it('el aviso es solo de bandeja: enviado_at queda NULL (S-3)', async () => {
    await conComercial()
    await ticketMarcado('t1', 500, 'OV-APP')
    await avisarDiscrepanciaOV(db, { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' })
    const r = await db.query('SELECT enviado_at FROM avisos')
    expect(r.rows[0].enviado_at).toBeNull()
  })

  it('una segunda llamada con el mismo valor de Zoho no repite el aviso (anti-ruido)', async () => {
    await conComercial()
    await ticketMarcado('t1', 500, 'OV-APP')
    const d: DiscrepanciaOV = { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' }
    await avisarDiscrepanciaOV(db, d)
    await avisarDiscrepanciaOV(db, d)
    const r = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(r.rows[0].n).toBe(1)
  })

  it('un valor de Zoho nuevo genera otra tanda de avisos', async () => {
    await conComercial()
    await ticketMarcado('t1', 500, 'OV-APP')
    await avisarDiscrepanciaOV(db, { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' })
    await avisarDiscrepanciaOV(db, { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-300' })
    const r = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(r.rows[0].n).toBe(2)
    const t = await db.query("SELECT ov_zoho_avisada FROM tickets WHERE id='t1'")
    expect(t.rows[0].ov_zoho_avisada).toBe('OV-300')
  })

  it('sin destinatarios, la marca anti-ruido se escribe igual (S-5)', async () => {
    // Sin conComercial(): no hay nadie que reciba, pero el UPDATE de ov_zoho_avisada no depende de eso.
    await ticketMarcado('t1', 500, 'OV-APP')
    await avisarDiscrepanciaOV(db, { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' })
    const t = await db.query("SELECT ov_zoho_avisada FROM tickets WHERE id='t1'")
    expect(t.rows[0].ov_zoho_avisada).toBe('OV-ZOHO')
    const r = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(r.rows[0].n).toBe(0)
  })

  it('nunca lanza: un ticket inexistente no revienta la pasada del sincronizador', async () => {
    await expect(avisarDiscrepanciaOV(db, { ticketId: 'no-existe', numero: null, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' }))
      .resolves.toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// Atomicidad (D4) — Plan B, igual que `db/transaccion.test.ts` (T0: pg-mem no revierte un ROLLBACK
// de verdad, así que la prueba de "si falla el INSERT de avisos, el UPDATE también se revierte" no se
// puede comprobar mirando filas tras la llamada: hace falta un rastreador de verbos SQL).
// ══════════════════════════════════════════════════════════════════════════════════════════════════

interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }

function rastreador(failOn: string): { db: Queryable & ConPool; calls: string[] } {
  const calls: string[] = []
  const ejecutar = async (sql: string) => {
    const verb = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push(verb)
    if (verb === failOn) throw new Error(`boom (${failOn})`)
    if (/UPDATE tickets/i.test(sql)) return { rows: [{ number: 500, orden_venta: 'OV-APP' }] }
    if (/FROM users/i.test(sql)) return { rows: [{ id: 'u1', email: 'a@x.co', name: 'A', is_admin: false, role_areas: ['Comercial'] }] }
    return { rows: [] }
  }
  const db: Queryable & ConPool = { query: ejecutar, connect: async () => ({ query: ejecutar, release: () => {} }) }
  return { db, calls }
}

describe('avisarDiscrepanciaOV · atomicidad (Plan B, rastreador de verbos)', () => {
  it('si crearAviso falla (INSERT), el UPDATE de ov_zoho_avisada queda en la MISMA transacción revertida', async () => {
    const { db, calls } = rastreador('INSERT')
    await expect(avisarDiscrepanciaOV(db, { ticketId: 't1', numero: 500, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' }))
      .resolves.toBeUndefined() // nunca lanza, ni siquiera con el fallo dentro
    expect(calls).toEqual(['BEGIN', 'UPDATE', 'SELECT', 'INSERT', 'ROLLBACK'])
  })
})
