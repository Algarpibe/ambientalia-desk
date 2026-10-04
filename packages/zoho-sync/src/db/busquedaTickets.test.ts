import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { leerBusquedaTickets, type BusquedaTickets } from '@ambientalia/shared'
import { migrate, type Queryable } from './migrate'
import { getActiveTickets, getClosedTickets, countClosedTickets, getAllTickets } from './repo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

/**
 * Ticket mínimo. `created_time` crece con el número para que el orden (`created_time DESC`) sea
 * determinista y se pueda paginar sin ambigüedad.
 */
async function ticket(number: number, opts: { serial?: string | null; equipoId?: string | null; cerrado?: boolean } = {}) {
  const creado = new Date(Date.UTC(2026, 0, 1) + number * 60_000).toISOString()
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, serial, equipo_id, created_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [`t-${number}`, number, `Ticket ${number}`, opts.cerrado ? 'Finalizado' : 'Ingresado', opts.cerrado ? 'Closed' : 'Open', opts.serial ?? null, opts.equipoId ?? null, creado],
  )
}

async function equipo(id: string, serial: string) {
  await db.query(`INSERT INTO equipos (id, serial) VALUES ($1, $2)`, [id, serial])
}

/** El filtro tal como lo deja la pieza compartida: es lo que el servidor le pasa a `repo.ts`. */
function buscar(q: string): BusquedaTickets {
  const l = leerBusquedaTickets(q)
  if (!l.ok || l.filtro === null) throw new Error(`la búsqueda de prueba «${q}» no produjo filtro`)
  return l.filtro
}

const numeros = (r: { row: { number: number } }[]) => r.map((x) => x.row.number)

describe('búsqueda de tickets: H-1 (subconsulta con parámetro en pg-mem)', () => {
  it('un ticket enlazado a un equipo se encuentra por el serial del equipo', async () => {
    await equipo('eq-1', 'NUEVO-88')
    await ticket(1001, { serial: 'VIEJO-77', equipoId: 'eq-1' })
    await ticket(1002, { serial: 'OTRO-00' })

    expect(numeros(await getActiveTickets(db, '', buscar('nuevo-88')))).toEqual([1001])
  })
})

describe('búsqueda de tickets: número', () => {
  it('el número coincide exacto, con y sin #: 864 sí, 8640 y 86 no', async () => {
    await ticket(864)
    await ticket(8640)

    expect(numeros(await getActiveTickets(db, '', buscar('864')))).toEqual([864])
    expect(numeros(await getActiveTickets(db, '', buscar('#864')))).toEqual([864])
  })

  it('un número parcial no encuentra por número', async () => {
    await ticket(864)
    await ticket(8640)

    expect(numeros(await getActiveTickets(db, '', buscar('86')))).toEqual([])
  })

  it('unos dígitos que no caben en integer no rompen la consulta y buscan sólo por serial', async () => {
    await ticket(7001, { serial: '99999999999-A' })
    await ticket(7002, { serial: 'OTRO' })

    expect(numeros(await getActiveTickets(db, '', buscar('99999999999')))).toEqual([7001])
  })

  it('unos dígitos buscan en el número Y en el serial', async () => {
    await ticket(864)
    await ticket(9000, { serial: 'X-864-Z' })
    await ticket(9001, { serial: 'SIN-QUE-VER' })

    expect(numeros(await getActiveTickets(db, '', buscar('864'))).sort()).toEqual([864, 9000])
  })
})

describe('búsqueda de tickets: serial', () => {
  it('últimos dígitos, centro y serial guardado en mayúsculas, sea cual sea la caja del texto', async () => {
    await ticket(2001, { serial: 'SN-0042517' })
    await ticket(2002, { serial: 'SN-9999999' })

    expect(numeros(await getActiveTickets(db, '', buscar('2517')))).toEqual([2001])
    expect(numeros(await getActiveTickets(db, '', buscar('0042')))).toEqual([2001])
    expect(numeros(await getActiveTickets(db, '', buscar('sn-0042517')))).toEqual([2001])
    expect(numeros(await getActiveTickets(db, '', buscar('  Sn-00  ')))).toEqual([2001])
  })

  it('un texto que no está en ningún serial no devuelve nada', async () => {
    await ticket(2001, { serial: 'SN-0042517' })

    expect(numeros(await getActiveTickets(db, '', buscar('zzz')))).toEqual([])
  })

  it('el espacio interior se conserva', async () => {
    await ticket(3001, { serial: 'AB 12' })
    await ticket(3002, { serial: 'AB12' })

    expect(numeros(await getActiveTickets(db, '', buscar('ab 12')))).toEqual([3001])
  })

  it('un serial de equipo corregido: se encuentra por el nuevo y por el viejo (criterio 3)', async () => {
    await equipo('eq-1', 'NUEVO-88')
    await ticket(4001, { serial: 'VIEJO-77', equipoId: 'eq-1' })
    await ticket(4002, { serial: 'AJENO-1' })

    expect(numeros(await getActiveTickets(db, '', buscar('NUEVO-88')))).toEqual([4001])
    expect(numeros(await getActiveTickets(db, '', buscar('VIEJO-77')))).toEqual([4001])
  })

  it('un ticket sin serial en ningún sitio no se encuentra por serial, pero sí por su número', async () => {
    await ticket(5005)
    await ticket(5006, { serial: 'ABC-1' })

    expect(numeros(await getActiveTickets(db, '', buscar('ABC')))).toEqual([5006])
    expect(numeros(await getActiveTickets(db, '', buscar('5005')))).toEqual([5005])
  })
})

