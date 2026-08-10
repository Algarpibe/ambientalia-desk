import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { sembrarArticulosDesdeChecklist } from './articulosSeed'
import { listarArticulos } from './catalogoArticulos'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-g','Grimm'), ('cmar-h','Horiba')")
})

const modelo = (id: string, marcaId: string, nombre: string) =>
  db.query('INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ($1,$2,$3)', [id, marcaId, nombre])

const checklist = (perfil: string, items: string[]) =>
  Promise.all(items.map((item, i) =>
    db.query('INSERT INTO remision_checklist (perfil,item,orden) VALUES ($1,$2,$3)', [perfil, item, i])))

describe('sembrarArticulosDesdeChecklist', () => {
  /**
   * Sembrar NO es heredar: copia una vez y a partir de ahí cada modelo va por su cuenta. La herencia
   * sería una regla viva que mira al perfil cada vez, y esa quedó descartada.
   */
  it('copia a cada modelo los ítems del perfil que le corresponde, como accesorios', async () => {
    await modelo('cmod-1', 'cmar-g', 'EDM180C')   // → perfil grimm_edm180
    await modelo('cmod-2', 'cmar-h', 'APMA-370')  // → perfil horiba_ap
    await checklist('grimm_edm180', ['Manuales', 'Datalogger'])
    await checklist('horiba_ap', ['Cable de poder'])

    expect(await sembrarArticulosDesdeChecklist(db)).toEqual({ modelos: 2, insertados: 3, existentes: 0 })

    const grimm = await listarArticulos(db, 'cmod-1')
    expect(grimm.map((a) => [a.nombre, a.clase, a.orden])).toEqual([['Manuales', 'accesorio', 0], ['Datalogger', 'accesorio', 1]])
    // Entran como texto libre: el checklist de n8n no tenía SKU, y enlazarlos a Books es trabajo posterior.
    expect(grimm.every((a) => a.itemId === undefined)).toBe(true)
    expect((await listarArticulos(db, 'cmod-2')).map((a) => a.nombre)).toEqual(['Cable de poder'])
  })

  // Idempotente y no destructiva, igual que `seedChecklist`: re-ejecutarla no duplica ni pisa lo que
  // alguien haya editado o desactivado después.
  it('re-ejecutarla no duplica ni reactiva lo desactivado', async () => {
    await modelo('cmod-1', 'cmar-g', 'EDM180C')
    await checklist('grimm_edm180', ['Manuales'])
    await sembrarArticulosDesdeChecklist(db)

    const id = (await listarArticulos(db, 'cmod-1'))[0].id
    await db.query('UPDATE catalogo_articulos SET activo = false WHERE id = $1', [id])

    expect(await sembrarArticulosDesdeChecklist(db)).toEqual({ modelos: 1, insertados: 0, existentes: 1 })
    expect((await listarArticulos(db, 'cmod-1'))[0].activo).toBe(false)
  })

  // Kunak nunca tuvo checklist en el flujo de n8n, y eso NO es un error: su lista queda por definir.
  it('un modelo cuyo perfil no tiene ítems se queda sin lista, sin fallar', async () => {
    await modelo('cmod-k', 'cmar-g', 'Kunak Air')
    await checklist('grimm_edm180', ['Manuales'])

    expect(await sembrarArticulosDesdeChecklist(db)).toMatchObject({ modelos: 1, insertados: 0 })
    expect(await listarArticulos(db, 'cmod-k')).toEqual([])
  })

  // Los ítems desactivados del checklist no se siembran: alguien los retiró a propósito.
  it('no siembra los ítems desactivados del checklist', async () => {
    await modelo('cmod-1', 'cmar-g', 'EDM180C')
    await checklist('grimm_edm180', ['Manuales', 'Retirado'])
    await db.query("UPDATE remision_checklist SET activo = false WHERE item = 'Retirado'")

    await sembrarArticulosDesdeChecklist(db)
    expect((await listarArticulos(db, 'cmod-1')).map((a) => a.nombre)).toEqual(['Manuales'])
  })
})
