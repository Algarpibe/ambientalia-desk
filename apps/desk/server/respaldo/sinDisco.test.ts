import { describe, it, expect, vi, beforeEach } from 'vitest'
import { randomBytes } from 'node:crypto'
import * as fsRed from 'node:fs'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { cargarConfigRespaldo } from './config'
import { cargarConfigDrive } from './configDrive'
import { crearCopiadorDrive } from './copiaDrive'
import type { ArchivoDrive } from './driveApi'

/**
 * F1F-02 (RQ-ZS-21), escenario «Sin escritura en disco»: la copia de Drive no escribe NADA en el servidor, ni temporales.
 * Dos redes, las dos por LISTA DE PERMITIDOS (una lista de prohibidos deja pasar todo lo que no nombra):
 * (1) en ejecución, TODO lo que exportan `node:fs` y `node:fs/promises` —también `fs.promises` y `default`— lanza y se
 * anota, salvo las lecturas de `LECTURAS`; `tmpdir` igual. Vale también para lo que el orquestador alcanza a través de
 * `cifrado.ts`, `dependencias.ts` o `firmaS3.ts`, y para un `import()` dinámico.
 * (2) estática: los módulos de Drive no contienen las palabras de `escriturasEnDisco` y, de todo módulo que no sea uno
 * de ellos, sólo importan los nombres de `PERMITIDOS` y sólo con `import { … } from`. Un nombre nuevo pone rojo.
 */
const { espia, red } = vi.hoisted(() => {
  const espia = { llamadas: [] as string[] }
  /** Lo único que no lanza: lo lee esta misma prueba (el guardián estático). Leer no es escribir. */
  const LECTURAS = new Set(['readFileSync'])
  const red = (real: object, prefijo = ''): Record<string, unknown> => Object.fromEntries(Object.entries(real).filter(([n]) => n !== 'default').map(([n, v]) => {
    if (v !== null && typeof v === 'object') return [n, red(v, `${prefijo}${n}.`)]
    if (typeof v !== 'function' || LECTURAS.has(prefijo + n)) return [n, v]
    return [n, function () { espia.llamadas.push(prefijo + n); throw new Error('acceso a disco: ' + prefijo + n) }]
  }))
  return { espia, red }
})
vi.mock('node:fs', async (orig) => { const m = red(await orig<typeof import('node:fs')>()); return { ...m, default: m } })
vi.mock('node:fs/promises', async (orig) => { const m = red(await orig<typeof import('node:fs/promises')>()); return { ...m, default: m } })
vi.mock('node:os', async (orig) => { const m = await orig<typeof import('node:os')>(); const t = () => { espia.llamadas.push('tmpdir'); throw new Error('acceso a disco: tmpdir') }; return { ...m, tmpdir: t, default: { ...m, tmpdir: t } } })

