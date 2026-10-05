import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { cargarConfigRespaldo, faltantes } from './config'

/** F1F-02 (RQ-ZS-20): el respaldo se configura sólo con variables de entorno, y su interruptor nace cerrado. */
const COMPLETO = {
  RESPALDO_HABILITADO: 'true', RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'copias',
  RESPALDO_S3_ACCESS_KEY_ID: 'id', RESPALDO_S3_SECRET_ACCESS_KEY: 'secreto', RESPALDO_CLAVE_CIFRADO: randomBytes(32).toString('base64'),
  RESPALDO_AVISO_EMAIL: 'responsable@ejemplo.test', DATABASE_URL: 'postgres://u:p@h:5432/desk',
}

describe('cargarConfigRespaldo', () => {
  it('RESPALDO_HABILITADO nace cerrado: sólo el literal "true" lo enciende', () => {
    expect(cargarConfigRespaldo({}).habilitado).toBe(false)
    for (const v of ['', 'false', 'TRUE', '1', 'yes']) expect(cargarConfigRespaldo({ RESPALDO_HABILITADO: v }).habilitado).toBe(false)
    expect(cargarConfigRespaldo({ RESPALDO_HABILITADO: 'true' }).habilitado).toBe(true)
  })

  it('la hora por defecto es las 3, y una hora fuera de 0-23 vuelve a las 3', () => {
    expect(cargarConfigRespaldo({}).hora).toBe(3)
    expect(cargarConfigRespaldo({ RESPALDO_HORA: '22' }).hora).toBe(22)
    for (const v of ['24', '-1', 'tres', '2.5']) expect(cargarConfigRespaldo({ RESPALDO_HORA: v }).hora).toBe(3)
  })

  it('con todo puesto no falta nada', () => {
    expect(faltantes(cargarConfigRespaldo(COMPLETO))).toEqual([])
  })

  it('nombra cada variable que falta, y la clave mala por su motivo', () => {
    const c = cargarConfigRespaldo({ ...COMPLETO, RESPALDO_S3_BUCKET: '', RESPALDO_S3_REGION: undefined, RESPALDO_CLAVE_CIFRADO: 'corta' })
    expect(faltantes(c)).toEqual(['RESPALDO_S3_REGION', 'RESPALDO_S3_BUCKET', 'RESPALDO_CLAVE_CIFRADO (no es base64 de 32 bytes)'])
  })

  it('el endpoint tiene que ser una URL https o http', () => {
    expect(faltantes(cargarConfigRespaldo({ ...COMPLETO, RESPALDO_S3_ENDPOINT: 's3.ejemplo.test' }))).toEqual(['RESPALDO_S3_ENDPOINT (no es una URL http/https)'])
  })
})
