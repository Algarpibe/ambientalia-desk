import { describe, it, expect, vi } from 'vitest'
import { createZohoClient } from './zohoClient'
import { loadConfig } from './config'
import type { AppConfig } from './config'
import { crearRegistroModoSinZoho, ErrorModoSinZohoDesk, esCorteModoSinZoho } from './modoSinZoho'

/**
 * 1G-04 · L1 (RQ-ZS-40, RQ-ZS-41): la puerta `zohoFetch` corta ANTES del token, cuenta y falla cerrado.
 * El transporte y el gestor de token son falsos: lo que se mide es que, abierto, ninguno se invoca.
 */
const env = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref',
  ZOHO_ORG_ID: 'ORG', ZOHO_DEPARTMENT_ID: 'dep',
  DATABASE_URL: 'postgres://u:p@localhost:5432/desk',
}
const abierta = { ...loadConfig({ ...env, MODO_SIN_ZOHO_DESK: 'true' }) } as AppConfig
const ID = 'MARCA_ID_5512'
const QUERY = 'MARCA_QUERY_5512'

function falsos() {
  const fetchMock = vi.fn().mockResolvedValue(new Response('unauth', { status: 401 }))
  const tm = { getAccessToken: vi.fn().mockResolvedValue('AT1') }
  return { fetchMock, tm }
}

/** Quien llama a `zohoFetch`: su nombre es el llamador que el registro tiene que anotar. */
async function llamarDesdeAqui(zohoFetch: (p: string, i?: RequestInit) => Promise<Response>, path: string): Promise<unknown> {
  try {
    await zohoFetch(path)
  } catch (e) {
    return e
  }
  return undefined
}

describe('zohoFetch con el modo sin Zoho Desk abierto (RQ-ZS-41)', () => {
  it('lee el interruptor de loadConfig: abierta es la configuración de verdad', () => {
    expect(abierta.modoSinZohoDesk).toBe(true)
  })

  it('no sale transporte ni se pide token, con cualquier ruta y verbo', async () => {
    const { fetchMock, tm } = falsos()
    const { zohoFetch } = createZohoClient({ config: abierta, tokenManager: tm, fetchImpl: fetchMock, registro: crearRegistroModoSinZoho() })
    await expect(zohoFetch('/tickets')).rejects.toBeInstanceOf(ErrorModoSinZohoDesk)
    await expect(zohoFetch('/tickets/1/sendReply', { method: 'POST', body: '{}' })).rejects.toBeInstanceOf(ErrorModoSinZohoDesk)
    await expect(zohoFetch('/contacts/9?x=1', { method: 'DELETE' })).rejects.toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(tm.getAccessToken).not.toHaveBeenCalled()
  })

  it('con un transporte que daría 401 tampoco hay reintento: cero llamadas y ningún segundo token', async () => {
    const { fetchMock, tm } = falsos()
    const { zohoFetch } = createZohoClient({ config: abierta, tokenManager: tm, fetchImpl: fetchMock, registro: crearRegistroModoSinZoho() })
    await expect(zohoFetch('/tickets')).rejects.toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(fetchMock).toHaveBeenCalledTimes(0)
    expect(tm.getAccessToken).toHaveBeenCalledTimes(0)
    expect(tm.getAccessToken).not.toHaveBeenCalledWith(true)
  })

  it('el error se distingue de un fallo de red y de un !res.ok, y su mensaje no lleva ruta, id ni query', async () => {
    const { fetchMock, tm } = falsos()
    const { zohoFetch } = createZohoClient({ config: abierta, tokenManager: tm, fetchImpl: fetchMock, registro: crearRegistroModoSinZoho() })
    const e = await llamarDesdeAqui(zohoFetch, `/tickets/${ID}/conversations?q=${QUERY}`)
    expect(e).toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(esCorteModoSinZoho(e)).toBe(true)
    expect(e).not.toBeInstanceOf(TypeError)
    expect(e).not.toBeInstanceOf(Response)
    const mensaje = (e as Error).message
    expect(mensaje).toBe('modo sin Zoho Desk: la petición a Zoho Desk no salió')
    for (const marca of [ID, QUERY, '/tickets', 'conversations']) expect(mensaje).not.toContain(marca)
  })

  it('el corte suma en el registro inyectado, con su recurso reducido y el llamador de la pila', async () => {
    const { fetchMock, tm } = falsos()
    const registro = crearRegistroModoSinZoho({ ahora: () => new Date('2026-11-20T13:00:00.000Z') })
    const { zohoFetch } = createZohoClient({ config: abierta, tokenManager: tm, fetchImpl: fetchMock, registro })
    await llamarDesdeAqui(zohoFetch, `/tickets/${ID}?q=${QUERY}`)
    await llamarDesdeAqui(zohoFetch, '/tickets/otro')
    expect(registro.leer().cortes).toEqual([
      {
        recurso: 'GET /tickets/{x}',
        llamador: 'packages/zoho-sync/src/zohoClientModoSinZoho.test.ts · llamarDesdeAqui',
        cuenta: 2,
        primera: '2026-11-20T13:00:00.000Z',
        ultima: '2026-11-20T13:00:00.000Z',
      },
    ])
    expect(JSON.stringify(registro.leer())).not.toContain(ID)
    expect(JSON.stringify(registro.leer())).not.toContain(QUERY)
  })

  it('sin registro inyectado también corta, con el registro por omisión', async () => {
    const { fetchMock, tm } = falsos()
    const { zohoFetch } = createZohoClient({ config: abierta, tokenManager: tm, fetchImpl: fetchMock })
    await expect(zohoFetch('/tickets')).rejects.toBeInstanceOf(ErrorModoSinZohoDesk)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(tm.getAccessToken).not.toHaveBeenCalled()
  })
})

describe('zohoFetch con el modo cerrado es la puerta de hoy (RQ-ZS-40, RQ-ZS-41)', () => {
  it.each([
    ['TRUE', 'TRUE'],
    ['1', '1'],
    ['vacío', ''],
    ['ausente', undefined],
    ['false', 'false'],
  ])('%s: pide el token, envía la petición y no cuenta nada', async (_nombre, valor) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValue('AT1') }
    const registro = crearRegistroModoSinZoho()
    const config = loadConfig({ ...env, MODO_SIN_ZOHO_DESK: valor })
    expect(config.modoSinZohoDesk).toBe(false)
    const { zohoFetch } = createZohoClient({ config, tokenManager: tm, fetchImpl: fetchMock, registro })
    const res = await zohoFetch('/tickets')
    expect(res.status).toBe(200)
    expect(tm.getAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(registro.leer()).toEqual({ cortes: [], rechazos: [] })
  })

  it('cerrado y con 401, refresca el token y reintenta una vez, como hoy', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('unauth', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValueOnce('AT1').mockResolvedValueOnce('AT2') }
    const { zohoFetch } = createZohoClient({ config: loadConfig(env), tokenManager: tm, fetchImpl: fetchMock })
    expect((await zohoFetch('/tickets')).status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(tm.getAccessToken).toHaveBeenLastCalledWith(true)
  })
})
