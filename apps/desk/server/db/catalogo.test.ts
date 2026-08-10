import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  leerCatalogo, getModelo, crearTipo, crearMarca, crearModelo, NombreRepetido,
  actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada, existeEnCatalogo, EntradaEnUso,
  leerConflictos, SIN_TIPO,
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

  // El test anterior solo ejercita la rama de rechazo por uso. Sin este, el DELETE FROM real de
  // 'tipos' y de 'marcas' —la interpolación del nombre de tabla que sale de USOS— nunca corre, y un
  // nombre de tabla equivocado en esa constante pasaría inadvertido hasta producción.
  it('borra de verdad un tipo libre y una marca libre', async () => {
    const tipo = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    await borrarEntrada(db, 'tipos', tipo)
    await borrarEntrada(db, 'marcas', marca)
    expect((await db.query('SELECT 1 FROM catalogo_tipos WHERE id=$1', [tipo])).rows).toEqual([])
    expect((await db.query('SELECT 1 FROM catalogo_marcas WHERE id=$1', [marca])).rows).toEqual([])
  })

  // Sin claves foráneas declaradas en este esquema, la ruta necesita poder preguntar si algo existe
  // antes de crear un modelo colgando de una marca inventada.
  it('existeEnCatalogo distingue lo que hay de lo que no', async () => {
    const marca = await crearMarca(db, 'Horiba')
    expect(await existeEnCatalogo(db, 'marcas', marca)).toBe(true)
    expect(await existeEnCatalogo(db, 'marcas', 'cmar-inventada')).toBe(false)
    expect(await existeEnCatalogo(db, 'tipos', 'ctip-inventado')).toBe(false)
  })

  // 'modelos' es la tercera entrada de la tabla de despacho USOS y ninguno de los tests de arriba la
  // ejercita a través de existeEnCatalogo: sin este, un error ahí pasaría igual de inadvertido.
  it('existeEnCatalogo también distingue un modelo real de uno inventado', async () => {
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null })
    expect(await existeEnCatalogo(db, 'modelos', modelo)).toBe(true)
    expect(await existeEnCatalogo(db, 'modelos', 'cmod-inventado')).toBe(false)
  })

  // La rama en la que el modelo se queda SIN tipo: el UPDATE pone tipo_id=NULL y apaga revisar igual
  // que cuando se fija uno concreto, pero al no haber tipo con qué comparar la función sale antes de
  // contar. Sin este test esa salida temprana no la ejercitaba nadie.
  it('fijar tipoId a null deja el modelo sin tipo, apaga revisar y no cuenta discrepancias', async () => {
    const cal = await crearTipo(db, 'Calibrador Multigas')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: cal, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])

    const r = await actualizarModelo(db, modelo, { tipoId: null })
    expect(r.discrepan).toBe(0) // sin tipo no hay con qué comparar: no es una cuenta real, es el valor fijo de la salida temprana
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoId: null, tipoNombre: null, revisar: false })
    const eq1 = await db.query("SELECT tipo FROM equipos WHERE id='eq-1'")
    expect(eq1.rows[0].tipo).toBe('Calibrador Multigas') // no se toca ningún equipo
  })
})

