import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getActiveTickets } from '@ambientalia/zoho-sync/db/repo'
import { leerBusquedaTickets } from '@ambientalia/shared'
import { upsertEquipo, searchEquipos } from './equipos'

/**
 * Confrontación (molde H5, RQ-VT-12): el autocompletado de la recepción (`searchEquipos`) y la búsqueda de
 * tickets son DOS implementaciones del mismo criterio de serial. Ninguna está rota por separado, así que
 * ninguna prueba suya sola lo vería divergir; esta las enfrenta sobre la misma tabla de casos.
 *
 * Aísla el serial: el equipo es ACTIVO, sin marca, modelo, tipo, cliente ni código interno que puedan
 * casar, y el ticket no tiene equipo enlazado, con un número que no colisiona con ningún `q`.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const NUMERO = 900001

async function sembrar(serial: string) {
  await upsertEquipo(db, { id: 'eq-1', serial, marca: null, modelo: null, tipo: null, cliente_nombre: null, source: 'test', raw: null })
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, serial) VALUES ($1,$2,$3,$4,$5,$6)`,
    ['t-1', NUMERO, 'Sin equipo', 'Ingresado', 'Open', serial],
  )
}

/** Veredicto del autocompletado: ¿encuentra el equipo? */
async function veredictoEquipos(q: string): Promise<boolean> {
  return (await searchEquipos(db, q)).length === 1
}

/** Veredicto de la búsqueda de tickets: ¿encuentra el ticket? */
async function veredictoTickets(q: string): Promise<boolean> {
  const l = leerBusquedaTickets(q)
  if (!l.ok) throw new Error(`la consulta de prueba «${q}» no debería ser inválida`)
  return (await getActiveTickets(db, '', l.filtro)).length === 1
}

const casos: { caso: string; serial: string; q: string; esperado: boolean }[] = [
  { caso: 'últimos dígitos', serial: 'SN-0042517', q: '2517', esperado: true },
  { caso: 'centro del serial', serial: 'SN-0042517', q: '0042', esperado: true },
  { caso: 'q en mayúsculas contra serial en minúsculas', serial: 'sn-0042517', q: 'SN-0042', esperado: true },
  { caso: 'q en minúsculas contra serial en mayúsculas', serial: 'SN-0042517', q: 'sn-0042517', esperado: true },
  { caso: 'espacios a los lados', serial: 'ABC-123', q: '  abc-123  ', esperado: true },
  { caso: 'sólo espacios', serial: 'ABC-123', q: '     ', esperado: true },
  { caso: 'el % es comodín', serial: 'AB-12', q: 'a%12', esperado: true },
  { caso: 'el _ es comodín de un carácter', serial: 'AB-12', q: 'a_-12', esperado: true },
  { caso: 'el _ no comodina dos caracteres', serial: 'AB-12', q: 'a_12', esperado: false },
  { caso: 'sin coincidencia', serial: 'SN-0042517', q: 'zzz', esperado: false },
  { caso: 'vacío devuelve todo', serial: 'SN-0042517', q: '', esperado: true },
]

describe('confrontación: searchEquipos y la búsqueda de tickets dan el mismo veredicto de serial', () => {
  it.each(casos)('$caso', async ({ serial, q, esperado }) => {
    await sembrar(serial)

    const equipos = await veredictoEquipos(q)
    const tickets = await veredictoTickets(q)

    expect(equipos).toBe(esperado)
    expect(tickets).toBe(esperado)
    expect(equipos).toBe(tickets)
  })
})
