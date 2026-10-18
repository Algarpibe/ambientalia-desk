// fecha-migracion-fuera-de-cifras (F1F-01), lote 1: la fecha que puso la migración no entra en ninguna cifra (RQ-TC-69).
import { describe, it, expect } from 'vitest'
import {
  esPasoDeMigracion, cierrePuestoPorMigracion, cierreQueCuenta, llegadaQueCuenta, resolucionPromedioMs,
} from './cierreEnCifras'
import { ID_TRANSICION_MIGRACION } from './migracionTickets'

const MIGRACION = '2026-12-12T15:00:00.000Z'
const ZOHO = '2026-11-03T10:00:00.000Z'
const valores = (origen: string, destino: string) => ({ regla: 'entregado-a-finalizado', closed_time_destino: destino, cierre_origen: origen })

describe('esPasoDeMigracion', () => {
  it('sólo el id del marcador', () => {
    expect(esPasoDeMigracion(ID_TRANSICION_MIGRACION)).toBe(true)
    expect(esPasoDeMigracion('entrega_al_cliente')).toBe(false)
    expect(esPasoDeMigracion(null)).toBe(false)
  })
})

describe('cierrePuestoPorMigracion', () => {
  it('devuelve el destino sólo con cierre_origen exactamente «migracion»', () => {
    expect(cierrePuestoPorMigracion(valores('migracion', MIGRACION))).toBe(MIGRACION)
    expect(cierrePuestoPorMigracion(valores('zoho', ZOHO))).toBeNull()
    expect(cierrePuestoPorMigracion(valores('Migracion', MIGRACION))).toBeNull()
  })
  it('sin cierre (identidad), sin destino o con values que no es objeto, null', () => {
    expect(cierrePuestoPorMigracion({ regla: 'identidad' })).toBeNull()
    expect(cierrePuestoPorMigracion({ cierre_origen: 'migracion' })).toBeNull()
    expect(cierrePuestoPorMigracion(null)).toBeNull()
    expect(cierrePuestoPorMigracion('x')).toBeNull()
  })
})

describe('cierreQueCuenta (S-1)', () => {
  it('el mismo instante que puso la migración no cuenta, aunque venga en otro formato', () => {
    expect(cierreQueCuenta(MIGRACION, MIGRACION)).toBeNull()
    expect(cierreQueCuenta('2026-12-12T10:00:00-05:00', MIGRACION)).toBeNull()
  })
  it('un cierre distinto, o sin marca de migración, cuenta tal cual', () => {
    expect(cierreQueCuenta(ZOHO, MIGRACION)).toBe(ZOHO)
    expect(cierreQueCuenta(ZOHO, null)).toBe(ZOHO)
    expect(cierreQueCuenta(null, MIGRACION)).toBeNull()
  })
})

describe('llegadaQueCuenta (S-3)', () => {
  const paso = (transitionId: string, values: unknown) => ({ transitionId, performedAt: MIGRACION, values })
  it('el marcador nunca fecha por su performedAt: con «zoho» fecha con su destino, con «migracion» no fecha', () => {
    expect(llegadaQueCuenta(paso(ID_TRANSICION_MIGRACION, valores('zoho', ZOHO)))).toBe(ZOHO)
    expect(llegadaQueCuenta(paso(ID_TRANSICION_MIGRACION, valores('migracion', MIGRACION)))).toBeNull()
    expect(llegadaQueCuenta(paso(ID_TRANSICION_MIGRACION, { regla: 'identidad' }))).toBeNull()
  })
  it('otro paso fecha por su performedAt', () => {
    expect(llegadaQueCuenta(paso('entrega_al_cliente', {}))).toBe(MIGRACION)
  })
})

describe('resolucionPromedioMs', () => {
  const t = (id: string, createdAt: string | null, closedAt: string | null, statusType: string | null = 'Closed') => ({ id, statusType, createdAt, closedAt })
  it('media de los cerrados cuyo cierre cuenta; el de la migración no entra', () => {
    const tickets = [
      t('a', '2026-11-01T00:00:00Z', '2026-11-01T02:00:00Z'),
      t('b', '2026-11-01T00:00:00Z', '2026-11-01T04:00:00Z'),
      t('m', '2026-01-01T00:00:00Z', MIGRACION),
      t('abierto', '2026-11-01T00:00:00Z', null, 'Open'),
    ]
    expect(resolucionPromedioMs(tickets, new Map([['m', MIGRACION]]), new Date('2027-01-31T00:00:00Z'))).toBe(3 * 3600000)
  })
  it('sin ningún cierre que cuente, null', () => {
    expect(resolucionPromedioMs([t('m', '2026-01-01T00:00:00Z', MIGRACION)], new Map([['m', MIGRACION]]), new Date('2027-01-31T00:00:00Z'))).toBeNull()
    expect(resolucionPromedioMs([], new Map(), new Date('2027-01-31T00:00:00Z'))).toBeNull()
  })
})
