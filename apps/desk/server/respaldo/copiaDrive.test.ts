import { describe, it, expect, vi } from 'vitest'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { cargarConfigRespaldo } from './config'
import { cargarConfigDrive } from './configDrive'
import { descifrarFichero, claveDesdeBase64 } from './cifrado'
import { crearCopiadorDrive, driveUrlsFuera, type DepsDrive } from './copiaDrive'
import type { ArchivoDrive } from './driveApi'

/** F1F-02 (RQ-ZS-21): el orquestador de la copia semanal, con TODO el mundo inyectado. La «nube» doble guarda lo que se sube. */
const CLAVE = randomBytes(32).toString('base64')
const ENV = {
  RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'bkt', RESPALDO_S3_ACCESS_KEY_ID: 'id',
  RESPALDO_S3_SECRET_ACCESS_KEY: 'secreto', RESPALDO_CLAVE_CIFRADO: CLAVE, RESPALDO_AVISO_EMAIL: 'r@ejemplo.test', DATABASE_URL: '',
}
const credencial = Buffer.from(JSON.stringify({ client_email: 'sa@x.iam', private_key: 'k' })).toString('base64')
const ENV_DRIVE = { RESPALDO_DRIVE_HABILITADO: 'true', RESPALDO_DRIVE_CREDENCIAL: credencial, RESPALDO_DRIVE_CARPETA_ID: 'RAIZ' }
const base = cargarConfigRespaldo(ENV)
const doc = (id: string, huella: string, extra: Partial<ArchivoDrive> = {}): ArchivoDrive => ({ id, nombre: `${id}.pdf`, ruta: `${id}.pdf`, mimeType: 'application/pdf', huella, ...extra })
const contenidoDe = (a: ArchivoDrive) => Buffer.from(`contenido de ${a.id} ${a.huella}`)

interface Opc { sinVersion?: boolean; denegarBorrado?: boolean; indiceRoto?: boolean; falloPut?: (clave: string) => boolean }
function nube(o: Opc = {}) {
  const objetos = new Map<string, Buffer>(); const partes = new Map<string, Buffer[]>(); const llamadas: string[] = []; let n = 0
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const u = new URL(url); const clave = u.pathname.replace(/^\/bkt\//, ''); const m = init?.method ?? 'GET'
    llamadas.push(`${m} ${clave}${u.search}`)
    if (m === 'GET') {
      if (o.indiceRoto && clave === 'drive/indice.json.enc') return new Response(new Uint8Array(40), { status: 200 })
      const b = objetos.get(clave); return b ? new Response(new Uint8Array(b)) : new Response('', { status: 404 })
    }
    if (m === 'POST' && u.searchParams.has('uploads')) { partes.set(`${clave}#${++n}`, []); return new Response(`<UploadId>${clave}#${n}</UploadId>`) }
    if (m === 'PUT') {
      if (o.falloPut?.(clave)) return new Response('boom', { status: 500 })
      partes.get(u.searchParams.get('uploadId')!)!.push(Buffer.from(init!.body as Uint8Array)); return new Response('', { headers: { etag: '"e"' } })
    }
    if (m === 'POST') {
      objetos.set(clave, Buffer.concat(partes.get(u.searchParams.get('uploadId')!)!))
      return new Response('<CompleteMultipartUploadResult/>', { headers: o.sinVersion ? {} : { 'x-amz-version-id': `v${n}` } })
    }
    if (u.searchParams.has('versionId')) return o.denegarBorrado ? new Response('bloqueado', { status: 403 }) : new Response(null, { status: 204 })
    return new Response(null, { status: 204 })
  }) as unknown as typeof fetch
  return { objetos, llamadas, fetchImpl, escrituras: () => llamadas.filter((l) => !l.startsWith('GET')) }
}

