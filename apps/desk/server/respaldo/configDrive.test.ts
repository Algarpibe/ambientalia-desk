import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { cargarConfigRespaldo } from './config'
import { cargarConfigDrive, faltantesDrive, tocaHoy } from './configDrive'

/** F1F-02 (RQ-ZS-21): la copia de Drive se configura sólo por entorno y su interruptor nace cerrado. */
const cred = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64')
const BUENA = cred({ client_email: 'cuenta@proyecto.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n' })
const S3 = {
  RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'copias', RESPALDO_S3_ACCESS_KEY_ID: 'id',
  RESPALDO_S3_SECRET_ACCESS_KEY: 'secreto', RESPALDO_CLAVE_CIFRADO: randomBytes(32).toString('base64'),
}
const COMPLETO = { RESPALDO_DRIVE_HABILITADO: 'true', RESPALDO_DRIVE_CREDENCIAL: BUENA, RESPALDO_DRIVE_CARPETA_ID: '1AbC_def-9', ...S3 }
const faltan = (env: Record<string, string | undefined>) => faltantesDrive(cargarConfigDrive(env), cargarConfigRespaldo(env))

describe('cargarConfigDrive', () => {
  it('RESPALDO_DRIVE_HABILITADO nace cerrado: sólo el literal "true" lo enciende', () => {
    expect(cargarConfigDrive({}).habilitado).toBe(false)
    for (const v of ['', 'false', 'TRUE', '1']) expect(cargarConfigDrive({ RESPALDO_DRIVE_HABILITADO: v }).habilitado).toBe(false)
    expect(cargarConfigDrive({ RESPALDO_DRIVE_HABILITADO: 'true' }).habilitado).toBe(true)
  })

  it('día por defecto 0 (0-6) y hora por defecto 5 (0-23); lo fuera de rango vuelve al defecto', () => {
    expect([cargarConfigDrive({}).dia, cargarConfigDrive({}).hora]).toEqual([0, 5])
    expect([cargarConfigDrive({ RESPALDO_DRIVE_DIA: '6', RESPALDO_DRIVE_HORA: '23' }).dia, cargarConfigDrive({ RESPALDO_DRIVE_DIA: '6', RESPALDO_DRIVE_HORA: '23' }).hora]).toEqual([6, 23])
    for (const v of ['7', '-1', 'lunes', '1.5']) expect(cargarConfigDrive({ RESPALDO_DRIVE_DIA: v }).dia).toBe(0)
    for (const v of ['24', '-1', 'cinco', '2.5']) expect(cargarConfigDrive({ RESPALDO_DRIVE_HORA: v }).hora).toBe(5)
  })
})

describe('faltantesDrive', () => {
  it('con todo puesto no falta nada, y no pide DATABASE_URL', () => {
    expect(faltan(COMPLETO)).toEqual([])
  })

  it('nombra la variable de Drive que falta o está mal, sin volcar su valor', () => {
    expect(faltan({ ...COMPLETO, RESPALDO_DRIVE_CREDENCIAL: undefined, RESPALDO_DRIVE_CARPETA_ID: '' })).toEqual(['RESPALDO_DRIVE_CREDENCIAL', 'RESPALDO_DRIVE_CARPETA_ID'])
    expect(faltan({ ...COMPLETO, RESPALDO_DRIVE_CARPETA_ID: "x' or '1'='1" })).toEqual(['RESPALDO_DRIVE_CARPETA_ID (formato no válido)'])
    for (const c of ['no-es-base64-json', cred({ client_email: 'a@b' }), cred({ private_key: 'k' })]) {
      expect(faltan({ ...COMPLETO, RESPALDO_DRIVE_CREDENCIAL: c })).toEqual(['RESPALDO_DRIVE_CREDENCIAL (no es JSON base64 con client_email y private_key)'])
    }
  })

  it('suma las del destino S3 y la clave de cifrado', () => {
    expect(faltan({ ...COMPLETO, RESPALDO_S3_BUCKET: '', RESPALDO_CLAVE_CIFRADO: 'corta' })).toEqual(['RESPALDO_S3_BUCKET', 'RESPALDO_CLAVE_CIFRADO (no es base64 de 32 bytes)'])
  })
})

describe('tocaHoy', () => {
  it('compara con el día de la semana LOCAL (getDay), 0 = domingo', () => {
    const casos: Array<[number, Date, boolean]> = [
      [0, new Date(2026, 9, 4, 5), true],   // domingo 4/10/2026, local
      [0, new Date(2026, 9, 5, 5), false],  // lunes
      [1, new Date(2026, 9, 5, 5), true],
      [6, new Date(2026, 9, 10, 23, 59), true], // sábado
      [6, new Date(2026, 9, 11, 0, 0), false],
    ]
    for (const [dia, fecha, esperado] of casos) expect(tocaHoy(dia, fecha)).toBe(esperado)
  })
})
