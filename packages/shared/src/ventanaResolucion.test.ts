// tiempos-ficha-cliente (F1F-03): la media de resolución de la ficha cuenta sólo los últimos seis meses (RQ-TC-70).
import { describe, it, expect } from 'vitest'
import { resolucionPromedioMs, MESES_VENTANA_RESOLUCION, inicioVentanaResolucion } from './cierreEnCifras'

const AHORA = new Date('2027-06-15T12:00:00.000Z')
const INICIO = '2026-12-15T12:00:00.000Z'
const HORA = 3600000
const t = (id: string, createdAt: string, closedAt: string) => ({ id, statusType: 'Closed', createdAt, closedAt })

describe('ventana de la media de resolución (RQ-TC-70)', () => {
  it('es de seis meses de calendario hacia atrás desde ahora', () => {
    expect(MESES_VENTANA_RESOLUCION).toBe(6)
    expect(inicioVentanaResolucion(AHORA)).toBe(new Date(INICIO).getTime())
  })
  it('un cierre de hace más de seis meses no entra en la media', () => {
    const tickets = [
      t('dentro', '2027-03-01T00:00:00Z', '2027-03-01T02:00:00Z'),
      t('fuera', '2026-12-01T00:00:00Z', '2026-12-01T06:00:00Z'),
    ]
    expect(resolucionPromedioMs(tickets, new Map(), AHORA)).toBe(2 * HORA)
  })
  it('el límite inferior cuenta; un milisegundo antes, no', () => {
    const tickets = [
      t('limite', '2026-12-15T11:00:00Z', INICIO),
      t('antes', '2026-12-15T08:00:00Z', '2026-12-15T11:59:59.999Z'),
    ]
    expect(resolucionPromedioMs(tickets, new Map(), AHORA)).toBe(1 * HORA)
  })
  it('el cierre de la migración no cuenta aunque caiga dentro de la ventana', () => {
    const MIGRACION = '2027-05-01T15:00:00.000Z'
    const tickets = [
      t('normal', '2027-03-01T00:00:00Z', '2027-03-01T02:00:00Z'),
      t('m', '2027-01-01T00:00:00Z', MIGRACION),
    ]
    expect(resolucionPromedioMs(tickets, new Map([['m', MIGRACION]]), AHORA)).toBe(2 * HORA)
  })
  it('sin cierres en la ventana, null', () => {
    expect(resolucionPromedioMs([t('fuera', '2026-12-01T00:00:00Z', '2026-12-01T06:00:00Z')], new Map(), AHORA)).toBeNull()
  })
})
