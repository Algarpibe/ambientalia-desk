import { describe, it, expect } from 'vitest'
import { vistaRotulado } from './rotuladoVista'
import { fmtFechaHora } from './remisionResultado'

// Casos de `vistaRotulado` (rotulado-tras-enviar, RQ-RE-41). El cliente PINTA lo que dice el servidor
// (`pendienteRotular`) y consume el predicado compartido de permiso: no recalcula la condición.
const TECNICO = { areas: ['Servicio Técnico'], isAdmin: false }
const ADMIN = { areas: [], isAdmin: true }
const OTRA_AREA = { areas: ['Comercial'], isAdmin: false }

const base = { pendienteRotular: false, novedades: [{ clave: 'ninguna', etiqueta: 'Sin novedad' }] as { clave: string; etiqueta: string }[] | null, estado: 'ok', anuladaAt: null as string | null, rotuladoAt: null as string | null, rotuladoPor: null as string | null }

const r = (o: Partial<typeof base> = {}) => ({ ...base, ...o })

describe('vistaRotulado', () => {
  it('RV-1 · nada: legado, sin enviar con éxito y anulada', () => {
    expect(vistaRotulado(r({ novedades: null }), TECNICO)).toEqual({ tipo: 'nada' })
    expect(vistaRotulado(r({ estado: 'pendiente' }), TECNICO)).toEqual({ tipo: 'nada' })
    expect(vistaRotulado(r({ estado: 'error' }), TECNICO)).toEqual({ tipo: 'nada' })
    expect(vistaRotulado(r({ anuladaAt: '2026-10-12T10:00:00Z' }), TECNICO)).toEqual({ tipo: 'nada' })
  })

  it('RV-2 · pendiente: con botón para el área Servicio Técnico y para el administrador', () => {
    const rem = r({ pendienteRotular: true })
    expect(vistaRotulado(rem, TECNICO)).toEqual({ tipo: 'pendiente', puedeConfirmar: true })
    expect(vistaRotulado(rem, ADMIN)).toEqual({ tipo: 'pendiente', puedeConfirmar: true })
  })

  it('RV-2 · pendiente: quien no tiene el área ve la marca sin botón (también sin sesión)', () => {
    const rem = r({ pendienteRotular: true })
    expect(vistaRotulado(rem, OTRA_AREA)).toEqual({ tipo: 'pendiente', puedeConfirmar: false })
    expect(vistaRotulado(rem, null)).toEqual({ tipo: 'pendiente', puedeConfirmar: false })
  })

  it('RV-3 · confirmado: dice quién y cuándo', () => {
    const rem = r({ rotuladoAt: '2026-10-12T15:30:00Z', rotuladoPor: 'Ana Pérez' })
    const v = vistaRotulado(rem, OTRA_AREA)
    expect(v).toEqual({ tipo: 'confirmado', texto: `Rotulado y guardado: lo confirmó Ana Pérez el ${fmtFechaHora('2026-10-12T15:30:00Z')}` })
  })

  it('RV-3 · confirmado sin nombre guardado: sólo la fecha y hora', () => {
    const v = vistaRotulado(r({ rotuladoAt: '2026-10-12T15:30:00Z' }), TECNICO)
    expect(v).toEqual({ tipo: 'confirmado', texto: `Rotulado y guardado el ${fmtFechaHora('2026-10-12T15:30:00Z')}` })
  })

  it('RV-3 · confirmado nunca ofrece botón, aunque la marca llegue verdadera por error', () => {
    const v = vistaRotulado(r({ pendienteRotular: false, rotuladoAt: '2026-10-12T15:30:00Z', rotuladoPor: 'Ana' }), ADMIN)
    expect(v.tipo).toBe('confirmado')
  })

  it('RV-4 · no recalcula: con pendienteRotular falso y datos que «parecen» pendientes, no ofrece botón', () => {
    // Enviada con éxito, formulario nuevo, sin anular, sin confirmar: lo que un cálculo propio daría por pendiente.
    expect(vistaRotulado(r({ pendienteRotular: false }), TECNICO)).toEqual({ tipo: 'nada' })
    expect(vistaRotulado(r({ pendienteRotular: false, estado: 'ok_con_avisos' }), ADMIN)).toEqual({ tipo: 'nada' })
  })

  it('RV-4 · no recalcula (al revés): con pendienteRotular verdadero pinta pendiente aunque el resto no lo parezca', () => {
    expect(vistaRotulado(r({ pendienteRotular: true, estado: 'error', anuladaAt: '2026-10-12T10:00:00Z' }), TECNICO)).toEqual({ tipo: 'pendiente', puedeConfirmar: true })
  })
})
