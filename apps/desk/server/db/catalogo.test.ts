import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { leerCatalogo, getModelo, crearTipo, crearMarca, crearModelo, NombreRepetido } from './catalogo'

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
