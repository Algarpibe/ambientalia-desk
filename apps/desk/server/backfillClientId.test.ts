import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { reconciliarClientesDeEquipos } from './backfillClientId'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const cliente = (id: string, nombre: string, empresa: string | null = null) =>
  db.query('INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ($1,$2,$3)', [id, nombre, empresa])

const equipo = (id: string, clienteNombre: string | null, clientId: string | null = null) =>
  db.query(
    "INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,client_id) VALUES ($1,$1,'Grimm','EDM180C','Monitor',$2,$3)",
    [id, clienteNombre, clientId],
  )

const clientIdDe = async (id: string): Promise<string | null> =>
  (await db.query('SELECT client_id FROM equipos WHERE id=$1', [id])).rows[0].client_id

describe('reconciliarClientesDeEquipos', () => {
  // El caso que motivó todo esto: la carga inicial guardó el cliente como texto libre del CSV, con
  // una grafía que no es la de Books. Comparar literalmente no enlazaría ni uno.
  it('empareja ignorando mayúsculas, acentos, puntuación y la forma societaria', async () => {
    await cliente('cli-amb', 'Ambientalia S.A.S.')
    await equipo('eq-1', 'AMBIENTALIA')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await clientIdDe('eq-1')).toBe('cli-amb')
  })

  // «S.A.S.» pierde los puntos y queda como letras sueltas («s a s»), no como la palabra «sas». Fue el
  // primer fallo real de esta función: la lista de formas societarias sola no lo recortaba.
  it('recorta la forma societaria tanto escrita junta como con puntos', async () => {
    await cliente('cli-gec', 'Gecelca S.A. E.S.P.')
    await cliente('cli-sol', 'Solam LTDA')
    await equipo('eq-gec', 'GECELCA')
    await equipo('eq-sol', 'solam')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 2 })
    expect(await clientIdDe('eq-gec')).toBe('cli-gec')
    expect(await clientIdDe('eq-sol')).toBe('cli-sol')
  })

  it('empareja también contra el nombre de empresa, no solo el de contacto', async () => {
    await cliente('cli-ser', 'Edgar Barrera', 'SERAMBIENTE S.A.S.')
    await equipo('eq-ser', 'Serambiente')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await clientIdDe('eq-ser')).toBe('cli-ser')
  })

  it('ignora acentos y espacios de más, que es como venían en el CSV', async () => {
    await cliente('cli-com', 'Compañía Energética')
    await equipo('eq-com', '  Compania   Energetica ')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await clientIdDe('eq-com')).toBe('cli-com')
  })

  /**
   * Elegir uno al azar ataría el equipo de un cliente al de otro y nadie se enteraría jamás. Se deja
   * sin tocar y se devuelve con los candidatos, que es lo que el humano necesita para decidir.
   */
  it('un nombre que casa con varios clientes se deja SIN enlazar y se devuelve con sus candidatos', async () => {
    await cliente('cli-a', 'Ambientalia S.A.S.')
    await cliente('cli-b', 'AMBIENTALIA LTDA')
    await equipo('eq-amb', 'Ambientalia')

    const r = await reconciliarClientesDeEquipos(db)
    expect(r).toMatchObject({ enlazados: 0, ambiguos: 1 })
    expect(await clientIdDe('eq-amb')).toBeNull()
    expect(r.pendientes).toEqual([
      { id: 'eq-amb', serial: 'eq-amb', clienteNombre: 'Ambientalia', motivo: 'ambiguo', candidatos: ['cli-a', 'cli-b'] },
    ])
  })

  // La errata del CSV («Sololucione ambientales») no se fuerza contra nada parecido: se reporta. Un
  // emparejamiento aproximado aquí sería adivinar sobre datos de clientes, y eso no se adivina.
  it('lo que no casa con nadie se devuelve para corregirlo a mano, sin inventar parecidos', async () => {
    await cliente('cli-sol', 'Soluciones Ambientales SOLAM')
    await equipo('eq-errata', 'Sololucione ambientales - SOLAM')

    const r = await reconciliarClientesDeEquipos(db)
    expect(r).toMatchObject({ enlazados: 0, sinCliente: 1 })
    expect(r.pendientes).toEqual([
      { id: 'eq-errata', serial: 'eq-errata', clienteNombre: 'Sololucione ambientales - SOLAM', motivo: 'sin-cliente' },
    ])
  })

  it('un equipo sin nombre de cliente no es un pendiente: no hay nada que emparejar', async () => {
    await equipo('eq-vacio', null)
    await equipo('eq-blanco', '   ')

    const r = await reconciliarClientesDeEquipos(db)
    expect(r).toMatchObject({ enlazados: 0, sinNombre: 2, sinCliente: 0 })
    expect(r.pendientes).toEqual([])
  })

  // No destructivo: un client_id ya puesto puede venir del alta en la app o de una corrección a mano,
  // y ambos mandan sobre esto.
  it('no pisa un client_id ya puesto, y reejecutarlo no cambia nada', async () => {
    await cliente('cli-a', 'Ambientalia S.A.S.')
    await cliente('cli-otro', 'Otro Cliente')
    await equipo('eq-ya', 'AMBIENTALIA', 'cli-otro')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 0 })
    expect(await clientIdDe('eq-ya')).toBe('cli-otro')

    await equipo('eq-nuevo', 'AMBIENTALIA')
    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 0, ambiguos: 0, sinCliente: 0 })
  })

  // Para mirar las cifras antes de tocar ~352 filas de producción, igual que el import del histórico.
  it('dryRun cuenta lo que haría pero no escribe nada', async () => {
    await cliente('cli-amb', 'Ambientalia S.A.S.')
    await equipo('eq-1', 'AMBIENTALIA')

    expect(await reconciliarClientesDeEquipos(db, { dryRun: true })).toMatchObject({ enlazados: 1 })
    expect(await clientIdDe('eq-1')).toBeNull()

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await clientIdDe('eq-1')).toBe('cli-amb')
  })

  // Un proveedor no es un cliente: enlazar un equipo con él sería un dato falso, no un dato parcial.
  it('no empareja contra contactos que no son clientes', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,raw) VALUES ('prov1','Repuestos SAS','{\"contact_type\":\"vendor\"}')")
    await equipo('eq-prov', 'Repuestos')

    expect(await reconciliarClientesDeEquipos(db)).toMatchObject({ enlazados: 0, sinCliente: 1 })
    expect(await clientIdDe('eq-prov')).toBeNull()
  })
})