function montar(listado: () => ArchivoDrive[], o: Opc = {}, sobre: Partial<DepsDrive> = {}, env: Record<string, string> = {}, fecha = { v: new Date('2025-01-05T05:00:00Z') }) {
  const cfg = cargarConfigDrive({ ...ENV_DRIVE, ...env })
  const n = nube(o)
  const deps: DepsDrive = {
    almacen: { cfg: base, fetchImpl: n.fetchImpl, ahora: () => fecha.v },
    token: vi.fn(async () => 'tok'),
    listar: vi.fn(async () => ({ archivos: listado(), omitidos: [] as string[], carpetas: ['RAIZ'] })),
    descargar: vi.fn(async (a: ArchivoDrive) => ({ flujo: Readable.from([contenidoDe(a)]) })),
    avisar: vi.fn(async () => {}),
    ahora: () => fecha.v,
    ...sobre,
  }
  return { cfg, n, deps, fecha, copiador: crearCopiadorDrive(cfg, base, deps) }
}
const sinTocarNada = (m: ReturnType<typeof montar>) => {
  expect(m.deps.token).not.toHaveBeenCalled(); expect(m.deps.listar).not.toHaveBeenCalled(); expect(m.deps.descargar).not.toHaveBeenCalled()
  expect(m.deps.avisar).not.toHaveBeenCalled(); expect(m.n.llamadas).toEqual([])
}

describe('orden de las guardas (regla de mutación 1: se prueba la POSICIÓN)', () => {
  it('apagado: no toca NADA (ni token, ni red, ni aviso)', async () => {
    const m = montar(() => [doc('a', '1')], {}, {}, { RESPALDO_DRIVE_HABILITADO: 'no' })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false })
    sinTocarNada(m)
  })
  it('apagado Y con configuración incompleta a la vez: gana el interruptor, no hay aviso', async () => {
    const m = montar(() => [], {}, {}, { RESPALDO_DRIVE_HABILITADO: '', RESPALDO_DRIVE_CARPETA_ID: '' })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false })
    sinTocarNada(m)
  })
  it('apagado Y pasada en curso a la vez: gana el interruptor (no dice «en-curso»)', async () => {
    let soltar!: () => void
    const m = montar(() => [], {}, { listar: vi.fn(() => new Promise<{ archivos: ArchivoDrive[]; omitidos: string[]; carpetas: string[] }>((r) => { soltar = () => r({ archivos: [], omitidos: [], carpetas: [] }) })) })
    const primera = m.copiador.lanzar()
    await vi.waitFor(() => expect(m.deps.listar).toHaveBeenCalled())
    m.cfg.habilitado = false
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false })
    soltar(); await primera
  })
  it('en curso Y configuración incompleta a la vez: gana «en-curso», sin aviso', async () => {
    let soltar!: () => void
    const m = montar(() => [], {}, { listar: vi.fn(() => new Promise<{ archivos: ArchivoDrive[]; omitidos: string[]; carpetas: string[] }>((r) => { soltar = () => r({ archivos: [], omitidos: [], carpetas: [] }) })) })
    const primera = m.copiador.lanzar()
    await vi.waitFor(() => expect(m.deps.listar).toHaveBeenCalled())
    m.cfg.carpetaId = ''
    expect(await m.copiador.lanzar()).toBe('en-curso')
    expect(m.deps.avisar).not.toHaveBeenCalled()
    soltar(); await primera
  })
  it('configuración incompleta: un aviso que nombra la variable y NADA más (ni token, ni red)', async () => {
    const m = montar(() => [doc('a', '1')], {}, {}, { RESPALDO_DRIVE_CARPETA_ID: '' })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false })
    expect(m.deps.avisar).toHaveBeenCalledTimes(1)
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls[0].join(' ')).toContain('RESPALDO_DRIVE_CARPETA_ID')
    expect(m.deps.token).not.toHaveBeenCalled(); expect(m.n.llamadas).toEqual([])
  })
})

