import { describe, it, expect, vi } from 'vitest'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { cargarConfigRespaldo } from './config'
import { descifrarFichero, claveDesdeBase64 } from './cifrado'
import { claseDe, claveObjeto, crearRespaldador, type Dependencias } from './respaldo'

/** F1F-02 (RQ-ZS-20): volcar → cifrar → subir, con aviso si falla y el temporal siempre borrado. */
const CLAVE = randomBytes(32).toString('base64')
const ENV = {
  RESPALDO_HABILITADO: 'true', RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'copias',
  RESPALDO_S3_ACCESS_KEY_ID: 'id', RESPALDO_S3_SECRET_ACCESS_KEY: 'secreto', RESPALDO_CLAVE_CIFRADO: CLAVE,
  RESPALDO_AVISO_EMAIL: 'responsable@ejemplo.test', DATABASE_URL: 'postgres://u:p@h:5432/desk',
}
const MARTES = new Date('2026-10-06T03:00:00Z')
const VOLCADO = Buffer.concat([Buffer.from('PGDMP'), randomBytes(3000)])
const temporales = (dir: string) => readdirSync(dir).filter((f) => f.startsWith('desk-'))

function deps(sobre: Partial<Dependencias> = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'resp-test-'))
  const subidas: { clave: string; md5: string; tamano: number; contenido: Buffer }[] = []
  const d: Dependencias = {
    volcar: vi.fn(() => ({ flujo: Readable.from([VOLCADO]), terminado: Promise.resolve() })),
    subir: vi.fn(async (ruta: string, clave: string, md5: string, tamano: number) => { subidas.push({ clave, md5, tamano, contenido: readFileSync(ruta) }) }),
    avisar: vi.fn(async () => {}),
    ahora: () => MARTES,
    dirTemporal: dir,
    ...sobre,
  }
  return { d, dir, subidas }
}

describe('clase y clave del objeto', () => {
  it('diaria entre semana, semanal el domingo, mensual el día 1 aunque sea domingo, y la previa aparte', () => {
    expect(claseDe('nocturna', MARTES)).toBe('diaria')
    expect(claseDe('nocturna', new Date('2026-10-11T03:00:00Z'))).toBe('semanal')
    expect(claseDe('nocturna', new Date('2026-11-01T03:00:00Z'))).toBe('mensual')
    expect(claseDe('previa', new Date('2026-11-01T03:00:00Z'))).toBe('previa')
  })
  it('la clave lleva la clase como prefijo y el instante sin dos puntos', () => {
    expect(claveObjeto('nocturna', MARTES)).toBe('diaria/desk-2026-10-06T03-00-00Z.dump.enc')
  })
})

describe('crearRespaldador', () => {
  it('apagado: no vuelca, no sube y no avisa', async () => {
    const { d } = deps()
    const r = await crearRespaldador(cargarConfigRespaldo({ ...ENV, RESPALDO_HABILITADO: undefined }), d).lanzar('nocturna')
    expect(r).toEqual({ hecho: false, motivo: 'RESPALDO_HABILITADO apagado' })
    expect(d.volcar).not.toHaveBeenCalled(); expect(d.subir).not.toHaveBeenCalled(); expect(d.avisar).not.toHaveBeenCalled()
  })

  it('configuración incompleta: no vuelca y avisa nombrando lo que falta', async () => {
    const { d } = deps()
    const r = await crearRespaldador(cargarConfigRespaldo({ ...ENV, RESPALDO_S3_BUCKET: '' }), d).lanzar('nocturna')
    expect(r).toMatchObject({ hecho: false })
    expect(d.volcar).not.toHaveBeenCalled()
    expect(d.avisar).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(vi.mocked(d.avisar).mock.calls[0])).toContain('RESPALDO_S3_BUCKET')
  })

  it('éxito: sube bajo su clase, con el MD5 y el tamaño de lo cifrado, que descifra al volcado; el temporal se borra', async () => {
    const { d, dir, subidas } = deps()
    const r = await crearRespaldador(cargarConfigRespaldo(ENV), d).lanzar('nocturna')
    expect(r).toEqual({ hecho: true, clave: 'diaria/desk-2026-10-06T03-00-00Z.dump.enc' })
    expect(subidas).toHaveLength(1)
    const s = subidas[0]
    expect(s.clave).toBe('diaria/desk-2026-10-06T03-00-00Z.dump.enc')
    expect(s.tamano).toBe(s.contenido.length)
    expect(s.md5).toBe(createHash('md5').update(s.contenido).digest('base64'))
    const enc = path.join(dir, 'x.enc'); const out = path.join(dir, 'x.dump')
    writeFileSync(enc, s.contenido)
    await descifrarFichero(enc, out, claveDesdeBase64(CLAVE))
    expect(readFileSync(out).equals(VOLCADO)).toBe(true)
    expect(temporales(dir)).toEqual([])
    expect(d.avisar).not.toHaveBeenCalled()
  })

  it('la subida falla: avisa con el motivo, borra el temporal y no lanza', async () => {
    const { d, dir } = deps({ subir: vi.fn(async () => { throw new Error('S3 403: AccessDenied') }) })
    const r = await crearRespaldador(cargarConfigRespaldo(ENV), d).lanzar('previa')
    expect(r).toMatchObject({ hecho: false })
    expect(JSON.stringify(vi.mocked(d.avisar).mock.calls[0])).toContain('S3 403: AccessDenied')
    expect(temporales(dir)).toEqual([])
  })

  it('pg_dump falla: no sube, avisa y borra el temporal', async () => {
    const { d, dir } = deps({ volcar: vi.fn(() => ({ flujo: Readable.from([Buffer.from('a medias')]), terminado: Promise.reject(new Error('pg_dump salió con 1: server version mismatch')) })) })
    const r = await crearRespaldador(cargarConfigRespaldo(ENV), d).lanzar('nocturna')
    expect(r).toMatchObject({ hecho: false })
    expect(d.subir).not.toHaveBeenCalled()
    expect(JSON.stringify(vi.mocked(d.avisar).mock.calls[0])).toContain('server version mismatch')
    expect(temporales(dir)).toEqual([])
  })

  it('un aviso que falla tampoco lanza', async () => {
    const { d } = deps({ subir: vi.fn(async () => { throw new Error('caído') }), avisar: vi.fn(async () => { throw new Error('n8n caído') }) })
    await expect(crearRespaldador(cargarConfigRespaldo(ENV), d).lanzar('nocturna')).resolves.toMatchObject({ hecho: false })
  })

  it('una copia en curso rechaza la segunda, y al terminar se puede volver a lanzar', async () => {
    let soltar!: () => void
    const subir = vi.fn(async () => {})
    subir.mockImplementationOnce(() => new Promise<void>((res) => { soltar = res }))
    const { d } = deps({ subir })
    const resp = crearRespaldador(cargarConfigRespaldo(ENV), d)
    const primera = resp.lanzar('nocturna')
    expect(resp.enCurso()).toBe(true)
    expect(await resp.lanzar('previa')).toBe('en-curso')
    await vi.waitFor(() => expect(d.subir).toHaveBeenCalled())
    soltar(); await primera
    expect(resp.enCurso()).toBe(false)
    await expect(resp.lanzar('previa')).resolves.toMatchObject({ hecho: true })
  })
})
