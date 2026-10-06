import { describe, it, expect } from 'vitest'
import { descargar, EXPORTACION, listarCarpeta, type ArchivoDrive } from './driveApi'

/** F1F-02 (RQ-ZS-21): Drive v3 con `fetchImpl` inyectado; el doble sirve un árbol de carpetas y registra cada petición. */
type Nodo = { id: string; name: string; mimeType: string; md5Checksum?: string; modifiedTime?: string }
const CARPETA = 'application/vnd.google-apps.folder'
const f = (id: string, name: string, extra: Partial<Nodo> = {}): Nodo => ({ id, name, mimeType: 'application/pdf', modifiedTime: '2026-09-01T00:00:00Z', md5Checksum: `md5-${id}`, ...extra })
const dir = (id: string, name: string): Nodo => ({ id, name, mimeType: CARPETA, modifiedTime: '2026-09-01T00:00:00Z' })
const padreDe = (u: URL): string => /'([^']+)' in parents/.exec(u.searchParams.get('q') ?? '')![1]

function drive(hijos: Record<string, Nodo[]>, opc: { raiz?: Nodo; falla?: (url: URL) => number | undefined; paginas?: number } = {}) {
  const urls: URL[] = []
  const cabeceras: Array<Record<string, string>> = []
  const fetchImpl = (async (u: string, init?: RequestInit) => {
    const url = new URL(u)
    urls.push(url)
    cabeceras.push((init?.headers ?? {}) as Record<string, string>)
    const forzado = opc.falla?.(url)
    if (forzado) return new Response(JSON.stringify({ error: { message: 'boom' } }), { status: forzado })
    const m = /^\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname)
    if (m && !url.searchParams.get('alt')) return new Response(JSON.stringify(opc.raiz ?? dir(m[1], 'Raiz')))
    if (url.pathname === '/drive/v3/files') {
      const todos = hijos[padreDe(url)] ?? []
      const pagina = Number(url.searchParams.get('pageToken') ?? 0)
      const n = opc.paginas ? Math.ceil(todos.length / opc.paginas) : todos.length
      const sig = opc.paginas && pagina + 1 < opc.paginas ? { nextPageToken: String(pagina + 1) } : {}
      return new Response(JSON.stringify({ files: opc.paginas ? todos.slice(pagina * n, (pagina + 1) * n) : todos, ...sig }))
    }
    return new Response('contenido', { status: 200 })
  }) as unknown as typeof fetch
  return { urls, cabeceras, fetchImpl }
}
const token = async () => 'tok'
const consultas = (urls: URL[]) => urls.filter((u) => u.pathname === '/drive/v3/files').map(padreDe)

