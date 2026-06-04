import { describe, it, expect } from 'vitest'
import { loadConfig } from './config'

const base = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref',
  ZOHO_ORG_ID: '713448415', ZOHO_DEPARTMENT_ID: '495552000000006907',
  DATABASE_URL: 'postgres://u:p@localhost:5432/desk',
}

describe('loadConfig', () => {
  it('aplica defaults de dominios, flags y sync', () => {
    const c = loadConfig(base)
    expect(c.accountsDomain).toBe('accounts.zoho.com')
    expect(c.apiDomain).toBe('desk.zoho.com')
    expect(c.enableWrites).toBe(false)
    expect(c.port).toBe(3001)
    expect(c.databaseUrl).toBe('postgres://u:p@localhost:5432/desk')
    expect(c.syncIntervalMs).toBe(180000)
  })

  it('respeta ENABLE_WRITES=true y SYNC_INTERVAL_MS', () => {
    const c = loadConfig({ ...base, ENABLE_WRITES: 'true', SYNC_INTERVAL_MS: '60000' })
    expect(c.enableWrites).toBe(true)
    expect(c.syncIntervalMs).toBe(60000)
  })

  it('lanza si falta un secreto o DATABASE_URL', () => {
    expect(() => loadConfig({ ...base, ZOHO_CLIENT_ID: undefined })).toThrow(/ZOHO_CLIENT_ID/)
    expect(() => loadConfig({ ...base, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/)
  })

  it('lee ADMIN_EMAIL/ADMIN_PASSWORD (vacíos por defecto)', () => {
    // usa el env base del archivo (las variables Zoho requeridas)
    expect(loadConfig(base).adminEmail).toBe('')
    const c = loadConfig({ ...base, ADMIN_EMAIL: 'a@x.co', ADMIN_PASSWORD: 'secreta12' })
    expect(c.adminEmail).toBe('a@x.co')
    expect(c.adminPassword).toBe('secreta12')
  })
})
