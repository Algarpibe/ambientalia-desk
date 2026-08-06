/**
 * Cómo se enlazan los documentos y las fotos de una remisión. Vive aparte porque lo usan ya tres
 * lectores —el hilo del ticket, y ahora la hoja de vida del equipo— y son dos reglas fáciles de
 * copiar mal: que las de Drive son enlaces que la app no puede servir, y que las fotos sí y por eso
 * son las únicas que se pintan como miniatura.
 *
 * Lo que NO vive aquí: el texto de cada entrada. Cada lector redacta el suyo a propósito.
 */
import type { Attachment } from '@ambientalia/shared'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { urlSegura } from '@ambientalia/shared'

const enlaceDrive = (id: unknown): string | null =>
  id ? urlSegura(`https://drive.google.com/file/d/${String(id)}/view`) : null
const enlaceDoc = (id: unknown): string | null =>
  id ? urlSegura(`https://docs.google.com/document/d/${String(id)}/edit`) : null

/** Lo que hace falta de una foto: el resto (el base64, el peso) no se usa para enlazarla. */
export interface FotoRemision { id: string; filename: string }

/**
 * Los adjuntos de Drive son ENLACES, no ficheros: la app no tiene credenciales de Google y no puede
 * servirlos por el proxy. `size` lleva el tipo en vez del tamaño porque de un fichero de Drive no lo
 * sabemos y la segunda línea de la tarjeta tiene que decir algo.
 *
 * Las fotos son el otro caso: las subió el técnico, viven en `remision_fotos` y las sirve la propia
 * app. Por eso son las únicas que van con `isImage` —el panel las pinta como miniatura— y las únicas
 * cuyo enlace es relativo: mismo origen, así que el `<img>` viaja con la cookie de sesión sin tocar
 * el proxy de adjuntos. Su `size` sigue el convenio de las de Drive y lleva el tipo: en la miniatura
 * esa línea ni se muestra.
 */
export function adjuntosRemision(
  resultado: Record<string, unknown>,
  tipo: string,
  remisionId: string,
  fotos: FotoRemision[],
): Attachment[] {
  const posibles: Array<[string, string, string | null]> = [
    [`Remisión de ${tipo}`, 'PDF', enlaceDrive(resultado.pdfId)],
    ['Documento editable', 'Documento', enlaceDoc(resultado.docId)],
    ['Etiqueta .dymo', 'Etiqueta', enlaceDrive(resultado.dymoId)],
    ['Carpeta en Drive', 'Carpeta', urlSegura(resultado.carpetaUrl as string | null | undefined)],
  ]
  // La URL va también en `path` —y no `path: ''`— porque `path` es el respaldo del `href` para
  // cualquier consumidor que aún no mire `url`. La `key` de React ya no depende de esto: el panel
  // usa `att.url ?? att.path`.
  const deDrive: Attachment[] = posibles
    .filter(([, , url]) => url !== null)
    .map(([name, size, url]) => ({ name, size, path: url as string, url: url as string }))

  const deFotos: Attachment[] = fotos.map((f) => {
    const url = `/api/remisiones/${remisionId}/fotos/${f.id}`
    return { name: f.filename, size: 'Foto', path: url, url, isImage: true }
  })

  return [...deDrive, ...deFotos]
}

/**
 * Las fotos de VARIAS remisiones en una sola consulta, y no `listFotos` por remisión: así el número
 * de consultas no depende de cuántas remisiones traiga el lector que llama.
 */
export async function fotosPorRemision(db: Queryable, remisionIds: string[]): Promise<Map<string, FotoRemision[]>> {
  const por = new Map<string, FotoRemision[]>()
  if (!remisionIds.length) return por
  const ph = remisionIds.map((_, i) => `$${i + 1}`).join(',')
  const r = await db.query(
    `SELECT id, remision_id, filename FROM remision_fotos WHERE remision_id IN (${ph}) ORDER BY created_at`,
    remisionIds,
  )
  for (const f of r.rows as Record<string, unknown>[]) {
    const k = String(f.remision_id)
    por.set(k, [...(por.get(k) ?? []), { id: String(f.id), filename: (f.filename as string) || 'Foto' }])
  }
  return por
}
