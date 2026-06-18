import { describe, it, expect, vi } from 'vitest'
import { createCrmClient } from './crmClient'
import type { AppConfig } from '../config'

const config = { crmApiDomain: 'www.zohoapis.com', crmAccountsDomain: 'acc.test', crmRefreshToken: 'r', crmClientId: 'c', crmClientSecret: 's' } as AppConfig

describe('crmClient', () => {
  it('adjunta el token y reintenta una vez ante 401', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 't1', expires_in: 3600 }), { status: 200 })) // refresh
      .mockResolvedValueOnce(new Response('nope', { status: 401 })) // call 1 → 401
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 't2', expires_in: 3600 }), { status: 200 })) // refresh forzado
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 })) // retry OK
    const { crmFetch } = createCrmClient({ config, fetchImpl: fetchImpl as any })
    const res = await crmFetch('/Deals?per_page=1')
    expect(res.status).toBe(200)
    const url = (fetchImpl.mock.calls[1][0] as string)
    expect(url).toBe('https://www.zohoapis.com/crm/v8/Deals?per_page=1')
    expect((fetchImpl.mock.calls[1][1] as any).headers.Authorization).toBe('Zoho-oauthtoken t1')
  })
})
