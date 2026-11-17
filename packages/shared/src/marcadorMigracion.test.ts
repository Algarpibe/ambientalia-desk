// marcador-migracion-lectores (F1F-01), lote 1: la regla única de «qué aporta el marcador de la migración» (RQ-TC-84, RQ-TC-85).
import { describe, it, expect } from 'vitest'
import { ID_TRANSICION_MIGRACION } from './migracionTickets'
import { entradaDelMarcador, resolverMarcador, presentarMarcador, TITULO_MARCADOR_MIGRACION, TEXTO_REGLA_MIGRACION } from './marcadorMigracion'
import type { HistorialTransition } from './types'

const etapa = (de: string | null, hacia: string | null, cuando: string): HistorialTransition => ({
  transitionName: null, fromStatus: de, toStatus: hacia, area: null, performedBy: null, performedAt: cuando,
})
const marcador = (de: string, hacia: string | null, values: unknown) => ({ transition_id: ID_TRANSICION_MIGRACION, from_status: de, to_status: hacia, values })
const desdeDe = (e: ReturnType<typeof entradaDelMarcador>): string | null | undefined => (e && e.tipo === 'entrada' ? e.desde : undefined)
const PENDIENTE_A_PROCESO = { regla: 'pendiente-servicio-a-en-proceso', estado_previo: 'Pendiente', estado_destino: 'En Proceso' }
const ENTREGADO_A_FINALIZADO = { regla: 'entregado-a-finalizado', estado_previo: 'Entregado', estado_destino: 'Finalizado', cierre_origen: 'zoho', closed_time_destino: '2026-11-30T15:00:00.000Z' }

describe('entradaDelMarcador · las cuatro ramas de D-4', () => {
  it('una fila que no es el marcador no se reconoce: null (sólo esPasoDeMigracion)', () => {
    expect(entradaDelMarcador({ transition_id: 'x', from_status: 'A', to_status: 'B', values: PENDIENTE_A_PROCESO }, [])).toBeNull()
    expect(entradaDelMarcador({ from_status: 'A', to_status: 'B' }, [])).toBeNull()
  })

  it('to_status nulo (identidad, y «pendiente-soporte-se-conserva») no es entrada', () => {
    expect(entradaDelMarcador(marcador('En Proceso', null, { regla: 'identidad' }), [])).toEqual({ tipo: 'ninguna' })
    expect(entradaDelMarcador(marcador('Pendiente', null, { regla: 'pendiente-soporte-se-conserva' }), [etapa('Ingresado', 'Pendiente', '2026-10-10T10:00:00Z')])).toEqual({ tipo: 'ninguna' })
  })

  it('«Entregado» → «Finalizado» fecha con el cierre de Zoho (D-3), no con la última entrada a «Entregado»', () => {
    const etapas = [etapa('En Proceso', 'Entregado', '2026-11-20T10:00:00Z')]
    expect(entradaDelMarcador(marcador('Entregado', 'Finalizado', ENTREGADO_A_FINALIZADO), etapas))
      .toEqual({ tipo: 'entrada', de: 'Entregado', estado: 'Finalizado', desde: '2026-11-30T15:00:00.000Z' })
  })

  it('«Entregado» → «Finalizado» con cierre puesto por la migración queda sin dato (S-10)', () => {
    const values = { ...ENTREGADO_A_FINALIZADO, cierre_origen: 'migracion' }
    expect(entradaDelMarcador(marcador('Entregado', 'Finalizado', values), [etapa('En Proceso', 'Entregado', '2026-11-20T10:00:00Z')]))
      .toEqual({ tipo: 'entrada', de: 'Entregado', estado: 'Finalizado', desde: null })
  })

  it('«Pendiente» → «En Proceso» fecha con la ÚLTIMA entrada de Zoho a «Pendiente» (D-2)', () => {
    const etapas = [
      etapa('Ingresado', 'Pendiente', '2026-10-10T10:00:00Z'),
      etapa('Pendiente', 'Ingresado', '2026-10-15T10:00:00Z'),
      etapa('Ingresado', 'Pendiente', '2026-10-20T14:00:00Z'),
      etapa('Pendiente', 'En Espera de Repuestos', '2026-10-22T10:00:00Z'),
    ]
    expect(entradaDelMarcador(marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), etapas))
      .toEqual({ tipo: 'entrada', de: 'Pendiente', estado: 'En Proceso', desde: '2026-10-20T14:00:00Z' })
  })

  it('D-2 normaliza el estado en crudo de la historia de Zoho (espacios) antes de comparar', () => {
    const etapas = [etapa('Ingresado', '  Pendiente ', '2026-10-10T10:00:00Z'), etapa('Pendiente', 'Ingresado', '2026-10-11T10:00:00Z')]
    expect(desdeDe(entradaDelMarcador(marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), etapas))).toBe('2026-10-10T10:00:00Z')
  })

  it('«Pendiente» → «En Proceso» sin entrada a «Pendiente» en la historia: sin dato (S-6, S-11)', () => {
    expect(entradaDelMarcador(marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), [etapa('Ingresado', 'Servicio externo', '2026-10-10T10:00:00Z')]))
      .toEqual({ tipo: 'entrada', de: 'Pendiente', estado: 'En Proceso', desde: null })
    expect(desdeDe(entradaDelMarcador(marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), []))).toBeNull()
  })

  it('una regla desconocida con destino relleno no fecha (S-13), y tampoco si values no es un objeto', () => {
    const etapas = [etapa('Ingresado', 'Pendiente', '2026-10-10T10:00:00Z')]
    expect(desdeDe(entradaDelMarcador(marcador('Pendiente', 'En Proceso', { regla: 'identidad' }), etapas))).toBeNull()
    expect(entradaDelMarcador(marcador('Pendiente', 'En Proceso', null), etapas)).toEqual({ tipo: 'entrada', de: 'Pendiente', estado: 'En Proceso', desde: null })
    expect(desdeDe(entradaDelMarcador(marcador('Pendiente', 'En Proceso', 'texto'), etapas))).toBeNull()
  })
})

