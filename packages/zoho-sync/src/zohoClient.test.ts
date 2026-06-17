import { describe, it, expect, vi } from 'vitest'
import { createZohoClient } from './zohoClient'
import type { AppConfig } from './config'

const config = {
  clientId: 'c', clientSecret: 's', refreshToken: 'r', orgId: 'ORG', departmentId: 'd',
  accountsDomain: 'accounts.zoho.com', apiDomain: 'desk.zoho.com', enableWrites: false, port: 3001,
  databaseUrl: 'postgres://x', syncIntervalMs: 180000,
} as AppConfig

describe('zohoFetch', () => {
  it('agrega base URL, orgId y Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValue('AT1') }
    const { zohoFetch } = createZohoClient({ config, tokenManager: tm, fetchImpl: fetchMock })
    await zohoFetch('/tickets')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://desk.zoho.com/api/v1/tickets')
    expect((init.headers as Record<string, string>).orgId).toBe('ORG')
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-oauthtoken AT1')
  })

  it('ante 401 refresca el token y reintenta una vez', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('unauth', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    const tm = { getAccessToken: vi.fn().mockResolvedValueOnce('AT1').mockResolvedValueOnce('AT2') }
    const { zohoFetch } = createZohoClient({ config, tokenManager: tm, fetchImpl: fetchMock })
    const res = await zohoFetch('/tickets')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(tm.getAccessToken).toHaveBeenLastCalledWith(true)
  })
})
