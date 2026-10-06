import { describe, it, expect } from 'vitest'
import { createHash, randomBytes } from 'node:crypto'
import { borrarVersion, leerObjeto, subirMultiparte, trocear, PARTE, type AlmacenS3 } from './multiparte'

/** F1F-02 (RQ-ZS-21): subida multiparte S3 en memoria, firmada con el hash REAL de cada parte. `fetchImpl` doble que registra todo. */
type Llamada = { metodo: string; url: URL; cabeceras: Record<string, string>; cuerpo: Buffer }
const MIB = 1024 * 1024
const md5 = (b: Buffer) => createHash('md5').update(b).digest('base64')
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const XML = (cuerpo: string, extra: Record<string, string> = {}, status = 200) => new Response(status === 204 || status === 404 ? null : cuerpo, { status, headers: extra })

function almacen(responder: (l: Llamada, n: number) => Response | undefined = () => undefined) {
  const llamadas: Llamada[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const l: Llamada = { metodo: init.method ?? 'GET', url: new URL(url), cabeceras: init.headers as Record<string, string>, cuerpo: init.body ? Buffer.from(init.body as Uint8Array) : Buffer.alloc(0) }
    llamadas.push(l)
    const q = l.url.searchParams
    const propia = responder(l, llamadas.length)
    if (propia) return propia
    if (l.metodo === 'POST' && q.has('uploads')) return XML('<InitiateMultipartUploadResult><UploadId>U1</UploadId></InitiateMultipartUploadResult>')
    if (l.metodo === 'PUT') return XML('', { etag: `"etag-${q.get('partNumber')}"` })
    if (l.metodo === 'POST') return XML('<CompleteMultipartUploadResult><Key>k</Key></CompleteMultipartUploadResult>', { 'x-amz-version-id': 'ver-9' })
    return XML('', {}, 204)
  }) as unknown as typeof fetch
  const alm: AlmacenS3 = { cfg: { endpoint: 'https://s3.ejemplo.test/', region: 'eu-1', bucket: 'bkt', accessKeyId: 'AK', secretAccessKey: 'SK' }, fetchImpl, ahora: () => new Date('2026-10-04T05:00:00Z') }
  return { alm, llamadas }
}
async function* en(datos: Buffer, trozo = 64 * 1024) { for (let i = 0; i < datos.length; i += trozo) yield datos.subarray(i, i + trozo) }

describe('trocear', () => {
  it('parte exacta de 8 MiB = una sola parte (sin parte final vacía) y 12 MiB = 8 + 4', async () => {
    const lista = async (n: number) => { const r: number[] = []; for await (const p of trocear(en(Buffer.alloc(n, 1)), PARTE)) r.push(p.length); return r }
    expect(PARTE).toBe(8 * MIB)
    expect(await lista(8 * MIB)).toEqual([8 * MIB])
    expect(await lista(12 * MIB)).toEqual([8 * MIB, 4 * MIB])
    expect(await lista(0)).toEqual([])
  })
})

