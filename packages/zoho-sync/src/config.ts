export interface AppConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  orgId: string
  departmentId: string
  accountsDomain: string
  apiDomain: string
  enableWrites: boolean
  port: number
  databaseUrl: string
  dbSchema: string
  syncIntervalMs: number
  syncContacts: boolean
  syncActivities: boolean
  syncBooks: boolean
  syncBooksRich: boolean
  salesTrackerDatabaseUrl: string
  deriveSalesRecords: boolean
  salesRecordsHour: number
  adminToken: string   // protege endpoints /api/admin/* (vacío = deshabilitados)
  adminEmail: string     // bootstrap del primer admin (vacío = no se siembra)
  adminPassword: string
  booksClientId: string
  booksClientSecret: string
  booksRefreshToken: string   // vacío = sync de Books deshabilitado
  booksOrgId: string
  booksApiDomain: string
  booksAccountsDomain: string
  crmClientId: string
  crmClientSecret: string
  crmRefreshToken: string
  crmApiDomain: string
  crmAccountsDomain: string
  syncCrm: boolean
}

type Env = Record<string, string | undefined>

function required(env: Env, key: string): string {
  const v = env[key]
  if (!v) throw new Error(`Falta la variable de entorno requerida: ${key}`)
  return v
}

export function loadConfig(env: Env = process.env): AppConfig {
  return {
    clientId: required(env, 'ZOHO_CLIENT_ID'),
    clientSecret: required(env, 'ZOHO_CLIENT_SECRET'),
    refreshToken: required(env, 'ZOHO_REFRESH_TOKEN'),
    orgId: required(env, 'ZOHO_ORG_ID'),
    departmentId: required(env, 'ZOHO_DEPARTMENT_ID'),
    accountsDomain: env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    apiDomain: env.ZOHO_API_DOMAIN || 'desk.zoho.com',
    enableWrites: env.ENABLE_WRITES === 'true',
    port: env.PORT ? Number(env.PORT) : 3001,
    databaseUrl: required(env, 'DATABASE_URL'),
    dbSchema: env.DB_SCHEMA || 'public',
    syncIntervalMs: env.SYNC_INTERVAL_MS ? Number(env.SYNC_INTERVAL_MS) : 180000,
    syncContacts: env.SYNC_CONTACTS !== 'false',
    syncActivities: env.SYNC_ACTIVITIES !== 'false',
    syncBooks: env.SYNC_BOOKS !== 'false',
    syncBooksRich: env.SYNC_BOOKS_RICH !== 'false',
    salesTrackerDatabaseUrl: env.SALES_TRACKER_DATABASE_URL || '',
    deriveSalesRecords: env.DERIVE_SALES_RECORDS !== 'false',
    salesRecordsHour: env.SALES_RECORDS_HOUR ? Number(env.SALES_RECORDS_HOUR) : 5,
    adminToken: env.ADMIN_TOKEN || '',
    adminEmail: env.ADMIN_EMAIL || '',
    adminPassword: env.ADMIN_PASSWORD || '',
    booksClientId: env.ZOHO_BOOKS_CLIENT_ID || env.ZOHO_CLIENT_ID || '',
    booksClientSecret: env.ZOHO_BOOKS_CLIENT_SECRET || env.ZOHO_CLIENT_SECRET || '',
    booksRefreshToken: env.ZOHO_BOOKS_REFRESH_TOKEN || '',
    booksOrgId: env.ZOHO_BOOKS_ORG_ID || '',
    booksApiDomain: env.ZOHO_BOOKS_API_DOMAIN || 'www.zohoapis.com',
    booksAccountsDomain: env.ZOHO_BOOKS_ACCOUNTS_DOMAIN || env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    crmClientId: env.ZOHO_CRM_CLIENT_ID || env.ZOHO_CLIENT_ID || '',
    crmClientSecret: env.ZOHO_CRM_CLIENT_SECRET || env.ZOHO_CLIENT_SECRET || '',
    crmRefreshToken: env.ZOHO_CRM_REFRESH_TOKEN || '',
    crmApiDomain: env.ZOHO_CRM_API_DOMAIN || 'www.zohoapis.com',
    crmAccountsDomain: env.ZOHO_CRM_ACCOUNTS_DOMAIN || env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    syncCrm: env.SYNC_CRM !== 'false',
  }
}
