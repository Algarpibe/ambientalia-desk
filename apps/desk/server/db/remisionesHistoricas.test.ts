import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionHistorica } from './remisionesHistoricasSeed'
import { importarRemisionesHistoricas } from './remisionesHistoricas'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const fila = (over: Partial<RemisionHistorica>): RemisionHistorica => ({
  id: 'rem-h-test-' + Math.random().toString(36).slice(2),
  fecha: '2026-01-10', tecnico: 'Ana Pérez', empresa: 'ACME S.A.S.', personaContacto: 'Juan Gómez',
  marca: null, modelo: null, serial: null, incluye: [], tipoServicio: 'Diagnóstico',
  ticketNumero: null, observaciones: null,
  ...over,
})

describe('importarRemisionesHistoricas', () => {
  it('una fila con ticketNumero que casa con un ticket existente queda enlazada por ticket_id', async () => {
    await db.query("INSERT INTO tickets (id,number,status) VALUES ('t-100',100,'Finalizado')")
    const filas = [fila({ id: 'rem-h-1', ticketNumero: '100' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r).toMatchObject({ total: 1, insertadas: 1, yaExistian: 0, conNumeroDeTicket: 1, enlazadasATicket: 1, sinNumeroDeTicket: 0, ticketNoEncontrado: 0 })
    const row = (await db.query('SELECT ticket_id FROM remisiones WHERE id=$1', ['rem-h-1'])).rows[0]
    expect(row.ticket_id).toBe('t-100')
  })

  it('un ticketNumero que no existe en tickets entra igual con ticket_id NULL y cuenta en ticketNoEncontrado', async () => {
    const filas = [fila({ id: 'rem-h-2', ticketNumero: '999' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r).toMatchObject({ total: 1, insertadas: 1, conNumeroDeTicket: 1, enlazadasATicket: 0, sinNumeroDeTicket: 0, ticketNoEncontrado: 1 })
    const row = (await db.query('SELECT ticket_id FROM remisiones WHERE id=$1', ['rem-h-2'])).rows[0]
    expect(row.ticket_id).toBeNull()
  })

  it('una fila sin ticketNumero entra con ticket_id NULL', async () => {
    const filas = [fila({ id: 'rem-h-3', ticketNumero: null })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r).toMatchObject({ total: 1, insertadas: 1, conNumeroDeTicket: 0, enlazadasATicket: 0, sinNumeroDeTicket: 1, ticketNoEncontrado: 0 })
    const row = (await db.query('SELECT ticket_id FROM remisiones WHERE id=$1', ['rem-h-3'])).rows[0]
    expect(row.ticket_id).toBeNull()
  })

  it('el perfil se calcula con perfilChecklist(marca, modelo)', async () => {
    const filas = [fila({ id: 'rem-h-4', marca: 'Grimm', modelo: 'EDM180C' })]

    await importarRemisionesHistoricas(db, { filas })

    const row = (await db.query('SELECT perfil FROM remisiones WHERE id=$1', ['rem-h-4'])).rows[0]
    expect(row.perfil).toBe('grimm_edm180')
  })

  it('resuelve equipo_id por serial cuando el equipo existe, y lo cuenta en enlazadasAEquipo', async () => {
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,source) VALUES ('eq-1','18A20070','Grimm','EDM180C','seed')")
    const filas = [fila({ id: 'rem-h-5', serial: '18A20070' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r.enlazadasAEquipo).toBe(1)
    expect(r.equipoNoEncontrado).toBe(0)
    const row = (await db.query('SELECT equipo_id FROM remisiones WHERE id=$1', ['rem-h-5'])).rows[0]
    expect(row.equipo_id).toBe('eq-1')
  })

  it('un serial que no casa con ningún equipo cuenta en equipoNoEncontrado y deja equipo_id NULL', async () => {
    const filas = [fila({ id: 'rem-h-6', serial: 'NO-EXISTE' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r.equipoNoEncontrado).toBe(1)
    expect(r.enlazadasAEquipo).toBe(0)
    const row = (await db.query('SELECT equipo_id FROM remisiones WHERE id=$1', ['rem-h-6'])).rows[0]
    expect(row.equipo_id).toBeNull()
  })

  // El serial del histórico es texto tecleado a mano: minúsculas y un espacio de más no deberían
  // impedir el enlace. Este es el test que demuestra que la normalización sirve.
  it('normaliza el serial (mayúsculas/minúsculas y espacios) para cruzar equipo_id', async () => {
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,source) VALUES ('eq-1','18a20070 ','Grimm','EDM180C','seed')")
    const filas = [fila({ id: 'rem-h-6b', serial: '18A20070' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r.enlazadasAEquipo).toBe(1)
    expect(r.equipoNoEncontrado).toBe(0)
    expect(r.equipoAmbiguo).toBe(0)
    const row = (await db.query('SELECT equipo_id FROM remisiones WHERE id=$1', ['rem-h-6b'])).rows[0]
    expect(row.equipo_id).toBe('eq-1')
  })

  // Si dos equipos DISTINTOS normalizan al mismo serial, quedarse con el primero en silencio
  // inventaría un enlace. Lo correcto es no enlazar ninguno y contarlo aparte.
  it('dos equipos distintos que normalizan al mismo serial no enlazan ninguno: se cuentan en equipoAmbiguo', async () => {
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,source) VALUES ('eq-a','SN-1','Grimm','EDM180C','seed')")
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,source) VALUES ('eq-b',' sn-1','Horiba','APMA-370','seed')")
    const filas = [fila({ id: 'rem-h-6c', serial: 'sn-1' })]

    const r = await importarRemisionesHistoricas(db, { filas })

    expect(r.equipoAmbiguo).toBe(1)
    expect(r.enlazadasAEquipo).toBe(0)
    expect(r.equipoNoEncontrado).toBe(0)
    const row = (await db.query('SELECT equipo_id FROM remisiones WHERE id=$1', ['rem-h-6c'])).rows[0]
    expect(row.equipo_id).toBeNull()
  })

  it('guarda estado ok, origen historico, empresa, persona_contacto y creado_por desde tecnico', async () => {
    const filas = [fila({ id: 'rem-h-7', tecnico: 'Julián Maya', empresa: 'SGI S.A.S.', personaContacto: 'Maycol Vásquez' })]

    await importarRemisionesHistoricas(db, { filas })

    const row = (await db.query('SELECT estado, origen, empresa, persona_contacto, creado_por, tipo, resultado, resuelto_at, enviado_at FROM remisiones WHERE id=$1', ['rem-h-7'])).rows[0]
    expect(row).toMatchObject({
      estado: 'ok', origen: 'historico', empresa: 'SGI S.A.S.', persona_contacto: 'Maycol Vásquez',
      creado_por: 'Julián Maya', tipo: 'entrada',
    })
    expect(row.resultado).toBeNull()
    expect(row.resuelto_at).toBeNull()
    expect(row.enviado_at).toBeNull()
  })

  it('reimportar las mismas filas no duplica: la segunda vez las cuenta en yaExistian', async () => {
    const filas = [fila({ id: 'rem-h-8' }), fila({ id: 'rem-h-9', ticketNumero: '5' })]

    const primera = await importarRemisionesHistoricas(db, { filas })
    expect(primera).toMatchObject({ insertadas: 2, yaExistian: 0 })

    const segunda = await importarRemisionesHistoricas(db, { filas })
    expect(segunda).toMatchObject({ insertadas: 0, yaExistian: 2 })

    const total = (await db.query('SELECT COUNT(*)::int AS n FROM remisiones')).rows[0].n
    expect(total).toBe(2)
  })

  it('dryRun:true no escribe nada en la tabla pero devuelve el mismo resumen', async () => {
    await db.query("INSERT INTO tickets (id,number,status) VALUES ('t-100',100,'Finalizado')")
    const filas = [fila({ id: 'rem-h-10', ticketNumero: '100' }), fila({ id: 'rem-h-11', ticketNumero: '999' })]

    const seco = await importarRemisionesHistoricas(db, { filas, dryRun: true })
    const antes = (await db.query('SELECT COUNT(*)::int AS n FROM remisiones')).rows[0].n
    expect(antes).toBe(0)

    const real = await importarRemisionesHistoricas(db, { filas })
    expect(seco).toEqual(real)
  })

  it('sin filas explícitas usa REMISIONES_HISTORICAS por defecto', async () => {
    const r = await importarRemisionesHistoricas(db, { dryRun: true })
    expect(r.total).toBe(149)
  })
})