/** Palabras que un módulo de Drive no puede contener: lo que da acceso a escribir en el disco. Vacío = limpio. */
export function escriturasEnDisco(fuente: string): string[] {
  const buscadas: Array<[string, RegExp]> = [['node:fs', /node:fs/], ["'fs'", /['"]fs['"]/], ['createWriteStream', /createWriteStream/], ['writeFile', /writeFile/], ['tmpdir', /tmpdir/], ['mkdtemp', /mkdtemp/]]
  return buscadas.filter(([, r]) => r.test(fuente)).map(([n]) => n)
}
const MODULOS = ['configDrive', 'driveAuth', 'driveApi', 'incremental', 'retencion', 'multiparte', 'indiceDrive', 'copiaDrive']
/** Lista CERRADA de lo que los módulos de Drive traen de fuera de sí mismos: los nombres que usan hoy, ni uno más. */
const PERMITIDOS: Record<string, string[]> = {
  './cifrado': ['cifrador', 'claveDesdeBase64', 'descifrarBuffer'], './dependencias': ['avisarFallo'], './firmaS3': ['firmarPeticion', 'hashHex'],
  './config': ['faltantes', 'ConfigRespaldo'], '@ambientalia/zoho-sync/config': ['AppConfig'],
  'node:crypto': ['createHash', 'createSign'], 'node:stream': ['Readable'], 'node:stream/promises': ['pipeline'],
}
/** Importaciones de un módulo de Drive que se salen de `PERMITIDOS`, o que no son `import { … } from`. Vacío = limpio. */
export function importacionesFueraDeLista(fuente: string): string[] {
  const nombradas = [...fuente.matchAll(/\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)]
  const otras = fuente.split(/\bfrom\s*['"]|\bimport\s*\(|\brequire\s*\(|\bimport\s*['"]/).length - 1 - nombradas.length
  const fuera = otras > 0 ? [`forma de importación no admitida (${otras})`] : []
  for (const [, lista, de] of nombradas) {
    if (MODULOS.some((m) => de === `./${m}`)) continue
    for (const n of lista.split(',').map((x) => x.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean)) if (!PERMITIDOS[de]?.includes(n)) fuera.push(`${de}: ${n}`)
  }
  return fuera
}

const CLAVE = randomBytes(32).toString('base64')
const base = cargarConfigRespaldo({ RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'bkt', RESPALDO_S3_ACCESS_KEY_ID: 'i', RESPALDO_S3_SECRET_ACCESS_KEY: 's', RESPALDO_CLAVE_CIFRADO: CLAVE })
const cfg = cargarConfigDrive({ RESPALDO_DRIVE_HABILITADO: 'true', RESPALDO_DRIVE_CARPETA_ID: 'RAIZ', RESPALDO_DRIVE_CREDENCIAL: Buffer.from(JSON.stringify({ client_email: 'a@b', private_key: 'k' })).toString('base64') })

describe('sin escritura en disco', () => {
  beforeEach(() => { espia.llamadas.length = 0 })
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
  it('la red es por lista de permitidos: TODO lo que exportan fs y fs/promises lanza y se anota, salvo readFileSync', async () => {
    const probar = (m: object, prefijo = ''): string[] => Object.entries(m).flatMap(([n, v]) => {
      if (v !== null && typeof v === 'object') return probar(v, n === 'default' ? prefijo : `${prefijo}${n}.`)
      if (typeof v !== 'function' || prefijo + n === 'readFileSync') return []
      expect(v, prefijo + n).toThrow('acceso a disco: ' + prefijo + n)
      return [prefijo + n]
    })
    const probadas = [...probar(fsRed), ...probar(await import('node:fs/promises'))]
    expect(probadas).toEqual(expect.arrayContaining(['writeFile', 'copyFileSync', 'renameSync', 'mkdir', 'cp', 'write', 'promises.writeFile', 'promises.copyFile', 'createReadStream']))
    expect(espia.llamadas).toEqual(probadas)
    expect(() => os.tmpdir()).toThrow('acceso a disco: tmpdir')
  })
})

describe('guardián estático (regla de mutación 2: se prueba ensuciando lo vigilado)', () => {
  it('escriturasEnDisco marca un fixture sintético con createWriteStream( y con las demás palabras', () => {
    expect(escriturasEnDisco("const w = createWriteStream(path.join(os.tmpdir(), 'parte'))")).toEqual(expect.arrayContaining(['createWriteStream', 'tmpdir']))
    expect(escriturasEnDisco("import { x } from 'node:fs/promises'")).toContain('node:fs')
    expect(escriturasEnDisco("import fs from 'fs'")).toContain("'fs'")
    expect(escriturasEnDisco('await writeFile(a, b); mkdtemp(x)')).toEqual(['writeFile', 'mkdtemp'])
    expect(escriturasEnDisco('const x = 1')).toEqual([])
  })
  it('importacionesFueraDeLista marca un nombre nuevo, un módulo nuevo y toda forma que no sea import { … } from', () => {
    expect(importacionesFueraDeLista("import { cifrador, volcar } from './cifrado'")).toEqual(['./cifrado: volcar'])
    expect(importacionesFueraDeLista("import { createReadStream as leer, type X } from './dependencias'")).toEqual(['./dependencias: createReadStream', './dependencias: X'])
    expect(importacionesFueraDeLista("import { rm } from './otro'\nimport { spawn } from 'node:child_process'")).toEqual(['./otro: rm', 'node:child_process: spawn'])
    for (const f of ["import * as c from './cifrado'", "import c from './cifrado'", "const m = await import('./firmaS3')", "export { cifrador } from './cifrado'", "require('./cifrado')", "import './dependencias'"]) expect(importacionesFueraDeLista(f), f).toEqual(['forma de importación no admitida (1)'])
    expect(importacionesFueraDeLista("import { cifrador } from './cifrado'\nimport type { ConfigRespaldo } from './config'\nimport { planificar, type IndiceDrive } from './incremental'")).toEqual([])
  })
  it.each(MODULOS)('%s.ts no contiene ninguna escritura en disco ni importa nada fuera de la lista cerrada', (m) => {
    const fuente = readFileSync(path.join(__dirname, `${m}.ts`), 'utf8')
    expect(escriturasEnDisco(fuente)).toEqual([])
    expect(importacionesFueraDeLista(fuente)).toEqual([])
  })
})
