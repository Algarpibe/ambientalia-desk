import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { instanteDeJornada } from './calendarioLaboral'
import { ESTADOS } from './estados'
import { ALARMAS_SLA, SLA_HORAS_POR_ESTADO, slaVencido } from './sla'
import {
  ESTADOS_QUE_PARAN_EL_RELOJ, ESTADOS_TERMINALES_DEL_RELOJ, paraElReloj, tiemposDelReloj, type PasoDelReloj,
} from './relojSla'

/**
 * RELOJ DEL SLA (F1C-06; RQ-TC-73, RQ-TC-74, RQ-TC-77). Todos los instantes salen de `instanteDeJornada`
 * (`calendarioLaboral.ts:155`), nunca de «-5 h» escrito a mano. La semana es la del lunes 26/10/2026: sin
 * festivos (el 12/10 y el 02/11 caen fuera) y sin cierres, con jornada de 8 a 17 h (9 horas por día).
 */

const lun = '2026-10-26', mar = '2026-10-27', mie = '2026-10-28', jue = '2026-10-29', vie = '2026-10-30'
const a = (dia: string, hora: number): Date => instanteDeJornada(dia, hora)
const sinCierres: ReadonlySet<string> = new Set()
const leer = (ruta: string): string => readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')

// Las sentencias `import` de un fichero, enteras (también las de varias líneas).
const importsDe = (texto: string): string[] => texto.match(/^import\s[\s\S]*?from\s+['"][^'"]+['"]/gm) ?? []

const PARAN = ['Notificación cliente', 'Por Entregar', 'Por Entregar / Sin facturar', 'En Espera de Repuestos', 'Servicio externo']
const INTERNAS = ['Notificación a Compras', 'Notificación Comercial', 'En espera de SKU inventario', 'Solicitado',
  'Liberación Comercial', 'Remisión creada']