describe('la pasada', () => {
  it('primera pasada: sube los tres documentos, cifrados en DESKR1; la segunda sólo lo nuevo y lo cambiado', async () => {
    let lista = [doc('a', '1'), doc('b', '1'), doc('c', '1', { ruta: 'sub/c.pdf' })]
    const m = montar(() => lista)
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 3 })
    for (const id of ['a', 'b', 'c']) expect(m.n.objetos.get(`drive/archivos/${id}/2025-01-05T05-00-00Z.enc`)!.subarray(0, 6).toString()).toBe('DESKR1')
    expect(m.deps.avisar).not.toHaveBeenCalled()
    m.fecha.v = new Date('2025-01-12T05:00:00Z'); lista = [doc('a', '1'), doc('b', '2'), doc('c', '1'), doc('d', '1')]
    ;(m.deps.descargar as ReturnType<typeof vi.fn>).mockClear()
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 2 })
    expect((m.deps.descargar as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].id)).toEqual(['b', 'd'])
  })
  it('restauración: el objeto sube y se descifra con la herramienta existente', async () => {
    const a = doc('a', '1'); const m = montar(() => [a])
    await m.copiador.lanzar()
    const dir = mkdtempSync(path.join(tmpdir(), 'copia-drive-')); const cifrado = path.join(dir, 'a.enc'); const salida = path.join(dir, 'a.out')
    writeFileSync(cifrado, m.n.objetos.get('drive/archivos/a/2025-01-05T05-00-00Z.enc')!)
    await descifrarFichero(cifrado, salida, claveDesdeBase64(CLAVE))
    expect(readFileSync(salida)).toEqual(contenidoDe(a))
  })
  it('índice ilegible: aviso y FIN, sin copiar ni borrar ni listar', async () => {
    const m = montar(() => [doc('a', '1')], { indiceRoto: true })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false, copiados: 0 })
    expect(m.deps.avisar).toHaveBeenCalledTimes(1)
    expect(m.deps.listar).not.toHaveBeenCalled(); expect(m.n.escrituras()).toEqual([])
  })
  it('listado que falla: aviso y FIN; nada se marca desaparecido, nada se borra, no se escribe índice', async () => {
    const m = montar(() => [doc('a', '1')])
    await m.copiador.lanzar()
    m.fecha.v = new Date('2027-01-05T05:00:00Z')
    ;(m.deps.listar as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Drive 500: x'))
    const antes = m.n.escrituras().length
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: false })
    expect(m.n.escrituras().length).toBe(antes)
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls.at(-1)!.join(' ')).toContain('Drive 500')
  })
  it('un documento que falla se anota y la pasada sigue con el resto; un nativo omitido también, en UN solo aviso', async () => {
    const m = montar(() => [doc('a', '1'), doc('b', '1'), doc('c', '1')], {}, {
      descargar: vi.fn(async (a: ArchivoDrive) => {
        if (a.id === 'a') throw new Error('Drive 500: caído')
        return a.id === 'b' ? { omitido: 'b.pdf: supera el límite de exportación de Drive' } : { flujo: Readable.from([contenidoDe(a)]) }
      }),
    })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 1, omitidos: ['b.pdf: supera el límite de exportación de Drive'] })
    expect(m.deps.avisar).toHaveBeenCalledTimes(1)
    const texto = (m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls[0].join(' ')
    expect(texto).toContain('Drive 500: caído'); expect(texto).toContain('límite de exportación')
    expect([...m.n.objetos.keys()]).toContain('drive/archivos/c/2025-01-05T05-00-00Z.enc')
  })
  it('una subida que falla (500 en UploadPart) se anota con Abort y la pasada sigue', async () => {
    const m = montar(() => [doc('a', '1'), doc('b', '1')], { falloPut: (c) => c.includes('/a/') })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 1 })
    expect(m.n.llamadas.some((l) => l.startsWith('DELETE drive/archivos/a/') && l.includes('uploadId'))).toBe(true)
    expect(m.deps.avisar).toHaveBeenCalledTimes(1)
  })
  it('nunca lanza, ni aunque falle el listado inesperadamente y el aviso también', async () => {
    const m = montar(() => [], {}, { listar: vi.fn(() => { throw new TypeError('inesperado') }), avisar: vi.fn(async () => { throw new Error('webhook caído') }) })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(m.copiador.lanzar()).resolves.toMatchObject({ hecho: false })
  })
})