describe('listarCarpeta', () => {
  it('comprueba la raíz con files.get y rechaza lo que no es una carpeta', async () => {
    const { fetchImpl, urls } = drive({}, { raiz: f('R', 'suelto') })
    await expect(listarCarpeta('R', token, fetchImpl)).rejects.toThrow(/no es una carpeta/)
    expect(urls[0].pathname).toBe('/drive/v3/files/R')
    expect(urls[0].searchParams.get('supportsAllDrives')).toBe('true')
    await expect(listarCarpeta('R', token, drive({}, { falla: () => 404 }).fetchImpl)).rejects.toThrow(/^Drive 404: /)
  })

  it('recorre subcarpetas y páginas; ruta, huella (md5 o fecha) y parámetros de unidad compartida', async () => {
    const { fetchImpl, urls, cabeceras } = drive({
      R: [f('a', 'a.pdf'), dir('S', 'Manuales'), f('b', 'b.pdf', { md5Checksum: undefined })],
      S: [f('c', 'c.pdf')],
    }, { paginas: 2 })
    const r = await listarCarpeta('R', token, fetchImpl)
    expect(r.archivos.map((a) => [a.id, a.ruta, a.huella])).toEqual([
      ['a', 'a.pdf', 'md5-a'], ['b', 'b.pdf', '2026-09-01T00:00:00Z'], ['c', 'Manuales/c.pdf', 'md5-c'],
    ])
    const l = urls.find((u) => u.pathname === '/drive/v3/files')!
    expect(l.searchParams.get('q')).toBe("'R' in parents and trashed=false")
    expect(l.searchParams.get('pageSize')).toBe('1000')
    expect(l.searchParams.get('supportsAllDrives')).toBe('true')
    expect(l.searchParams.get('includeItemsFromAllDrives')).toBe('true')
    expect(urls.filter((u) => u.searchParams.get('pageToken'))).toHaveLength(2)   // el doble parte cada carpeta en 2 páginas: R y S
    expect(cabeceras.every((c) => c.Authorization === 'Bearer tok')).toBe(true)
  })

  it('un ciclo de carpetas no se repite (conjunto de visitadas)', async () => {
    const { fetchImpl, urls } = drive({ R: [dir('S', 'S')], S: [dir('R', 'vuelta'), f('c', 'c.pdf')] })
    const r = await listarCarpeta('R', token, fetchImpl)
    expect(r.archivos.map((a) => a.id)).toEqual(['c'])
    expect(consultas(urls)).toEqual(['R', 'S'])
  })

  it('sólo consulta carpetas de la raíz: no sigue accesos directos y omite otros nativos con su motivo', async () => {
    const { fetchImpl, urls } = drive({
      R: [{ id: 'X', name: 'atajo', mimeType: 'application/vnd.google-apps.shortcut' }, { id: 'F', name: 'Formulario', mimeType: 'application/vnd.google-apps.form' }, f('a', 'a.pdf')],
      X: [f('fuera', 'fuera.pdf')], F: [f('fuera2', 'fuera2.pdf')],
    })
    const r = await listarCarpeta('R', token, fetchImpl)
    expect(r.archivos.map((a) => a.id)).toEqual(['a'])
    expect(consultas(urls)).toEqual(['R'])
    expect(r.omitidos).toEqual(['atajo: acceso directo, no se sigue', 'Formulario: documento nativo de Google sin exportación (application/vnd.google-apps.form)'])
  })

  it('los nativos exportables salen con su formato y extensión, y la fecha como huella', async () => {
    const nativo = (id: string, tipo: string, name: string): Nodo => ({ id, name, mimeType: `application/vnd.google-apps.${tipo}`, modifiedTime: '2026-09-02T00:00:00Z' })
    const r = await listarCarpeta('R', token, drive({ R: [nativo('d', 'document', 'Acta'), nativo('s', 'spreadsheet', 'Hoja'), nativo('p', 'presentation', 'Deck'), nativo('w', 'drawing', 'Plano')] }).fetchImpl)
    expect(r.archivos.map((a) => [a.ruta, a.exportarComo, a.huella])).toEqual([
      ['Acta.docx', EXPORTACION['application/vnd.google-apps.document'].mime, '2026-09-02T00:00:00Z'],
      ['Hoja.xlsx', EXPORTACION['application/vnd.google-apps.spreadsheet'].mime, '2026-09-02T00:00:00Z'],
      ['Deck.pptx', EXPORTACION['application/vnd.google-apps.presentation'].mime, '2026-09-02T00:00:00Z'],
      ['Plano.pdf', 'application/pdf', '2026-09-02T00:00:00Z'],
    ])
  })

  it('un fallo en una página o en una subcarpeta lanza: nunca devuelve un listado parcial', async () => {
    const hijos = { R: [dir('S', 'S'), f('a', 'a.pdf'), f('b', 'b.pdf'), f('c', 'c.pdf')], S: [f('d', 'd.pdf')] }
    await expect(listarCarpeta('R', token, drive(hijos, { falla: (u) => (u.searchParams.get('pageToken') ? 500 : undefined), paginas: 2 }).fetchImpl)).rejects.toThrow(/^Drive 500: /)
    await expect(listarCarpeta('R', token, drive(hijos, { falla: (u) => (u.pathname === '/drive/v3/files' && padreDe(u) === 'S' ? 429 : undefined) }).fetchImpl)).rejects.toThrow(/^Drive 429: /)
  })
})

describe('descargar', () => {
  const archivo = (extra: Partial<ArchivoDrive> = {}): ArchivoDrive => ({ id: 'a', nombre: 'a.pdf', ruta: 'a.pdf', mimeType: 'application/pdf', huella: 'h', ...extra })
  const leer = async (flujo: AsyncIterable<Buffer>) => { const t: Buffer[] = []; for await (const c of flujo) t.push(Buffer.from(c)); return Buffer.concat(t).toString() }

  it('un fichero normal se baja con alt=media como flujo', async () => {
    const { fetchImpl, urls } = drive({})
    const r = await descargar(archivo(), token, fetchImpl)
    expect(urls[0].pathname).toBe('/drive/v3/files/a')
    expect(urls[0].searchParams.get('alt')).toBe('media')
    expect(urls[0].searchParams.get('supportsAllDrives')).toBe('true')
    expect('flujo' in r && await leer(r.flujo)).toBe('contenido')
  })

  it('un nativo se exporta con su mimeType de destino', async () => {
    const { fetchImpl, urls } = drive({})
    const mime = EXPORTACION['application/vnd.google-apps.document'].mime
    await descargar(archivo({ mimeType: 'application/vnd.google-apps.document', exportarComo: mime }), token, fetchImpl)
    expect(urls[0].pathname).toBe('/drive/v3/files/a/export')
    expect(urls[0].searchParams.get('mimeType')).toBe(mime)
  })

  it('403 exportSizeLimitExceeded se omite con motivo; cualquier otro fallo lanza', async () => {
    const limite = (async () => new Response(JSON.stringify({ error: { errors: [{ reason: 'exportSizeLimitExceeded' }] } }), { status: 403 })) as unknown as typeof fetch
    expect(await descargar(archivo({ ruta: 'Grande.docx', exportarComo: 'x' }), token, limite)).toEqual({ omitido: 'Grande.docx: supera el límite de exportación de Drive' })
    await expect(descargar(archivo(), token, drive({}, { falla: () => 500 }).fetchImpl)).rejects.toThrow(/^Drive 500: /)
    await expect(descargar(archivo(), token, (async () => new Response('{}', { status: 403 })) as unknown as typeof fetch)).rejects.toThrow(/^Drive 403: /)
  })
})
