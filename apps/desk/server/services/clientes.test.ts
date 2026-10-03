import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { obtenerCliente, buscarClientes, clienteParaEquipo } from './clientes'

instalarArnes()

/**
 * RQ-TC-34 (F1B-15, lote 1): el servidor de la app resuelve los clientes provisionales con una SEGUNDA
 * consulta, sin tocar la vista `public.clients` ni `books/repo.ts`. Los siete escenarios del requisito.
 */
const contacto = (id: string, nombre: string, nit = '900111222') =>
  db.query('INSERT INTO books.contacts (contact_id,contact_name,nit) VALUES ($1,$2,$3)', [id, nombre, nit])
const provisional = (id: string, razon: string, nit = '800555666', enlazadoA: string | null = null) =>
  db.query(
    `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo, enlazado_a)
     VALUES ($1,$2,$3,'Ana Ruiz','3001112233','ana@prov.co','no está en Books',$4)`, [id, razon, nit, enlazadoA])

describe('buscarClientes · búsqueda con provisionales marcados', () => {
  it('con provisionales devuelve ambos: Books con provisional:false y el provisional con provisional:true', async () => {
    await contacto('c1', 'Acme SAS')
    await provisional('prov-1', 'Acme Provisional')
    const r = await buscarClientes(db, 'Acme', true)
    expect(r.map((c) => [c.id, c.name, c.provisional])).toEqual([['c1', 'Acme SAS', false], ['prov-1', 'Acme Provisional', true]])
  })

  it('sin pedir provisionales devuelve sólo los de Books, marcados provisional:false (D13)', async () => {
    await contacto('c1', 'Acme SAS')
    await provisional('prov-1', 'Acme Provisional')
    const r = await buscarClientes(db, 'Acme', false)
    expect(r.map((c) => [c.id, c.provisional])).toEqual([['c1', false]])
  })

  it('el provisional también se encuentra por NIT, y uno que no casa no aparece', async () => {
    await provisional('prov-1', 'Zeta Ltda', '800555666')
    await provisional('prov-2', 'Otra Cosa', '700000000')
    const r = await buscarClientes(db, '800555', true)
    expect(r.map((c) => c.id)).toEqual(['prov-1'])
  })

  it('un provisional enlazado NO se lista como provisional', async () => {
    await contacto('c9', 'Acme Oficial')
    await provisional('prov-1', 'Acme Provisional', '800555666', 'c9')
    expect(await buscarClientes(db, 'Provisional', true)).toEqual([])
    expect((await buscarClientes(db, 'Acme', true)).map((c) => [c.id, c.provisional])).toEqual([['c9', false]])
  })
})

describe('obtenerCliente · ficha', () => {
  it('la ficha de un provisional no enlazado lleva los cinco datos y provisional:true', async () => {
    await provisional('prov-1', 'Acme Provisional')
    expect(await obtenerCliente(db, 'prov-1')).toMatchObject({
      id: 'prov-1', name: 'Acme Provisional', nit: '800555666', personaContacto: 'Ana Ruiz', telefono: '3001112233', email: 'ana@prov.co', provisional: true,
    })
  })

  it('la ficha de un id de Books es la de siempre más provisional:false', async () => {
    await contacto('c1', 'Acme SAS')
    const antes = await getClient(db, 'c1')
    expect(antes).not.toBeNull()
    expect(await obtenerCliente(db, 'c1')).toEqual({ ...antes, provisional: false })
  })

  it('un provisional enlazado se resuelve por el contacto de Books de enlazado_a', async () => {
    await contacto('c9', 'Acme Oficial')
    await provisional('prov-1', 'Acme Provisional', '800555666', 'c9')
    expect(await obtenerCliente(db, 'prov-1')).toMatchObject({ id: 'c9', name: 'Acme Oficial', provisional: false })
  })

  it('un id que no está en Books ni en provisionales es null, con o sin el prefijo', async () => {
    expect(await obtenerCliente(db, 'no-existe')).toBeNull()
    expect(await obtenerCliente(db, 'prov-no-existe')).toBeNull()
  })

  it('prioridad de Books: para un id de Books no se consulta clientes_provisionales', async () => {
    await contacto('c1', 'Acme SAS')
    await provisional('prov-1', 'Acme Provisional')
    const espia = vi.spyOn(db, 'query')
    const c = await obtenerCliente(db, 'c1')
    const textos = espia.mock.calls.map((a) => String(a[0]))
    espia.mockRestore()
    expect(c).toMatchObject({ id: 'c1', provisional: false })
    expect(textos.length).toBeGreaterThan(0)
    expect(textos.filter((t) => /clientes_provisionales/.test(t))).toEqual([])
  })

  it('triangulación de la prioridad: un id provisional SÍ consulta la tabla, tras Books', async () => {
    await provisional('prov-1', 'Acme Provisional')
    const espia = vi.spyOn(db, 'query')
    await obtenerCliente(db, 'prov-1')
    const textos = espia.mock.calls.map((a) => String(a[0]))
    espia.mockRestore()
    expect(textos.findIndex((t) => /FROM clients/.test(t))).toBe(0)
    expect(textos.filter((t) => /clientes_provisionales/.test(t))).toHaveLength(1)
  })
})

describe('clienteParaEquipo · sólo el mismo provisional que ya tiene el equipo', () => {
  it('un cliente de Books siempre vale', async () => {
    await contacto('c1', 'Acme SAS')
    expect(await clienteParaEquipo(db, 'c1', null)).toMatchObject({ id: 'c1' })
  })
  it('el provisional que el equipo YA tiene vale; otro provisional no', async () => {
    await provisional('prov-1', 'Uno')
    await provisional('prov-2', 'Dos')
    expect(await clienteParaEquipo(db, 'prov-1', 'prov-1')).toMatchObject({ id: 'prov-1', provisional: true })
    expect(await clienteParaEquipo(db, 'prov-2', 'prov-1')).toBeNull()
    expect(await clienteParaEquipo(db, 'prov-1', null)).toBeNull()
  })
})

describe('GET /api/clients y /api/clients/:id con provisionales (RQ-TC-34, D13)', () => {
  it('?provisionales=1 devuelve ambos con su marca; sin el parámetro sólo Books con provisional:false', async () => {
    const cookie = await adminCookie()
    await contacto('c1', 'Acme SAS')
    await provisional('prov-1', 'Acme Provisional')
    const { app } = appWith()
    const con = await request(app).get('/api/clients?search=Acme&provisionales=1').set('Cookie', cookie)
    expect(con.status).toBe(200)
    expect(con.body.map((c: { id: string; provisional: boolean }) => [c.id, c.provisional])).toEqual([['c1', false], ['prov-1', true]])
    const sin = await request(app).get('/api/clients?search=Acme').set('Cookie', cookie)
    expect(sin.body.map((c: { id: string; provisional: boolean }) => [c.id, c.provisional])).toEqual([['c1', false]])
  })

  it('la ficha de un provisional es 200 con provisional:true y la de un id inexistente 404', async () => {
    const cookie = await adminCookie()
    await provisional('prov-1', 'Acme Provisional')
    const { app } = appWith()
    const ok = await request(app).get('/api/clients/prov-1').set('Cookie', cookie)
    expect(ok.status).toBe(200)
    expect(ok.body).toMatchObject({ id: 'prov-1', name: 'Acme Provisional', provisional: true })
    expect((await request(app).get('/api/clients/prov-nada').set('Cookie', cookie)).status).toBe(404)
  })
})
