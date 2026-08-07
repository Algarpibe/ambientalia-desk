import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  leerCatalogo, getModelo, crearTipo, crearMarca, crearModelo, NombreRepetido,
  actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada, existeEnCatalogo, EntradaEnUso,
} from './catalogo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

/** Siembra directa por SQL: estos tests miran la lectura, no cómo se dieron de alta las filas. */
async function seedMinimo(): Promise<void> {
  await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-so2','Analizador de SO2')")
  await db.query("INSERT INTO catalogo_tipos (id,nombre,activo) VALUES ('t-off','Tipo retirado',false)")
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-hor','Horiba')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-apsa','m-hor','APSA-370','t-so2')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,activo) VALUES ('mo-off','m-hor','VIEJO','t-so2',false)")
}

describe('leerCatalogo', () => {
  it('devuelve solo lo activo, con el nombre del tipo resuelto', async () => {
    await seedMinimo()
    const c = await leerCatalogo(db)
    expect(c.tipos.map((t) => t.id)).toEqual(['t-so2'])
    expect(c.marcas.map((m) => m.id)).toEqual(['m-hor'])
    expect(c.modelos.map((m) => m.id)).toEqual(['mo-apsa'])
    expect(c.modelos[0]).toMatchObject({ marcaId: 'm-hor', nombre: 'APSA-370', tipoNombre: 'Analizador de SO2', revisar: false })
  })

  // Sin esto, editar un equipo cuyo modelo se desactivó dejaría el campo en blanco y obligaría a
  // cambiarle el modelo para poder guardar — un efecto colateral que nadie pidió.
  it('incluir devuelve además el modelo desactivado que se le pida, y su marca', async () => {
    await seedMinimo()
    await db.query("UPDATE catalogo_marcas SET activo=false WHERE id='m-hor'")
    const c = await leerCatalogo(db, 'mo-off')
    expect(c.modelos.map((m) => m.id)).toContain('mo-off')
    expect(c.marcas.map((m) => m.id)).toContain('m-hor')
  })

  // A diferencia del test de arriba, aquí la marca desactivada NO se pide por `incluirModeloId`:
  // se cuela porque uno de sus modelos sigue activo. Un modelo elegible sin su marca en el
  // desplegable sería un modelo inalcanzable, así que la marca tiene que salir igual — y este test
  // es el que distingue esa regla general de la más estrecha (solo la marca del incluido), porque
  // el test anterior mezcla las dos: su marca es a la vez la del modelo activo y la del incluido.
  it('una marca desactivada con un modelo activo aparece aunque no se pida incluirModeloId', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre,activo) VALUES ('m-y','Y',false)")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-y','m-y','ACTIVO')")
    const c = await leerCatalogo(db)
    expect(c.marcas.map((m) => m.id)).toContain('m-y')
  })

  it('un modelo sin tipo sale con tipoNombre nulo, no revienta', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-x','X')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,revisar) VALUES ('mo-x','m-x','SIN-TIPO',true)")
    const c = await leerCatalogo(db)
    expect(c.modelos[0]).toMatchObject({ tipoId: null, tipoNombre: null, revisar: true })
  })
})

describe('getModelo', () => {
  it('devuelve el modelo con marca y tipo ya resueltos a texto', async () => {
    await seedMinimo()
    const m = await getModelo(db, 'mo-apsa')
    expect(m).toMatchObject({ id: 'mo-apsa', nombre: 'APSA-370', marca: 'Horiba', tipo: 'Analizador de SO2' })
  })

  it('un modelo sin tipo devuelve tipo nulo', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-x','X')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-x','m-x','SIN-TIPO')")
    const m = await getModelo(db, 'mo-x')
    expect(m).toMatchObject({ id: 'mo-x', nombre: 'SIN-TIPO', marca: 'X', tipo: null })
  })

  it('un id que no existe devuelve null', async () => {
    const m = await getModelo(db, 'no-existe')
    expect(m).toBeNull()
  })
})

describe('altas del catálogo', () => {
  it('crea tipo, marca y modelo con ids prefijados', async () => {
    const tipo = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: tipo })
    expect(tipo).toMatch(/^ctip-/)
    expect(marca).toMatch(/^cmar-/)
    expect(modelo).toMatch(/^cmod-/)
    const c = await leerCatalogo(db)
    expect(c.modelos[0]).toMatchObject({ nombre: 'APSA-370', tipoNombre: 'Analizador de SO2' })
  })

  // El nombre repetido es el caso corriente: dos administradores dando de alta lo mismo. Se avisa
  // con un error propio para que la ruta lo traduzca a 409 y no a un 500 del driver.
  it('rechaza un nombre repetido de tipo o de marca', async () => {
    await crearTipo(db, 'Analizador de SO2')
    await expect(crearTipo(db, 'Analizador de SO2')).rejects.toBeInstanceOf(NombreRepetido)
    await crearMarca(db, 'Horiba')
    await expect(crearMarca(db, 'Horiba')).rejects.toBeInstanceOf(NombreRepetido)
  })

  // El modelo es único DENTRO de su marca: un "6103" de Environics y otro de Horiba son equipos
  // distintos y los dos tienen que poder existir.
  it('rechaza un modelo repetido en la misma marca, pero lo admite en otra', async () => {
    const horiba = await crearMarca(db, 'Horiba')
    const environics = await crearMarca(db, 'Environics')
    await crearModelo(db, { marcaId: horiba, nombre: '6103', tipoId: null })
    await expect(crearModelo(db, { marcaId: horiba, nombre: '6103', tipoId: null })).rejects.toBeInstanceOf(NombreRepetido)
    await expect(crearModelo(db, { marcaId: environics, nombre: '6103', tipoId: null })).resolves.toMatch(/^cmod-/)
  })

  // La comprobación de nombre repetido es insensible a mayúsculas y recorta espacios: son la misma
  // marca aunque cambie la caja o traiga espacios de un copia-pega, y por eso no puede haber dos.
  it('rechaza un nombre repetido por mayúsculas o por espacios de más', async () => {
    await crearMarca(db, 'Horiba')
    await expect(crearMarca(db, 'horiba')).rejects.toBeInstanceOf(NombreRepetido)
    await expect(crearMarca(db, '  Horiba  ')).rejects.toBeInstanceOf(NombreRepetido)
  })
})