describe('RQ-TC-73 · la lista propia de estados que paran el reloj', () => {
  it('las cinco de c7 paran, con su nombre exacto, y ninguna otra', () => {
    expect([...ESTADOS_QUE_PARAN_EL_RELOJ].sort()).toEqual([...PARAN].sort())
    for (const e of PARAN) expect(paraElReloj(e), e).toBe(true)
  })

  it('las seis esperas internas corren', () => {
    for (const e of INTERNAS) {
      expect(ESTADOS, `${e} debe ser un estado del registro`).toContain(e)
      expect(ESTADOS_QUE_PARAN_EL_RELOJ as readonly string[], e).not.toContain(e)
      expect(paraElReloj(e), e).toBe(false)
    }
  })

  it('Pendiente corre aunque la vista la haga externa', () => {
    expect(paraElReloj('Pendiente')).toBe(false)
    expect(ESTADOS_QUE_PARAN_EL_RELOJ as readonly string[]).not.toContain('Pendiente')
  })

  it('Pendiente de facturar corre', () => {
    expect(paraElReloj('Pendiente de facturar')).toBe(false)
    expect(ESTADOS_QUE_PARAN_EL_RELOJ as readonly string[]).not.toContain('Pendiente de facturar')
  })

  it('los dos terminales son Finalizado y Anulado, y no están entre los que paran', () => {
    expect([...ESTADOS_TERMINALES_DEL_RELOJ].sort()).toEqual(['Anulado', 'Finalizado'])
    for (const t of ESTADOS_TERMINALES_DEL_RELOJ) expect(paraElReloj(t), t).toBe(false)
  })

  it('el módulo no importa nada de valor de estados.ts ni los nombres de la vista (regla de mutación 2)', () => {
    const imports = importsDe(leer('./relojSla.ts'))
    expect(imports.length, 'el guardián tiene que encontrar los import del fichero').toBeGreaterThan(0)
    for (const i of imports) {
      if (/from\s+['"]\.\/estados['"]/.test(i)) {
        expect(i, 'de estados.ts sólo se importa el TIPO (`import type`)').toMatch(/^import\s+type\s/)
      }
      for (const nombre of ['CLASIFICACION_EN_ESPERA', 'ESTADOS_EN_ESPERA', 'enEsperaDe', 'estadoEnEspera']) {
        expect(i, `${nombre} es de la vista`).not.toContain(nombre)
      }
    }
  })
})

describe('RQ-TC-74 · los dos tiempos en horas hábiles', () => {
  const pausa = (): PasoDelReloj[] => [
    { estado: 'Ticket creado', desde: a(lun, 8) },
    { estado: 'Notificación cliente', desde: a(lun, 17) },
    { estado: 'Finalizado', desde: a(mar, 17) },
  ]

  it('una pausa no entra en el SLA', () => {
    expect(tiemposDelReloj(pausa(), a(mie, 17), sinCierres)).toEqual({ slaHoras: 9, totalHoras: 18 })
  })

  it('una espera interna sí entra en el SLA', () => {
    const r = tiemposDelReloj([{ estado: 'Solicitado', desde: a(lun, 8) }, { estado: 'Finalizado', desde: a(mar, 17) }], a(mie, 17), sinCierres)
    expect(r).toEqual({ slaHoras: 18, totalHoras: 18 })
  })

  it('sin pausas, el total es el SLA', () => {
    const r = tiemposDelReloj([{ estado: 'Ticket creado', desde: a(lun, 8) }, { estado: 'Remisión creada', desde: a(lun, 17) },
      { estado: 'Pendiente', desde: a(mar, 17) }, { estado: 'Finalizado', desde: a(mie, 17) }], a(jue, 17), sinCierres)!
    expect(r.totalHoras).toBe(r.slaHoras)
    expect(r.totalHoras).toBe(27)
  })

  it('el total menos el SLA son exactamente las horas en pausa', () => {
    const r = tiemposDelReloj([{ estado: 'Ticket creado', desde: a(lun, 8) }, { estado: 'Por Entregar', desde: a(lun, 17) },
      { estado: 'Servicio externo', desde: a(mar, 17) }, { estado: 'Solicitado', desde: a(mie, 17) },
      { estado: 'Finalizado', desde: a(jue, 17) }], a(vie, 17), sinCierres)!
    expect(r.totalHoras).toBe(36)
    expect(r.totalHoras - r.slaHoras).toBe(18)
    expect(r.slaHoras).toBe(18)
  })

  it('una pausa abierta sólo hace crecer el total', () => {
    const abierta: PasoDelReloj[] = [{ estado: 'Notificación cliente', desde: a(lun, 8) }]
    expect(tiemposDelReloj(abierta, a(mie, 17), sinCierres)).toEqual({ slaHoras: 0, totalHoras: 27 })
    expect(tiemposDelReloj(abierta, a(jue, 17), sinCierres)).toEqual({ slaHoras: 0, totalHoras: 36 })
  })

  it('una espera interna abierta hace crecer los dos', () => {
    const abierta: PasoDelReloj[] = [{ estado: 'Solicitado', desde: a(lun, 8) }]
    expect(tiemposDelReloj(abierta, a(mie, 17), sinCierres)).toEqual({ slaHoras: 27, totalHoras: 27 })
  })

  it('los tramos terminales no cuentan', () => {
    const r = tiemposDelReloj([{ estado: 'Ticket creado', desde: a(lun, 8) }, { estado: 'Finalizado', desde: a(lun, 17) }], a(mie, 17), sinCierres)
    expect(r).toEqual({ slaHoras: 9, totalHoras: 9 })
    const anulado = tiemposDelReloj([{ estado: 'Ticket creado', desde: a(lun, 8) }, { estado: 'Anulado', desde: a(lun, 17) }], a(mie, 17), sinCierres)
    expect(anulado).toEqual({ slaHoras: 9, totalHoras: 9 })
  })

  it('una secuencia desordenada da lo mismo', () => {
    const al_reves = [...pausa()].reverse()
    expect(tiemposDelReloj(al_reves, a(mie, 17), sinCierres)).toEqual(tiemposDelReloj(pausa(), a(mie, 17), sinCierres))
    expect(tiemposDelReloj(al_reves, a(mie, 17), sinCierres)).toEqual({ slaHoras: 9, totalHoras: 18 })
  })

  it('no modifica la secuencia que recibe', () => {
    const al_reves = [...pausa()].reverse()
    const copia = al_reves.map((p) => ({ ...p }))
    tiemposDelReloj(al_reves, a(mie, 17), sinCierres)
    expect(al_reves).toEqual(copia)
  })

  it('acepta los instantes como texto ISO', () => {
    const r = tiemposDelReloj(pausa().map((p) => ({ ...p, desde: (p.desde as Date).toISOString() })), a(mie, 17), sinCierres)
    expect(r).toEqual({ slaHoras: 9, totalHoras: 18 })
  })

  it('un tramo que empieza después de `hasta` se recorta y no resta', () => {
    const r = tiemposDelReloj(pausa(), a(lun, 17), sinCierres)
    expect(r).toEqual({ slaHoras: 9, totalHoras: 9 })
  })

  it('los cierres de empresa no cuentan en ningún tramo', () => {
    const r = tiemposDelReloj([{ estado: 'Solicitado', desde: a(lun, 8) }, { estado: 'Finalizado', desde: a(mar, 17) }], a(mie, 17), new Set([mar]))
    expect(r).toEqual({ slaHoras: 9, totalHoras: 9 })
  })

  it('una secuencia vacía no tiene dato (null, no 0)', () => {
    expect(tiemposDelReloj([], a(mie, 17), sinCierres)).toBeNull()
  })

  it('un `desde` inválido no tiene dato', () => {
    expect(tiemposDelReloj([{ estado: 'Solicitado', desde: 'no es una fecha' }], a(mie, 17), sinCierres)).toBeNull()
    expect(tiemposDelReloj([{ estado: 'Solicitado', desde: a(lun, 8) }, { estado: 'Finalizado', desde: new Date(NaN) }], a(mie, 17), sinCierres)).toBeNull()
  })
})

describe('RQ-TC-77 · el reloj no toca las alarmas', () => {
  it('la alarma de Notificación cliente sigue midiendo aunque ese estado pare el reloj', () => {
    expect(paraElReloj('Notificación cliente')).toBe(true)
    expect(SLA_HORAS_POR_ESTADO['Notificación cliente']).toBe(36)
    expect(ALARMAS_SLA['Notificación cliente']).toBeDefined()
    expect(slaVencido('Notificación cliente', a(lun, 8), a(vie, 17), sinCierres)).toBe(true) // 45 h hábiles > 36
    expect(slaVencido('Notificación cliente', a(lun, 8), a(jue, 17), sinCierres)).toBe(false) // 36 h exactas: aún no
    // y el reloj, sobre el mismo ticket, no cuenta esas horas
    expect(tiemposDelReloj([{ estado: 'Notificación cliente', desde: a(lun, 8) }], a(vie, 17), sinCierres)).toEqual({ slaHoras: 0, totalHoras: 45 })
  })

  it('las alarmas no leen la lista del reloj (regla de mutación 2: se vigilan los ficheros)', () => {
    for (const ruta of ['./sla.ts', '../../../apps/desk/server/db/sla.ts', '../../../apps/desk/server/services/alarmasSla.ts']) {
      const texto = leer(ruta)
      expect(texto.length, `${ruta} debe poder leerse`).toBeGreaterThan(0)
      expect(texto, `${ruta} no nombra la lista del reloj`).not.toContain('ESTADOS_QUE_PARAN_EL_RELOJ')
      expect(texto, `${ruta} no importa relojSla`).not.toContain('relojSla')
    }
  })
})
