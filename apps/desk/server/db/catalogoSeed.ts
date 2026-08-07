import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearTipo, crearMarca, crearModelo } from './catalogo'

/** Recorta a texto; null/undefined y blancos se tratan como ausentes por igual. */
const limpio = (v: unknown): string => String(v ?? '').trim()

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

export interface ResumenSiembra {
  tipos: number
  marcas: number
  modelos: number
  equiposEnlazados: number
  conflictos: number
}

/** Lo que un modelo acumula mientras se recorre el inventario: su casing de fábrica (la primera vez
 * que aparece) y cuántos de sus equipos declaran cada tipo. */
interface AgregadoModelo {
  marcaOriginal: string
  modeloOriginal: string
  /** tipo en minúsculas → { casing original, cuántos equipos lo declaran } */
  tipos: Map<string, { texto: string; n: number }>
}

/**
 * Puebla el catálogo maestro (tipos, marcas, modelos) a partir del inventario ya existente en
 * `equipos`, y enlaza cada equipo con su modelo. Se dispara a mano (la ruta llega en la Task 9),
 * nunca desde `migrate()`: `migrate()` es tolerante por sentencia y se salta en silencio la que
 * falle, así que un backfill escondido ahí podría no llegar a correr nunca sin que nadie se enterase.
 *
 * Idempotente y no destructiva, con el mismo precedente que `seedChecklist`: antes de crear nada
 * carga lo que YA existe en las tres tablas (indexado por nombre en minúsculas, porque la unicidad
 * de las tablas no distingue mayúsculas) y no lo reinserta. Reejecutarla no duplica ni pisa las
 * correcciones que un administrador haya hecho a mano entre una ejecución y la siguiente — es la
 * lección de la vieja siembra CSV de equipos, que revertía esas ediciones en cada arranque.
 *
 * La agregación se hace en JavaScript y no en SQL, mismo patrón que usaba `equipoFacets`: esquiva
 * las lagunas de pg-mem (sin subconsultas correlacionadas, sin TRIM) y es lo único que permite el
 * desempate alfabético determinista del paso 4 sin depender del orden en que la base devuelva filas.
 *
 * No reescribe ningún equipo salvo para rellenarle `modelo_id`: la evidencia del reparto de tipos
 * sigue viva en `equipos.tipo` para que la bandeja de conflictos (Task 7) pueda recalcularla.
 */