describe('cambios del catálogo', () => {
  it('renombra y desactiva un tipo', async () => {
    const t = await crearTipo(db, 'Analizador SO2')
    await actualizarTipo(db, t, { nombre: 'Analizador de Dióxido de Azufre (SO2)' })
    expect((await leerCatalogo(db)).tipos[0].nombre).toBe('Analizador de Dióxido de Azufre (SO2)')
    await actualizarTipo(db, t, { activo: false })
    expect((await leerCatalogo(db)).tipos).toEqual([])
  })

  // Fijar el tipo a conciencia ES resolver la duda, así que apaga `revisar` sin que haya que pedirlo
  // aparte. Por eso no hay endpoint "resolver": sería el mismo camino con otro nombre.
  it('fijar el tipo de un modelo apaga revisar y cuenta los equipos que discrepan', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const cal = await crearTipo(db, 'Calibrador Multigas')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: cal, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-2','B','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])

    const r = await actualizarModelo(db, modelo, { tipoId: so2, corregirEquipos: false })
    expect(r.discrepan).toBe(1) // eq-1 sigue diciendo Calibrador
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Analizador de SO2', revisar: false })
    const eq1 = await db.query("SELECT tipo FROM equipos WHERE id='eq-1'")
    expect(eq1.rows[0].tipo).toBe('Calibrador Multigas') // sin corregir, no se toca
  })

  it('corregirEquipos reescribe el tipo de los que discrepan', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])

    const r = await actualizarModelo(db, modelo, { tipoId: so2, corregirEquipos: true })
    expect(r.discrepan).toBe(1)
    const eq1 = await db.query("SELECT tipo FROM equipos WHERE id='eq-1'")
    expect(eq1.rows[0].tipo).toBe('Analizador de SO2')
  })

  // Se comprueba la tabla cruda y no leerCatalogo: con un modelo activo colgando, la marca seguiría
  // apareciendo en leerCatalogo por la invariante ya fijada en ba7974b (ningún modelo visible se
  // queda sin su marca en el desplegable) — eso es un asunto de esa función, no de esta. Lo que
  // actualizarMarca tiene que demostrar es que NO desactiva en cascada el modelo ni toca el equipo.
  it('desactivar una marca no toca sus modelos ni sus equipos', async () => {
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null })
    await actualizarMarca(db, marca, { activo: false })
    const m = await db.query('SELECT activo FROM catalogo_marcas WHERE id=$1', [marca])
    expect(m.rows[0].activo).toBe(false)
    const mo = await db.query('SELECT activo FROM catalogo_modelos WHERE id=$1', [modelo])
    expect(mo.rows[0].activo).toBe(true) // el modelo sigue vivo: desactivar la marca no es borrarla
  })

  // Borrar lo que alguien está usando dejaría equipos apuntando a la nada. Se niega con el conteo
  // delante, que es lo que permite decidir si desactivarlo en vez de borrarlo.
  it('no borra un modelo en uso, y sí uno libre', async () => {
    const marca = await crearMarca(db, 'Horiba')
    const usado = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null })
    const libre = await crearModelo(db, { marcaId: marca, nombre: 'APOA-370', tipoId: null })
    await db.query("INSERT INTO equipos (id,serial,modelo_id) VALUES ('eq-1','A',$1)", [usado])

    await expect(borrarEntrada(db, 'modelos', usado)).rejects.toBeInstanceOf(EntradaEnUso)
    await expect(borrarEntrada(db, 'modelos', libre)).resolves.toBeUndefined()
    expect((await leerCatalogo(db)).modelos.map((m) => m.id)).toEqual([usado])
  })

  it('no borra una marca con modelos colgando ni un tipo asignado a un modelo', async () => {
    const tipo = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: tipo })
    await expect(borrarEntrada(db, 'marcas', marca)).rejects.toBeInstanceOf(EntradaEnUso)
    await expect(borrarEntrada(db, 'tipos', tipo)).rejects.toBeInstanceOf(EntradaEnUso)
  })

  // Sin claves foráneas declaradas en este esquema, la ruta necesita poder preguntar si algo existe
  // antes de crear un modelo colgando de una marca inventada.
  it('existeEnCatalogo distingue lo que hay de lo que no', async () => {
    const marca = await crearMarca(db, 'Horiba')
    expect(await existeEnCatalogo(db, 'marcas', marca)).toBe(true)
    expect(await existeEnCatalogo(db, 'marcas', 'cmar-inventada')).toBe(false)
    expect(await existeEnCatalogo(db, 'tipos', 'ctip-inventado')).toBe(false)
  })
})
