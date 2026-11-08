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

  it('MIGRACION_TICKETS_HABILITADA nace cerrada: sólo el literal "true" la enciende (E-231)', () => {
    expect(loadConfig(base).migracionTicketsHabilitada).toBe(false)
    for (const v of ['', 'false', 'TRUE', '1', 'yes']) expect(loadConfig({ ...base, MIGRACION_TICKETS_HABILITADA: v }).migracionTicketsHabilitada).toBe(false)
    expect(loadConfig({ ...base, MIGRACION_TICKETS_HABILITADA: 'true' }).migracionTicketsHabilitada).toBe(true)
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

describe('DECISIONALES_POR_CARGO (F1C-05, RQ-PM-28)', () => {
  it('nace cerrado: sólo el literal "true" lo enciende', () => {
    expect(loadConfig(base).decisionalesPorCargo).toBe(false)
    for (const v of ['', 'false', 'TRUE', 'True', '1', 'yes', ' true']) expect(loadConfig({ ...base, DECISIONALES_POR_CARGO: v }).decisionalesPorCargo, v).toBe(false)
    expect(loadConfig({ ...base, DECISIONALES_POR_CARGO: 'true' }).decisionalesPorCargo).toBe(true)
  })
})

describe('CONTROL_CALIDAD_LIBERACION (F1C-07, RQ-PM-32)', () => {
  it('nace cerrado: sólo el literal "true" lo enciende', () => {
    expect(loadConfig(base).controlCalidadLiberacion).toBe(false)
    for (const v of ['', 'false', 'TRUE', 'True', '1', 'yes', ' true']) expect(loadConfig({ ...base, CONTROL_CALIDAD_LIBERACION: v }).controlCalidadLiberacion, v).toBe(false)
    expect(loadConfig({ ...base, CONTROL_CALIDAD_LIBERACION: 'true' }).controlCalidadLiberacion).toBe(true)
  })
})

describe('SYNC_CONVERSACIONES_PERIODICA y MARCAR_CONVERSACIONES_AUSENTES (1G-01, RQ-ZS-27)', () => {
  it('nacen cerrados: ausentes del entorno, los dos campos valen false', () => {
    const c = loadConfig(base)
    expect(c.syncConversacionesPeriodica).toBe(false)
    expect(c.marcarConversacionesAusentes).toBe(false)
  })

  it('sólo el literal "true" enciende cada uno', () => {
    for (const v of ['', 'false', 'TRUE', 'True', '1', 'yes', ' true']) {
      expect(loadConfig({ ...base, SYNC_CONVERSACIONES_PERIODICA: v }).syncConversacionesPeriodica, v).toBe(false)
      expect(loadConfig({ ...base, MARCAR_CONVERSACIONES_AUSENTES: v }).marcarConversacionesAusentes, v).toBe(false)
    }
    expect(loadConfig({ ...base, SYNC_CONVERSACIONES_PERIODICA: 'true' }).syncConversacionesPeriodica).toBe(true)
    expect(loadConfig({ ...base, MARCAR_CONVERSACIONES_AUSENTES: 'true' }).marcarConversacionesAusentes).toBe(true)
  })

  it('son independientes: encender uno no enciende el otro', () => {
    const a = loadConfig({ ...base, SYNC_CONVERSACIONES_PERIODICA: 'true' })
    expect([a.syncConversacionesPeriodica, a.marcarConversacionesAusentes]).toEqual([true, false])
    const b = loadConfig({ ...base, MARCAR_CONVERSACIONES_AUSENTES: 'true' })
    expect([b.syncConversacionesPeriodica, b.marcarConversacionesAusentes]).toEqual([false, true])
  })
})

describe('loadConfig · RELLENO_CONVERSACIONES_HABILITADO (1G-01, RQ-ZS-29)', () => {
  it('nace cerrado: sin la variable, o vacía', () => {
    expect(loadConfig(base).rellenoConversacionesHabilitado).toBe(false)
    expect(loadConfig({ ...base, RELLENO_CONVERSACIONES_HABILITADO: '' }).rellenoConversacionesHabilitado).toBe(false)
  })

  it('sólo el literal "true" lo enciende', () => {
    for (const v of ['false', 'TRUE', 'True', '1', 'yes', ' true', 'true ']) {
      expect(loadConfig({ ...base, RELLENO_CONVERSACIONES_HABILITADO: v }).rellenoConversacionesHabilitado, v).toBe(false)
    }
    expect(loadConfig({ ...base, RELLENO_CONVERSACIONES_HABILITADO: 'true' }).rellenoConversacionesHabilitado).toBe(true)
  })

  it('es independiente de los dos interruptores de conversaciones: encender uno no enciende el otro', () => {
    const solo = loadConfig({ ...base, RELLENO_CONVERSACIONES_HABILITADO: 'true' })
    expect([solo.rellenoConversacionesHabilitado, solo.syncConversacionesPeriodica, solo.marcarConversacionesAusentes]).toEqual([true, false, false])
    const marcan = loadConfig({ ...base, SYNC_CONVERSACIONES_PERIODICA: 'true', MARCAR_CONVERSACIONES_AUSENTES: 'true' })
    expect([marcan.rellenoConversacionesHabilitado, marcan.syncConversacionesPeriodica, marcan.marcarConversacionesAusentes]).toEqual([false, true, true])
  })
})

describe('loadConfig · adjuntos en el volumen propio (1G-02, RQ-ZS-32 y RQ-ZS-33)', () => {
  const interruptores = [
    ['RELLENO_ADJUNTOS_HABILITADO', 'rellenoAdjuntosHabilitado'],
    ['GUARDAR_ADJUNTOS_AL_SINCRONIZAR', 'guardarAdjuntosAlSincronizar'],
  ] as const

  for (const [variable, campo] of interruptores) {
    it(`${variable} nace cerrado: sin la variable, o vacía`, () => {
      expect(loadConfig(base)[campo]).toBe(false)
      expect(loadConfig({ ...base, [variable]: '' })[campo]).toBe(false)
    })

    it(`${variable}: sólo el literal "true" lo abre (TRUE, 1, false y los blancos lo dejan cerrado)`, () => {
      for (const v of ['false', 'TRUE', 'True', '1', 'yes', ' true', 'true ']) {
        expect(loadConfig({ ...base, [variable]: v })[campo], v).toBe(false)
      }
      expect(loadConfig({ ...base, [variable]: 'true' })[campo]).toBe(true)
    })
  }

  it('los dos interruptores son independientes entre sí y de los de conversaciones', () => {
    const solo = loadConfig({ ...base, RELLENO_ADJUNTOS_HABILITADO: 'true' })
    expect([solo.rellenoAdjuntosHabilitado, solo.guardarAdjuntosAlSincronizar, solo.syncConversacionesPeriodica]).toEqual([true, false, false])
    const otro = loadConfig({ ...base, GUARDAR_ADJUNTOS_AL_SINCRONIZAR: 'true' })
    expect([otro.rellenoAdjuntosHabilitado, otro.guardarAdjuntosAlSincronizar, otro.syncConversacionesPeriodica]).toEqual([false, true, false])
  })

  it('ADJUNTOS_DIR no tiene valor por defecto: ausente o vacía da cadena vacía, y lo escrito se conserva tal cual', () => {
    expect(loadConfig(base).adjuntosDir).toBe('')
    expect(loadConfig({ ...base, ADJUNTOS_DIR: '' }).adjuntosDir).toBe('')
    expect(loadConfig({ ...base, ADJUNTOS_DIR: '/data/adjuntos' }).adjuntosDir).toBe('/data/adjuntos')
  })
})

describe('loadConfig · verificacionCompletitudHabilitada (1G-03, RQ-ZS-39)', () => {
  it("nace cerrada: ausente, vacía, `TRUE` y `1` la dejan en false; sólo 'true' la abre", () => {
    expect(loadConfig(base).verificacionCompletitudHabilitada).toBe(false)
    expect(loadConfig({ ...base, VERIFICACION_COMPLETITUD_HABILITADA: '' }).verificacionCompletitudHabilitada).toBe(false)
    expect(loadConfig({ ...base, VERIFICACION_COMPLETITUD_HABILITADA: 'TRUE' }).verificacionCompletitudHabilitada).toBe(false)
    expect(loadConfig({ ...base, VERIFICACION_COMPLETITUD_HABILITADA: '1' }).verificacionCompletitudHabilitada).toBe(false)
    expect(loadConfig({ ...base, VERIFICACION_COMPLETITUD_HABILITADA: 'true' }).verificacionCompletitudHabilitada).toBe(true)
  })
})

describe('loadConfig · modoSinZohoDesk (1G-04, RQ-ZS-40)', () => {
  it("nace cerrado: ausente, vacío, `TRUE`, `1` y `false` lo dejan en false; sólo 'true' lo abre", () => {
    expect(loadConfig(base).modoSinZohoDesk).toBe(false)
    expect(loadConfig({ ...base, MODO_SIN_ZOHO_DESK: '' }).modoSinZohoDesk).toBe(false)
    expect(loadConfig({ ...base, MODO_SIN_ZOHO_DESK: 'TRUE' }).modoSinZohoDesk).toBe(false)
    expect(loadConfig({ ...base, MODO_SIN_ZOHO_DESK: '1' }).modoSinZohoDesk).toBe(false)
    expect(loadConfig({ ...base, MODO_SIN_ZOHO_DESK: 'false' }).modoSinZohoDesk).toBe(false)
    expect(loadConfig({ ...base, MODO_SIN_ZOHO_DESK: 'true' }).modoSinZohoDesk).toBe(true)
  })

  it('abierto, loadConfig sigue exigiendo las credenciales de Desk (S-g)', () => {
    expect(() => loadConfig({ ...base, MODO_SIN_ZOHO_DESK: 'true', ZOHO_CLIENT_ID: undefined })).toThrow(/ZOHO_CLIENT_ID/)
    expect(() => loadConfig({ ...base, MODO_SIN_ZOHO_DESK: 'true', ZOHO_REFRESH_TOKEN: undefined })).toThrow(/ZOHO_REFRESH_TOKEN/)
  })
})
