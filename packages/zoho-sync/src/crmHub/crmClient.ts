import type { AppConfig } from '../config'

export interface CrmClient { crmFetch(path: string, init?: RequestInit): Promise<Response> }
interface Deps { config: AppConfig; fetchImpl?: typeof fetch; now?: () => number }

export function createCrmClient({ config, fetchImpl = fetch, now = () => Date.now() }: Deps): CrmClient {
  const base = `https://${config.crmApiDomain}/crm/v8`
  let token: string | null = null
  let expiresAt = 0
  async function refresh(): Promise<string> {
    const url = `https://${config.crmAccountsDomain}/oauth/v2/token`
    const body = new URLSearchParams({ refresh_token: config.crmRefreshToken, client_id: config.crmClientId, client_secret: config.crmClientSecret, grant_type: 'refresh_token' })
    const res = await fetchImpl(url, { method: 'POST', body })
    if (!res.ok) throw new Error(`Fallo al refrescar token CRM: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new Error(`Token CRM inválido: ${JSON.stringify(data)}`)
    token = data.access_token; expiresAt = now() + ((data.expires_in ?? 3600) - 60) * 1000
    return token
  }
  async function getToken(force = false): Promise<string> { return (!force && token && now() < expiresAt) ? token : refresh() }
  async function call(path: string, init: RequestInit, t: string): Promise<Response> {
    return fetchImpl(`${base}${path}`, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Zoho-oauthtoken ${t}` } })
  }
  return {
    async crmFetch(path: string, init: RequestInit = {}): Promise<Response> {
      let t = await getToken(); let res = await call(path, init, t)
      if (res.status === 401) { t = await getToken(true); res = await call(path, init, t) }
      return res
    },
  }
}
