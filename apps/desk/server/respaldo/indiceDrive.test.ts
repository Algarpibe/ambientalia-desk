import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { CLAVE_INDICE, escribirIndice, IndiceIlegible, leerIndice } from './indiceDrive'
import { cifrador } from './cifrado'
import { aplicarCopia, indiceVacio } from './incremental'
import type { AlmacenS3 } from './multiparte'

/** F1F-02 (RQ-ZS-21): el índice vive cifrado en el almacenamiento. Sólo un `404` es «primera pasada»; todo lo demás es ilegible. */
const CLAVE = randomBytes(32)
const AHORA = '2026-10-04T05:00:00.000Z'
const INDICE = aplicarCopia(indiceVacio(AHORA), { id: 'f1', nombre: 'a.pdf', ruta: 'a.pdf', mimeType: 'application/pdf', huella: 'h1' }, { clave: 'k1', versionId: 'v1', copiadaEn: AHORA })

/** Un almacén en memoria que habla S3 lo justo: multiparte para escribir, GET para leer. */
function almacen(forzar?: (metodo: string) => Response | undefined) {
  const objetos = new Map<string, Buffer>(); const partes: Buffer[] = []; const claves: string[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const u = new URL(url); const metodo = init.method ?? 'GET'; const clave = u.pathname.replace(/^\/bkt\//, '')
    const forzada = forzar?.(metodo); if (forzada) return forzada
    if (metodo === 'POST' && u.searchParams.has('uploads')) return new Response('<UploadId>U</UploadId>')
    if (metodo === 'PUT') { partes.push(Buffer.from(init.body as Uint8Array)); return new Response('', { headers: { etag: '"e"' } }) }
    if (metodo === 'POST') { objetos.set(clave, Buffer.concat(partes)); claves.push(clave); return new Response('<ok/>', { headers: { 'x-amz-version-id': 'vi' } }) }
    const o = objetos.get(clave)
    return o ? new Response(new Uint8Array(o)) : new Response('', { status: 404 })
  }) as unknown as typeof fetch
  const alm: AlmacenS3 = { cfg: { endpoint: 'https://s3.ejemplo.test', region: 'eu-1', bucket: 'bkt', accessKeyId: 'AK', secretAccessKey: 'SK' }, fetchImpl, ahora: () => new Date(AHORA) }
  return { alm, objetos, claves }
}

describe('indiceDrive', () => {
  it('escribe cifrado en drive/indice.json.enc (sin el nombre del documento a la vista) y lo lee de vuelta idéntico', async () => {
    const { alm, objetos, claves } = almacen()
    await escribirIndice(alm, CLAVE, INDICE)
    expect(claves).toEqual(['drive/indice.json.enc']); expect(CLAVE_INDICE).toBe('drive/indice.json.enc')
    expect(objetos.get(CLAVE_INDICE)!.includes('a.pdf')).toBe(false)
    expect(await leerIndice(alm, CLAVE, AHORA)).toEqual(INDICE)
  })
  it('404 = primera pasada: índice vacío con la fecha de ahora', async () => {
    expect(await leerIndice(almacen().alm, CLAVE, AHORA)).toEqual(indiceVacio(AHORA))
  })
  it('cualquier otro fallo es IndiceIlegible, distinguible: red, 500, otra clave, byte alterado, JSON roto o forma errónea', async () => {
    const colocar = async (datos: Buffer, clave = CLAVE) => { const { alm, objetos } = almacen(); const c = cifrador(clave); c.end(datos); objetos.set(CLAVE_INDICE, Buffer.concat(await c.toArray())); return { alm, objetos } }
    const ilegible = async (alm: AlmacenS3) => { const e = await leerIndice(alm, CLAVE, AHORA).catch((x) => x); expect(e).toBeInstanceOf(IndiceIlegible); return e as Error }

    const { alm: red } = almacen(); red.fetchImpl = (async () => { throw new Error('ECONNRESET') }) as unknown as typeof fetch
    expect((await ilegible(red)).message).toContain('ECONNRESET')
    await ilegible(almacen((m) => (m === 'GET' ? new Response('boom', { status: 500 }) : undefined)).alm)
    await ilegible((await colocar(Buffer.from(JSON.stringify(INDICE)), randomBytes(32))).alm)
    const { alm: alterado, objetos } = await colocar(Buffer.from(JSON.stringify(INDICE)))
    const o = objetos.get(CLAVE_INDICE)!; o[o.length - 20] ^= 1
    await ilegible(alterado)
    await ilegible((await colocar(Buffer.from('{no es json'))).alm)
    await ilegible((await colocar(Buffer.from('{"formato":2,"documentos":{}}'))).alm)
    await ilegible((await colocar(Buffer.from('{"formato":1,"documentos":[]}'))).alm)
  })
})
