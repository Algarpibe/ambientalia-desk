import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { enlazarTicketsConEquipos } from './backfillEquipoId'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const equipo = (id: string, serial: string) =>
  db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ($1,$2,'Grimm','EDM180C','Monitor')", [id, serial])

let n = 0
const ticket = (id: string, serial: string | null, equipoId: string | null = null) =>
  db.query(
    "INSERT INTO tickets (id,number,subject,status,managed_by_app,serial,equipo_id) VALUES ($1,$2,'Servicio','Finalizado',false,$3,$4)",
    [id, ++n + 900, serial, equipoId],
  )

describe('enlazarTicketsConEquipos', () => {
  it('enlaza los tickets cuyo serial casa con UN equipo, y cuenta el resto por su motivo', async () => {
    await equipo('eq-a', '18A19042')
    await ticket('t-casa', '18A19042')      // enlazable
    await ticket('t-huerfano', 'NO-EXISTE') // el serial no está en el inventario
    await ticket('t-sin-serial', null)      // el asunto nunca dio serial

    expect(await enlazarTicketsConEquipos(db)).toEqual({ enlazados: 1, ambiguos: 0, sinEquipo: 1, sinSerial: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-casa'")).rows[0].equipo_id).toBe('eq-a')
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-huerfano'")).rows[0].equipo_id).toBeNull()
  })

  /**
   * `equipos.serial` NO es único —la tabla tiene id propio precisamente por eso—, así que un serial
   * puede casar con varios equipos. Elegir uno al azar sería peor que no enlazar: ataría el historial
   * de un cliente al equipo de otro, y nadie se enteraría jamás.
   */
  it('un serial que casa con varios equipos se deja SIN enlazar y se cuenta aparte', async () => {
    await equipo('eq-1', 'REPETIDO')
    await equipo('eq-2', 'REPETIDO')
    await ticket('t-ambiguo', 'REPETIDO')

    expect(await enlazarTicketsConEquipos(db)).toMatchObject({ enlazados: 0, ambiguos: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-ambiguo'")).rows[0].equipo_id).toBeNull()
  })

  // Misma decisión que tomó la siembra del catálogo: el inventario trae la misma grafía escrita de
  // varias formas, y comparar literalmente dejaría fuera a la mitad sin ninguna razón de negocio.
  it('la comparación de seriales no distingue mayúsculas ni espacios sobrantes', async () => {
    await equipo('eq-may', '18a19042')
    await ticket('t-may', '  18A19042  ')

    expect(await enlazarTicketsConEquipos(db)).toMatchObject({ enlazados: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-may'")).rows[0].equipo_id).toBe('eq-may')
  })

  // No destructivo: un ticket que YA tiene equipo no se toca aunque su serial dijera otra cosa. El
  // enlace existente puede venir de la app o de una corrección a mano, y ambos mandan sobre esto.
  it('no pisa un equipo_id ya puesto, y reejecutarlo no cambia nada', async () => {
    await equipo('eq-a', '18A19042')
    await equipo('eq-otro', 'OTRO')
    await ticket('t-ya', '18A19042', 'eq-otro')

    expect(await enlazarTicketsConEquipos(db)).toMatchObject({ enlazados: 0 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-ya'")).rows[0].equipo_id).toBe('eq-otro')

    await ticket('t-nuevo', '18A19042')
    expect(await enlazarTicketsConEquipos(db)).toMatchObject({ enlazados: 1 })
    expect(await enlazarTicketsConEquipos(db)).toEqual({ enlazados: 0, ambiguos: 0, sinEquipo: 0, sinSerial: 0 })
  })

  // Los equipos dados de baja siguen siendo el equipo al que ese ticket se refirió. Excluirlos
  // dejaría huecos en el historial justo de los equipos que más lo necesitan: los que ya no están.
  it('enlaza también contra equipos dados de baja', async () => {
    await equipo('eq-baja', '18A19042')
    await db.query("UPDATE equipos SET active=false WHERE id='eq-baja'")
    await ticket('t-baja', '18A19042')

    expect(await enlazarTicketsConEquipos(db)).toMatchObject({ enlazados: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='t-baja'")).rows[0].equipo_id).toBe('eq-baja')
  })
})