describe('retención dentro de la pasada', () => {
  const pasadas = async (o: Opc) => {
    let lista = [doc('a', '1')]
    const m = montar(() => lista, o)
    await m.copiador.lanzar()
    m.fecha.v = new Date('2025-01-12T05:00:00Z'); lista = [doc('a', '2')]; await m.copiador.lanzar()
    m.fecha.v = new Date('2026-02-01T05:00:00Z')
    return m
  }
  it('borra con ?versionId= la superada hace más de 12 meses y la quita del índice; la última se queda', async () => {
    const m = await pasadas({})
    await m.copiador.lanzar()
    const borrados = m.n.llamadas.filter((l) => l.startsWith('DELETE') && l.includes('versionId'))
    expect(borrados).toEqual(['DELETE drive/archivos/a/2025-01-05T05-00-00Z.enc?versionId=v1'])
    ;(m.n.llamadas as string[]).length = 0
    await m.copiador.lanzar()
    expect(m.n.llamadas.filter((l) => l.includes('versionId'))).toEqual([]) // ya no está en el índice
  })
  it('un borrado denegado por el bloqueo avisa, la pasada sigue y la versión se queda para la semana siguiente', async () => {
    const m = await pasadas({ denegarBorrado: true })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, retirados: 0 })
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls.at(-1)!.join(' ')).toContain('403')
    expect(m.n.llamadas.filter((l) => l.includes('versionId')).length).toBe(1)
    await m.copiador.lanzar()
    expect(m.n.llamadas.filter((l) => l.includes('versionId')).length).toBe(2) // reintentada
  })
  it('sin versionId (almacén sin versionar) NO se borra: se queda en el índice y se anota', async () => {
    const m = await pasadas({ sinVersion: true })
    expect(await m.copiador.lanzar()).toMatchObject({ retirados: 0 })
    expect(m.n.llamadas.some((l) => l.includes('versionId'))).toBe(false)
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls.at(-1)!.join(' ')).toContain('versionId')
  })
})

describe('driveUrlsFuera (aviso de drive_url fuera de la raíz)', () => {
  const vistos = new Set(['RAIZ', 'sub1', 'f1'])
  it('extrae el id de cada forma de URL y separa lo de dentro, lo de fuera y lo no reconocido', () => {
    const r = driveUrlsFuera([
      'https://drive.google.com/drive/folders/RAIZ?usp=sharing', 'https://drive.google.com/drive/u/0/folders/sub1',
      'https://drive.google.com/file/d/f1/view', 'https://docs.google.com/document/d/FUERA1/edit', 'https://docs.google.com/spreadsheets/d/FUERA2/edit#gid=0',
      'https://docs.google.com/presentation/d/FUERA3/edit', 'https://drive.google.com/open?id=FUERA4', 'https://ejemplo.test/manual.pdf', '',
    ], vistos)
    expect(r.fuera).toEqual(['https://docs.google.com/document/d/FUERA1/edit', 'https://docs.google.com/spreadsheets/d/FUERA2/edit#gid=0', 'https://docs.google.com/presentation/d/FUERA3/edit', 'https://drive.google.com/open?id=FUERA4'])
    expect(r.noReconocidas).toEqual(['https://ejemplo.test/manual.pdf'])
  })
  it('la pasada avisa de los drive_url fuera y NO copia su contenido', async () => {
    const m = montar(() => [doc('f1', '1')], {}, { equiposConDrive: async () => ['https://drive.google.com/file/d/f1/view', 'https://drive.google.com/drive/folders/OTRA'] })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 1 })
    expect(m.deps.avisar).toHaveBeenCalledTimes(1)
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls[0].join(' ')).toContain('folders/OTRA')
    expect((m.deps.descargar as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].id)).toEqual(['f1'])
  })
  it('si la lectura de equipos falla, se anota y la pasada sigue', async () => {
    const m = montar(() => [doc('f1', '1')], {}, { equiposConDrive: async () => { throw new Error('db caída') } })
    expect(await m.copiador.lanzar()).toMatchObject({ hecho: true, copiados: 1 })
    expect((m.deps.avisar as ReturnType<typeof vi.fn>).mock.calls[0].join(' ')).toContain('db caída')
  })
})
