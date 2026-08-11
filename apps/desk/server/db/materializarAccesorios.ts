import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearArticulo, ArticuloRepetido } from './catalogoArticulos'

export interface ResumenMaterializacion {
  /** Artículos que pasan de derivarse a estar en la lista del modelo (o que pasarían, en simulacro). */
  copiados: number
  /** Los que ya estaban en la lista con ese nombre: se dejan como están, no se duplican. */
  omitidos: number
  /** Categorías de accesorios retiradas. */
  categorias: number
  /** Lo que se copia, modelo a modelo. Es lo que hay que guardar antes de ejecutarlo de verdad. */
  detalle: Array<{ modelo: string; categoria: string; articulos: string[] }>
}

const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/**
 * Convierte los accesorios DERIVADOS de cada modelo en artículos sueltos, y retira las categorías de
 * accesorios.
 *
 * **Por qué.** Para los accesorios, la vía de bloque resultó poco práctica: una categoría de serie trae
 * decenas de artículos y la mayoría no aplica a la variante concreta, así que se acababa desactivando
 * uno a uno. Se elige pieza a pieza. Consumibles y repuestos se quedan como estaban: ahí el bloque sí
 * acierta, y esta función no los toca.
 *
 * **Por qué copiar antes de quitar.** Los derivados no están guardados en ninguna parte —se calculan en
 * vivo desde `books.items`—, así que retirar la categoría sin más los borraría sin dejar rastro. Al
 * copiarlos con su `item_id` y su SKU siguen siendo el mismo artículo de Books, no texto libre: el
 * modelo ve exactamente lo mismo, solo que ahora editable pieza a pieza.
 *
 * **Qué NO se copia**, y las dos razones son la misma —copiar lo que hoy no se ve sería inventar—:
 * lo que esté oculto para ese modelo (alguien dijo que no aplica) y lo que esté inactivo en Books.
 *
 * **Es destructiva y no tiene vuelta atrás**, así que `dryRun` devuelve el detalle completo para
 * guardarlo antes. Ese detalle es la copia de seguridad, igual que en `limpiarArticulosSembrados`.
 */
export async function materializarAccesorios(
  db: Queryable,
  opts: { dryRun?: boolean } = {},
): Promise<ResumenMaterializacion> {
  const resumen: ResumenMaterializacion = { copiados: 0, omitidos: 0, categorias: 0, detalle: [] }

  // El nombre del modelo se resuelve aquí para que el detalle se lea sin cruzar nada: quien lo guarde
  // como copia tiene que entenderlo dentro de un año sin la base delante.
  const cats = await db.query(
    `SELECT c.id, c.modelo_id, c.categoria, ma.nombre AS marca, mo.nombre AS modelo
       FROM catalogo_modelo_categorias c
       JOIN catalogo_modelos mo ON mo.id = c.modelo_id
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
      WHERE c.clase = 'accesorio'
      ORDER BY ma.nombre, mo.nombre, c.categoria`,
  )

  for (const c of filas(cats.rows)) {
    const modeloId = String(c.modelo_id)
    const categoria = String(c.categoria)
    const etiqueta = `${String(c.marca)} ${String(c.modelo)}`

    const arts = await db.query(
      `SELECT item_id, name, sku FROM books.items
        WHERE category_name = $1 AND COALESCE(status,'active') = 'active'
        ORDER BY name`,
      [categoria],
    )
    // Se agrega en JavaScript y no con un NOT EXISTS: pg-mem no resuelve las subconsultas correlacionadas
    // que eso pediría. Es el mismo motivo que en el resto del repo.
    const ocultosQ = await db.query('SELECT item_id FROM catalogo_articulos_ocultos WHERE modelo_id=$1', [modeloId])
    const ocultos = new Set(filas(ocultosQ.rows).map((r) => String(r.item_id)))

    const copiadosAqui: string[] = []
    for (const a of filas(arts.rows)) {
      const itemId = String(a.item_id)
      if (ocultos.has(itemId)) continue
      const nombre = String(a.name ?? '')
      const sku = (a.sku as string | null) || null

      if (opts.dryRun) {
        // En simulacro no se llama a `crearArticulo`, así que el choque de nombre se comprueba aquí. La
        // misma regla que allí: sin distinguir mayúsculas.
        const ya = await db.query(
          'SELECT 1 FROM catalogo_articulos WHERE modelo_id=$1 AND clase=$2 AND LOWER(nombre)=$3',
          [modeloId, 'accesorio', nombre.trim().toLowerCase()],
        )
        if (ya.rows.length) { resumen.omitidos++; continue }
        resumen.copiados++
        copiadosAqui.push(sku ? `${sku} · ${nombre}` : nombre)
        continue
      }

      try {
        await crearArticulo(db, modeloId, { clase: 'accesorio', itemId, sku, nombre })
        resumen.copiados++
        copiadosAqui.push(sku ? `${sku} · ${nombre}` : nombre)
      } catch (e) {
        // Ya hay modelos con artículos añadidos a mano: un choque de nombre no puede tumbar la
        // migración entera ni duplicar la fila. Se cuenta y se sigue.
        if (e instanceof ArticuloRepetido) { resumen.omitidos++; continue }
        throw e
      }
    }

    resumen.categorias++
    if (copiadosAqui.length) resumen.detalle.push({ modelo: etiqueta, categoria, articulos: copiadosAqui })
    if (!opts.dryRun) await db.query('DELETE FROM catalogo_modelo_categorias WHERE id = $1', [String(c.id)])
  }

  return resumen
}
