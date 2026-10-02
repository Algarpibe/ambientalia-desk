import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * Enlace del cliente provisional (RQ-TC-32), validación del equipo (RQ-HV-18) y caracterización de D12 (F1B-15, lote 3).
 * Arnés real: HTTP contra pg-mem. Orden de las respuestas = escalera A < B < C < D de `transitions-st` §3.8:
 * A existencia (`404`) · B estado y permiso (`403`, luego `409`) · C contenido (`422`). Un fallo a mitad se mira por la
 * secuencia de verbos, porque pg-mem no revierte un `ROLLBACK` de verdad (`services/altaManual.test.ts`, TC-31c).
 */
const PROV = 'prov-1'
const COMERCIAL = ['Comercial']
const SERVICIO = ['Servicio Técnico']

async function sembrar(): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c1','Cliente Uno','900111222')")
  await db.query(
    "INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo) VALUES ($1,'Acme Provisional','800555666','Ana','300','a@p.co','m')",
    [PROV],
  )
  await db.query("INSERT INTO tickets (id, number, subject, status, client_id) VALUES ('t1', 9001, 'Uno', 'Ticket creado', $1), ('t2', 9002, 'Dos', 'Ticket creado', $1), ('t3', 9003, 'Ajeno', 'Ticket creado', 'c1')", [PROV])
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo, client_id, cliente_nombre, pendiente_validar) VALUES ('eq-1','S1','Horiba','APSA','Analizador',$1,'Acme Provisional',true), ('eq-2','S2','Horiba','APSA','Analizador','c1','Cliente Uno',null)", [PROV])
}
const enlazar = (cookie: string, id: string, cuerpo: unknown = { contactId: 'c1' }, app = appWith().app) =>
  request(app).post(`/api/clientes-provisionales/${id}/enlace`).set('Cookie', cookie).send(cuerpo as object)
const estadoDelProvisional = async () => (await db.query('SELECT enlazado_a, enlazado_por_nombre, enlazado_at FROM public.clientes_provisionales WHERE id=$1', [PROV])).rows[0]
const clientIds = async () => ({
  tickets: (await db.query("SELECT id, client_id FROM tickets WHERE id IN ('t1','t2','t3') ORDER BY id")).rows.map((r: { client_id: string }) => r.client_id),
  equipo: (await db.query("SELECT client_id, cliente_nombre FROM equipos WHERE id='eq-1'")).rows[0],
})
const SIN_CAMBIOS = { tickets: [PROV, PROV, 'c1'], equipo: { client_id: PROV, cliente_nombre: 'Acme Provisional' } }
const contarCambios = async () => (await db.query('SELECT COUNT(*)::int AS n FROM public.equipos_cambios')).rows[0].n as number

