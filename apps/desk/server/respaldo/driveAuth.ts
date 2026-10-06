import { createSign } from 'node:crypto'

/**
 * Token de acceso a Drive para una cuenta de servicio (F1F-02, RQ-ZS-21): JWT RS256 firmado con `node:crypto`.
 *
 * Es propio y no del SDK de Google por el mismo motivo que `firmaS3.ts`: una sola operación, sin dependencias nuevas.
 * Ni el JWT ni la clave salen nunca en un mensaje de error.
 */
export interface CuentaServicio { client_email: string; private_key: string }

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const RENOVAR_ANTES_MS = 5 * 60_000
const b64u = (o: object): string => Buffer.from(JSON.stringify(o)).toString('base64url')

export function firmarJwt(cuenta: CuentaServicio, ahora: Date): string {
  const iat = Math.floor(ahora.getTime() / 1000)
  const sinFirma = `${b64u({ alg: 'RS256', typ: 'JWT' })}.${b64u({ iss: cuenta.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 })}`
  return `${sinFirma}.${createSign('RSA-SHA256').update(sinFirma).sign(cuenta.private_key).toString('base64url')}`
}

/** Devuelve `() => token`, perezoso: crearlo no toca la red; el token se cachea y se renueva si le quedan < 5 min. */
export function crearTokenDrive(credencialBase64: string, fetchImpl: typeof fetch = fetch, ahora: () => Date = () => new Date()): () => Promise<string> {
  let cache: { token: string; caduca: number } | undefined
  return async () => {
    if (cache && cache.caduca - ahora().getTime() >= RENOVAR_ANTES_MS) return cache.token
    const cuenta = JSON.parse(Buffer.from(credencialBase64, 'base64').toString('utf8')) as CuentaServicio
    const res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: firmarJwt(cuenta, ahora()) }).toString(),
    })
    const texto = await res.text().catch(() => '')
    if (!res.ok) throw new Error(`Google ${res.status}: ${texto.slice(0, 300)}`)
    const j = JSON.parse(texto) as { access_token?: string; expires_in?: number }
    if (!j.access_token) throw new Error('Google respondió sin access_token')
    cache = { token: j.access_token, caduca: ahora().getTime() + (j.expires_in ?? 3600) * 1000 }
    return cache.token
  }
}
