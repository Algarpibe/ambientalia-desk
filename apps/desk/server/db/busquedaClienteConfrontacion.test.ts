import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { searchClients } from '@ambientalia/zoho-sync/books/repo'
import { leerBusquedaTickets } from '@ambientalia/shared'
import { normalizarNombreCliente } from '../backfillClientId'
import { getActiveTickets } from './ticketsConCliente'

/**
 * Confrontación (molde H5, RQ-VT-17): la búsqueda de tickets por cliente usa la MISMA regla que el criterio de nombre de
 * `searchClients` (minúsculas, «contiene», sin plegar acentos ni puntuación) y es DISTINTA a propósito de
 * `normalizarNombreCliente`, que empareja grafías para enlazar equipos. Ninguna de las tres está rota por separado: esta
 * prueba las enfrenta sobre la misma tabla de casos, para que plegar en una sola obligue a decidirlo en las dos.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

interface Caso { nombre: string; q: string; casa: boolean; normalizadosIguales: boolean }

/** `design.md` D3. Las filas con `casa: false` y `normalizadosIguales: true` son las divergencias declaradas (S-1). */
const CASOS: Caso[] = [
  { nombre: 'Gecelca S.A. E.S.P.', q: 'gecelca', casa: true, normalizadosIguales: true },
  { nombre: 'Gecelca S.A. E.S.P.', q: '  GECELCA s.a.  ', casa: true, normalizadosIguales: true },
  { nombre: 'Energía del Caribe', q: 'energía', casa: true, normalizadosIguales: true },
  { nombre: 'Energía del Caribe', q: 'energia', casa: false, normalizadosIguales: true },
  { nombre: 'Ambientalia S.A.S.', q: 'ambientalia sas', casa: false, normalizadosIguales: true },
  { nombre: 'Del Caribe Ltda', q: 'del  caribe', casa: false, normalizadosIguales: true },
  { nombre: 'Camposol Colombia', q: 'colombia camposol', casa: false, normalizadosIguales: false },
]

/** ¿La forma de `normalizarNombreCliente` del texto está contenida en la del nombre? */
const normalizadosIguales = (c: Caso) => normalizarNombreCliente(c.nombre).includes(normalizarNombreCliente(c.q))

async function sembrar(nombre: string) {
  await db.query('INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,$2)', ['cb-1', nombre])
  await db.query(
    "INSERT INTO tickets (id, number, subject, status, status_type, client_id) VALUES ('t-1', 900101, 'Sin nada más', 'Ingresado', 'Open', 'cb-1')",
  )
}

async function veredictoTickets(q: string): Promise<boolean> {
  const l = leerBusquedaTickets(q)
  if (!l.ok || l.filtro === null) throw new Error(`«${q}» no produjo filtro`)
  return (await getActiveTickets(db, '', l.filtro)).length === 1
}
// `searchClients` NO recorta los extremos: la ruta le pasa el texto tal cual (`apps/desk/server/routes/directory.ts:16`).
// Aquí se le pasa recortado para enfrentar sólo la regla del nombre; la diferencia del recorte se fija aparte.
const veredictoClientes = async (q: string) => (await searchClients(db, q.trim())).length === 1

describe('RQ-VT-17 · la regla de normalización enfrentada a searchClients y a normalizarNombreCliente', () => {
  for (const c of CASOS) {
    it(`«${c.nombre}» con «${c.q}»: tickets y searchClients ${c.casa ? 'casan' : 'no casan'}`, async () => {
      await sembrar(c.nombre)
      expect(await veredictoTickets(c.q)).toBe(c.casa)
      expect(await veredictoClientes(c.q)).toBe(c.casa)
      expect(normalizadosIguales(c)).toBe(c.normalizadosIguales)
    })
  }

  it('searchClients no recorta los extremos y la búsqueda de tickets sí: es la única diferencia de regla entre las dos', async () => {
    await sembrar('Gecelca S.A. E.S.P.')
    expect(await veredictoTickets('  gecelca  ')).toBe(true)
    expect((await searchClients(db, '  gecelca  ')).length).toBe(0)
  })

  it('las divergencias con normalizarNombreCliente son exactamente las tres declaradas', () => {
    const divergencias = CASOS.filter((c) => !c.casa && normalizadosIguales(c)).map((c) => c.q)
    expect(divergencias).toEqual(['energia', 'ambientalia sas', 'del  caribe'])
  })
})

describe('RQ-VT-17 · el provisional por ticketsConCliente', () => {
  it('sale en la búsqueda y trae su razón social como nombre del cliente', async () => {
    await db.query(
      `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo)
       VALUES ('prov-1','Zeta Provisional','800555666','Ana Ruiz','3001112233','ana@prov.co','no está en Books')`)
    await db.query("INSERT INTO tickets (id, number, status, status_type, client_id) VALUES ('t-p', 900201, 'Ingresado', 'Open', 'prov-1')")
    const l = leerBusquedaTickets('zeta')
    if (!l.ok || !l.filtro) throw new Error('sin filtro')

    const r = await getActiveTickets(db, '', l.filtro)
    expect(r.map((x) => x.row.number)).toEqual([900201])
    expect(r[0].refs.accountName).toBe('Zeta Provisional')
    expect(r[0].refs.clienteProvisional).toBe(true)
  })
})
