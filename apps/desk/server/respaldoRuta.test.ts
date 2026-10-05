import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'
import type { RespaldadorRuta } from './routes/respaldo'

instalarArnes()

/**
 * F1F-02 (RQ-ZS-20): `POST /api/admin/respaldo` lanza la copia previa a un cambio. Orden de guardas: 401 → 403 (rol)
 * → 403 (interruptor) → 409 (en curso) → 202. «No lanzó» se lee en el espía de `lanzar`.
 */
const URL = '/api/admin/respaldo'
function respaldador(sobre: Partial<RespaldadorRuta> = {}): RespaldadorRuta {
  return { habilitado: true, enCurso: () => false, lanzar: vi.fn(async () => ({ hecho: true as const, clave: 'previa/x' })), ...sobre }
}

describe('POST /api/admin/respaldo', () => {
  it('sin sesión: 401 sin lanzar', async () => {
    const r = respaldador()
    expect((await request(appWith({}, undefined, r).app).post(URL)).status).toBe(401)
    expect(r.lanzar).not.toHaveBeenCalled()
  })

  it('sin rol de administrador: 403 sin lanzar, y no nombra el interruptor aunque esté apagado', async () => {
    const r = respaldador({ habilitado: false })
    const res = await request(appWith({}, undefined, r).app).post(URL).set('Cookie', await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(403)
    expect(JSON.stringify(res.body)).not.toMatch(/RESPALDO_HABILITADO/)
    expect(r.lanzar).not.toHaveBeenCalled()
  })

  it('interruptor apagado: 403 con el nombre de la variable, sin lanzar', async () => {
    const r = respaldador({ habilitado: false })
    const res = await request(appWith({}, undefined, r).app).post(URL).set('Cookie', await adminCookie())
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/RESPALDO_HABILITADO/)
    expect(r.lanzar).not.toHaveBeenCalled()
  })

  it('apagado y además en curso: 403, no 409 (el interruptor va antes)', async () => {
    const r = respaldador({ habilitado: false, enCurso: () => true })
    expect((await request(appWith({}, undefined, r).app).post(URL).set('Cookie', await adminCookie())).status).toBe(403)
  })

  it('una copia en curso: 409 sin lanzar otra', async () => {
    const r = respaldador({ enCurso: () => true })
    const res = await request(appWith({}, undefined, r).app).post(URL).set('Cookie', await adminCookie())
    expect(res.status).toBe(409)
    expect(r.lanzar).not.toHaveBeenCalled()
  })

  it('encendido: 202 y lanza la copia previa', async () => {
    const r = respaldador()
    const res = await request(appWith({}, undefined, r).app).post(URL).set('Cookie', await adminCookie())
    expect(res.status).toBe(202)
    expect(res.body).toEqual({ iniciado: true, motivo: 'previa' })
    expect(r.lanzar).toHaveBeenCalledWith('previa')
  })

  it('sin respaldador cableado la ruta no existe', async () => {
    expect((await request(appWith().app).post(URL).set('Cookie', await adminCookie())).status).toBe(404)
  })
})
