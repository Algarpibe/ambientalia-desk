import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { leerBusquedaTickets, type BusquedaTickets } from '@ambientalia/shared'
import { migrate, type Queryable } from './migrate'
import { getActiveTickets, getClosedTickets, countClosedTickets, getAllTickets } from './repo'

/**
 * RQ-VT-17 (`busqueda-cliente-y-codigo`, F1F-03): la búsqueda del listado encuentra también por código de servicio,
 * por cliente (cuenta de Desk o cliente de Books) y por cliente provisional no enlazado. El contacto no se busca.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

interface Opciones { codigo?: string | null; accountId?: string | null; clientId?: string | null; contactId?: string | null; cerrado?: boolean }

async function ticket(number: number, o: Opciones = {}) {
  const creado = new Date(Date.UTC(2026, 0, 1) + number * 60_000).toISOString()
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, codigo_servicio, account_id, client_id, contact_id, created_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [`t-${number}`, number, `Ticket ${number}`, o.cerrado ? 'Finalizado' : 'Ingresado', o.cerrado ? 'Closed' : 'Open',
      o.codigo ?? null, o.accountId ?? null, o.clientId ?? null, o.contactId ?? null, creado],
  )
}
const cuenta = (id: string, name: string) => db.query('INSERT INTO accounts (id, name) VALUES ($1,$2)', [id, name])
const clienteBooks = (id: string, name: string) => db.query('INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,$2)', [id, name])
const provisional = (id: string, razon: string, enlazadoA: string | null = null) =>
  db.query(
    `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo, enlazado_a)
     VALUES ($1,$2,'800555666','Ana Ruiz','3001112233','ana@prov.co','no está en Books',$3)`, [id, razon, enlazadoA])

function buscar(q: string): BusquedaTickets {
  const l = leerBusquedaTickets(q)
  if (!l.ok || l.filtro === null) throw new Error(`la búsqueda de prueba «${q}» no produjo filtro`)
  return l.filtro
}
const numeros = (r: { row: { number: number } }[]) => r.map((x) => x.row.number).sort((a, b) => a - b)

describe('RQ-VT-17 · código de servicio', () => {
  it('el código se encuentra por una parte, sin distinguir mayúsculas', async () => {
    await ticket(5001, { codigo: 'MT_18A19042_EDM180C_260301' })
    await ticket(5002, { codigo: 'CG_77B_OTRO' })
    await ticket(5003)

    expect(numeros(await getActiveTickets(db, '', buscar('edm180c')))).toEqual([5001])
    expect(numeros(await getActiveTickets(db, '', buscar('CG_77')))).toEqual([5002])
  })
})

describe('RQ-VT-17 · cliente', () => {
  it('se encuentra por la cuenta de Desk y por el cliente de Books', async () => {
    await cuenta('ac-1', 'Gecelca S.A. E.S.P.')
    await clienteBooks('cb-1', 'Camposol Colombia')
    await ticket(5101, { accountId: 'ac-1' })
    await ticket(5102, { clientId: 'cb-1' })
    await ticket(5103)

    expect(numeros(await getActiveTickets(db, '', buscar('gecelca')))).toEqual([5101])
    expect(numeros(await getActiveTickets(db, '', buscar('CAMPOSOL')))).toEqual([5102])
  })

  it('una parte del medio del nombre basta («contiene», no «empieza por»)', async () => {
    await clienteBooks('cb-1', 'Camposol Colombia')
    await ticket(5111, { clientId: 'cb-1' })

    expect(numeros(await getActiveTickets(db, '', buscar('colomb')))).toEqual([5111])
  })

  it('el cliente provisional no enlazado se encuentra por su razón social', async () => {
    await provisional('prov-1', 'Zeta Provisional')
    await ticket(5201, { clientId: 'prov-1' })
    await ticket(5202)

    expect(numeros(await getActiveTickets(db, '', buscar('ZETA')))).toEqual([5201])
  })

  it('un provisional ya enlazado no se encuentra por su razón social vieja', async () => {
    await clienteBooks('cb-9', 'Nombre de Books')
    await provisional('prov-2', 'Razón Vieja', 'cb-9')
    await ticket(5211, { clientId: 'prov-2' })

    expect(numeros(await getActiveTickets(db, '', buscar('razón vieja')))).toEqual([])
  })

  it('el contacto no se busca', async () => {
    await db.query("INSERT INTO contacts (id, first_name, last_name) VALUES ('co-1','Ana','Ruiz')")
    await ticket(5301, { contactId: 'co-1' })

    expect(numeros(await getActiveTickets(db, '', buscar('ruiz')))).toEqual([])
  })
})

describe('RQ-VT-17 · posición y suma', () => {
  it('un cerrado que casa por cliente no sale entre los activos, y el recuento de cerrados lo cuenta', async () => {
    await clienteBooks('cb-1', 'Camposol Colombia')
    await ticket(5401, { clientId: 'cb-1' })
    await ticket(5402, { clientId: 'cb-1', cerrado: true })
    await ticket(5403, { cerrado: true })

    expect(numeros(await getActiveTickets(db, '', buscar('camposol')))).toEqual([5401])
    expect(numeros(await getClosedTickets(db, '', 50, 0, buscar('camposol')))).toEqual([5402])
    expect(await countClosedTickets(db, buscar('camposol'))).toBe(1)
    expect(numeros(await getAllTickets(db, '', buscar('camposol')))).toEqual([5401, 5402])
  })

  it('el número sigue exacto y la vía del cliente suma, no sustituye', async () => {
    await clienteBooks('cb-8', 'Cliente 8640')
    await ticket(864)
    await ticket(8640)
    await ticket(5501, { clientId: 'cb-8' })

    expect(numeros(await getActiveTickets(db, '', buscar('864')))).toEqual([864, 5501])
  })
})
