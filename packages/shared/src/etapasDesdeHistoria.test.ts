import { describe, it, expect } from 'vitest'
import { etapasDesdeHistoria } from './etapasDesdeHistoria'

/**
 * Los eventos son copias fieles de lo que devuelve Zoho para un ticket real de 2024. Una transición
 * del Blueprint no es UN evento: es un racimo de varios con la misma marca de tiempo —el cambio de
 * estado, el `BlueprintTransitionPerformed` que lleva la persona, el comentario— y recomponerlos en
 * una sola etapa es todo el trabajo de esta función.
 */
const cambioDeEstado = (transicion: { id: string; name: string }, de: string, a: string, cuando: string) => ({
  eventName: 'TicketUpdated',
  eventTime: cuando,
  actor: { id: 'bp1', name: ' Blueprint estado del Servicio', type: 'Blueprint' },
  eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: a, type: 'Text' }, propertyType: 'ValueTransition' }],
  actorInfo: [{ propertyName: 'Transition', propertyValue: { ...transicion, type: 'Transition' }, propertyType: 'Entity' }],
})
const laHizo = (transicion: { id: string; name: string }, quien: string, cuando: string) => ({
  eventName: 'BlueprintTransitionPerformed',
  eventTime: cuando,
  actor: { id: 'a1', name: quien, type: 'Agent' },
  eventInfo: [{ propertyName: 'Transition', propertyValue: { ...transicion, type: 'Transition' }, propertyType: 'Entity' }],
  actorInfo: [],
})
const comento = (transicion: { id: string; name: string }, quien: string, html: string, cuando: string, adjuntos: string[] = []) => ({
  eventName: 'CommentAdded',
  eventTime: cuando,
  actor: { id: 'a1', name: quien, type: 'Agent' },
  eventInfo: [
    { propertyName: 'Content', propertyValue: html, propertyType: 'Text' },
    { propertyName: 'AttachmentNames', propertyValue: adjuntos, propertyType: 'TextList' },
  ],
  actorInfo: [{ propertyName: 'Transition', propertyValue: { ...transicion, type: 'Transition' }, propertyType: 'Entity' }],
})

const ESCALADO = { id: 't-esc', name: 'Escalado a Revisión' }
const INGRESO = { id: 't-ing', name: 'ingreso' }

