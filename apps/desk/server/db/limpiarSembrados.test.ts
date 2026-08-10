import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { limpiarArticulosSembrados, CONSERVAR_SIEMPRE } from './limpiarSembrados'
import { listarArticulos, crearArticulo } from './catalogoArticulos'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
  await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Datalogger',0),('grimm_edm180','Manuales',1)")
})

describe('limpiarArticulosSembrados', () => {
  /**
   * La siembra copió el checklist de n8n como texto libre. El rediseño por categorías dejó esas copias
   * obsoletas: los artículos reales salen ahora de Books. Se borra lo que vino de la siembra y **solo**
   * eso — reconocido por casar con un ítem del checklist.
   */
  it('borra los sembrados y deja los que se añadieron por otra vía', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Datalogger' })   // del checklist
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Invento propio' }) // no está en él

    const r = await limpiarArticulosSembrados(db)
    expect(r).toMatchObject({ borrados: 1 })
    expect((await listarArticulos(db, 'cmod-1')).map((a) => a.nombre)).toEqual(['Invento propio'])
  })

  /**
   * `Manuales`, `Repuestos reemplazados` y `Documentación de calibración` vienen del checklist pero NO
   * son artículos: son casillas que el técnico verifica y que Books nunca va a vender. Si se borraran,
   * desaparecerían de la remisión sin que ninguna categoría los devuelva.
   */
  it('conserva los ítems que nunca serán artículos de Books', async () => {
    // Los tres tienen que estar EN el checklist para que cuenten como sembrados: lo que no vino de la
    // siembra no hay que protegerlo, porque nunca fue candidato a borrarse.
    for (const [i, nombre] of CONSERVAR_SIEMPRE.entries()) {
      await db.query('INSERT INTO remision_checklist (perfil,item,orden) VALUES ($1,$2,$3)', ['otro', nombre, i])
      await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre })
    }

    const r = await limpiarArticulosSembrados(db)
    expect(r).toMatchObject({ borrados: 0, conservados: CONSERVAR_SIEMPRE.length })
    expect((await listarArticulos(db, 'cmod-1'))).toHaveLength(CONSERVAR_SIEMPRE.length)
  })

  // Un artículo enlazado a Books no lo puso la siembra —ésta solo creaba texto libre—, así que no se
  // toca aunque su nombre coincida con uno del checklist.
  it('no borra los artículos enlazados a un artículo de Books', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i1', sku: 'D-1', nombre: 'Datalogger' })

    expect(await limpiarArticulosSembrados(db)).toMatchObject({ borrados: 0 })
    expect(await listarArticulos(db, 'cmod-1')).toHaveLength(1)
  })

  /**
   * El simulacro es lo que se guarda como copia de seguridad antes de borrar, así que tiene que
   * devolver el detalle COMPLETO —modelo por modelo y artículo por artículo—, no solo las cifras.
   */
  it('dryRun devuelve el detalle por modelo y no borra nada', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','EDM180D')")
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Datalogger' })
    await crearArticulo(db, 'cmod-2', { clase: 'accesorio', nombre: 'Datalogger' })

    const r = await limpiarArticulosSembrados(db, { dryRun: true })
    expect(r.borrados).toBe(2)
    expect(r.detalle).toEqual([
      { modelo: 'Grimm EDM180C', articulos: ['Datalogger'] },
      { modelo: 'Grimm EDM180D', articulos: ['Datalogger'] },
    ])
    // Nada se tocó: el simulacro es solo lectura.
    expect(await listarArticulos(db, 'cmod-1')).toHaveLength(1)
  })

  // La comparación con el checklist no distingue mayúsculas ni espacios sobrantes, igual que el resto
  // de cruces por texto del proyecto.
  it('reconoce el ítem del checklist aunque cambie la caja o sobren espacios', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: '  DATALOGGER ' })

    expect(await limpiarArticulosSembrados(db)).toMatchObject({ borrados: 1 })
  })
})
