import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearArticulo, actualizarArticulo, asignarCategoria, reordenarArticulos } from './catalogoArticulos'
import { checklistDeRemision } from './checklistRemision'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
  await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Del perfil viejo',0)")
})

describe('checklistDeRemision', () => {
  /**
   * El cambio de la fase 2: lo que el técnico verifica sale de la lista del MODELO, no del perfil que
   * agrupaba familias enteras. Y sale en el orden que se le dio en la ficha, porque ese orden se
   * eligió pensando en cómo se recorre el equipo.
   */
  it('con modelo, devuelve sus accesorios activos en el orden de la ficha', async () => {
    const a = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })
    const b = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Cable RJ45' })
    await reordenarArticulos(db, 'cmod-1', 'accesorio', [b, a])

    expect(await checklistDeRemision(db, { modeloId: 'cmod-1', perfil: 'grimm_edm180' }))
      .toEqual({ items: ['Cable RJ45', 'Manuales'], origen: 'modelo' })
  })

  // «Incluye» es lo que ACOMPAÑA al equipo cuando entra. Un filtro o una bomba de repuesto no vienen
  // con él, así que meterlos daría al técnico una lista que no puede verificar.
  it('no incluye los consumibles ni los repuestos', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Maletín' })
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', nombre: 'Filtro' })
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Bomba','B-1','C&R EDM 180','active')")
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R EDM 180')

    expect((await checklistDeRemision(db, { modeloId: 'cmod-1', perfil: 'grimm_edm180' })).items).toEqual(['Maletín'])
  })

  it('no incluye los desactivados', async () => {
    const id = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Retirado' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Vigente' })
    await actualizarArticulo(db, id, { activo: false })

    expect((await checklistDeRemision(db, { modeloId: 'cmod-1', perfil: 'grimm_edm180' })).items).toEqual(['Vigente'])
  })

  /**
   * Un modelo sin accesorios devuelve lista vacía CON origen `modelo`, y esa distinción es todo el
   * mensaje: la pantalla dirá «aún sin lista definida», que empuja a completarla, en vez de «este
   * equipo no lleva accesorios», que afirma algo que nadie ha comprobado.
   */
  it('un modelo sin accesorios devuelve vacío, no el checklist del perfil', async () => {
    expect(await checklistDeRemision(db, { modeloId: 'cmod-1', perfil: 'grimm_edm180' }))
      .toEqual({ items: [], origen: 'modelo' })
  })

  /**
   * Sin equipo enlazado no hay modelo del que colgar la lista. Los ~79 tickets históricos que nunca
   * se enlazaron perderían su checklist, así que se cae al perfil de siempre: la fase 2 no puede
   * quitarle a nadie lo que ya tenía.
   */
  it('sin modelo cae al checklist del perfil', async () => {
    expect(await checklistDeRemision(db, { modeloId: null, perfil: 'grimm_edm180' }))
      .toEqual({ items: ['Del perfil viejo'], origen: 'perfil' })
  })
})