describe('resolverMarcador · D-5', () => {
  const real = { id: 1, transition_id: 'x', from_status: 'En Proceso', to_status: 'Finalizado' }

  it('quita los marcadores y deja las filas reales tal cual', () => {
    const r = resolverMarcador([marcador('En Proceso', null, { regla: 'identidad' }), real], [])
    expect(r).toEqual({ filasApp: [real], etapasZoho: [] })
  })

  it('el marcador que cambia el estado añade al FINAL de las etapas de Zoho una sintética con la fecha resuelta', () => {
    const etapas = [etapa('Ingresado', 'Pendiente', '2026-10-20T14:00:00Z'), etapa('Pendiente', 'Ingresado', '2026-10-25T10:00:00Z')]
    const r = resolverMarcador([marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), real], etapas)
    expect(r?.filasApp).toEqual([real])
    expect(r?.etapasZoho).toHaveLength(3)
    expect(r?.etapasZoho.slice(0, 2)).toEqual(etapas)
    // La sintética queda DETRÁS de la entrada a «Pendiente» aunque su fecha sea anterior a la última etapa: el orden lo fija el final de la lista.
    expect(r?.etapasZoho[2]).toMatchObject({ fromStatus: 'Pendiente', toStatus: 'En Proceso', performedAt: '2026-10-20T14:00:00Z' })
  })

  it('un marcador que cambia el estado y no tiene fecha deja la secuencia entera en null (S-11)', () => {
    expect(resolverMarcador([marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO), real], [])).toBeNull()
    expect(resolverMarcador([marcador('Entregado', 'Finalizado', { ...ENTREGADO_A_FINALIZADO, cierre_origen: 'migracion' })], [])).toBeNull()
  })

  it('no muta lo que recibe', () => {
    const etapas = [etapa('Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')]
    const filas = [marcador('Pendiente', 'En Proceso', PENDIENTE_A_PROCESO)]
    resolverMarcador(filas, etapas)
    expect(etapas).toHaveLength(1)
    expect(filas).toHaveLength(1)
  })
})

