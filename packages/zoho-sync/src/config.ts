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
  /**
   * Fuerza el backfill de `books.contacts` en el arranque del worker, aunque ya haya datos.
   * Puntual: se activa, se redespliega, corre una vez y se vuelve a apagar. Existe porque el guard
   * normal mira `books.items`, así que no hay forma de repoblar solo contactos sin arrastrar
   * artículos, órdenes y facturas. Cuesta ~615 GET de detalle contra Books.
   */
  backfillContacts: boolean
  /** Webhook de n8n que genera la remisión. Vacío = no se dispara (la remisión queda en `pendiente`). */
  remisionWebhookUrl: string
  /** Valor de la cabecera `X-Remision-Token` que exige ese webhook. */
  remisionWebhookToken: string
  /** Secreto con el que n8n autentica su callback de vuelta. Vacío = callback deshabilitado. */
  remisionCallbackToken: string
  /** Webhook de n8n que manda los avisos por correo. Vacío = no se manda nada (la campana sigue igual). */
  avisosWebhookUrl: string
  /** Valor de la cabecera `X-Avisos-Token` que exige ese webhook. */
  avisosWebhookToken: string
  /** URL pública de la aplicación, para que el correo pueda enlazarla. Vacío = el correo no lleva enlace. */
  appBaseUrl: string
  /**
   * Dirección que recibe copia de los avisos de DERIVACIÓN dirigidos a otras personas. Muleta de la
   * fase de pruebas: existe para poder verificar que el canal de correo sale de verdad. Vacío —lo
   * normal— = no se copia nada, y se apaga borrando la variable, sin tocar código.
   */
  avisosCopiaEmail: string
  sweepEnabled: boolean
  sweepDryRun: boolean
  sweepHour: number
  sweepMaxRows: number
  sweepMaxPct: number
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
    backfillContacts: env.BACKFILL_CONTACTS === 'true',   // default OFF
    remisionWebhookUrl: env.N8N_REMISION_WEBHOOK_URL || '',
    remisionWebhookToken: env.N8N_REMISION_TOKEN || '',
    remisionCallbackToken: env.REMISION_CALLBACK_TOKEN || '',
    avisosWebhookUrl: env.N8N_AVISOS_WEBHOOK_URL || '',
    avisosWebhookToken: env.N8N_AVISOS_TOKEN || '',
    appBaseUrl: env.APP_BASE_URL || '',
    avisosCopiaEmail: env.AVISOS_COPIA_EMAIL || '',   // default OFF: es una muleta de pruebas
    sweepEnabled: env.SWEEP_ENABLED === 'true',        // default OFF
    sweepDryRun: env.SWEEP_DRY_RUN !== 'false',         // default ON
    sweepHour: env.SWEEP_HOUR ? Number(env.SWEEP_HOUR) : 4,
    sweepMaxRows: env.SWEEP_MAX_ROWS ? Number(env.SWEEP_MAX_ROWS) : 200,
    sweepMaxPct: env.SWEEP_MAX_PCT ? Number(env.SWEEP_MAX_PCT) : 0.1,
  }
}
