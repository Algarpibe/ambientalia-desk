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

  it('lee ZOHO_BOOKS_* (refresh token vacío por defecto)', () => {
    expect(loadConfig(base).booksRefreshToken).toBe('')
    const c = loadConfig({ ...base, ZOHO_BOOKS_REFRESH_TOKEN: 'rt', ZOHO_BOOKS_ORG_ID: '714421387' })
    expect(c.booksRefreshToken).toBe('rt')
    expect(c.booksOrgId).toBe('714421387')
    expect(c.booksApiDomain).toBe('www.zohoapis.com')
  })

  it('flags de sync local: default true; se desactivan con "false"', () => {
    const def = loadConfig(base)
    expect(def.syncContacts).toBe(true)
    expect(def.syncActivities).toBe(true)
    expect(def.syncBooks).toBe(true)
    const off = loadConfig({ ...base, SYNC_CONTACTS: 'false', SYNC_ACTIVITIES: 'false', SYNC_BOOKS: 'false' })
    expect(off.syncContacts).toBe(false)
    expect(off.syncActivities).toBe(false)
    expect(off.syncBooks).toBe(false)
  })

  it('syncBooksRich default true; false con SYNC_BOOKS_RICH=false', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    expect(loadConfig(base as any).syncBooksRich).toBe(true)
    expect(loadConfig({ ...base, SYNC_BOOKS_RICH: 'false' } as any).syncBooksRich).toBe(false)
  })

  it('deriveSalesRecords/url/hora con defaults y overrides', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    const def = loadConfig(base as any)
    expect(def.deriveSalesRecords).toBe(true)
    expect(def.salesTrackerDatabaseUrl).toBe('')
    expect(def.salesRecordsHour).toBe(5)
    const ov = loadConfig({ ...base, DERIVE_SALES_RECORDS: 'false', SALES_TRACKER_DATABASE_URL: 'postgres://x', SALES_RECORDS_HOUR: '7' } as any)
    expect(ov.deriveSalesRecords).toBe(false)
    expect(ov.salesTrackerDatabaseUrl).toBe('postgres://x')
    expect(ov.salesRecordsHour).toBe(7)
  })

  it('CRM: token/flag/domain con defaults y overrides', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    const d = loadConfig(base as any)
    expect(d.syncCrm).toBe(true)
    expect(d.crmRefreshToken).toBe('')
    expect(d.crmApiDomain).toBe('www.zohoapis.com')
    expect(d.crmClientId).toBe('a') // fallback a ZOHO_CLIENT_ID
    const o = loadConfig({ ...base, ZOHO_CRM_REFRESH_TOKEN: 'r', ZOHO_CRM_CLIENT_ID: 'cc', SYNC_CRM: 'false' } as any)
    expect(o.crmRefreshToken).toBe('r'); expect(o.crmClientId).toBe('cc'); expect(o.syncCrm).toBe(false)
  })

  it('dbSchema default public; desk con DB_SCHEMA=desk', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    expect(loadConfig(base as any).dbSchema).toBe('public')
    expect(loadConfig({ ...base, DB_SCHEMA: 'desk' } as any).dbSchema).toBe('desk')
  })
})