describe('etapasDesdeHistoria', () => {
  it('sin eventos no inventa nada', () => {
    expect(etapasDesdeHistoria([])).toEqual([])
  })

  /**
   * El caso completo: un racimo entero se convierte en UNA etapa con los mismos campos que la tarjeta
   * ya sabe pintar, más el comentario y sus adjuntos.
   */
  it('recompone el racimo de una transición en una sola etapa', () => {
    const t = '2024-01-04T20:12:22.000Z'
    const etapas = etapasDesdeHistoria([
      cambioDeEstado(ESCALADO, 'En Proceso', 'Notificado', t),
      laHizo(ESCALADO, 'Equipo  Técnico ', t),
      comento(ESCALADO, 'Equipo  Técnico ', '<div>Informe subido para revisión.</div>', t, ['MT_18A20070.pdf']),
    ])

    expect(etapas).toHaveLength(1)
    expect(etapas[0]).toEqual({
      transitionName: 'Escalado a Revisión',
      fromStatus: 'En Proceso',
      toStatus: 'Notificado',
      area: null,
      performedBy: 'Equipo  Técnico',
      performedAt: t,
      comentario: 'Informe subido para revisión.',
      adjuntos: ['MT_18A20070.pdf'],
    })
  })

  /**
   * La persona sale del `BlueprintTransitionPerformed`, no del cambio de estado: ese lo firma el
   * Blueprint, que no es nadie. Sin esta búsqueda, la hoja de vida diría que todas las etapas de todos
   * los tickets las hizo « Blueprint estado del Servicio».
   */
  it('la persona es quien ejecutó la transición, no el Blueprint', () => {
    const t = '2024-01-04T20:12:22.000Z'
    const soloEstado = etapasDesdeHistoria([cambioDeEstado(ESCALADO, 'En Proceso', 'Notificado', t)])
    expect(soloEstado[0].performedBy).toBeNull()

    const conPersona = etapasDesdeHistoria([
      cambioDeEstado(ESCALADO, 'En Proceso', 'Notificado', t),
      laHizo(ESCALADO, 'Alfonso García', t),
    ])
    expect(conPersona[0].performedBy).toBe('Alfonso García')
  })

  /**
   * El caso que rompe emparejar solo por id de transición: un informe devuelto a corrección se vuelve
   * a escalar, así que la MISMA transición aparece dos veces. Cada etapa tiene que quedarse con su
   * comentario, no con el del otro pase.
   */
  it('con la misma transición repetida, cada etapa se queda con su comentario', () => {
    const primera = '2024-01-04T20:12:22.000Z'
    const segunda = '2024-03-10T15:00:00.000Z'
    const etapas = etapasDesdeHistoria([
      cambioDeEstado(ESCALADO, 'En Proceso', 'Notificado', primera),
      comento(ESCALADO, 'Ana', '<div>Primer informe.</div>', primera),
      cambioDeEstado(ESCALADO, 'Rev./Diagnostico', 'Notificado', segunda),
      comento(ESCALADO, 'Ana', '<div>Informe corregido.</div>', segunda),
    ])

    expect(etapas.map((e) => e.comentario)).toEqual(['Primer informe.', 'Informe corregido.'])
  })

  // De más vieja a más nueva, que es el orden en que ya llegan las transiciones de Desk: las dos
  // listas se juntan después, y con órdenes distintos la mezcla saldría barajada.
  it('las devuelve de la más vieja a la más nueva', () => {
    const etapas = etapasDesdeHistoria([
      cambioDeEstado(ESCALADO, 'En Proceso', 'Notificado', '2024-01-04T20:12:22.000Z'),
      cambioDeEstado(INGRESO, 'Ingresado', 'En Proceso', '2024-01-04T16:02:25.000Z'),
    ])
    expect(etapas.map((e) => e.toStatus)).toEqual(['En Proceso', 'Notificado'])
  })

  /**
   * El comentario se guarda como TEXTO, no como HTML. La tarjeta lo pinta dentro de una lista compacta
   * y React escapa el texto, así que no queda superficie de inyección que sanear — y un `div` crudo
   * ahí dentro solo sería ruido.
   */
  it('convierte el comentario a texto plano', () => {
    const t = '2024-01-04T20:12:22.000Z'
    const html = '<div style="font-size:13px"><div>Se cambia la bomba.<br>Equipo operativo.</div></div>'
    const etapas = etapasDesdeHistoria([cambioDeEstado(ESCALADO, 'a', 'b', t), comento(ESCALADO, 'Ana', html, t)])
    expect(etapas[0].comentario).toBe('Se cambia la bomba. Equipo operativo.')
  })

  /**
   * Los correos reenviados al ticket llegan con la maqueta entera de Gmail dentro del comentario:
   * cientos de líneas de estilos que en texto plano son un muro. La tarjeta se lee de un vistazo, así
   * que se recorta.
   */
  it('recorta los comentarios kilométricos', () => {
    const t = '2024-01-04T20:12:22.000Z'
    const largo = '<div>' + 'palabra '.repeat(200) + '</div>'
    const etapas = etapasDesdeHistoria([cambioDeEstado(ESCALADO, 'a', 'b', t), comento(ESCALADO, 'Ana', largo, t)])
    const texto = etapas[0].comentario ?? ''
    expect(texto.length).toBeLessThanOrEqual(301)
    expect(texto.endsWith('…')).toBe(true)
  })

  // Un cambio de estado a mano, sin transición del Blueprint detrás, sigue siendo una etapa: pasó.
  it('un cambio de estado sin transición también cuenta', () => {
    const suelto = {
      eventName: 'TicketUpdated',
      eventTime: '2024-05-01T10:00:00.000Z',
      actor: { id: 'a9', name: 'Julián Maya', type: 'Agent' },
      eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: 'Pendiente', updatedValue: 'En Proceso' }, propertyType: 'ValueTransition' }],
      actorInfo: [],
    }
    const [e] = etapasDesdeHistoria([suelto])
    expect(e).toMatchObject({ transitionName: null, fromStatus: 'Pendiente', toStatus: 'En Proceso', performedBy: 'Julián Maya' })
  })

  /**
   * Lo que NO es una etapa se queda fuera. Es la diferencia entre una hoja de vida y un volcado: las
   * tareas que abre el Blueprint, los correos que dispara y los cambios de campos técnicos son ruido
   * de sistema en una pantalla que se lee de un vistazo.
   */
  it('ignora tareas, notificaciones y cambios que no son de estado', () => {
    const ruido = [
      { eventName: 'TaskAdded', eventTime: '2024-01-04T16:02:26.000Z', actor: { name: 'bp' }, eventInfo: [{ propertyName: 'Subject', propertyValue: 'Informe preliminar' }], actorInfo: [] },
      { eventName: 'NotificationSent', eventTime: '2024-01-04T16:02:26.000Z', actor: { name: 'bp' }, eventInfo: [], actorInfo: [] },
      { eventName: 'TicketArchived', eventTime: '2024-08-08T11:31:54.000Z', actor: { name: 'Desk System' }, eventInfo: [], actorInfo: [] },
      { eventName: 'TicketUpdated', eventTime: '2024-01-04T21:52:33.000Z', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'Días de entrega', propertyValue: { previousValue: '8', updatedValue: '2' } }], actorInfo: [] },
    ]
    expect(etapasDesdeHistoria(ruido)).toEqual([])
  })
})
