import { describe, it, expect, vi } from 'vitest'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { cargarConfigRespaldo } from './config'
import { cargarConfigDrive } from './configDrive'
import { crearCopiadorDrive } from './copiaDrive'
import type { ArchivoDrive } from './driveApi'

/**
 * F1F-02 (RQ-ZS-21), escenario «Sin escritura en disco»: la copia de Drive no escribe NADA en el servidor, ni temporales.
 * Dos redes: (1) en ejecución, las funciones de escritura de `node:fs`, `node:fs/promises` y `tmpdir` lanzan y quedan
 * anotadas; (2) estática, `escriturasEnDisco` rechaza esas palabras en los fuentes de los módulos de Drive.
 * `readFileSync` (lo usa esta misma prueba) NO se sustituye: leer no es escribir.
 */
const { espia, sustitutos } = vi.hoisted(() => {
  const espia = { llamadas: [] as string[] }
  const LANZAN = ['createWriteStream', 'writeFile', 'writeFileSync', 'appendFile', 'open', 'openSync', 'mkdtemp', 'mkdtempSync']
  const sustitutos = (): Record<string, () => never> => Object.fromEntries(LANZAN.map((n) => [n, () => { espia.llamadas.push(n); throw new Error('escritura en disco: ' + n) }]))
  return { espia, sustitutos }
})
vi.mock('node:fs', async (orig) => { const m = await orig<typeof import('node:fs')>(); const s = sustitutos(); return { ...m, ...s, default: { ...m, ...s } } })
vi.mock('node:fs/promises', async (orig) => { const m = await orig<typeof import('node:fs/promises')>(); const s = sustitutos(); return { ...m, ...s, default: { ...m, ...s } } })
vi.mock('node:os', async (orig) => { const m = await orig<typeof import('node:os')>(); const t = () => { espia.llamadas.push('tmpdir'); throw new Error('escritura en disco: tmpdir') }; return { ...m, tmpdir: t, default: { ...m, tmpdir: t } } })

/** Palabras que un módulo de Drive no puede contener: lo que da acceso a escribir en el disco. Vacío = limpio. */
export function escriturasEnDisco(fuente: string): string[] {
  const buscadas: Array<[string, RegExp]> = [['node:fs', /node:fs/], ["'fs'", /['"]fs['"]/], ['createWriteStream', /createWriteStream/], ['writeFile', /writeFile/], ['tmpdir', /tmpdir/], ['mkdtemp', /mkdtemp/]]
  return buscadas.filter(([, r]) => r.test(fuente)).map(([n]) => n)
}
const MODULOS = ['configDrive', 'driveAuth', 'driveApi', 'incremental', 'retencion', 'multiparte', 'indiceDrive', 'copiaDrive']

const CLAVE = randomBytes(32).toString('base64')
const base = cargarConfigRespaldo({ RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'bkt', RESPALDO_S3_ACCESS_KEY_ID: 'i', RESPALDO_S3_SECRET_ACCESS_KEY: 's', RESPALDO_CLAVE_CIFRADO: CLAVE })
const cfg = cargarConfigDrive({ RESPALDO_DRIVE_HABILITADO: 'true', RESPALDO_DRIVE_CARPETA_ID: 'RAIZ', RESPALDO_DRIVE_CREDENCIAL: Buffer.from(JSON.stringify({ client_email: 'a@b', private_key: 'k' })).toString('base64') })

describe('sin escritura en disco', () => {
  it('una pasada con un documento de 12 MiB y un nativo exportado termina hecha con CERO llamadas a escritura', async () => {
    const puts: string[] = []
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      const u = new URL(url); const m = init?.method ?? 'GET'
      if (m === 'GET') return new Response('', { status: 404 })
      if (m === 'POST' && u.searchParams.has('uploads')) return new Response('<UploadId>U</UploadId>')
      if (m === 'PUT') { puts.push(`${u.pathname}#${u.searchParams.get('partNumber')}`); return new Response('', { headers: { etag: '"e"' } }) }
      return new Response('<CompleteMultipartUploadResult/>', { headers: { 'x-amz-version-id': 'v' } })
    }) as unknown as typeof fetch
    const grande: ArchivoDrive = { id: 'grande', nombre: 'g.bin', ruta: 'g.bin', mimeType: 'application/octet-stream', huella: '1' }
    const nativo: ArchivoDrive = { id: 'acta', nombre: 'Acta.docx', ruta: 'Acta.docx', mimeType: 'application/vnd.google-apps.document', huella: 't', exportarComo: 'x/docx' }
    const copiador = crearCopiadorDrive(cfg, base, {
      almacen: { cfg: base, fetchImpl, ahora: () => new Date('2026-10-04T05:00:00Z') }, token: async () => 't',
      listar: async () => ({ archivos: [grande, nativo], omitidos: [] }),
      descargar: async (a) => ({ flujo: Readable.from(a.id === 'grande' ? Array.from({ length: 192 }, () => Buffer.alloc(64 * 1024, 7)) : [Buffer.from('docx exportado')]) }),
      avisar: async () => {}, ahora: () => new Date('2026-10-04T05:00:00Z'),
    })
    expect(await copiador.lanzar()).toMatchObject({ hecho: true, copiados: 2, fallos: [] })
    expect(puts.filter((p) => p.includes('/grande/'))).toHaveLength(2) // 12 MiB cifrados = 8 + 4 MiB
    expect(espia.llamadas).toEqual([])
  })
})

describe('guardián estático escriturasEnDisco (regla de mutación 2: se prueba ensuciando lo vigilado)', () => {
  it('marca un fixture sintético con createWriteStream( y con las demás palabras', () => {
    expect(escriturasEnDisco("const w = createWriteStream(path.join(os.tmpdir(), 'parte'))")).toEqual(expect.arrayContaining(['createWriteStream', 'tmpdir']))
    expect(escriturasEnDisco("import { x } from 'node:fs/promises'")).toContain('node:fs')
    expect(escriturasEnDisco("import fs from 'fs'")).toContain("'fs'")
    expect(escriturasEnDisco('await writeFile(a, b); mkdtemp(x)')).toEqual(['writeFile', 'mkdtemp'])
    expect(escriturasEnDisco('const x = 1')).toEqual([])
  })
  it.each(MODULOS)('%s.ts no contiene ninguna escritura en disco', (m) => {
    expect(escriturasEnDisco(readFileSync(path.join(__dirname, `${m}.ts`), 'utf8'))).toEqual([])
  })
})