describe('RQ-TC-32 · enlace del provisional con un contacto de Books', () => {
  beforeEach(sembrar)

  it('Comercial enlaza: 200, tickets y equipo pasan al contacto de Books, el provisional queda enlazado y cada equipo deja su fila clientId', async () => {
    const res = await enlazar(await userCookie(COMERCIAL), PROV)
    expect(res.status).toBe(200)
    expect(await clientIds()).toEqual({ tickets: ['c1', 'c1', 'c1'], equipo: { client_id: 'c1', cliente_nombre: 'Cliente Uno' } })
    const p = await estadoDelProvisional()
    expect(p.enlazado_a).toBe('c1')
    expect(p.enlazado_por_nombre).toBe('Op')
    expect(p.enlazado_at).not.toBeNull()
    expect((await db.query("SELECT equipo_id, campo, valor_anterior, valor_nuevo, usuario_nombre FROM public.equipos_cambios")).rows).toEqual([
      { equipo_id: 'eq-1', campo: 'clientId', valor_anterior: PROV, valor_nuevo: 'c1', usuario_nombre: 'Op' },
    ])
  })

  it('el administrador también puede, y el cliente enlazado ya se resuelve por Books (provisional: false)', async () => {
    const cookie = await adminCookie()
    expect((await enlazar(cookie, PROV)).status).toBe(200)
    const ficha = await request(appWith().app).get(`/api/clients/${PROV}`).set('Cookie', cookie)
    expect(ficha.status).toBe(200)
    expect(ficha.body.provisional).toBe(false)
    expect(ficha.body.id).toBe('c1')
  })

  it('sin Comercial ni administración: 403 y ningún client_id cambia', async () => {
    const res = await enlazar(await userCookie(SERVICIO), PROV)
    expect(res.status).toBe(403)
    expect(await clientIds()).toEqual(SIN_CAMBIOS)
    expect((await estadoDelProvisional()).enlazado_a).toBeNull()
    expect(await contarCambios()).toBe(0)
  })

  it('contacto inexistente en Books: 404 y no se escribe nada', async () => {
    const res = await enlazar(await userCookie(COMERCIAL), PROV, { contactId: 'no-existe' })
    expect(res.status).toBe(404)
    expect(await clientIds()).toEqual(SIN_CAMBIOS)
    expect((await estadoDelProvisional()).enlazado_a).toBeNull()
  })

  it('provisional inexistente: 404', async () => {
    expect((await enlazar(await userCookie(COMERCIAL), 'prov-no-existe')).status).toBe(404)
  })

  it('doble enlace: el segundo es 409 y no reescribe nada más', async () => {
    const cookie = await userCookie(COMERCIAL)
    expect((await enlazar(cookie, PROV)).status).toBe(200)
    await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('c2','Cliente Dos')")
    const otra = await enlazar(cookie, PROV, { contactId: 'c2' })
    expect(otra.status).toBe(409)
    expect((await estadoDelProvisional()).enlazado_a).toBe('c1')
    expect((await clientIds()).tickets).toEqual(['c1', 'c1', 'c1'])
    expect(await contarCambios()).toBe(1)
  })

  it('sin contactId o con un id con prefijo provisional: 422 y no se escribe nada', async () => {
    const cookie = await userCookie(COMERCIAL)
    for (const cuerpo of [{}, { contactId: '' }, { contactId: 'prov-otro' }, { contactId: 42 }]) {
      const res = await enlazar(cookie, PROV, cuerpo)
      expect(res.status, JSON.stringify(cuerpo)).toBe(422)
    }
    expect(await clientIds()).toEqual(SIN_CAMBIOS)
    expect((await estadoDelProvisional()).enlazado_a).toBeNull()
  })

  describe('orden de las guardas: A < B < C (cada caso rompe DOS a la vez)', () => {
    it('A antes que B: provisional inexistente y sin permiso → 404, no 403', async () => {
      expect((await enlazar(await userCookie(SERVICIO), 'prov-no-existe')).status).toBe(404)
    })
    it('A antes que B: contacto inexistente y sin permiso → 404, no 403', async () => {
      expect((await enlazar(await userCookie(SERVICIO), PROV, { contactId: 'no-existe' })).status).toBe(404)
    })
    it('A antes que C: provisional inexistente y sin contactId → 404, no 422', async () => {
      expect((await enlazar(await userCookie(COMERCIAL), 'prov-no-existe', {})).status).toBe(404)
    })
    it('B (permiso) antes que B (estado): ya enlazado y sin permiso → 403, no 409', async () => {
      await enlazar(await adminCookie(), PROV)
      expect((await enlazar(await userCookie(SERVICIO), PROV)).status).toBe(403)
    })
    it('B antes que C: sin permiso y sin contactId → 403, no 422', async () => {
      expect((await enlazar(await userCookie(SERVICIO), PROV, {})).status).toBe(403)
    })
    it('B antes que C: ya enlazado y sin contactId → 409, no 422', async () => {
      await enlazar(await adminCookie(), PROV)
      expect((await enlazar(await userCookie(COMERCIAL), PROV, {})).status).toBe(409)
    })
  })

  it('fallo a mitad: si la reescritura de equipos falla, ROLLBACK, ningún COMMIT, y la respuesta no es 200', async () => {
    interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
    const sqls: string[] = []
    const pool = db as unknown as ConPool
    const espia = {
      query: db.query.bind(db),
      connect: async () => {
        const c = await pool.connect()
        return {
          query: ((sql: string, p?: unknown[]) => {
            sqls.push(sql.trim().replace(/\s+/g, ' '))
            if (/^UPDATE equipos/i.test(sql.trim())) throw new Error('boom')
            return c.query(sql, p)
          }) as Queryable['query'],
          release: () => c.release(),
        }
      },
    } as unknown as Queryable
    const res = await enlazar(await userCookie(COMERCIAL), PROV, { contactId: 'c1' }, appWith({}, espia).app)
    expect(res.status).toBe(500)
    const verbos = sqls.map((s) => s.split(' ')[0].toUpperCase())
    expect(verbos[0]).toBe('BEGIN')
    expect(verbos.at(-1)).toBe('ROLLBACK')
    expect(verbos).not.toContain('COMMIT')
    // Los tickets y el provisional ya se habían escrito DENTRO de la transacción: lo que importa es que el cierre es ROLLBACK.
    expect(sqls.some((s) => /^UPDATE public\.clientes_provisionales/i.test(s))).toBe(true)
    expect(sqls.some((s) => /^UPDATE tickets/i.test(s))).toBe(true)
  })

  it('TC-33 · el enlace no llama a Zoho ni escribe en books.*', async () => {
    const sqls: string[] = []
    const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
    const anotar = (q: Queryable['query']): Queryable['query'] => ((sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ')); return q(sql, p) }) as Queryable['query']
    const espia = { query: anotar(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: anotar(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
    const { app, zohoFetch, sync } = appWith({}, espia)
    expect((await enlazar(await userCookie(COMERCIAL), PROV, { contactId: 'c1' }, app)).status).toBe(200)
    expect(sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s) && /\bbooks\./i.test(s))).toEqual([])
    expect(zohoFetch).toHaveBeenCalledTimes(0)
    for (const f of Object.values(sync)) expect(f).toHaveBeenCalledTimes(0)
  })
})

describe('RQ-HV-18 · validación del equipo pendiente', () => {
  beforeEach(sembrar)
  const validar = (cookie: string, id = 'eq-1') => request(appWith().app).post(`/api/equipos/${id}/validacion`).set('Cookie', cookie).send({})
  const pendiente = async () => (await db.query("SELECT pendiente_validar FROM equipos WHERE id='eq-1'")).rows[0].pendiente_validar as boolean | null

  it('Comercial valida: 200, la marca desaparece y equipos_cambios gana una fila «pendiente» → «validado» con autor', async () => {
    const res = await validar(await userCookie(COMERCIAL))
    expect(res.status).toBe(200)
    expect(await pendiente()).not.toBe(true)
    expect((await db.query('SELECT equipo_id, campo, valor_anterior, valor_nuevo, usuario_nombre FROM public.equipos_cambios')).rows).toEqual([
      { equipo_id: 'eq-1', campo: 'validacion', valor_anterior: 'pendiente', valor_nuevo: 'validado', usuario_nombre: 'Op' },
    ])
  })

  it('sin Comercial ni administración: 403, sigue pendiente y no se inserta traza', async () => {
    const res = await validar(await userCookie(SERVICIO))
    expect(res.status).toBe(403)
    expect(await pendiente()).toBe(true)
    expect(await contarCambios()).toBe(0)
  })

  it('un equipo «no catalogado» se valida sin catálogo y su texto de modelo no cambia', async () => {
    await db.query("UPDATE equipos SET modelo='X-200 prototipo', modelo_id=NULL WHERE id='eq-1'")
    expect((await validar(await adminCookie())).status).toBe(200)
    expect((await db.query("SELECT modelo, modelo_id FROM equipos WHERE id='eq-1'")).rows[0]).toEqual({ modelo: 'X-200 prototipo', modelo_id: null })
  })

  it('un equipo que no está pendiente: 409 y no se inserta traza', async () => {
    const res = await validar(await adminCookie(), 'eq-2')
    expect(res.status).toBe(409)
    expect(await contarCambios()).toBe(0)
  })

  it('validar dos veces: la segunda es 409 y la traza no se duplica', async () => {
    const cookie = await userCookie(COMERCIAL)
    expect((await validar(cookie)).status).toBe(200)
    expect((await validar(cookie)).status).toBe(409)
    expect(await contarCambios()).toBe(1)
  })

  it('equipo inexistente: 404', async () => {
    expect((await validar(await adminCookie(), 'eq-no-existe')).status).toBe(404)
  })

  it('orden: A antes que B (inexistente y sin permiso → 404) y B permiso antes que B estado (validado y sin permiso → 403)', async () => {
    const cookie = await userCookie(SERVICIO)
    expect((await validar(cookie, 'eq-no-existe')).status).toBe(404)
    expect((await validar(cookie, 'eq-2')).status).toBe(403)
  })

  it('TC-33 · validar no llama a Zoho', async () => {
    const { app, zohoFetch } = appWith()
    expect((await request(app).post('/api/equipos/eq-1/validacion').set('Cookie', await adminCookie()).send({})).status).toBe(200)
    expect(zohoFetch).toHaveBeenCalledTimes(0)
  })
})

/**
 * D12 (RQ-ZS-16, RQ-TC-34) · CARACTERIZACIÓN: sin cambios de código, un id provisional lo rechazan las rutas que exigen
 * cliente de Books, porque `getClient` de Books no ve provisionales. Nacen verdes; su rojo previo es la mutación
 * `getClient` → `obtenerCliente` en `contratos.ts:52` (la ruta de contratos aceptaría al provisional).
 */
describe('D12 · un id provisional lo rechazan contratos, Top 5, mantenedor y alta de equipos', () => {
  beforeEach(sembrar)

  it('contratos.ts:52 · POST /api/contratos con un cliente provisional: 422 «El cliente no existe»', async () => {
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(COMERCIAL))
      .send({ clientId: PROV, lote: 'OV-2026-001', fechaInicio: '2026-01-01', fechaFin: '2026-12-31' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('El cliente no existe')
    expect((await db.query('SELECT COUNT(*)::int AS n FROM public.contratos')).rows[0].n).toBe(0)
  })

  it('prioridad.ts:30 y :38 · GET y PUT de la prioridad de un cliente provisional: 404', async () => {
    const cookie = await adminCookie()
    const app = appWith().app
    expect((await request(app).get(`/api/clients/${PROV}/prioridad`).set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).put(`/api/clients/${PROV}/prioridad`).set('Cookie', cookie).send({ top5: true, prioridad: 'High' })).status).toBe(404)
    expect((await db.query('SELECT COUNT(*)::int AS n FROM public.cliente_prioridad')).rows[0].n).toBe(0)
  })

  it('equipos.ts:56 · POST /api/equipos con un cliente provisional: 422 «Cliente no encontrado»', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('ma-1','Horiba')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('ti-1','Analizador')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-1','ma-1','APSA-370','ti-1')")
    const res = await request(appWith().app).post('/api/equipos').set('Cookie', await adminCookie()).send({ serial: 'SN-NUEVO', clientId: PROV, modeloId: 'mo-1' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Cliente no encontrado')
    expect((await db.query("SELECT COUNT(*)::int AS n FROM equipos WHERE serial='SN-NUEVO'")).rows[0].n).toBe(0)
  })

  it('equipos.ts:171 · un provisional como mantenedor: 422 «Mantenedor no encontrado»', async () => {
    const res = await request(appWith().app).patch('/api/equipos/eq-2').set('Cookie', await adminCookie()).send({ mantenedorId: PROV })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Mantenedor no encontrado')
  })
})

describe('Lote 4 · la ficha y la hoja de vida dicen si el equipo está pendiente de validar', () => {
  beforeEach(sembrar)

  it('GET /api/equipos/:id y /historial llevan pendienteValidar:true en el pendiente y nada en el validado', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const ficha = (id: string) => request(app).get(`/api/equipos/${id}`).set('Cookie', cookie)
    const hoja = (id: string) => request(app).get(`/api/equipos/${id}/historial`).set('Cookie', cookie)
    expect((await ficha('eq-1')).body.pendienteValidar).toBe(true)
    expect((await hoja('eq-1')).body.equipo.pendienteValidar).toBe(true)
    expect((await ficha('eq-2')).body.pendienteValidar).toBeUndefined()
    expect((await hoja('eq-2')).body.equipo.pendienteValidar).toBeUndefined()
  })
})