describe('búsqueda de tickets: posición del predicado respecto del filtro de estado', () => {
  it('un cerrado que casa nunca entra en activos, ni un activo en cerrados (por serial y por equipo)', async () => {
    await equipo('eq-a', 'XAAA-9')
    await equipo('eq-c', 'YAAA-9')
    await ticket(6001, { serial: 'AAA-9' }) // activo, por su copia
    await ticket(6002, { equipoId: 'eq-a' }) // activo, por el equipo
    await ticket(6003, { serial: 'AAA-9', cerrado: true }) // cerrado, por su copia
    await ticket(6004, { equipoId: 'eq-c', cerrado: true }) // cerrado, por el equipo
    const f = buscar('aaa-9')

    expect(numeros(await getActiveTickets(db, '', f)).sort()).toEqual([6001, 6002])
    expect(numeros(await getClosedTickets(db, '', 50, 0, f)).sort()).toEqual([6003, 6004])
    expect(await countClosedTickets(db, f)).toBe(2)
  })

  it('con un texto de dígitos, la rama del número tampoco se escapa del filtro de estado', async () => {
    await equipo('eq-c', 'ZZ-6010')
    await ticket(6010, { serial: 'LIBRE' }) // activo, por número
    await ticket(6011, { equipoId: 'eq-c', cerrado: true }) // cerrado, por el equipo

    expect(numeros(await getActiveTickets(db, '', buscar('6010')))).toEqual([6010])
    expect(numeros(await getClosedTickets(db, '', 50, 0, buscar('6010')))).toEqual([6011])
  })
})

describe('búsqueda de tickets: cerrados paginados y su recuento (criterio 5)', () => {
  it('el total es el filtrado y la página 2 trae los siguientes de la misma búsqueda', async () => {
    for (let n = 1; n <= 5; n++) await ticket(100 + n, { serial: `PAG-${n}`, cerrado: true })
    for (let n = 1; n <= 2; n++) await ticket(200 + n, { serial: `OTRO-${n}`, cerrado: true })
    const f = buscar('pag-')

    expect(await countClosedTickets(db, f)).toBe(5)
    expect(await countClosedTickets(db)).toBe(7)
    expect(numeros(await getClosedTickets(db, '', 2, 0, f))).toEqual([105, 104])
    expect(numeros(await getClosedTickets(db, '', 2, 2, f))).toEqual([103, 102])
    expect(numeros(await getClosedTickets(db, '', 2, 4, f))).toEqual([101])
    expect(numeros(await getClosedTickets(db, '', 2, 8, f))).toEqual([])
  })
})

describe('búsqueda de tickets: getAllTickets (rama WHERE)', () => {
  it('con filtro devuelve activos y cerrados que casan, y nada más', async () => {
    await ticket(8001, { serial: 'ALL-1' })
    await ticket(8002, { serial: 'ALL-2', cerrado: true })
    await ticket(8003, { serial: 'NADA' })

    expect(numeros(await getAllTickets(db, '', buscar('all-'))).sort()).toEqual([8001, 8002])
  })
})

describe('búsqueda de tickets: sin filtro [CARACTERIZACIÓN]', () => {
  it('undefined y null devuelven lo mismo que no pasar el argumento, en las cuatro consultas', async () => {
    await equipo('eq-1', 'E-1')
    await ticket(9101, { serial: 'S-1', equipoId: 'eq-1' })
    await ticket(9102)
    await ticket(9103, { cerrado: true })
    await ticket(9104, { cerrado: true })

    const activos = numeros(await getActiveTickets(db, ''))
    const cerrados = numeros(await getClosedTickets(db, '', 50, 0))
    const todos = numeros(await getAllTickets(db, ''))
    expect(activos.sort()).toEqual([9101, 9102])
    expect(cerrados.sort()).toEqual([9103, 9104])
    expect(todos.length).toBe(4)
    expect(await countClosedTickets(db)).toBe(2)

    for (const vacio of [undefined, null]) {
      expect(numeros(await getActiveTickets(db, '', vacio))).toEqual(numeros(await getActiveTickets(db, '')))
      expect(numeros(await getClosedTickets(db, '', 50, 0, vacio))).toEqual(numeros(await getClosedTickets(db, '', 50, 0)))
      expect(numeros(await getAllTickets(db, '', vacio))).toEqual(todos)
      expect(await countClosedTickets(db, vacio)).toBe(2)
    }
  })
})