describe('leerConflictos', () => {
  it('devuelve los modelos marcados con su reparto real y cuenta los equipos sin modelo', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: so2, revisar: true })
    await crearModelo(db, { marcaId: marca, nombre: 'LIMPIO', tipoId: so2 })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-2','B','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-3','C','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial) VALUES ('eq-4','D')") // sin modelo

    const c = await leerConflictos(db)
    expect(c.modelos.length).toBe(1) // el limpio no aparece
    expect(c.modelos[0]).toMatchObject({ modeloId: modelo, marca: 'Horiba', modelo: 'APSA-370', tipoActual: 'Analizador de SO2' })
    // Ordenado de más a menos, que es como se lee para decidir.
    expect(c.modelos[0].reparto).toEqual([
      { tipo: 'Analizador de SO2', equipos: 2 },
      { tipo: 'Calibrador Multigas', equipos: 1 },
    ])
    expect(c.equiposSinModelo).toBe(1)
  })

  // Caso real de producción: la siembra marca `revisar` también cuando el inventario NO declaraba
  // ningún tipo (candidatos.length !== 1 incluye el cero). El modelo tiene que seguir saliendo en la
  // bandeja —si el LEFT JOIN a catalogo_tipos se cambiara por un JOIN, este modelo desaparecería en
  // vez de mostrarse con tipoActual nulo, que es lo que de verdad hay que enseñarle al administrador.
  it('un modelo marcado sin tipo asignado sale en la bandeja con tipoActual nulo', async () => {
    const marca = await crearMarca(db, 'Environics')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'S9000', tipoId: null, revisar: true })

    const c = await leerConflictos(db)
    expect(c.modelos).toHaveLength(1)
    expect(c.modelos[0]).toMatchObject({ modeloId: modelo, marca: 'Environics', modelo: 'S9000', tipoActual: null })
    expect(c.modelos[0].reparto).toEqual([]) // ningún equipo enlazado todavía: no hay nada que repartir
  })

  // Decisión: los equipos que no declaran tipo (equipos.tipo NULL) SÍ entran en el reparto, con la
  // etiqueta SIN_TIPO, en vez de desaparecer. Ocultarlos disfrazaría de "sin conflicto" —o de
  // reparto vacío, que en la pantalla se leería igual de mal— un modelo cuyos equipos en realidad no
  // dicen nada: es evidencia tan real como cualquier tipo declarado, y el administrador necesita verla
  // para decidir.
  it('los equipos que no declaran tipo cuentan en el reparto como SIN_TIPO', async () => {
    const marca = await crearMarca(db, 'Casella')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'CEL-712', tipoId: null, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,modelo_id) VALUES ('eq-5','E','Casella','CEL-712',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,modelo_id) VALUES ('eq-6','F','Casella','CEL-712',$1)", [modelo])

    const c = await leerConflictos(db)
    expect(c.modelos[0].reparto).toEqual([{ tipo: SIN_TIPO, equipos: 2 }])
  })

  // Sin desempate fijo, GROUP BY podría devolver el empate en el orden de inserción (aquí, Calibrador
  // antes que Analizador) y la bandeja se reordenaría sola entre recargas sin que nadie tocara nada.
  it('un empate en el reparto se desempata alfabéticamente, no por el orden de la base', async () => {
    // equipos.tipo es texto libre, no una FK a catalogo_tipos: no hace falta crear los tipos para
    // que el reparto los cuente, así que esta prueba se queda deliberadamente sin crearTipo.
    const marca = await crearMarca(db, 'Teledyne')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'T400', tipoId: null, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-7','G','Teledyne','T400','Calibrador Multigas',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-8','H','Teledyne','T400','Analizador de SO2',$1)", [modelo])

    const c = await leerConflictos(db)
    expect(c.modelos[0].reparto).toEqual([
      { tipo: 'Analizador de SO2', equipos: 1 },
      { tipo: 'Calibrador Multigas', equipos: 1 },
    ])
  })

  // El único test de arriba con dos modelos (APSA-370 y LIMPIO) descarta el segundo por no estar
  // marcado, así que el ORDER BY ma.nombre, mo.nombre de la consulta principal nunca se ejercitaba
  // con más de una fila de salida. Los nombres se eligen para que el orden alfabético de marca
  // contradiga el orden de creación (Zeta se crea primero pero sale última) y para que, dentro de
  // Alfa, el orden de alta de sus dos modelos (M-B antes que M-A) también contradiga el alfabético:
  // si alguien rompe el ORDER BY al fusionar otra cosa, este test lo nota.
  it('con varios modelos marcados, el orden es por marca y luego por modelo', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const zeta = await crearMarca(db, 'Zeta')
    const alfa = await crearMarca(db, 'Alfa')
    const modeloZeta = await crearModelo(db, { marcaId: zeta, nombre: 'M-1', tipoId: so2, revisar: true })
    const modeloAlfaB = await crearModelo(db, { marcaId: alfa, nombre: 'M-B', tipoId: so2, revisar: true })
    const modeloAlfaA = await crearModelo(db, { marcaId: alfa, nombre: 'M-A', tipoId: so2, revisar: true })

    const c = await leerConflictos(db)
    expect(c.modelos.map((m) => m.modeloId)).toEqual([modeloAlfaA, modeloAlfaB, modeloZeta])
  })

  // El revisor confirmó que contar también los equipos dados de baja es la decisión correcta:
  // `active=false` es un borrado lógico, no un estado operativo, y la pregunta que responde la
  // bandeja ("¿qué tipo es este modelo?") es una propiedad del modelo, no un censo de lo que está en
  // servicio hoy. Sin este test, alguien podría añadir `AND active = true` pensando que "arregla" el
  // reparto y nadie se enteraría de que rompió la intención.
  it('el reparto cuenta también los equipos dados de baja (active=false)', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: so2, revisar: true })
    await db.query(
      "INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id,active) VALUES ('eq-9','I','Horiba','APSA-370','Analizador de SO2',$1,false)",
      [modelo],
    )

    const c = await leerConflictos(db)
    expect(c.modelos[0].reparto).toEqual([{ tipo: 'Analizador de SO2', equipos: 1 }])
  })
})

/**
 * La vista del catálogo enseña, junto a cada modelo, la ficha comercial del artículo de Books al que
 * apunta su SKU. Se resuelve al leer y no se guarda: el nombre y la categoría son de Books, y
 * duplicarlos aquí abriría una divergencia sin dueño.
 */
describe('leerCatalogo — artículo de Books del modelo', () => {
  it('trae sku, nombre y categoría del artículo, sin distinguir mayúsculas en el SKU', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-1','cmar-1','APMA-370','apma-370-eu')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Analizador de CO APMA-370','APMA-370-EU','AP Series','active')")

    const mo = (await leerCatalogo(db)).modelos.find((m) => m.id === 'cmod-1')
    expect(mo).toMatchObject({
      sku: 'apma-370-eu',
      articuloNombre: 'Analizador de CO APMA-370',
      articuloCategoria: 'AP Series',
    })
  })

  // Un modelo sin SKU, o con uno que no casa, no es un error: la columna sale vacía y la pantalla lo
  // enseña como tal. Bloquear aquí dejaría el catálogo ilegible por un dato que falta.
  it('deja el artículo vacío si el modelo no tiene SKU o el SKU no casa con ninguno', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('sin-sku','cmar-1','Sin SKU')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('sku-malo','cmar-1','SKU inventado','NO-EXISTE')")

    const c = await leerCatalogo(db)
    const sinSku = c.modelos.find((m) => m.id === 'sin-sku')
    const skuMalo = c.modelos.find((m) => m.id === 'sku-malo')
    expect(sinSku).toMatchObject({ sku: null, articuloNombre: null, articuloCategoria: null })
    expect(skuMalo).toMatchObject({ sku: 'NO-EXISTE', articuloNombre: null, articuloCategoria: null })
  })
})
