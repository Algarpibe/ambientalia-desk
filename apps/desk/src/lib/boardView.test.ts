import { describe, it, expect } from 'vitest'
import type { Ticket } from '@ambientalia/shared'
import { applyBoardView, viewLabel, FUNCTIONAL_BY_LABEL, type VistaKey } from './boardView'

const BASE = { id: 'x', number: '#1', subject: 's', status: 'Ingresado', statusType: 'Open', dueDate: null }
const T = (over: Partial<Ticket>): Ticket => ({ ...BASE, ...over } as Ticket)

const now = new Date('2026-06-06T00:00:00Z')
const tickets: Ticket[] = [
  T({ id: 'a', status: 'Ingresado', statusType: 'Open', dueDate: '2026-01-01T00:00:00Z' }),   // activo, vencido
  T({ id: 'b', status: 'En Espera de Repuestos', statusType: 'Open', dueDate: null }),         // en espera
  T({ id: 'c', status: 'Finalizado', statusType: 'Closed', dueDate: '2026-01-01T00:00:00Z' }), // cerrado (no vencido)
  T({ id: 'd', status: 'Diagnóstico', statusType: 'Open', dueDate: '2026-12-31T00:00:00Z' }),  // activo, futuro
]

describe('applyBoardView', () => {
  const ids = (key: VistaKey) => applyBoardView(tickets, key, now).map((t) => t.id).sort()
  it('todos = activos y cerrados, sin filtrar', () => { expect(ids('todos')).toEqual(['a', 'b', 'c', 'd']) })
  it('cerrados = solo Closed', () => { expect(ids('cerrados')).toEqual(['c']) })
  it('abiertos = activos sin en espera', () => { expect(ids('abiertos')).toEqual(['a', 'd']) })
  it('espera = solo en espera', () => { expect(ids('espera')).toEqual(['b']) })
  it('vencidos = activo + fecha pasada (excluye sin fecha/futuro/cerrado)', () => { expect(ids('vencidos')).toEqual(['a']) })
  it('key desconocida → vacío, no hereda el cuerpo de todos', () => { expect(ids('zzz' as VistaKey)).toEqual([]) })
})

/**
 * RQ-VT-04 — los seis estados que la regex vieja (`/espera/i`) no reconocía, porque su nombre no
 * lleva la palabra «espera»: `ESTADOS_EN_ESPERA` (`packages/shared/src/estados.ts`) sí los declara, y
 * `applyBoardView` tiene que consumir ese registro, no un patrón sobre el texto del estado.
 */
describe('applyBoardView · RQ-VT-04, los seis estados que la regex vieja no reconocía', () => {
  const casoEnEspera = (status: string) => {
    const t = [T({ id: 'e', status, statusType: 'Open' })]
    it(`${status}: cae en espera y no en abiertos`, () => {
      expect(applyBoardView(t, 'espera', now).map((x) => x.id)).toEqual(['e'])
      expect(applyBoardView(t, 'abiertos', now)).toEqual([])
    })
  }
  casoEnEspera('Servicio externo')
  casoEnEspera('Notificación cliente')
  casoEnEspera('Notificación a Compras')
  casoEnEspera('Notificación Comercial')
  casoEnEspera('Solicitado')
  casoEnEspera('Liberación Comercial')
})

/**
 * RQ-VT-05 — un ticket CERRADO nunca aparece bajo «Espera», aunque su estado esté en
 * `ESTADOS_EN_ESPERA`. Cierra el hueco de detector que la Fase 0 de `tasks.md` confirmó: con el
 * fixture de arriba, quitar el filtro de cerrados de la rama `espera` (`boardView.ts:48`) no lo
 * detectaba nadie.
 */
describe('applyBoardView · RQ-VT-05, un cerrado nunca aparece en espera', () => {
  it('Closed en un estado de espera no aparece en la vista espera', () => {
    const t = [T({ id: 'cerrado-en-espera', status: 'Solicitado', statusType: 'Closed' })]
    expect(applyBoardView(t, 'espera', now)).toEqual([])
  })

  /**
   * `por-entregar-es-espera` — el filtro de cerrados (`boardView.ts:48`) sigue aplicándose ANTES de
   * comprobar la clasificación, también para los dos estados de entrega (regla de mutación 1: M3 de
   * `tasks.md` exige que quitar ese orden ponga esto en rojo).
   */
  it('Closed en Por Entregar o en Por Entregar / Sin facturar tampoco aparece en espera', () => {
    const t = [
      T({ id: 'entrega-cerrada', status: 'Por Entregar', statusType: 'Closed' }),
      T({ id: 'sin-facturar-cerrada', status: 'Por Entregar / Sin facturar', statusType: 'Closed' }),
    ]
    expect(applyBoardView(t, 'espera', now)).toEqual([])
  })
})

