import type { ArchivoDrive } from './driveApi'

/**
 * Índice de lo ya copiado y decisiones incrementales (F1F-02, RQ-ZS-21). Todo es PURO: devuelve un índice nuevo y no
 * muta el de entrada. El índice vive cifrado en el almacenamiento (`drive/indice.json.enc`), no en la base de datos.
 */
export interface VersionCopiada { clave: string; versionId?: string; copiadaEn: string; huella: string; superadaEn?: string }
export interface EntradaIndice { nombre: string; ruta: string; mimeType: string; desaparecidoEn?: string; versiones: VersionCopiada[] }
export interface IndiceDrive { formato: 1; actualizado: string; documentos: Record<string /* fileId */, EntradaIndice> }

export const indiceVacio = (ahora: string): IndiceDrive => ({ formato: 1, actualizado: ahora, documentos: {} })

/** El MD5 es del contenido (no recopia por mover o renombrar); los nativos de Google no lo traen y sólo cabe la fecha. */
export const huella = (n: { md5Checksum?: string; modifiedTime?: string }): string => n.md5Checksum || n.modifiedTime || ''

/** El nombre del documento NO va en la clave (iría sin cifrar en el almacenamiento); va en el índice. */
export const claveObjeto = (fileId: string, copiadaEn: Date): string =>
  `drive/archivos/${fileId}/${copiadaEn.toISOString().slice(0, 19).replace(/:/g, '-')}Z.enc`

/** Lo que hay que copiar: lo nuevo y lo de huella distinta de la ÚLTIMA versión del índice. */
export const planificar = (indice: IndiceDrive, listado: ArchivoDrive[]): ArchivoDrive[] =>
  listado.filter((a) => indice.documentos[a.id]?.versiones.at(-1)?.huella !== a.huella)

/** Registra una copia terminada: la versión anterior queda superada en el instante de la nueva. */
export function aplicarCopia(indice: IndiceDrive, a: ArchivoDrive, v: { clave: string; versionId?: string; copiadaEn: string }): IndiceDrive {
  const previo = indice.documentos[a.id]
  const versiones = (previo?.versiones ?? []).map((x, i, todas) => (i === todas.length - 1 ? { ...x, superadaEn: v.copiadaEn } : x))
  const entrada: EntradaIndice = { ...previo, nombre: a.nombre, ruta: a.ruta, mimeType: a.mimeType, versiones: [...versiones, { ...v, huella: a.huella }] }
  return { ...indice, actualizado: v.copiadaEn, documentos: { ...indice.documentos, [a.id]: entrada } }
}

/**
 * Marca como desaparecido al que ya no está en Drive, y quita la marca al que reaparece. SÓLO con listado completo: uno
 * parcial marcaría como borrados documentos vivos y, a los 12 meses, la retención los borraría.
 */
export function marcarDesaparecidos(indice: IndiceDrive, vistos: ArchivoDrive[], listadoCompleto: boolean, ahora: string): IndiceDrive {
  if (!listadoCompleto) return indice
  const ids = new Set(vistos.map((a) => a.id))
  const documentos = Object.fromEntries(Object.entries(indice.documentos).map(([id, e]) => {
    const { desaparecidoEn, ...resto } = e
    return [id, ids.has(id) ? resto : { ...resto, desaparecidoEn: desaparecidoEn ?? ahora }]
  }))
  return { ...indice, documentos }
}
