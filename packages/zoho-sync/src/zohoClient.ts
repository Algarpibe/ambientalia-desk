import type { AppConfig } from './config'
import type { TokenManager } from './tokenManager'

export interface ZohoClient {
  zohoFetch(path: string, init?: RequestInit): Promise<Response>
}

interface Deps {
  config: AppConfig
  tokenManager: TokenManager
  fetchImpl?: typeof fetch
}

export function createZohoClient({ config, tokenManager, fetchImpl = fetch }: Deps): ZohoClient {
  const base = `https://${config.apiDomain}/api/v1`

  async function call(path: string, init: RequestInit, token: string): Promise<Response> {
    return fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        orgId: config.orgId,
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })
  }

  return {
    async zohoFetch(path: string, init: RequestInit = {}): Promise<Response> {
      let token = await tokenManager.getAccessToken()
      let res = await call(path, init, token)
      if (res.status === 401) {
        token = await tokenManager.getAccessToken(true)
        res = await call(path, init, token)
      }
      return res
    },
  }
}
