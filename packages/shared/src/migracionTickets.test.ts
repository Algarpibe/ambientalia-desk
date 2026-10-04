import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION,
  equivalenciaDeEstado, planDeTicket, esperaRemisionDeEntrada, resumenDeMigracion,
  type TicketParaMigrar,
} from './migracionTickets'
import { ESTADOS } from './estados'

/**
 * migracion-tickets-abiertos (F1F-01), lote 1 · el núcleo puro: tabla de equivalencias (RQ-TC-40) y plan por ticket
 * (RQ-TC-41). Sin base de datos: la lectura, la vigencia de remisión y la escritura son del ejecutor (lote 2).
 */
const CORTE = new Date('2026-12-01T05:00:00.000Z')
const ANTES = '2026-11-01T00:00:00.000Z'
const DESPUES = '2027-01-20T00:00:00.000Z'

let n = 0
const tk = (over: Partial<TicketParaMigrar> = {}): TicketParaMigrar => ({
  id: `z-${++n}`, number: 1000 + n, status: 'En Proceso', statusType: 'Open', classification: 'Reparación',
  managedByApp: false, createdTime: ANTES, ...over,
})

describe('equivalenciaDeEstado (RQ-TC-40)', () => {
  it('los 23 de ESTADOS salvo «Pendiente» son identidad y no cambian el status_type', () => {
    const resto = ESTADOS.filter((e) => e !== 'Pendiente')
    expect(ESTADOS).toHaveLength(23)
    expect(resto).toHaveLength(22)
    for (const e of resto) {
      expect(equivalenciaDeEstado(e, null)).toEqual({ destino: e, regla: 'identidad', statusTypeDestino: null })
    }
  })

  it('«Entregado» no está en ESTADOS y va a «Finalizado» con status_type «Closed»', () => {
    expect((ESTADOS as string[]).includes('Entregado')).toBe(false)
    expect(equivalenciaDeEstado('Entregado', null)).toEqual({
      destino: 'Finalizado', regla: 'entregado-a-finalizado', statusTypeDestino: 'Closed',
    })
  })

  it('«Pendiente» de servicio va a «En Proceso» con status_type «Open»', () => {
    const esperado = { destino: 'En Proceso', regla: 'pendiente-servicio-a-en-proceso', statusTypeDestino: 'Open' }
    expect(equivalenciaDeEstado('Pendiente', 'Reparación')).toEqual(esperado)
  })

  it('«Pendiente» sin clasificación (null y vacía) cuenta como servicio', () => {
    expect(equivalenciaDeEstado('Pendiente', null)?.destino).toBe('En Proceso')
    expect(equivalenciaDeEstado('Pendiente', '')?.destino).toBe('En Proceso')
  })

  it('«Pendiente» de soporte remoto se conserva, con la mayúscula variable de Zoho', () => {
    const esperado = { destino: 'Pendiente', regla: 'pendiente-soporte-se-conserva', statusTypeDestino: null }
    expect(equivalenciaDeEstado('Pendiente', 'Soporte remoto')).toEqual(esperado)
    expect(equivalenciaDeEstado('Pendiente', 'soporte REMOTO')).toEqual(esperado)
  })

  it('«Pendiente» con «Soporte remoto urgente» cae como servicio: se usa el predicado compartido, no un LIKE', () => {
    expect(equivalenciaDeEstado('Pendiente', 'Soporte remoto urgente')?.destino).toBe('En Proceso')
  })

  it('un estado desconocido, «entregado» y «Entregado » (espacio final) son «sin equivalencia»', () => {
    expect(equivalenciaDeEstado('En revisión externa', null)).toBeNull()
    expect(equivalenciaDeEstado('entregado', null)).toBeNull()
    expect(equivalenciaDeEstado('Entregado ', null)).toBeNull()
  })

  it('el módulo es puro: no importa base, red, ficheros ni reloj', () => {
    const fuente = readFileSync(new URL('./migracionTickets.ts', import.meta.url), 'utf8')
    const importaciones = [...fuente.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    expect(importaciones.every((r) => r.startsWith('./'))).toBe(true)
    expect(fuente).not.toMatch(/Date\.now\(|new Date\(\)|process\.|fetch\(|require\(/)
  })

  it('declara la identidad de su marcador', () => {
    expect(ID_TRANSICION_MIGRACION).toBe('migracion_f1f01_abiertos')
    expect(NOMBRE_TRANSICION_MIGRACION).toBe('Migración de ticket abierto de Zoho (F1F-01)')
    expect(ACTOR_MIGRACION).toBe('Migración F1F-01')
  })
})

describe('planDeTicket (RQ-TC-41)', () => {
  it('un ticket abierto, no gobernado y con equivalencia se migra, con su equivalencia', () => {
    const p = planDeTicket(tk({ status: 'Entregado' }), CORTE)
    expect(p.accion).toBe('migrar')
    expect(p.equivalencia?.destino).toBe('Finalizado')
  })

  it('precedencia: gobernado y sin equivalencia es «ya-gobernado»', () => {
    expect(planDeTicket(tk({ status: 'Estado raro', managedByApp: true }), CORTE).accion).toBe('ya-gobernado')
  })

  it('precedencia: tras el corte y sin equivalencia es «tras-el-corte»', () => {
    expect(planDeTicket(tk({ status: 'Estado raro', createdTime: DESPUES }), CORTE).accion).toBe('tras-el-corte')
  })

  it('precedencia: gobernado y tras el corte es «ya-gobernado»', () => {
    expect(planDeTicket(tk({ managedByApp: true, createdTime: DESPUES }), CORTE).accion).toBe('ya-gobernado')
  })

  it('sin equivalencia, antes del corte y sin gobernar es «sin-equivalencia»', () => {
    expect(planDeTicket(tk({ status: 'Estado raro' }), CORTE).accion).toBe('sin-equivalencia')
  })

  it('corte en el instante exacto: createdTime igual al corte se migra', () => {
    expect(planDeTicket(tk({ createdTime: CORTE.toISOString() }), CORTE).accion).toBe('migrar')
  })

  it('un instante posterior al corte en un milisegundo ya es «tras-el-corte»', () => {
    expect(planDeTicket(tk({ createdTime: '2026-12-01T05:00:00.001Z' }), CORTE).accion).toBe('tras-el-corte')
  })

  it('createdTime nulo se trata como anterior al corte', () => {
    expect(planDeTicket(tk({ createdTime: null }), CORTE).accion).toBe('migrar')
  })

  it('«On Hold» cuenta como abierto y se migra', () => {
    expect(planDeTicket(tk({ statusType: 'On Hold', status: 'En Espera de Repuestos' }), CORTE).accion).toBe('migrar')
  })

  it('la fecha de corte manda: el mismo ticket cambia de acción con otro corte', () => {
    const t = tk({ createdTime: '2027-01-20T00:00:00.000Z' })
    expect(planDeTicket(t, new Date('2027-01-15T00:00:00.000Z')).accion).toBe('tras-el-corte')
    expect(planDeTicket(t, new Date('2027-02-01T00:00:00.000Z')).accion).toBe('migrar')
  })

  it('no muta el ticket de entrada (objeto congelado)', () => {
    const t = Object.freeze(tk({ status: 'Entregado' }))
    expect(() => planDeTicket(t, CORTE)).not.toThrow()
    expect(t.status).toBe('Entregado')
  })

  it('un corte inválido lanza RangeError', () => {
    expect(() => planDeTicket(tk(), new Date('no es fecha'))).toThrow(RangeError)
  })
})

describe('esperaRemisionDeEntrada', () => {
  it('«OV asignada» y «Ticket creado» esperan remisión; «En Proceso» no', () => {
    expect(esperaRemisionDeEntrada('OV asignada')).toBe(true)
    expect(esperaRemisionDeEntrada('Ticket creado')).toBe(true)
    expect(esperaRemisionDeEntrada('En Proceso')).toBe(false)
  })
})

describe('resumenDeMigracion (RQ-TC-41)', () => {
  const planes = (ts: TicketParaMigrar[]) => ts.map((t) => planDeTicket(t, CORTE))

  it('cuenta por pareja con cambiaEstado y lista los «Pendiente» por ticket', () => {
    const r = resumenDeMigracion(planes([
      tk({ number: 1, status: 'Pendiente', classification: 'Reparación' }),
      tk({ number: 2, status: 'Pendiente', classification: null }),
      tk({ number: 3, status: 'Pendiente', classification: 'Soporte remoto' }),
      tk({ number: 4, status: 'Entregado' }),
      tk({ number: 5, status: 'En Proceso' }),
    ]))
    const par = (o: string, d: string) => r.porEstado.find((x) => x.origen === o && x.destino === d)
    expect(par('Pendiente', 'En Proceso')).toMatchObject({ tickets: 2, cambiaEstado: true, regla: 'pendiente-servicio-a-en-proceso' })
    expect(par('Pendiente', 'Pendiente')).toMatchObject({ tickets: 1, cambiaEstado: false })
    expect(par('Entregado', 'Finalizado')).toMatchObject({ tickets: 1, cambiaEstado: true })
    expect(par('En Proceso', 'En Proceso')).toMatchObject({ tickets: 1, cambiaEstado: false, regla: 'identidad' })
    expect(r.pendientes).toEqual([
      { numero: 1, clasificacion: 'Reparación', destino: 'En Proceso' },
      { numero: 2, clasificacion: null, destino: 'En Proceso' },
      { numero: 3, clasificacion: 'Soporte remoto', destino: 'Pendiente' },
    ])
    expect(r.abiertos).toBe(5)
    expect(r.migrables).toBe(5)
  })

  it('«sinEquivalencia» va agrupado por estado, con recuento y números', () => {
    const r = resumenDeMigracion(planes([
      tk({ number: 10, status: 'Estado raro' }), tk({ number: 11, status: 'Otro raro' }), tk({ number: 12, status: 'Estado raro' }),
    ]))
    expect(r.sinEquivalencia).toEqual([
      { estado: 'Estado raro', tickets: 2, numeros: [10, 12] },
      { estado: 'Otro raro', tickets: 1, numeros: [11] },
    ])
    expect(r.migrables).toBe(0)
  })

  it('un sin equivalencia gobernado o posterior al corte no bloquea: no entra en «sinEquivalencia»', () => {
    const r = resumenDeMigracion(planes([
      tk({ number: 20, status: 'Estado raro', managedByApp: true }),
      tk({ number: 21, status: 'Estado raro', createdTime: DESPUES }),
    ]))
    expect(r.sinEquivalencia).toEqual([])
  })

  it('«yaGobernados» son dos recuentos, partidos por el prefijo del id de la app', () => {
    const r = resumenDeMigracion(planes([
      tk({ id: 'app-1', managedByApp: true }), tk({ id: 'app-2', managedByApp: true }), tk({ id: 'z-9', managedByApp: true }),
    ]))
    expect(r.yaGobernados).toEqual({ nacidosEnLaApp: 2, deZoho: 1 })
  })

  it('«trasElCorte» lleva número, estado y fecha de creación', () => {
    const r = resumenDeMigracion(planes([tk({ number: 30, status: 'Ingresado', createdTime: DESPUES })]))
    expect(r.trasElCorte).toEqual([{ numero: 30, estado: 'Ingresado', creado: DESPUES }])
  })

  it('masAltoAMarcar es sólo sobre los que migran', () => {
    const r = resumenDeMigracion(planes([
      tk({ number: 4100 }), tk({ number: 4300 }),
      tk({ number: 9000, managedByApp: true }), tk({ number: 9500, createdTime: DESPUES }),
      tk({ number: 9900, status: 'Estado raro' }),
    ]))
    expect(r.masAltoAMarcar).toBe(4300)
  })

  it('masAltoAMarcar es null si nada migra', () => {
    expect(resumenDeMigracion(planes([tk({ managedByApp: true })])).masAltoAMarcar).toBeNull()
    expect(resumenDeMigracion([]).masAltoAMarcar).toBeNull()
  })

  it('no muta la lista de planes de entrada', () => {
    const lista = Object.freeze(planes([tk({ status: 'Entregado' })]))
    expect(() => resumenDeMigracion(lista)).not.toThrow()
  })
})
