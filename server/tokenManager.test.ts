import { describe, it, expect, vi } from 'vitest'
import { createTokenManager } from './tokenManager'
import type { AppConfig } from './config'

const config = {
  clientId: 'cid', clientSecret: 'sec', refreshToken: 'ref',
  orgId: 'o', departmentId: 'd', accountsDomain: 'accounts.zoho.com',
  apiDomain: 'desk.zoho.com', enableWrites: false, port: 3001,
  databaseUrl: 'postgres://x', syncIntervalMs: 180000,
} as AppConfig

function tokenResponse(token: string, expiresIn = 3600) {
  return new Response(JSON.stringify({ access_token: token, expires_in: expiresIn }), { status: 200 })
}

describe('tokenManager', () => {
  it('pide un access token y lo cachea', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse('AT1'))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => 0 })
    expect(await tm.getAccessToken()).toBe('AT1')
    expect(await tm.getAccessToken()).toBe('AT1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refresca cuando el token expiró', async () => {
    let t = 0
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse('AT1', 100))
      .mockResolvedValueOnce(tokenResponse('AT2', 100))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => t })
    expect(await tm.getAccessToken()).toBe('AT1')
    t = 200_000
    expect(await tm.getAccessToken()).toBe('AT2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('forceRefresh ignora la cache', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse('AT1'))
      .mockResolvedValueOnce(tokenResponse('AT2'))
    const tm = createTokenManager({ config, fetchImpl: fetchMock, now: () => 0 })
    await tm.getAccessToken()
    expect(await tm.getAccessToken(true)).toBe('AT2')
  })
})
