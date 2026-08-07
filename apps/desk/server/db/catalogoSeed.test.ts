import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { sembrarCatalogo } from './catalogoSeed'
import { leerCatalogo } from './catalogo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

let n = 0
const eq = (marca: string | null, modelo: string | null, tipo: string | null) =>
  db.query('INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ($1,$2,$3,$4,$5)', [`eq-${++n}`, `SN-${n}`, marca, modelo, tipo])

describe('sembrarCatalogo', () => {
  it('siembra marcas, tipos y modelos, y enlaza los equipos', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APOA-370', 'Analizador de Ozono')
    await eq('Grimm', 'EDM180C', 'Monitor PM10')

    const r = await sembrarCatalogo(db)
    expect(r).toMatchObject({ marcas: 2, tipos: 3, modelos: 3, equiposEnlazados: 3, conflictos: 0 })

    const c = await leerCatalogo(db)
    expect(c.marcas.map((m) => m.nombre)).toEqual(['Grimm', 'Horiba'])
    const apsa = c.modelos.find((m) => m.nombre === 'APSA-370')!
    expect(apsa.tipoNombre).toBe('Analizador de SO2')
    expect(apsa.revisar).toBe(false)
  })

  // Un modelo con dos tipos es un dato ambiguo del inventario. Se queda con el MÁS FRECUENTE para no
  // perder la deducción, pero marcado, porque elegir por el usuario y callárselo sería esconderlo.
  it('un modelo con dos tipos se queda con el más frecuente y marcado para revisar', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Calibrador Multigas')

    const r = await sembrarCatalogo(db)
    expect(r.conflictos).toBe(1)
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Analizador de SO2', revisar: true })
  })

  // Sin desempate explícito, dos ejecuciones sobre los mismos datos podrían dar resultados distintos
  // según el orden en que la base devuelva las filas.
  it('el empate lo rompe el orden alfabético', async () => {
    await eq('Horiba', 'DUAL', 'Zeta')
    await eq('Horiba', 'DUAL', 'Alfa')

    await sembrarCatalogo(db)
    expect((await leerCatalogo(db)).modelos[0]).toMatchObject({ tipoNombre: 'Alfa', revisar: true })
  })

  it('un modelo cuyos equipos no declaran tipo entra sin tipo y marcado', async () => {
    await eq('Horiba', 'APSA-370', null)
    const r = await sembrarCatalogo(db)
    expect(r.conflictos).toBe(1)
    expect((await leerCatalogo(db)).modelos[0]).toMatchObject({ tipoId: null, tipoNombre: null, revisar: true })
  })

  it('un equipo sin marca o sin modelo no entra en el catálogo y se queda sin enlazar', async () => {
    await eq(null, 'HUERFANO', 'Monitor')
    await eq('Horiba', null, 'Monitor')
    await eq('Horiba', '  ', 'Monitor') // en blanco cuenta como ausente

    const r = await sembrarCatalogo(db)
    expect(r.modelos).toBe(0)
    expect(r.equiposEnlazados).toBe(0)
    const sinEnlazar = await db.query('SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NULL')
    expect(sinEnlazar.rows[0].n).toBe(3)
  })

  // La siembra se dispara a mano y puede repetirse. Si pisara, revertiría las correcciones que un
  // administrador hizo entre una ejecución y la siguiente.
  it('reejecutarla no duplica ni pisa las correcciones hechas a mano', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Calibrador Multigas')
    await sembrarCatalogo(db)

    const cal = (await leerCatalogo(db)).tipos.find((t) => t.nombre === 'Calibrador Multigas')!
    await db.query('UPDATE catalogo_modelos SET tipo_id=$1, revisar=false', [cal.id])

    const r2 = await sembrarCatalogo(db)
    expect(r2).toMatchObject({ marcas: 0, tipos: 0, modelos: 0 })
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Calibrador Multigas', revisar: false })
    expect((await leerCatalogo(db)).modelos.length).toBe(1)
  })

  // Caso corriente en producción: el mismo nombre de modelo bajo dos marcas distintas (un "6103" de
  // Environics y otro de Horiba). Tienen que acabar como dos modelos independientes, cada uno colgado
  // de su marca, y cada equipo enlazado al suyo — es el test que prueba que los Map anidados (marca →
  // modelo) hacen su trabajo y no se funden en una sola clave.
  it('el mismo nombre de modelo bajo dos marcas distintas se guarda como dos modelos independientes', async () => {
    await eq('Environics', '6103', 'Calibrador Multigas')
    await eq('Horiba', '6103', 'Analizador de SO2')

    const r = await sembrarCatalogo(db)
    expect(r).toMatchObject({ marcas: 2, tipos: 2, modelos: 2, equiposEnlazados: 2, conflictos: 0 })

    const c = await leerCatalogo(db)
    const modelos6103 = c.modelos.filter((m) => m.nombre === '6103')
    expect(modelos6103).toHaveLength(2)
    const nombreMarca = new Map(c.marcas.map((m) => [m.id, m.nombre]))
    const tipoPorMarca = new Map(modelos6103.map((m) => [nombreMarca.get(m.marcaId), m.tipoNombre]))
    expect(tipoPorMarca.get('Environics')).toBe('Calibrador Multigas')
    expect(tipoPorMarca.get('Horiba')).toBe('Analizador de SO2')

    // Cada equipo enlazado al modelo de SU marca, no al de la otra.
    const eqEnv = await db.query("SELECT modelo_id FROM equipos WHERE marca='Environics'")
    const eqHor = await db.query("SELECT modelo_id FROM equipos WHERE marca='Horiba'")
    const idPorMarca = new Map(modelos6103.map((m) => [nombreMarca.get(m.marcaId), m.id]))
    expect(eqEnv.rows[0].modelo_id).toBe(idPorMarca.get('Environics'))
    expect(eqHor.rows[0].modelo_id).toBe(idPorMarca.get('Horiba'))
  })

  // Lo importante no es que "HORIBA" y "Horiba" se fundan en una marca (eso ya lo hacía altaSimple):
  // es que el paso 5 tiene que encontrar el modelo aunque la grafía del equipo no coincida letra a
  // letra con la que ganó en catalogo_marcas/catalogo_modelos. Si el paso 5 comparase texto literal
  // en vez de la clave en minúsculas, la mitad de estos dos equipos se quedaría sin enlazar.
  it('una marca escrita en dos grafías es una sola marca, y los dos equipos quedan enlazados', async () => {
    await eq('HORIBA', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')

    const r = await sembrarCatalogo(db)
    expect(r.marcas).toBe(1)
    expect(r.modelos).toBe(1)

    const c = await leerCatalogo(db)
    expect(c.marcas).toHaveLength(1)
    expect(c.modelos).toHaveLength(1)

    // La aserción que de verdad importa: ninguno de los dos se queda huérfano.
    const sinEnlazar = await db.query('SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NULL')
    expect(sinEnlazar.rows[0].n).toBe(0)
  })

  // El desempate de grafía usa `ORDER BY id` a propósito (ver catalogoSeed.ts, paso de agregación):
  // sin ese ORDER BY, pg-mem (y Postgres en general) no garantiza en qué orden llegan las filas de un
  // SELECT sin ordenar, así que dos ejecuciones sobre los mismos datos podrían "recordar" una grafía
  // distinta cada vez. Para probar que el resultado depende del `id` y no del orden en que se
  // insertaron las filas, aquí se inserta PRIMERO el equipo que tiene que PERDER (le damos a mano un
  // id alfabéticamente mayor) y DESPUÉS el que tiene que ganar (id menor). Si alguien quitara el
  // `ORDER BY id` por parecer decorativo, este test empezaría a fallar porque pg-mem suele devolver
  // las filas en el orden en que se insertaron, y entonces ganaría la grafía insertada primero
  // ('Horiba'), no la del id menor ('HORIBA').
  it('la grafía que sobrevive la decide el id, no el orden de inserción', async () => {
    await db.query(
      "INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-z-pierde','SN-Z','Horiba','APSA-370','Analizador de SO2')",
    )
    await db.query(
      "INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-a-gana','SN-A','HORIBA','APSA-370','Analizador de SO2')",
    )

    await sembrarCatalogo(db)
    const c = await leerCatalogo(db)
    expect(c.marcas).toHaveLength(1)
    expect(c.marcas[0].nombre).toBe('HORIBA') // 'eq-a-gana' < 'eq-z-pierde': gana pese a haberse insertado después
  })

  // Dos grafías del mismo tipo ('Monitor PM10' y 'monitor pm10') no son dos tipos: son el mismo dato
  // escrito distinto, y sus votos se suman al decidir el tipo más frecuente del modelo.
  it('dos grafías del mismo tipo se suman como un solo tipo al contar votos', async () => {
    await eq('Grimm', 'EDM180C', 'Monitor PM10')
    await eq('Grimm', 'EDM180C', 'monitor pm10') // misma grafía en minúsculas: es el mismo voto que la anterior
    await eq('Grimm', 'EDM180C', 'Requiere Calibración') // tipo distinto: queda en minoría, 1 voto frente a 2

    const r = await sembrarCatalogo(db)
    expect(r.tipos).toBe(2) // 'Monitor PM10'/'monitor pm10' cuentan como un solo tipo; el otro es el segundo

    const m = (await leerCatalogo(db)).modelos[0]
    // Gana con 2 votos frente a 1, y con el texto de su PRIMERA aparición, no con el de la mayoría
    // de las grafías textuales (que aquí también sería 'Monitor PM10', pero por razones distintas).
    expect(m.tipoNombre).toBe('Monitor PM10')
    // Sigue habiendo más de un tipo DISTINTO en el conjunto (dos), así que se marca para revisar
    // aunque uno domine en votos: elegir en silencio por el usuario sería esconder la ambigüedad real.
    expect(m.revisar).toBe(true)
  })
})
