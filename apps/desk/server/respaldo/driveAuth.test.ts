import { describe, it, expect } from 'vitest'
import { createPublicKey, createVerify, generateKeyPairSync } from 'node:crypto'
import { crearTokenDrive, firmarJwt } from './driveAuth'

/** F1F-02 (RQ-ZS-21): el JWT RS256 es propio (`node:crypto`), sin SDK; las claves se generan aquí, nunca hay secretos reales. */
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
const CUENTA = { client_email: 'cuenta@proyecto.iam.gserviceaccount.com', private_key: privateKey }
const CRED = Buffer.from(JSON.stringify(CUENTA)).toString('base64')
const T0 = new Date('2026-10-04T05:00:00Z')
const dec = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))

describe('firmarJwt', () => {
  it('es un RS256 verificable con la clave pública y lleva las reclamaciones de Drive de sólo lectura', () => {
    const [cab, cuerpo, firma] = firmarJwt(CUENTA, T0).split('.')
    expect(dec(cab)).toEqual({ alg: 'RS256', typ: 'JWT' })
    const iat = Math.floor(T0.getTime() / 1000)
    expect(dec(cuerpo)).toEqual({ iss: CUENTA.client_email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 })
    const v = createVerify('RSA-SHA256').update(`${cab}.${cuerpo}`)
    expect(v.verify(createPublicKey(publicKey), Buffer.from(firma, 'base64url'))).toBe(true)
    // Si cambia un byte del cuerpo, la firma deja de valer.
    expect(createVerify('RSA-SHA256').update(`${cab}.${cuerpo}x`).verify(createPublicKey(publicKey), Buffer.from(firma, 'base64url'))).toBe(false)
  })
})

describe('crearTokenDrive', () => {
  const doble = (respuestas: Array<{ status?: number; cuerpo: unknown }>) => {
    const llamadas: Array<{ url: string; init: RequestInit }> = []
    const fetchImpl = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init })
      const r = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)]
      return new Response(JSON.stringify(r.cuerpo), { status: r.status ?? 200 })
    }) as unknown as typeof fetch
    return { llamadas, fetchImpl }
  }

  it('crearlo no pide token (apagado no toca Google); pedirlo manda el JWT como grant jwt-bearer', async () => {
    const { llamadas, fetchImpl } = doble([{ cuerpo: { access_token: 'tok1', expires_in: 3600 } }])
    const t = crearTokenDrive(CRED, fetchImpl, () => T0)
    expect(llamadas).toHaveLength(0)
    expect(await t()).toBe('tok1')
    expect(llamadas[0].url).toBe('https://oauth2.googleapis.com/token')
    const p = new URLSearchParams(String(llamadas[0].init.body))
    expect(p.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(p.get('assertion')?.split('.')).toHaveLength(3)
  })

  it('cachea el token y lo renueva cuando le quedan menos de 5 minutos', async () => {
    const { llamadas, fetchImpl } = doble([{ cuerpo: { access_token: 'tok1', expires_in: 3600 } }, { cuerpo: { access_token: 'tok2', expires_in: 3600 } }])
    let ahora = T0
    const t = crearTokenDrive(CRED, fetchImpl, () => ahora)
    await t()
    ahora = new Date(T0.getTime() + 54 * 60_000)   // quedan 6 min: sigue valiendo
    expect(await t()).toBe('tok1')
    expect(llamadas).toHaveLength(1)
    ahora = new Date(T0.getTime() + 56 * 60_000)   // quedan 4 min: se renueva
    expect(await t()).toBe('tok2')
    expect(llamadas).toHaveLength(2)
  })

  it('un rechazo de Google lanza con estado y cuerpo recortado, sin la clave ni el JWT', async () => {
    const { fetchImpl } = doble([{ status: 400, cuerpo: { error: 'invalid_grant', pad: 'x'.repeat(500) } }])
    const e = await crearTokenDrive(CRED, fetchImpl, () => T0)().catch((x: Error) => x)
    expect(e).toBeInstanceOf(Error)
    expect((e as Error).message).toMatch(/^Google 400: .*invalid_grant/)
    expect((e as Error).message.length).toBeLessThan(330)
    expect((e as Error).message).not.toContain('PRIVATE KEY')
  })

  it('una respuesta sin access_token es un fallo', async () => {
    const { fetchImpl } = doble([{ cuerpo: { expires_in: 3600 } }])
    await expect(crearTokenDrive(CRED, fetchImpl, () => T0)()).rejects.toThrow(/sin access_token/)
  })
})