describe('subirMultiparte', () => {
  it('12 MiB = 2 partes: Create, UploadPart con MD5 y SHA-256 reales de CADA parte, Complete con PartNumber+ETag, y guarda el versionId', async () => {
    const datos = randomBytes(12 * MIB)
    const { alm, llamadas } = almacen()
    const r = await subirMultiparte(alm, 'drive/archivos/x/1.enc', en(datos))
    expect(r).toEqual({ versionId: 'ver-9' })
    expect(llamadas.map((l) => `${l.metodo} ${[...l.url.searchParams.keys()].sort().join('&')}`)).toEqual(['POST uploads', 'PUT partNumber&uploadId', 'PUT partNumber&uploadId', 'POST uploadId'])
    expect(llamadas[0].url.pathname).toBe('/bkt/drive/archivos/x/1.enc')
    const partes = [datos.subarray(0, 8 * MIB), datos.subarray(8 * MIB)]
    llamadas.slice(1, 3).forEach((l, i) => {
      expect(l.url.searchParams.get('uploadId')).toBe('U1'); expect(l.url.searchParams.get('partNumber')).toBe(String(i + 1))
      expect(l.cuerpo.equals(partes[i])).toBe(true)
      expect(l.cabeceras['Content-MD5']).toBe(md5(partes[i]))
      expect(l.cabeceras['x-amz-content-sha256']).toBe(sha(partes[i]))
      expect(l.cabeceras.Authorization).toMatch(/SignedHeaders=[^,]*content-md5[^,]*x-amz-content-sha256/)
      expect(l.cabeceras.host).toBeUndefined()
    })
    const xml = llamadas[3].cuerpo.toString()
    expect(xml).toContain('<Part><PartNumber>1</PartNumber><ETag>"etag-1"</ETag></Part><Part><PartNumber>2</PartNumber><ETag>"etag-2"</ETag></Part>')
  })

  it('un 200 con <Error> en el cuerpo del Complete es un fallo, y se aborta la subida', async () => {
    const { alm, llamadas } = almacen((l) => (l.metodo === 'POST' && l.url.searchParams.has('uploadId') ? XML('<Error><Code>InternalError</Code></Error>') : undefined))
    await expect(subirMultiparte(alm, 'k', en(Buffer.from('hola')))).rejects.toThrow(/InternalError/)
    const ultima = llamadas.at(-1)!
    expect([ultima.metodo, ultima.url.searchParams.get('uploadId')]).toEqual(['DELETE', 'U1'])
  })

  it('una parte que falla aborta; y si el Abort también falla, el error que sale es el de la parte', async () => {
    const { alm, llamadas } = almacen((l) => (l.metodo === 'PUT' ? XML('<Error><Code>SlowDown</Code></Error>', {}, 503) : l.metodo === 'DELETE' ? XML('', {}, 500) : undefined))
    await expect(subirMultiparte(alm, 'k', en(Buffer.from('hola')))).rejects.toThrow(/503.*SlowDown/s)
    expect(llamadas.at(-1)!.metodo).toBe('DELETE')
  })

  it('si la fuente falla a media subida, aborta y propaga', async () => {
    const { alm, llamadas } = almacen()
    async function* rota() { yield Buffer.alloc(PARTE); throw new Error('Drive cortó') }
    await expect(subirMultiparte(alm, 'k', rota())).rejects.toThrow('Drive cortó')
    expect(llamadas.at(-1)!.metodo).toBe('DELETE')
  })

  it('una fuente vacía sube una parte vacía (S3 no cierra una subida sin partes)', async () => {
    const { alm, llamadas } = almacen()
    await subirMultiparte(alm, 'k', en(Buffer.alloc(0)))
    expect(llamadas.filter((l) => l.metodo === 'PUT')).toHaveLength(1)
    expect(llamadas.find((l) => l.metodo === 'PUT')!.cabeceras['x-amz-content-sha256']).toBe(sha(Buffer.alloc(0)))
  })
})

describe('borrarVersion', () => {
  it('borra CON ?versionId= (sin él sólo se crearía un marcador)', async () => {
    const { alm, llamadas } = almacen()
    expect(await borrarVersion(alm, 'drive/archivos/x/1.enc', 'ver 1')).toEqual({ ok: true })
    expect([llamadas[0].metodo, llamadas[0].url.searchParams.get('versionId')]).toEqual(['DELETE', 'ver 1'])
  })
  it('un 403 del bloqueo, o la red caída, devuelve el fallo sin lanzar', async () => {
    const { alm } = almacen(() => XML('<Error><Code>AccessDenied</Code></Error>', {}, 403))
    expect(await borrarVersion(alm, 'k', 'v')).toEqual({ ok: false, error: expect.stringMatching(/403.*AccessDenied/s) })
    alm.fetchImpl = (async () => { throw new Error('ECONNRESET') }) as unknown as typeof fetch
    expect(await borrarVersion(alm, 'k', 'v')).toEqual({ ok: false, error: expect.stringContaining('ECONNRESET') })
  })
})

describe('leerObjeto', () => {
  it('200 devuelve los bytes, 404 devuelve null y cualquier otra cosa lanza', async () => {
    expect((await leerObjeto(almacen(() => XML('abc')).alm, 'k'))!.toString()).toBe('abc')
    expect(await leerObjeto(almacen(() => XML('', {}, 404)).alm, 'k')).toBeNull()
    await expect(leerObjeto(almacen(() => XML('boom', {}, 500)).alm, 'k')).rejects.toThrow(/500/)
  })
})
