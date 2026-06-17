import type { AppConfig } from './config'

export interface TokenManager {
  getAccessToken(forceRefresh?: boolean): Promise<string>
}

interface Deps {
  config: AppConfig
  fetchImpl?: typeof fetch
  now?: () => number
}

export function createTokenManager({ config, fetchImpl = fetch, now = () => Date.now() }: Deps): TokenManager {
  let token: string | null = null
  let expiresAt = 0

  async function refresh(): Promise<string> {
    const url = `https://${config.accountsDomain}/oauth/v2/token`
    const body = new URLSearchParams({
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    })
    const res = await fetchImpl(url, { method: 'POST', body })
    if (!res.ok) {
      throw new Error(`Fallo al refrescar token Zoho: ${res.status} ${await res.text()}`)
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }
    if (!data.access_token) {
      throw new Error(`Respuesta de token inválida: ${JSON.stringify(data)}`)
    }
    token = data.access_token
    expiresAt = now() + ((data.expires_in ?? 3600) - 60) * 1000
    return token
  }

  return {
    async getAccessToken(forceRefresh = false): Promise<string> {
      if (!forceRefresh && token && now() < expiresAt) return token
      return refresh()
    },
  }
}