export async function sembrarCatalogo(db: Queryable): Promise<ResumenSiembra> {
  // --- Lo que ya existe, indexado por nombre en minúsculas. ---
  const tipoIdPorNombre = new Map<string, string>()
  for (const f of filas((await db.query('SELECT id, nombre FROM catalogo_tipos')).rows)) {
    tipoIdPorNombre.set((f.nombre as string).toLowerCase(), f.id as string)
  }
  const marcaIdPorNombre = new Map<string, string>()
  for (const f of filas((await db.query('SELECT id, nombre FROM catalogo_marcas')).rows)) {
    marcaIdPorNombre.set((f.nombre as string).toLowerCase(), f.id as string)
  }
  // marcaId → nombre de modelo en minúsculas → id del modelo
  const modeloIdPorMarca = new Map<string, Map<string, string>>()
  for (const f of filas((await db.query('SELECT id, marca_id, nombre FROM catalogo_modelos')).rows)) {
    const marcaId = f.marca_id as string
    let porMarca = modeloIdPorMarca.get(marcaId)
    if (!porMarca) { porMarca = new Map(); modeloIdPorMarca.set(marcaId, porMarca) }
    porMarca.set((f.nombre as string).toLowerCase(), f.id as string)
  }

  // --- Recorre el inventario UNA vez y agrega en memoria. ORDER BY id para que, entre ejecuciones,
  //     la primera casing vista de cada nombre sea siempre la misma. ---
  const equipos = filas((await db.query('SELECT id, marca, modelo, tipo, modelo_id FROM equipos ORDER BY id')).rows)

  const tiposVistos = new Map<string, string>() // minúsculas → primera casing vista
  const marcasVistas = new Map<string, string>()
  // marca en minúsculas → modelo en minúsculas → agregado (los Map anidados evitan cualquier clave
  // de texto concatenada: "6103" de Environics y "6103" de Horiba viven en ramas distintas del árbol)
  const modelosVistos = new Map<string, Map<string, AgregadoModelo>>()

  for (const f of equipos) {
    const marca = limpio(f.marca)
    const modelo = limpio(f.modelo)
    const tipo = limpio(f.tipo)

    // Regla 1 y 2: tipos y marcas se recogen de TODO el inventario, sin exigir que el equipo tenga
    // también el otro campo — son listas independientes de la de modelos.
    if (marca && !marcasVistas.has(marca.toLowerCase())) marcasVistas.set(marca.toLowerCase(), marca)
    if (tipo && !tiposVistos.has(tipo.toLowerCase())) tiposVistos.set(tipo.toLowerCase(), tipo)

    if (!marca || !modelo) continue // regla 3: sin marca o sin modelo no hay par que sembrar

    const marcaKey = marca.toLowerCase()
    const modeloKey = modelo.toLowerCase()
    let porMarca = modelosVistos.get(marcaKey)
    if (!porMarca) { porMarca = new Map(); modelosVistos.set(marcaKey, porMarca) }
    let agregado = porMarca.get(modeloKey)
    if (!agregado) { agregado = { marcaOriginal: marca, modeloOriginal: modelo, tipos: new Map() }; porMarca.set(modeloKey, agregado) }

    if (tipo) { // regla 4: los equipos que no declaran tipo no votan
      const tipoKey = tipo.toLowerCase()
      const actual = agregado.tipos.get(tipoKey)
      if (actual) actual.n++
      else agregado.tipos.set(tipoKey, { texto: tipo, n: 1 })
    }
  }

  // --- Alta de tipos y marcas que faltan (reutiliza crearTipo/crearMarca: no se duplica su lógica). ---
  let tiposCreados = 0
  for (const [key, nombre] of tiposVistos) {
    if (tipoIdPorNombre.has(key)) continue
    tipoIdPorNombre.set(key, await crearTipo(db, nombre))
    tiposCreados++
  }
  let marcasCreadas = 0
  for (const [key, nombre] of marcasVistas) {
    if (marcaIdPorNombre.has(key)) continue
    marcaIdPorNombre.set(key, await crearMarca(db, nombre))
    marcasCreadas++
  }

  // --- Alta de modelos que faltan, con el tipo más frecuente entre sus equipos (regla 4). ---
  let modelosCreados = 0
  let conflictos = 0
  for (const [marcaKey, porMarca] of modelosVistos) {
    const marcaId = marcaIdPorNombre.get(marcaKey)! // ya se creó o ya existía en el paso anterior
    let modelosDeLaMarca = modeloIdPorMarca.get(marcaId)
    if (!modelosDeLaMarca) { modelosDeLaMarca = new Map(); modeloIdPorMarca.set(marcaId, modelosDeLaMarca) }

    for (const [modeloKey, agregado] of porMarca) {
      // El modelo ya existía: `revisar` se decide una sola vez, al crearlo, y no se toca aquí —
      // podría llevar una corrección manual hecha entre una ejecución y la siguiente.
      if (modelosDeLaMarca.has(modeloKey)) continue

      const candidatos = [...agregado.tipos.values()]
      // Empate: gana el primero por orden alfabético, para que dos ejecuciones sobre los mismos
      // datos den siempre el mismo resultado sin depender del orden en que llegaron las filas.
      candidatos.sort((a, b) => (b.n - a.n) || a.texto.localeCompare(b.texto))
      const ganador = candidatos[0] ?? null
      // Ambiguo si no hay ningún tipo declarado o si hay más de uno distinto, aunque uno domine.
      const revisar = candidatos.length !== 1
      const tipoId = ganador ? (tipoIdPorNombre.get(ganador.texto.toLowerCase()) ?? null) : null

      const modeloId = await crearModelo(db, { marcaId, nombre: agregado.modeloOriginal, tipoId, revisar })
      modelosDeLaMarca.set(modeloKey, modeloId)
      modelosCreados++
      if (revisar) conflictos++
    }
  }

  // --- Enlaza equipos.modelo_id por coincidencia exacta de (marca, modelo), sin pisar lo ya enlazado
  //     (regla 5). Lo que no case queda NULL: no se inventa nada. ---
  let equiposEnlazados = 0
  for (const f of equipos) {
    if (f.modelo_id != null) continue // ya enlazado: no se pisa
    const marca = limpio(f.marca)
    const modelo = limpio(f.modelo)
    if (!marca || !modelo) continue
    const marcaId = marcaIdPorNombre.get(marca.toLowerCase())
    const modeloId = marcaId ? modeloIdPorMarca.get(marcaId)?.get(modelo.toLowerCase()) : undefined
    if (!modeloId) continue // no debería pasar (el modelo se creó arriba), pero por si acaso no se inventa nada
    await db.query('UPDATE equipos SET modelo_id=$1 WHERE id=$2 AND modelo_id IS NULL', [modeloId, f.id])
    equiposEnlazados++
  }

  return { tipos: tiposCreados, marcas: marcasCreadas, modelos: modelosCreados, equiposEnlazados, conflictos }
}
