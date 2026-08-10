import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Ítems que vinieron del checklist pero que **nunca serán artículos de Zoho Books**: son casillas que
 * el técnico verifica al recibir el equipo, no cosas que se vendan ni se inventaríen.
 *
 * Si se borraran con el resto de la siembra desaparecerían de la remisión y ninguna categoría los
 * devolvería, porque no existen en Books ni van a existir.
 */
export const CONSERVAR_SIEMPRE = [
  'Manuales',
  'Repuestos reemplazados',
  'Documentación de calibración',
] as const

export interface ResumenLimpieza {
  /** Artículos que se borran (o que se borrarían, en simulacro). */
  borrados: number
  /** De la siembra, los que se dejan por estar en `CONSERVAR_SIEMPRE`. */
  conservados: number
  /** El detalle de lo que se va, por modelo. Es lo que se guarda como copia antes de borrar. */
  detalle: Array<{ modelo: string; articulos: string[] }>
}

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

const clave = (v: unknown): string => String(v ?? '').trim().toLowerCase()

/**
 * Retira los artículos que dejó la siembra desde el checklist de remisiones.
 *
 * El rediseño por categorías los dejó obsoletos: la lista de un modelo se deriva ahora de `books.items`
 * a través de las categorías asignadas, así que esas copias de texto libre duplicarían cada artículo.
 *
 * **Qué se considera «sembrado», y por qué así.** Un artículo de `catalogo_articulos` **sin `item_id`**
 * (la siembra solo creaba texto libre) cuyo nombre casa con un ítem de `remision_checklist`. Los dos
 * requisitos importan: sin el primero se borrarían artículos enlazados a Books que alguien añadió a
 * mano; sin el segundo se borraría cualquier añadido propio que no venga de la siembra.
 *
 * **Es destructivo y no tiene vuelta atrás**, así que `dryRun` devuelve el detalle completo —modelo por
 * modelo— para guardarlo antes. Ese detalle es la copia de seguridad.
 */
export async function limpiarArticulosSembrados(
  db: Queryable,
  opts: { dryRun?: boolean } = {},
): Promise<ResumenLimpieza> {
  const resumen: ResumenLimpieza = { borrados: 0, conservados: 0, detalle: [] }

  const checklist = await db.query('SELECT item FROM remision_checklist')
  const delChecklist = new Set(filas(checklist.rows).map((r) => clave(r.item)))
  const conservar = new Set(CONSERVAR_SIEMPRE.map(clave))

  // El nombre del modelo se resuelve aquí para que el detalle sea legible sin cruzar nada: quien lo
  // guarde como copia tiene que poder leerlo dentro de un año sin la base delante.
  const candidatos = await db.query(
    `SELECT a.id, a.nombre, ma.nombre AS marca, mo.nombre AS modelo
       FROM catalogo_articulos a
       JOIN catalogo_modelos mo ON mo.id = a.modelo_id
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
      WHERE a.item_id IS NULL
      ORDER BY ma.nombre, mo.nombre, a.orden`,
  )

  const porModelo = new Map<string, string[]>()
  const aBorrar: string[] = []
  for (const f of filas(candidatos.rows)) {
    const nombre = String(f.nombre)
    if (!delChecklist.has(clave(nombre))) continue // no vino de la siembra
    if (conservar.has(clave(nombre))) { resumen.conservados++; continue }

    const modelo = `${String(f.marca)} ${String(f.modelo)}`
    if (!porModelo.has(modelo)) porModelo.set(modelo, [])
    porModelo.get(modelo)!.push(nombre)
    aBorrar.push(String(f.id))
  }

  resumen.borrados = aBorrar.length
  resumen.detalle = [...porModelo.entries()].map(([modelo, articulos]) => ({ modelo, articulos }))

  if (!opts.dryRun) {
    // De uno en uno y no con un `IN (...)`: pg-mem no tipa los arrays enlazados, y son pocos cientos.
    for (const id of aBorrar) await db.query('DELETE FROM catalogo_articulos WHERE id = $1', [id])
  }
  return resumen
}
