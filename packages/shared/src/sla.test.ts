import { describe, it, expect } from 'vitest'
import { SLA_HORAS_POR_ESTADO, slaVencido, venceSlaEn } from './sla'
import { ESTADOS, ESTADOS_EN_ESPERA, ESTADOS_SIN_SALIDA } from './estados'

/**
 * C11 — EL RELOJ. F1A-02.
 *
 * El SLA de un día sobre `Notificado` existe en el blueprint de Zoho y la aplicación no lo trajo
 * (maestro M1.7, `R08.1.md:1570`; punto abierto nº 40). Es la ÚNICA regla por tiempo que el proceso
 * tiene, y hasta esta tanda el código no tenía ninguna: `R08.1.md:1588` lo dice como `[ABIERTO —
 * AS-BUILT]`, «no existe hoy ninguna transición por tiempo en el blueprint implementado».
 *
 * SE DECLARA COMO DATO, igual que `ESTADOS_SIN_SALIDA` y por la misma razón: es una decisión de
 * negocio y no una propiedad que el grafo pueda contestar. Nadie puede deducir de las 34 transiciones
 * que `Notificado` merece un día y `Pendiente` no.
 *
 * LA UNIDAD ES LA HORA, no el día, y no es cosmético: el propio maestro deja abierto el plazo de la
 * otra regla por tiempo en «24/48 h» (`:1586`). Declarar días obligaría a cambiar la unidad —y todas
 * las pruebas— el día que Gerencia elija 48.
 */
describe('C11 · el reloj del SLA', () => {
  it('declara UN solo SLA, y es el único que el maestro decidió', () => {
    // Se afirma el objeto entero, no `Notificado` suelto: añadir un estado con SLA es una decisión de
    // Gerencia, y así aparece aquí en rojo en vez de colarse.
    expect(SLA_HORAS_POR_ESTADO).toEqual({ 'Notificado': 24 })
  })

  it('todo estado con SLA es un estado declarado del registro', () => {
    const declarados = new Set<string>(ESTADOS)
    const fantasmas = Object.keys(SLA_HORAS_POR_ESTADO).filter((e) => !declarados.has(e))
    expect(fantasmas, 'estados con SLA que no existen en el registro').toEqual([])
  })

  /**
   * LA COHERENCIA QUE §3.7 DE `transitions-st` PEDÍA, Y QUE HASTA HOY ERA HIPOTÉTICA.
   *
   * `estados.ts:28` avisa: «la vista muestra las ocho; el reloj del SLA NO lee esta clasificación».
   * Era una advertencia sin caso que la demostrase. Ya lo hay: el ÚNICO estado con SLA está
   * clasificado `ninguna` (`estados.ts:79`), así que no es ninguno de los ocho de la vista ni de los
   * cuatro sin salida. Si alguien «arreglara» el reloj haciéndolo leer `ESTADOS_EN_ESPERA`, esta
   * prueba se pone roja.
   */
  it('el reloj y la vista no leen la misma lista: el único estado con SLA no está en las ocho', () => {
    const conSla = Object.keys(SLA_HORAS_POR_ESTADO)
    expect(conSla.filter((e) => (ESTADOS_EN_ESPERA as string[]).includes(e))).toEqual([])
    expect(conSla.filter((e) => (ESTADOS_SIN_SALIDA as string[]).includes(e))).toEqual([])
  })

  // ── El cálculo ───────────────────────────────────────────────────────────────────────────────

  const entro = new Date('2026-09-01T10:00:00.000Z')

  it('vence exactamente 24 h después de entrar en el estado', () => {
    expect(venceSlaEn('Notificado', entro)).toEqual(new Date('2026-09-02T10:00:00.000Z'))
  })

  it('un estado sin SLA no vence nunca', () => {
    expect(venceSlaEn('En Proceso', entro)).toBeNull()
    expect(slaVencido('En Proceso', entro, new Date('2027-01-01T00:00:00.000Z'))).toBe(false)
  })

  /**
   * EL BORDE, y va en positivo y en negativo. Justo en el vencimiento NO está vencido: un SLA de «un
   * día» que salta a las 23:59:59.999 no es un día. El milisegundo siguiente sí.
   */
  it('en el instante exacto del vencimiento todavía no está vencido', () => {
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T10:00:00.000Z'))).toBe(false)
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T10:00:00.001Z'))).toBe(true)
  })

  it('antes del vencimiento no está vencido, por mucho que se acerque', () => {
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T09:59:59.999Z'))).toBe(false)
  })
})