describe('presentarMarcador · texto del historial (S-1, S-12)', () => {
  const COMPLETO = { estado_previo: 'Pendiente', estado_destino: 'En Proceso', status_type_previo: 'Open', managed_by_app_previo: false, regla: 'pendiente-servicio-a-en-proceso', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin', closed_time_previo: '2026-11-30T15:00:00.000Z', closed_time_destino: '2026-11-30T15:00:00.000Z', cierre_origen: 'zoho' }

  it('con los values completos: título propio y los cinco detalles, en orden y con etiqueta propia', () => {
    expect(TITULO_MARCADOR_MIGRACION).toBe('Migración desde Zoho Desk')
    expect(presentarMarcador(COMPLETO)).toEqual({
      title: 'Migración desde Zoho Desk',
      details: [
        { label: 'Estado en Zoho', value: 'Pendiente' },
        { label: 'Estado en Desk', value: 'En Proceso' },
        { label: 'Regla aplicada', value: '"Pendiente" de servicio técnico pasa a "En Proceso"' },
        { label: 'Corte de la migración', value: '2026-12-01T05:00:00.000Z' },
        { label: 'Ejecutada por', value: 'Admin' },
      ],
    })
  })

  it('los textos de las cuatro reglas, y ninguna etiqueta es «Regla» a secas ni una clave de values', () => {
    expect(TEXTO_REGLA_MIGRACION).toEqual({
      identidad: 'El estado existe igual en Desk y se conserva',
      'pendiente-servicio-a-en-proceso': '"Pendiente" de servicio técnico pasa a "En Proceso"',
      'entregado-a-finalizado': '"Entregado" pasa a "Finalizado"',
      'pendiente-soporte-se-conserva': '"Pendiente" de soporte remoto se conserva',
    })
    const etiquetas = presentarMarcador({ ...COMPLETO, regla: 'entregado-a-finalizado' }).details.map((d) => d.label)
    expect(etiquetas).toEqual(['Estado en Zoho', 'Estado en Desk', 'Regla aplicada', 'Corte de la migración', 'Ejecutada por'])
    for (const prohibida of ['Regla', 'regla', 'estado_previo', 'estado_destino', 'status_type_previo', 'managed_by_app_previo', 'closed_time_previo', 'closed_time_destino', 'cierre_origen']) expect(etiquetas).not.toContain(prohibida)
    expect(presentarMarcador({ ...COMPLETO, regla: 'identidad' }).details[2]).toEqual({ label: 'Regla aplicada', value: 'El estado existe igual en Desk y se conserva' })
    expect(presentarMarcador({ ...COMPLETO, regla: 'pendiente-soporte-se-conserva' }).details[2]).toEqual({ label: 'Regla aplicada', value: '"Pendiente" de soporte remoto se conserva' })
  })

  it('values nulo, vacío o que no es un objeto: sólo el título y ningún detalle, sin lanzar', () => {
    for (const v of [null, undefined, {}, 'texto', [1]]) expect(presentarMarcador(v)).toEqual({ title: 'Migración desde Zoho Desk', details: [] })
  })

  it('omite los detalles vacíos o que no son texto y no inventa los que faltan; una regla desconocida no sale', () => {
    expect(presentarMarcador({ estado_previo: 'Pendiente', estado_destino: '', regla: 'inventada', corte: null, ejecutado_por: 'Admin' }).details)
      .toEqual([{ label: 'Estado en Zoho', value: 'Pendiente' }, { label: 'Ejecutada por', value: 'Admin' }])
  })
})
