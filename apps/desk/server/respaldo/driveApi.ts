import { Readable } from 'node:stream'
import { huella } from './incremental'

/**
 * Lectura de Google Drive v3 con una cuenta de servicio de sólo lectura (F1F-02, RQ-ZS-21). Todo lo de red entra por
 * `fetchImpl`. Un listado que falla en cualquier punto LANZA: devolver uno parcial marcaría como desaparecidos
 * documentos vivos. Los accesos directos no se siguen (podrían salir de la carpeta raíz).
 */
export interface ArchivoDrive {
  id: string
  nombre: string
  /** Ruta relativa a la raíz, con extensión si es un nativo exportado. Sólo informativa: la clave de objeto lleva el `id`. */
  ruta: string
  mimeType: string
  /** `md5Checksum` si Drive lo da; si no (nativos), `modifiedTime`. */
  huella: string
  /** Formato de destino de la exportación, sólo en nativos exportables. */
  exportarComo?: string
}

const API = 'https://www.googleapis.com/drive/v3/files'
const NATIVO = 'application/vnd.google-apps.'
const OFFICE = 'application/vnd.openxmlformats-officedocument.'
/** Nativos que se exportan a un formato que se puede volver a subir a Drive (el PDF no es editable), salvo Drawings. */
export const EXPORTACION: Record<string, { mime: string; ext: string }> = {
  [`${NATIVO}document`]: { mime: `${OFFICE}wordprocessingml.document`, ext: '.docx' },
  [`${NATIVO}spreadsheet`]: { mime: `${OFFICE}spreadsheetml.sheet`, ext: '.xlsx' },
  [`${NATIVO}presentation`]: { mime: `${OFFICE}presentationml.presentation`, ext: '.pptx' },
  [`${NATIVO}drawing`]: { mime: 'application/pdf', ext: '.pdf' },
}

type Token = () => Promise<string>
type Nodo = { id: string; name: string; mimeType: string; md5Checksum?: string; modifiedTime?: string }

const pedir = async (url: URL, token: Token, fetchImpl: typeof fetch): Promise<Response> =>
  fetchImpl(url.toString(), { headers: { Authorization: `Bearer ${await token()}` } })
const fallo = async (res: Response): Promise<Error> => new Error(`Drive ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)

async function json<T>(url: URL, token: Token, fetchImpl: typeof fetch): Promise<T> {
  const res = await pedir(url, token, fetchImpl)
  if (!res.ok) throw await fallo(res)
  return (await res.json()) as T
}

/** `files.get` de la raíz (tiene que ser una carpeta) y listado recursivo y paginado. Devuelve también lo omitido, con motivo, y las carpetas visitadas (para el aviso de `drive_url`). */
export async function listarCarpeta(raizId: string, token: Token, fetchImpl: typeof fetch = fetch): Promise<{ archivos: ArchivoDrive[]; omitidos: string[]; carpetas: string[] }> {
  const raiz = new URL(`${API}/${encodeURIComponent(raizId)}`)
  raiz.search = new URLSearchParams({ fields: 'id,name,mimeType', supportsAllDrives: 'true' }).toString()
  if ((await json<Nodo>(raiz, token, fetchImpl)).mimeType !== `${NATIVO}folder`) throw new Error('RESPALDO_DRIVE_CARPETA_ID no es una carpeta de Drive')

  const archivos: ArchivoDrive[] = []
  const omitidos: string[] = []
  const visitadas = new Set([raizId])
  const cola: Array<{ id: string; ruta: string }> = [{ id: raizId, ruta: '' }]
  for (let c = cola.shift(); c; c = cola.shift()) {
    let pagina: string | undefined
    do {
      const url = new URL(API)
      url.search = new URLSearchParams({
        q: `'${c.id}' in parents and trashed=false`, fields: 'nextPageToken,files(id,name,mimeType,md5Checksum,modifiedTime)', pageSize: '1000',
        supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(pagina ? { pageToken: pagina } : {}),
      }).toString()
      const r = await json<{ files?: Nodo[]; nextPageToken?: string }>(url, token, fetchImpl)
      for (const n of r.files ?? []) {
        const exp = EXPORTACION[n.mimeType]
        const ruta = `${c.ruta}${n.name}${exp?.ext ?? ''}`
        if (n.mimeType === `${NATIVO}folder`) { if (!visitadas.has(n.id)) { visitadas.add(n.id); cola.push({ id: n.id, ruta: `${ruta}/` }) } }
        else if (n.mimeType === `${NATIVO}shortcut`) omitidos.push(`${n.name}: acceso directo, no se sigue`)
        else if (n.mimeType.startsWith(NATIVO) && !exp) omitidos.push(`${n.name}: documento nativo de Google sin exportación (${n.mimeType})`)
        else archivos.push({ id: n.id, nombre: `${n.name}${exp?.ext ?? ''}`, ruta, mimeType: n.mimeType, huella: huella(n), ...(exp ? { exportarComo: exp.mime } : {}) })
      }
      pagina = r.nextPageToken
    } while (pagina)
  }
  return { archivos, omitidos, carpetas: [...visitadas] }
}

/** Contenido como flujo (`alt=media` o `export`). Un `403 exportSizeLimitExceeded` se omite; cualquier otro fallo lanza. */
export async function descargar(a: ArchivoDrive, token: Token, fetchImpl: typeof fetch = fetch): Promise<{ flujo: Readable } | { omitido: string }> {
  const url = new URL(`${API}/${encodeURIComponent(a.id)}${a.exportarComo ? '/export' : ''}`)
  url.search = new URLSearchParams(a.exportarComo ? { mimeType: a.exportarComo } : { alt: 'media', supportsAllDrives: 'true' }).toString()
  const res = await pedir(url, token, fetchImpl)
  if (res.ok && res.body) return { flujo: Readable.fromWeb(res.body as never) }
  const cuerpo = (await res.text().catch(() => '')).slice(0, 300)
  if (res.status === 403 && cuerpo.includes('exportSizeLimitExceeded')) return { omitido: `${a.ruta}: supera el límite de exportación de Drive` }
  throw new Error(`Drive ${res.status}: ${cuerpo}`)
}
