/**
 * Reduce una imagen antes de subirla.
 *
 * Las fotos de remisión salen de la cámara de un móvil: 3-5 MB cada una, y en base64 ocupan un 33 %
 * más en Postgres, engordando también los backups. A 1600 px de ancho y calidad 0.8 quedan en unos
 * 300 KB, resolución de sobra para documentar el estado de un equipo.
 *
 * Nunca amplía, y si el resultado pesara más que el original (pasa con imágenes ya pequeñas o con
 * capturas de pantalla) devuelve el fichero original. Ante cualquier fallo también, para que un
 * formato exótico no impida subir la foto.
 */
export async function redimensionarImagen(file: File, maxAncho = 1600, calidad = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const ancho = Math.min(maxAncho, bitmap.width)
    const alto = Math.round((bitmap.height * ancho) / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', calidad))
    if (!blob || blob.size >= file.size) return file
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/** Fecha de hoy en `AAAA-MM-DD` con los getters LOCALES. `toISOString()` daría la de UTC, que en
 *  Colombia adelanta un día a partir de las 19:00. */
export function hoyISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
