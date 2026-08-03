import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { parseEquiposCsv } from './seedEquipos'
import { upsertEquipo, searchEquipos, getEquipo, countEquipos } from './equipos'
import { createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull } from './equipos'
import { getEquipoHistorial } from './equipos'

const rows = parseEquiposCsv([
  'Nombre cliente;Marca;Modelo;Numero serie;Tipo',
  'Corola Ambiental S.A.S.;Horiba;APMA-370;85HHP0N0;Analizador de Monóxido de Carbono (CO)',
  'Gecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor de Material Particulado PM10/PM2.5',
].join('\n'))

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('equipos repo', () => {
  it('upsert + búsqueda por serie/cliente/tipo + count', async () => {
    for (const r of rows) await upsertEquipo(db, r)
    expect(await countEquipos(db)).toBe(2)
    expect((await searchEquipos(db, '85HHP')).map((e) => e.serial)).toEqual(['85HHP0N0'])
    expect((await searchEquipos(db, 'gecelca')).map((e) => e.marca)).toEqual(['Grimm'])
    expect((await searchEquipos(db, 'monóxido')).length).toBe(1)
    const e = await getEquipo(db, rows[0].id)
    expect(e).toMatchObject({ serial: '85HHP0N0', tipo: 'Analizador de Monóxido de Carbono (CO)', clienteNombre: 'Corola Ambiental S.A.S.' })
  })

  it('upsert es idempotente (mismo id no duplica)', async () => {
    await upsertEquipo(db, rows[0])
    await upsertEquipo(db, rows[0])
    expect(await countEquipos(db)).toBe(1)
  })

  // El selector de equipo del formulario de ticket debe acotarse al cliente elegido. El vínculo
  // no puede apoyarse solo en `client_id`: la semilla (~352 equipos) lo deja NULL y solo guarda
  // `cliente_nombre` como texto libre del CSV, con otra grafía que en Books ("AMBIENTALIA" vs
  // "Ambientalia S.A.S."). Por eso se cruzan las dos señales.
  it('searchEquipos acota al cliente cruzando client_id y nombre; sin cliente devuelve todos', async () => {
    const seed = (id: string, serial: string, cliente: string) =>
      upsertEquipo(db, { id, serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', cliente_nombre: cliente, source: 'seed', raw: null })
    await seed('e-corto', '18A0001', 'AMBIENTALIA')            // semilla, nombre abreviado
    await seed('e-exacto', '18A0002', 'Ambientalia S.A.S.')    // semilla, nombre igual al de Books
    await seed('e-otro', '18A0003', 'AGQ Colombia S.A.S.')     // otro cliente → fuera
    const idApp = await createEquipo(db, { serial: '18A0004', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'Ambientalia S.A.S.', clientId: 'cli-amb' })

    const cliente = { id: 'cli-amb', name: 'Ambientalia S.A.S.' }
    expect((await searchEquipos(db, '18A', cliente)).map((e) => e.id).sort())
      .toEqual(['e-corto', 'e-exacto', idApp].sort())

    // Sin cliente → todos (es la salida de emergencia del formulario si el vínculo falla).
    expect((await searchEquipos(db, '18A')).length).toBe(4)
  })
})

describe('equipos CRUD (Subsistema F)', () => {
  it('create (id propio + client_id), getFull, y aparece en searchEquipos', async () => {
    const id = await createEquipo(db, { serial: 'NEW1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'cli1' })
    expect(id).toMatch(/^eq-/)
    expect(await getEquipoFull(db, id)).toMatchObject({ serial: 'NEW1', marca: 'Grimm', active: true, clientId: 'cli1', clienteNombre: 'ACME' })
    expect((await searchEquipos(db, 'NEW1')).length).toBe(1)
  })

  it('desactivar lo saca de searchEquipos pero sigue en listEquiposManage', async () => {
    const id = await createEquipo(db, { serial: 'NEW2', marca: 'Horiba', modelo: 'APMA', tipo: 'CO', clienteNombre: 'X', clientId: 'cli1' })
    await setEquipoActive(db, id, false)
    expect((await searchEquipos(db, 'NEW2')).length).toBe(0)
    expect((await listEquiposManage(db, 'NEW2')).map((e) => e.active)).toEqual([false])
  })

  it('update cambia campos y reconcilia cliente', async () => {
    const id = await createEquipo(db, { serial: 'NEW3', marca: 'Grimm', modelo: 'm', tipo: 'Monitor', clienteNombre: 'Viejo', clientId: null })
    await updateEquipo(db, id, { tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
    expect(await getEquipoFull(db, id)).toMatchObject({ tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
  })

  it('facets devuelve marcas y tipos distintos', async () => {
    await createEquipo(db, { serial: 'A', marca: 'Grimm', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    await createEquipo(db, { serial: 'B', marca: 'Horiba', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    await createEquipo(db, { serial: 'C', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: null, clientId: null })
    const f = await equipoFacets(db)
    expect(f.marcas).toEqual(expect.arrayContaining(['Grimm', 'Horiba']))
    expect(f.byMarca['Grimm'].tipos).toContain('Monitor')
    expect(f.byMarca['Grimm'].modelos).toContain('EDM180C')
  })
})

async function insTicket(id: string, number: number, serial: string | null, equipoId: string | null, status: string) {
  await db.query(
    `INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ($1,$2,$3,$4,'Open',$5,$6,now())`,
    [id, number, `Ticket ${number}`, status, serial, equipoId],
  )
}

describe('getEquipoHistorial', () => {
  it('empareja por equipo_id y por serial, agrupa transiciones', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-1', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1' })
    await insTicket('app-1', 901, 'SN-1', eqId, 'Ingresado')
    await insTicket('zoho-1', 303, 'SN-1', null, 'Finalizado')
    await insTicket('otro-1', 500, 'SN-X', null, 'Ingresado')
    await db.query(`INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('app-1','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin',now())`)
    const h = await getEquipoHistorial(db, eqId)
    expect(h).not.toBeNull()
    expect(h!.equipo.serial).toBe('SN-1')
    expect(h!.tickets.map((t) => t.id).sort()).toEqual(['app-1', 'zoho-1'])
    const app1 = h!.tickets.find((t) => t.id === 'app-1')!
    expect(app1.number).toBe('#901')
    expect(app1.transitions.map((x) => x.transitionName)).toEqual(['Habilitar Servicio'])
  })

  it('empareja históricos por el serial dentro del asunto (token), sin falsos positivos', async () => {
    const eqId = await createEquipo(db, { serial: '18A19042', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'CHEMILAB', clientId: 'c1' })
    // histórico de Zoho: serial/codigo_servicio NULL; el serial vive en el asunto.
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('h1',190,'Servicio Técnico CHEMILAB GRIMM EDM 180C MT_18A19042_EDM180C_260305','Finalizado','Closed',now())`)
    // falso positivo: el serial es subcadena de uno más largo (18A190420) → NO debe entrar.
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('h2',191,'Servicio MT_18A190420_EDM180C_260305','Ingresado','Open',now())`)
    const h = await getEquipoHistorial(db, eqId)
    expect(h!.tickets.map((t) => t.id)).toEqual(['h1'])
  })

  it('devuelve null si el equipo no existe', async () => {
    expect(await getEquipoHistorial(db, 'eq-nope')).toBeNull()
  })
})
