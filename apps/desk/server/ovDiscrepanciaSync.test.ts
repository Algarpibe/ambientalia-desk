import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { upsertEquipo } from './db/equipos'
import { createRole, actualizarRecibeAvisos } from './auth/roles'
import { createUser } from './auth/users'
import { avisarDiscrepanciaOV } from './services/avisoDiscrepanciaOV'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

function page(t: unknown[]) { return new Response(JSON.stringify({ data: t }), { status: 200 }) }
function zohoTicket(ov: string) {
  return { id: 't1', ticketNumber: '5000', subject: 's', status: 'Ingresado', statusType: 'Open', customFields: { 'Orden de Venta': ov } }
}

/**
 * Extremo a extremo (tasks.md, Fase 6). Punta a punta de `parche-iv11-orden-venta` (F1B-11):
 *
 * 1. La remisión de entrada captura una orden de venta libre → el `UPDATE` deja la marca
 *    `ov_elegida_en_app_at` (RQ-RE-16 modificado).
 * 2. Una pasada del sincronizador con OTRA orden de venta en Zoho no pisa la de la aplicación
 *    (`zoho-sync` RQ-ZS-01 modificado) y genera un aviso a Comercial (RQ-AV-13).
 * 3. Una segunda pasada con el MISMO valor de Zoho no repite el aviso (anti-ruido).
 * 4. Un valor de Zoho nuevo genera otro aviso.
 *
 * El ticket es de origen Zoho (`managed_by_app: false`): es el caso real de IV-11 — un ticket
 * sincronizado al que un escritor de la app (aquí, la remisión) le fija la orden de venta.
 */
describe('OV: remisión → sync → aviso de discrepancia (extremo a extremo)', () => {
  it('marca en la remisión, avisa en la primera discrepancia, calla en la repetida, avisa de nuevo con valor distinto', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-p1', '18A20070'))
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    await db.query(
      `INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
       VALUES ('t1', 5000, 'OV asignada', false, 'cli1', 'Mantenimiento', 'eq-p1', 'Grimm', 'EDM180C', '18A1')`,
    )
    await db.query(
      "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov1','OV-2026-300','cli1','2026-07-15','{\"order_status\":\"open\"}')",
    )
    const rol = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, rol.id, true)
    await createUser(db, { email: 'coord@x.co', name: 'Coord', passwordHash: 'h', roleId: rol.id })

    // 1) La remisión captura la orden de venta libre.
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'], salesOrderId: 'ov1' })
    expect(res.status).toBe(201)
    const marca = await db.query("SELECT ov_elegida_en_app_at, orden_venta FROM tickets WHERE id='t1'")
    expect(marca.rows[0].ov_elegida_en_app_at).not.toBeNull()
    expect(marca.rows[0].orden_venta).toBe('OV-2026-300')

    // 2), 3), 4) Tres pasadas del sincronizador, cableado como en `apps/desk/server/index.ts`.
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([zohoTicket('OV-ZOHO-1')]))
      .mockResolvedValueOnce(page([zohoTicket('OV-ZOHO-1')]))
      .mockResolvedValueOnce(page([zohoTicket('OV-ZOHO-2')]))
    const sync = createSync({
      zohoFetch, db, config: { departmentId: 'DEP' } as AppConfig,
      alDiscrepanciaOV: (d) => avisarDiscrepanciaOV(db, d),
    })

    // Dos destinatarios de Comercial: el coordinador del rol y el admin de `adminCookie()` (todos los
    // administradores activos reciben copia, `db/avisos.ts` `destinatariosDeArea`).
    await sync.syncRecent()
    let n = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(n.rows[0].n, 'primera discrepancia: un aviso por destinatario (2)').toBe(2)
    // La orden de venta de la aplicación sigue intacta: el sync no la pisó.
    expect((await db.query("SELECT orden_venta FROM tickets WHERE id='t1'")).rows[0].orden_venta).toBe('OV-2026-300')

    await sync.syncRecent()
    n = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(n.rows[0].n, 'mismo valor de Zoho: sin aviso nuevo').toBe(2)

    await sync.syncRecent()
    n = await db.query('SELECT COUNT(*)::int AS n FROM avisos')
    expect(n.rows[0].n, 'valor de Zoho nuevo: otra tanda de avisos (2 más)').toBe(4)
  })
})