/**
 * `por-entregar-es-espera` — el rojo de la DECISIÓN (Fase 0 del diseño), escrito ANTES de tocar
 * `estados.ts`. Reutiliza el molde `casoEnEspera` de `:32-38` (RQ-VT-04), pero es un `describe` NUEVO
 * y no una ampliación de aquél: `:31` documenta F1B-08 y los seis estados que la regex vieja no
 * reconocía, y estos dos NO vienen de esa regex — meterlos ahí volvería falso un título verdadero.
 *
 * CUANDO SE ESCRIBIÓ, este bloque fallaba: `Por Entregar` y `Por Entregar / Sin facturar` estaban
 * clasificados `'ninguna'` (`estados.ts:87-88` en `5919b6e`; hoy están en `:72-73`, ya `'externa'`) y
 * caían en `'abiertos'`, no en `'espera'`. Gerencia decidió lo contrario
 * (decision/por-entregar-es-espera, 2026-09-12): el equipo ya fue avisado y espera a que el cliente lo
 * recoja, así que debe contar como espera. Este describe se puso VERDE en la Fase 2 del diseño, al
 * mover las dos entradas al bloque `externa` de `CLASIFICACION_EN_ESPERA`.
 */
describe('applyBoardView · Por Entregar y Por Entregar / Sin facturar pasan a espera (decisión Gerencia 2026-09-12)', () => {
  const casoEnEspera = (status: string) => {
    const t = [T({ id: 'e', status, statusType: 'Open' })]
    it(`${status}: cae en espera y no en abiertos`, () => {
      expect(applyBoardView(t, 'espera', now).map((x) => x.id)).toEqual(['e'])
      expect(applyBoardView(t, 'abiertos', now)).toEqual([])
    })
  }
  casoEnEspera('Por Entregar')
  casoEnEspera('Por Entregar / Sin facturar')
})

/**
 * «Mis Tickets» filtra por DERIVACIÓN, y solo en la vista.
 *
 * ⚠️ Nunca en el servidor: `docs/modelo-autorizacion.md` decidió que no hay propiedad por ticket ni
 * segmentación de visibilidad. Esto es una comodidad para barrer lo propio, no un permiso.
 */
describe('applyBoardView · mis tickets', () => {
  const mios = [
    T({ id: 'm1', derivado: { id: 'yo', nombre: 'Yo', cargo: null, initials: 'YO' } }),
    T({ id: 'm2', statusType: 'Closed', derivado: { id: 'yo', nombre: 'Yo', cargo: null, initials: 'YO' } }),
    T({ id: 'otro', derivado: { id: 'tu', nombre: 'Tú', cargo: null, initials: 'TU' } }),
    T({ id: 'nadie', derivado: null }),
  ]

  it('trae solo los derivados a mí, y excluye los cerrados', () => {
    expect(applyBoardView(mios, 'mios', now, 'yo').map((t) => t.id)).toEqual(['m1'])
  })

  /**
   * Sin usuario NO se devuelve todo. Enseñar el tablero entero bajo el rótulo «Mis Tickets» es la
   * mentira peor de las dos posibles: quien lo lea creerá que todo eso es suyo.
   */
  it('sin usuario devuelve vacío, nunca el tablero entero', () => {
    expect(applyBoardView(mios, 'mios', now)).toEqual([])
  })
})

describe('viewLabel / FUNCTIONAL_BY_LABEL', () => {
  it('viewLabel mapea key→etiqueta con fallback', () => {
    expect(viewLabel('cerrados')).toBe('Tickets cerrados')
    expect(viewLabel('zzz' as VistaKey)).toBe('Vista no reconocida')
  })
  it('FUNCTIONAL_BY_LABEL mapea etiqueta→key', () => {
    expect(FUNCTIONAL_BY_LABEL['Tickets en espera']).toBe('espera')
    // Era `toBeUndefined()`: «Mis Tickets» estaba en el Sidebar como ítem decorativo. Ahora es una
    // vista de verdad y se reutiliza esa misma etiqueta, que ya estaba puesta.
    expect(FUNCTIONAL_BY_LABEL['Mis Tickets']).toBe('mios')
  })
})
