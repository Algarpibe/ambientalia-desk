import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { perfilChecklist } from '@ambientalia/shared'

export interface ResumenSiembraArticulos {
  /** Modelos del catálogo recorridos. */
  modelos: number
  /** Artículos creados en esta pasada. */
  insertados: number
  /** Ya estaban, así que no se tocaron. */
  existentes: number
}

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/**
 * Siembra la lista de **accesorios** de cada modelo copiando el checklist «Incluye» que hoy usa la
 * remisión de entrada, indexado por perfil.
 *
 * **Sembrar no es heredar.** La herencia sería una regla viva —un modelo sin lista mira a su perfil cada
 * vez que se le pregunta—, y quedó descartada. Esto copia UNA vez y a partir de ahí cada modelo va por su
 * cuenta: es un punto de partida editable, no un vínculo.
 *
 * Sin esto hay que teclear del orden de 700 filas (35 modelos × ~20 ítems) antes de que la pantalla sirva
 * de algo, y una tarea así se queda a medias — que es peor que no empezarla, porque un modelo con la lista
 * incompleta parece completo.
 *
 * Los ítems entran como **texto libre** (sin `item_id`): el checklist venía del flujo de n8n y no tenía
 * SKU, y buena parte de sus ítems —«Manuales», «Caja de transporte», «Pletinas (par)»— no son artículos
 * vendibles en Books. Enlazar a artículos reales los que sí lo sean es trabajo posterior y manual.
 *
 * **Idempotente y no destructiva**, igual que `seedChecklist`: solo inserta lo que falta, y no reactiva lo
 * que alguien haya desactivado después. Pensada para dispararse a mano, nunca al arrancar.
 */
export async function sembrarArticulosDesdeChecklist(db: Queryable): Promise<ResumenSiembraArticulos> {
  const resumen: ResumenSiembraArticulos = { modelos: 0, insertados: 0, existentes: 0 }

  const modelos = await db.query(
    `SELECT m.id, m.nombre, ma.nombre AS marca FROM catalogo_modelos m
     JOIN catalogo_marcas ma ON ma.id = m.marca_id`,
  )

  for (const m of filas(modelos.rows)) {
    resumen.modelos++
    const modeloId = String(m.id)
    const perfil = perfilChecklist(String(m.marca ?? ''), String(m.nombre ?? ''))

    // Solo los ítems ACTIVOS del checklist: los desactivados los retiró alguien a propósito.
    const items = await db.query(
      'SELECT item FROM remision_checklist WHERE perfil = $1 AND activo = true ORDER BY orden, item',
      [perfil],
    )

    let orden = 0
    for (const fila of filas(items.rows)) {
      const nombre = String(fila.item)
      const ya = await db.query(
        'SELECT 1 FROM catalogo_articulos WHERE modelo_id = $1 AND clase = $2 AND LOWER(nombre) = $3',
        [modeloId, 'accesorio', nombre.toLowerCase()],
      )
      if (ya.rows.length) { resumen.existentes++; orden++; continue }
      await db.query(
        'INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre,orden) VALUES ($1,$2,$3,$4,$5)',
        ['art-' + randomUUID(), modeloId, 'accesorio', nombre, orden],
      )
      resumen.insertados++
      orden++
    }
  }

  return resumen
}
